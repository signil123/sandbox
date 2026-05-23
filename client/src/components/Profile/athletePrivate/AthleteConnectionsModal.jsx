import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { connectionService } from '../../../services/connectionService'
import { profileService } from '../../../services/profileService'
import { Search, X } from './shared/icons'
import {
  ConnectionMiniCard,
  buildMiniCardData,
  extractOtherUserId,
} from './shared/ConnectionMiniCard'
import { distanceMiles, isRemoteLocation } from '../../../utils/geo'

// AthleteConnectionsModal — full connections grid for the athlete private
// profile. Replaces the legacy `ConnectionsModal` on this surface only;
// other call sites still use the old modal.
//
// Design source: Claude Design `connections.jsx` ConnectionsModal — 960px,
// navy backdrop with blur, search bar, two filter pill groups (Focus +
// Location), 3-column grid of `ConnectionMiniCard`.
//
// Filters:
//   - Focus: All / Legal / Finance / Marketing / Other.
//     Mapped from each connection's expertise — falls through to userType
//     ('agent' → 'other') when expertise is empty.
//   - Location: Any / 25 mi / 100 mi / Remote.
//     - Remote matches connections whose location string contains "remote"
//       (case-insensitive) OR whose location is missing entirely (per #14).
//     - 25 / 100 use haversine on Profile.coordinates (populated by the
//       LocationField when the user picks a Photon suggestion). Older
//       advisor docs without coords are excluded from those buckets.
//     - Requires the viewer (the athlete) to have coordinates set;
//       otherwise the distance filters silently match nothing and we surface
//       a hint.

const NAVY = '#163146'
const BRONZE = '#986a41'

const FOCUS_OPTIONS = [
  ['all', 'All'],
  ['legal', 'Legal'],
  ['finance', 'Finance'],
  ['marketing', 'Marketing'],
  ['other', 'Other'],
]

const LOCATION_OPTIONS = [
  ['any', 'Any'],
  ['25', '25 mi'],
  ['100', '100 mi'],
  ['remote', 'Remote'],
]

// Crude focus-area → category mapping. Keyword-based so we don't need a
// taxonomy. Anything that doesn't match falls through to 'other'.
const focusCategoryFor = (data) => {
  const txt = (
    (data.expertise || []).join(' ') +
    ' ' +
    (data.role || '')
  ).toLowerCase()
  if (/legal|contract|compliance|attorney|counsel|ip rights|nil law|estate/.test(txt)) return 'legal'
  if (/financ|tax|invest|wealth|cpa|accounting|s-corp|trust|insurance/.test(txt)) return 'finance'
  if (/brand|market|content|social|press|public relations|publicity|growth/.test(txt)) return 'marketing'
  if (data.userType === 'agent') return 'other'
  return 'other'
}

const FilterGroup = ({ label, value, onChange, options }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: 'rgba(22,49,70,0.5)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
    <div
      style={{
        display: 'inline-flex',
        gap: 3,
        padding: 3,
        borderRadius: 10,
        background: 'rgba(22,49,70,0.04)',
        border: '1px solid rgba(22,49,70,0.06)',
      }}
    >
      {options.map(([id, lbl]) => (
        <button
          key={id}
          type='button'
          onClick={() => onChange(id)}
          style={{
            padding: '4px 10px',
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 700,
            border: 0,
            cursor: 'pointer',
            background: value === id ? '#fff' : 'transparent',
            color: value === id ? NAVY : 'rgba(22,49,70,0.6)',
            boxShadow: value === id ? '0 2px 6px -2px rgba(22,49,70,0.15)' : 'none',
          }}
        >
          {lbl}
        </button>
      ))}
    </div>
  </div>
)

