import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from './shared/icons'
import { connectionService } from '../../../services/connectionService'
import { profileService } from '../../../services/profileService'
import {
  ConnectionMiniCard,
  buildMiniCardData,
  extractOtherUserId,
} from './shared/ConnectionMiniCard'

// Connection Center — top 3 most recent accepted connections + circular bronze
// arrow that opens AthleteConnectionsModal. The mini-card visual is shared
// with the modal (see shared/ConnectionMiniCard.jsx).

const NAVY = '#163146'

const SeeAllArrow = ({ onClick }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <button
      type='button'
      onClick={onClick}
      aria-label='See all connections'
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#986a41',
        border: 'none',
        cursor: 'pointer',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px -2px rgba(152,106,65,0.5)',
        transition: 'transform 200ms, background 200ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)'
        e.currentTarget.style.background = '#7a5435'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = '#986a41'
      }}
    >
      <ArrowRight size={14} />
    </button>
  </div>
)

const ConnectionCenterCard = ({ currentUserId, onSeeAll, onMessage, onView }) => {
  const [conns, setConns] = useState(null)
  const [profiles, setProfiles] = useState({}) // {userId: publicProfileResponse}
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!currentUserId) return
    let cancelled = false
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
        setConns(sorted.slice(0, 3))
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e?.message || e))
      })
    return () => {
      cancelled = true
    }
  }, [currentUserId])

  useEffect(() => {
    if (!conns || conns.length === 0) return
    let cancelled = false
    const targets = conns
      .map((c) => extractOtherUserId(c, currentUserId))
      .filter((id) => id && !profiles[id])
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

  const total = Array.isArray(conns) ? conns.length : 0

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 18,
        border: '1px solid rgba(22,49,70,0.05)',
        boxShadow: '0 2px 8px -2px rgba(22,49,70,0.06)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
          gap: 10,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 800,
              color: NAVY,
              letterSpacing: '-0.01em',
            }}
          >
            Connection Center
          </h3>
          <span style={{ fontSize: 11, color: 'rgba(22,49,70,0.4)', fontWeight: 600 }}>
            ({total})
          </span>
        </div>
      </div>

      {err && (
        <div style={{ padding: 20, color: 'rgba(22,49,70,0.5)', fontSize: 12 }}>
          Couldn’t load connections: {err}
        </div>
      )}
      {!err && conns === null && (
        <div style={{ padding: 20, color: 'rgba(22,49,70,0.5)', fontSize: 12 }}>
          Loading connections…
        </div>
      )}
      {!err && conns?.length === 0 && (
        <div style={{ padding: 20, color: 'rgba(22,49,70,0.5)', fontSize: 12 }}>
          No connections yet — they’ll show up here once you accept your first one.
        </div>
      )}

      {!err && conns && conns.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 44px',
            gap: 8,
            alignItems: 'stretch',
            flex: 1,
            minHeight: 0,
          }}
        >
          {cardData.map((d, i) => (
            <ConnectionMiniCard
              key={d.userId ? `card-${d.userId}` : `card-idx-${i}`}
              data={d}
              onMessage={onMessage}
              onView={onView}
            />
          ))}
          {Array.from({ length: Math.max(0, 3 - cardData.length) }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          <SeeAllArrow onClick={onSeeAll} />
        </div>
      )}
    </section>
  )
}

export default ConnectionCenterCard
