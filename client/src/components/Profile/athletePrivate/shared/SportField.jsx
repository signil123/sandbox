import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

const NAVY = '#163146'
const BRONZE = '#986a41'

// COLLEGE_SPORTS — comprehensive list of NCAA + NAIA + club-level sports
// commonly fielded at US colleges. Sorted alphabetically. Pre-Olympic and
// emerging-sport additions are included so we don't gatekeep the niches.
// Users who play something genuinely off-list can still type freely and
// commit it via the "Use exactly what I typed" affordance.
export const COLLEGE_SPORTS = [
  'Acrobatics & Tumbling',
  'Archery',
  'Badminton',
  'Baseball',
  'Basketball',
  'Beach Volleyball',
  'Bowling',
  'Boxing',
  'Cheerleading',
  'Cross Country',
  'Cycling',
  'Dance',
  'Diving',
  'Equestrian',
  'eSports',
  'Fencing',
  'Field Hockey',
  'Figure Skating',
  'Football',
  'Golf',
  'Gymnastics',
  'Ice Hockey',
  'Lacrosse',
  'Marching Band',
  'Mountain Biking',
  'Pickleball',
  'Rifle',
  'Rodeo',
  'Rowing',
  'Rugby',
  'Sailing',
  'Skiing',
  'Snowboarding',
  'Soccer',
  'Softball',
  'Spirit Squad',
  'Squash',
  'Stunt',
  'Surfing',
  'Swimming',
  'Synchronized Swimming',
  'Table Tennis',
  'Tennis',
  'Track & Field',
  'Triathlon',
  'Ultimate Frisbee',
  'Volleyball',
  'Water Polo',
  'Weightlifting',
  'Wrestling',
]

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

// SportField — typeahead backed by COLLEGE_SPORTS. No network. If the user
// types something not in the list, a "Use 'X' as a custom sport" row appears
// at the bottom of the dropdown — same escape hatch pattern as LocationField,
// but no separate manual-mode form because there's only one field to capture.
export const SportField = ({ label = 'Sport', value, onChange, required, error, hint, placeholder = 'Search sport…' }) => {
  const id = useId()
  const wrapRef = useRef(null)
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COLLEGE_SPORTS.slice(0, 10)
    return COLLEGE_SPORTS.filter((s) => s.toLowerCase().includes(q)).slice(0, 10)
  }, [query])

  const trimmed = query.trim()
  const exactInList = COLLEGE_SPORTS.some((s) => s.toLowerCase() === trimmed.toLowerCase())
  const showCustomRow = trimmed.length > 0 && !exactInList

  // Rows = matches followed by an optional "use custom" row (rendered last).
  const customIdx = showCustomRow ? matches.length : -1

  const commit = (v) => {
    onChange?.(v)
    setQuery(v)
    setOpen(false)
    setActiveIdx(-1)
  }

  const onKeyDown = (e) => {
    const total = matches.length + (showCustomRow ? 1 : 0)
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(total - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx === customIdx && showCustomRow) commit(trimmed)
      else if (activeIdx >= 0 && matches[activeIdx]) commit(matches[activeIdx])
      else if (matches[0]) commit(matches[0])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div style={{ marginBottom: 14, position: 'relative' }} ref={wrapRef}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <input
        id={id}
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
          ...(error ? { borderColor: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.04)' } : null),
        }}
      />
      {open && (matches.length > 0 || showCustomRow) && (
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
          {matches.map((s, i) => {
            const active = i === activeIdx
            return (
              <button
                type='button'
                key={s}
                role='option'
                aria-selected={active}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commit(s)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  border: 0,
                  background: active ? 'rgba(152,106,65,0.10)' : 'transparent',
                  color: NAVY,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(22,49,70,0.04)',
                }}
              >
                {s}
              </button>
            )
          })}
          {showCustomRow && (
            <button
              type='button'
              onMouseEnter={() => setActiveIdx(customIdx)}
              onMouseDown={(e) => {
                e.preventDefault()
                commit(trimmed)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 0,
                background: activeIdx === customIdx ? 'rgba(152,106,65,0.18)' : 'rgba(22,49,70,0.04)',
                color: BRONZE,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                borderTop: '1px solid rgba(22,49,70,0.08)',
              }}
            >
              Use “{trimmed}” as a custom sport
            </button>
          )}
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

export default SportField