const AthleteConnectionsModal = ({
  open,
  onClose,
  currentUserId,
  viewerProfile, // bundle.profile from the page — needed for the distance filter
  onMessage,
  onView,
}) => {
  const [conns, setConns] = useState(null)
  const [profiles, setProfiles] = useState({})
  const [err, setErr] = useState(null)
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState('all')
  const [radius, setRadius] = useState('any')

  // Lock body scroll while open + ESC closes.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Reset transient state on open
  useEffect(() => {
    if (!open) return
    setQ('')
    setFocus('all')
    setRadius('any')
  }, [open])

  // Load all connections (not just top 3) when the modal opens.
  useEffect(() => {
    if (!open || !currentUserId) return
    let cancelled = false
    setConns(null)
    setErr(null)
    connectionService
      .getNetwork(currentUserId)
      .then((res) => {
        if (cancelled) return
        const raw =
          res?.data?.data?.connections ||
          res?.data?.connections ||
          res?.data?.data ||
          res?.data ||
          []
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
        const sorted = [...list].sort((a, b) => {
          const at = new Date(
            a.acceptedAt || a.connectedAt || a.updatedAt || a.createdAt || 0
          ).getTime()
          const bt = new Date(
            b.acceptedAt || b.connectedAt || b.updatedAt || b.createdAt || 0
          ).getTime()
          return bt - at
        })
        setConns(sorted)
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e?.message || e))
      })
    return () => {
      cancelled = true
    }
  }, [open, currentUserId])

  // Lazy-load each connection's full Profile in batches as connections arrive.
  useEffect(() => {
    if (!conns || conns.length === 0) return
    let cancelled = false
    const targets = conns
      .map((c) => extractOtherUserId(c, currentUserId))
      .filter((id) => id && !profiles[id])
    if (targets.length === 0) return
    Promise.all(
      targets.map((id) =>
        profileService
          .getPublicProfile(id)
          .then((res) => ({ id, data: res?.data || res }))
          .catch(() => ({ id, data: null }))
      )
    ).then((results) => {
      if (cancelled) return
      const next = { ...profiles }
      for (const r of results) {
        if (r.data) next[r.id] = r.data
      }
      setProfiles(next)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conns])

  // Build mini-card data for every connection
  const cardData = useMemo(() => {
    if (!conns) return []
    return conns.map((c) =>
      buildMiniCardData({
        connection: c,
        currentUserId,
        publicProfile: profiles[extractOtherUserId(c, currentUserId)] || null,
      })
    )
  }, [conns, profiles, currentUserId])

  // Apply filters
  const viewerCoords = viewerProfile?.coordinates || null
  const viewerHasCoords =
    viewerCoords && Number.isFinite(viewerCoords.lat) && Number.isFinite(viewerCoords.lng)

  const filtered = useMemo(() => {
    if (!cardData) return []
    return cardData.filter((d) => {
      // Focus filter
      if (focus !== 'all') {
        if (focusCategoryFor(d) !== focus) return false
      }

      // Location filter
      if (radius === 'remote') {
        if (!isRemoteLocation(d.location)) return false
      } else if (radius === '25' || radius === '100') {
        const limit = radius === '25' ? 25 : 100
        if (!viewerHasCoords) return false
        if (!d.coordinates) return false
        const dist = distanceMiles(viewerCoords, d.coordinates)
        if (dist == null || dist > limit) return false
      }

      // Search query (name / role / expertise / location)
      if (q.trim()) {
        const hay =
          `${d.name || ''} ${d.role || ''} ${(d.expertise || []).join(' ')} ${d.location || ''}`.toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
  }, [cardData, focus, radius, q, viewerCoords, viewerHasCoords])

  if (!open) return null

  const total = cardData.length

  // Hint shown when distance filter is selected but viewer has no coords.
  const distanceHint =
    (radius === '25' || radius === '100') && !viewerHasCoords
      ? 'Add your location (with city autocomplete) to enable distance filters.'
      : null

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Your connections'
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(10,24,36,0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(960px, 96vw)',
          maxHeight: '88vh',
          background: '#fff',
          borderRadius: 24,
          border: '1px solid rgba(22,49,70,0.06)',
          boxShadow: '0 50px 100px -20px rgba(22,49,70,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(22,49,70,0.06)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: NAVY,
                  letterSpacing: '-0.01em',
                }}
              >
                Your Connections
              </h2>
              <div
                style={{
                  fontSize: 9,
                  color: BRONZE,
                  letterSpacing: '0.18em',
                  marginTop: 3,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                {filtered.length} of {total} · Advisors &amp; Agents
              </div>
            </div>
            <button
              type='button'
              onClick={onClose}
              aria-label='Close'
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'rgba(22,49,70,0.05)',
                color: NAVY,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 0,
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 12,
              background: 'rgba(22,49,70,0.04)',
              border: '1px solid rgba(22,49,70,0.06)',
              marginBottom: 10,
            }}
          >
            <span style={{ color: 'rgba(22,49,70,0.5)' }}>
              <Search size={15} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search by name, role, expertise…'
              style={{
                flex: 1,
                border: 0,
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                fontFamily: 'inherit',
                color: NAVY,
              }}
            />
          </div>

          {/* Filter groups */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterGroup label='Focus' value={focus} onChange={setFocus} options={FOCUS_OPTIONS} />
            <FilterGroup
              label='Location'
              value={radius}
              onChange={setRadius}
              options={LOCATION_OPTIONS}
            />
            {distanceHint && (
              <span
                style={{
                  fontSize: 11,
                  color: '#7a5435',
                  fontStyle: 'italic',
                  fontWeight: 600,
                }}
              >
                {distanceHint}
              </span>
            )}
          </div>
        </div>

        {/* List */}
        <div
          className='no-scrollbar'
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 22px',
          }}
        >
          {err && (
            <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c', fontSize: 13 }}>
              Couldn’t load connections: {err}
            </div>
          )}
          {!err && conns === null && (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'rgba(22,49,70,0.5)',
                fontSize: 13,
              }}
            >
              Loading connections…
            </div>
          )}
          {!err && conns && filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'rgba(22,49,70,0.5)',
                fontSize: 13,
              }}
            >
              No connections match.
            </div>
          )}
          {!err && conns && filtered.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {filtered.map((d) => (
                <ConnectionMiniCard
                  key={d.userId || `idx-${d.name}`}
                  data={d}
                  onMessage={onMessage}
                  onView={onView}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AthleteConnectionsModal
