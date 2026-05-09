import React, { useEffect, useState } from 'react'
import { Card, EmptyState } from './shared/primitives'
import { ArrowRight } from './shared/icons'
import { connectionService } from '../../../services/connectionService'
import { getImageUrl } from '../../../utils/imageUtils'

// Connection Center — top 3 most recent accepted connections + "see all" arrow
// that opens the existing ConnectionsModal. Per spec: Message-only button
// (these are already accepted, no Connect needed).

const initialsOf = (name) => {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
}

const ConnectionMiniCard = ({ c, onMessage }) => {
  const u = c.user || c
  const name = u.name || 'Unknown'
  const role = u.userType || c.relationshipType || 'connection'
  const photo = u.profileImage ? getImageUrl(u.profileImage) : null
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid rgba(22,49,70,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 36,
          background: 'linear-gradient(135deg, #163146, #1c3e5a)',
          flexShrink: 0,
        }}
      />
      <div style={{ padding: '0 12px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            marginTop: -23,
            background: photo ? `url(${photo}) center/cover` : '#986a41',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 900,
            border: '3px solid #fff',
            boxShadow: '0 2px 6px -1px rgba(22,49,70,0.18)',
            alignSelf: 'flex-start',
          }}
        >
          {!photo && initialsOf(name)}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 12.5,
            fontWeight: 800,
            color: '#163146',
            letterSpacing: '-0.005em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: 'rgba(22,49,70,0.55)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: 1,
          }}
        >
          {role}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type='button'
          onClick={() => onMessage?.(u._id || u.id)}
          style={{
            marginTop: 8,
            background: '#163146',
            color: '#fff',
            padding: '6px 0',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            border: 0,
            width: '100%',
          }}
        >
          Message
        </button>
      </div>
    </div>
  )
}

const SeeAllArrow = ({ onClick }) => (
  <button
    type='button'
    onClick={onClick}
    aria-label='See all connections'
    style={{
      background: 'rgba(152,106,65,0.08)',
      color: '#7a5435',
      borderRadius: 14,
      border: '1px dashed rgba(152,106,65,0.35)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: '10px 6px',
      height: '100%',
    }}
  >
    <ArrowRight size={20} />
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 900,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      See all
    </span>
  </button>
)

const ConnectionCenterCard = ({ currentUserId, onSeeAll, onMessage }) => {
  const [conns, setConns] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!currentUserId) return
    let cancelled = false
    connectionService
      .getNetwork(currentUserId)
      .then((res) => {
        if (cancelled) return
        // Response shape varies by endpoint version — be defensive.
        const raw =
          res?.data?.data?.connections ||
          res?.data?.connections ||
          res?.data?.data ||
          res?.data ||
          []
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
        // Sort by most recent acceptedAt / updatedAt / createdAt; take top 3
        const sorted = [...list].sort((a, b) => {
          const at = new Date(a.acceptedAt || a.updatedAt || a.createdAt || 0).getTime()
          const bt = new Date(b.acceptedAt || b.updatedAt || b.createdAt || 0).getTime()
          return bt - at
        })
        setConns(sorted.slice(0, 3))
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e?.message || e))
      })
    return () => {
      cancelled = true
    }
  }, [currentUserId])

  const total = Array.isArray(conns) ? conns.length : 0

  return (
    <Card title='Connection Center' count={total}>
      {err && <EmptyState message={`Couldn't load connections: ${err}`} />}
      {!err && conns === null && <EmptyState message='Loading connections…' />}
      {!err && conns?.length === 0 && (
        <EmptyState message='No connections yet — they’ll show up here once you accept your first one.' />
      )}
      {!err && conns && conns.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 52px',
            gap: 10,
            height: '100%',
            minHeight: 0,
          }}
        >
          {conns.map((c, i) => (
            <ConnectionMiniCard key={c._id || i} c={c} onMessage={onMessage} />
          ))}
          {/* Pad with empty slots so the grid stays balanced when <3 conns */}
          {Array.from({ length: Math.max(0, 3 - conns.length) }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          <SeeAllArrow onClick={onSeeAll} />
        </div>
      )}
    </Card>
  )
}

export default ConnectionCenterCard
