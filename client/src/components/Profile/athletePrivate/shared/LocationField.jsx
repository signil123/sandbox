import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Pin } from './icons'

const NAVY = '#163146'
const BRONZE = '#986a41'

// LocationField — Photon-backed typeahead for US cities + "Remote" + manual fallback.
//
// Why Photon (komoot.io public instance): no API key, designed for search-as-you-type,
// covers every US settlement OSM knows about (which is effectively all of them).
// We restrict to countrycode=US and layer=city so we only ever see city/town/village
// hits. State name is mapped to a 2-letter abbreviation client-side so the stored
// value is always 'City, ST' (or the literal string 'Remote'). On Photon errors we
// silently degrade to the manual-entry form — the user is never blocked by a network
// hiccup.
//
// Storage: a single string in the same field that already exists (`location`).
// No schema change.

export const STATE_ABBR = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
}

export const STATE_OPTIONS = Object.entries(STATE_ABBR)
  .map(([name, abbr]) => ({ value: abbr, label: `${abbr} — ${name}` }))
  .sort((a, b) => a.value.localeCompare(b.value))

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(22,49,70,0.65)',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(22,49,70,0.15)',
  background: '#fff',
  color: NAVY,
  fontSize: 13.5,
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const PHOTON_URL = 'https://photon.komoot.io/api'

// Resolve a Photon feature to 'City, ST'. Returns null if we can't extract both.
const formatFeature = (feature) => {
  const p = feature?.properties || {}
  const city = p.name
  const stateAbbr = STATE_ABBR[p.state]
  if (!city || !stateAbbr) return null
  return `${city}, ${stateAbbr}`
}

export const LocationField = ({ label = 'Location', value, onChange, placeholder = 'Search city…', hint, error, required }) => {
  const id = useId()
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [manualMode, setManualMode] = useState(false)
  const [manualCity, setManualCity] = useState('')
  const [manualState, setManualState] = useState('')
  const [photonFailed, setPhotonFailed] = useState(false)

  // Keep the visible input synced when the parent resets `value` externally.
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Click-outside closes the dropdown but never clears the stored value.
  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Debounced Photon fetch. 250ms keeps the network quiet without feeling laggy.
  useEffect(() => {
    if (manualMode) return undefined
    const trimmed = query.trim()
    if (trimmed.length < 2 || trimmed.toLowerCase() === 'remote') {
      setSuggestions([])
      setLoading(false)
      return undefined
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `${PHOTON_URL}?q=${encodeURIComponent(trimmed)}&countrycode=US&layer=city&limit=8`
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const seen = new Set()
        const picked = []
        for (const f of data.features || []) {
          const formatted = formatFeature(f)
          if (!formatted || seen.has(formatted)) continue
          seen.add(formatted)
          picked.push({ formatted, raw: f })
          if (picked.length >= 8) break
        }
        setSuggestions(picked)
        setPhotonFailed(false)
      } catch (e) {
        if (e.name !== 'AbortError') {
          setSuggestions([])
          setPhotonFailed(true)
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query, manualMode])

  const remoteRow = useMemo(
    () => ({ formatted: 'Remote', raw: { isRemote: true } }),
    [],
  )

  // Always pin Remote at the top so it's reachable without typing.
  const rows = useMemo(() => {
    const list = []
    list.push(remoteRow)
    suggestions.forEach((s) => list.push(s))
    return list
  }, [remoteRow, suggestions])

  // Extract [lng, lat] (GeoJSON order) from a Photon feature into our own
  // {lat, lng}. Returns null for Remote / manual entry / malformed responses.
  const coordsFromFeature = (raw) => {
    if (!raw || raw.isRemote) return null
    const coords = raw?.geometry?.coordinates
    if (!Array.isArray(coords) || coords.length < 2) return null
    const [lng, lat] = coords
    if (typeof lat !== 'number' || typeof lng !== 'number') return null
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }

  const commitChoice = (v, raw) => {
    // Second arg lets the parent capture {lat, lng} when the user picks from
    // Photon. Manual entry / Remote pass null so the field is cleared on save.
    onChange?.(v, coordsFromFeature(raw))
    setQuery(v)
    setOpen(false)
    setActiveIdx(-1)
  }

  const onKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(rows.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && rows[activeIdx]) {
        e.preventDefault()
        commitChoice(rows[activeIdx].formatted, rows[activeIdx].raw)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const enterManual = () => {
    setManualMode(true)
    setOpen(false)
    // Pre-fill from current value if it parses as 'City, ST'
    const m = (value || '').match(/^(.+?),\s*([A-Z]{2})$/)
    if (m) {
      setManualCity(m[1])
      setManualState(m[2])
    } else {
      setManualCity(value && value !== 'Remote' ? value : '')
      setManualState('')
    }
  }

  const commitManual = () => {
    const city = manualCity.trim()
    if (!city || !manualState) return
    // Manual entry has no coords — pass undefined raw so commitChoice forwards null.
    commitChoice(`${city}, ${manualState}`, null)
    setManualMode(false)
  }

  const cancelManual = () => {
    setManualMode(false)
    setManualCity('')
    setManualState('')
  }

  if (manualMode) {
    const ready = manualCity.trim() && manualState
    return (
      <div style={{ marginBottom: 14 }}>
        {label && (
          <label style={labelStyle}>
            {label}
            {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
          </label>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualCity}
            onChange={(e) => setManualCity(e.target.value)}
            placeholder='City (e.g. Asheville)'
            style={{ ...inputStyle, flex: 1 }}
            autoFocus
          />
          <select
            value={manualState}
            onChange={(e) => setManualState(e.target.value)}
            style={{ ...inputStyle, width: 140, appearance: 'auto' }}
          >
            <option value=''>State</option>
            {STATE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type='button'
            onClick={commitManual}
            disabled={!ready}
            style={{
              padding: '7px 14px',
              borderRadius: 9,
              border: 0,
              background: ready ? BRONZE : 'rgba(152,106,65,0.4)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: ready ? 'pointer' : 'not-allowed',
            }}
          >
            Use this location
          </button>
          <button
            type='button'
            onClick={cancelManual}
            style={{
              padding: '7px 14px',
              borderRadius: 9,
              border: '1px solid rgba(22,49,70,0.15)',
              background: '#fff',
              color: NAVY,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Back to search
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 11.5, color: 'rgba(22,49,70,0.55)', fontWeight: 600 }}>
          Will save as: {manualCity.trim() && manualState ? `${manualCity.trim()}, ${manualState}` : '—'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 14, position: 'relative' }} ref={wrapRef}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(22,49,70,0.5)',
            pointerEvents: 'none',
          }}
        >
          <Pin size={14} />
        </span>
        <input
          id={id}
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIdx(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete='off'
          style={{
            ...inputStyle,
            paddingLeft: 32,
            ...(error ? { borderColor: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.04)' } : null),
          }}
        />
      </div>

      {open && (
        <div
          role='listbox'
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid rgba(22,49,70,0.12)',
            borderRadius: 10,
            boxShadow: '0 10px 30px -10px rgba(22,49,70,0.25)',
            zIndex: 20,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {rows.map((row, i) => {
            const isRemote = !!row.raw?.isRemote
            const active = i === activeIdx
            return (
              <button
                type='button'
                key={`${row.formatted}-${i}`}
                role='option'
                aria-selected={active}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commitChoice(row.formatted, row.raw)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  border: 0,
                  background: active ? 'rgba(152,106,65,0.10)' : 'transparent',
                  color: NAVY,
                  fontSize: 13,
                  fontWeight: isRemote ? 800 : 600,
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(22,49,70,0.04)',
                }}
              >
                {isRemote ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: BRONZE,
                    }}
                  >
                    Remote
                  </span>
                ) : (
                  <span>{row.formatted}</span>
                )}
              </button>
            )
          })}

          {loading && (
            <div style={{ padding: 10, fontSize: 12, color: 'rgba(22,49,70,0.55)', fontStyle: 'italic' }}>
              Searching…
            </div>
          )}

          {!loading && query.trim().length >= 2 && suggestions.length === 0 && !photonFailed && (
            <div style={{ padding: 10, fontSize: 12, color: 'rgba(22,49,70,0.55)' }}>
              No matches. Use manual entry below.
            </div>
          )}

          {!loading && photonFailed && (
            <div style={{ padding: 10, fontSize: 12, color: '#9b1c1c' }}>
              Search unavailable. Use manual entry below.
            </div>
          )}

          <button
            type='button'
            onMouseDown={(e) => {
              e.preventDefault()
              enterManual()
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              border: 0,
              background: 'rgba(22,49,70,0.04)',
              color: NAVY,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              borderTop: '1px solid rgba(22,49,70,0.08)',
            }}
          >
            Don't see it? Enter city + state manually
          </button>
        </div>
      )}

      {(error || hint) && (
        <div style={{ marginTop: 6, fontSize: 11.5, color: error ? '#9b1c1c' : 'rgba(22,49,70,0.55)', fontWeight: 600 }}>
          {error || hint}
        </div>
      )}
    </div>
  )
}

export default LocationField
