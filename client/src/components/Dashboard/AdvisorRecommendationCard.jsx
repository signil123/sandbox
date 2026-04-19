import { motion } from 'framer-motion'
import { ExternalLink, Plus, Send, UserPlus, Users } from 'lucide-react'
import React from 'react'
import ProfileBlurOverlay from '../Explore/ProfileBlurOverlay'

const truncate = (text, max = 50) => {
  if (!text) return ''
  const clean = String(text).trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

export const AdvisorRecommendationCard = ({ advisor, onConnect, onView }) => {
  const bio = truncate(advisor.about, 150)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'relative',
        background: '#fff',
        border: '1px solid rgba(22,49,70,.05)',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
      }}
      className='group'
    >
      {advisor.isBlurred && <ProfileBlurOverlay onClick={() => onView(advisor)} />}

      {/* Banner — 25% of card height */}
      <div style={{ flex: '0 0 25%', minHeight: 0, position: 'relative', ...advisor.banner }}>
        {/* Location — bottom right */}
        {advisor.location && (
          <div style={{ position: 'absolute', right: 12, bottom: 10, color: '#fff', fontSize: 11, fontWeight: 600, opacity: 0.95 }}>
            {advisor.location}
          </div>
        )}
        {/* Avatar — overlaps banner */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            bottom: -22,
            width: 50,
            height: 50,
            borderRadius: '50%',
            border: '3px solid #fff',
            overflow: 'hidden',
            background: '#b5c3d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {advisor.profileImg ? (
            <img
              src={advisor.profileImg}
              alt={advisor.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            advisor.initials
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 14px 12px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Name + Title */}
        <div style={{ fontSize: 13, fontWeight: 800, color: '#163146', letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {advisor.name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(22,49,70,.55)', fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {advisor.title}
        </div>

        {/* Specialty chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '10px 0 10px' }}>
          {advisor.specialties?.slice(0, 2).map((s, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'rgba(22,49,70,.04)',
                color: '#163146',
                border: '1px solid rgba(22,49,70,.08)',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </span>
          ))}
          {advisor.specialties?.length > 2 && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 999, background: '#986a41', color: '#fff' }}>
              +{advisor.specialties.length - 2}
            </span>
          )}
        </div>

        {/* Bio — middle area, fills free space */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            fontSize: 11,
            color: 'rgba(22,49,70,.68)',
            fontWeight: 500,
            lineHeight: 1.4,
            marginBottom: 10,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {bio}
        </div>

        {/* Stats — right above buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 2,
            padding: '9px 0',
            borderTop: '1px solid rgba(22,49,70,.05)',
            borderBottom: '1px solid rgba(22,49,70,.05)',
            marginBottom: 10,
          }}
        >
          {[
            {
              k: 'Experience',
              v: advisor.experience
                ? (String(advisor.experience).toLowerCase().includes('year') ? advisor.experience : `${advisor.experience} years`)
                : 'N/A',
            },
            {
              k: 'Rating',
              v: advisor.rating > 0 ? Number(advisor.rating).toFixed(1) : 'N/A',
            },
            {
              k: 'Connections',
              v: advisor.connections ?? 0,
            },
          ].map((m) => (
            <div key={m.k} style={{ textAlign: 'center', minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(22,49,70,.4)',
                  marginBottom: 2,
                }}
              >
                {m.k}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#163146', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.v}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          <motion.button
            onClick={() => onView(advisor)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: 8,
              borderRadius: 10,
              background: '#fff',
              border: '1px solid rgba(22,49,70,.12)',
              color: '#163146',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={11} strokeWidth={2} />
            View
          </motion.button>
          <motion.button
            onClick={() => onConnect(advisor)}
            disabled={advisor.isBlurred || advisor.connectionStatus !== 'not_connected'}
            whileHover={!advisor.isBlurred && advisor.connectionStatus === 'not_connected' ? { scale: 1.02 } : {}}
            whileTap={!advisor.isBlurred && advisor.connectionStatus === 'not_connected' ? { scale: 0.98 } : {}}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: 8,
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              border: 'none',
              cursor: advisor.isBlurred || advisor.connectionStatus !== 'not_connected' ? 'default' : 'pointer',
              ...(advisor.isBlurred
                ? { background: 'rgba(22,49,70,.06)', color: 'rgba(22,49,70,.55)' }
                : advisor.connectionStatus === 'connected'
                  ? { background: 'rgba(22,49,70,.06)', color: 'rgba(22,49,70,.55)' }
                  : advisor.connectionStatus === 'pending' || advisor.connectionStatus === 'received'
                    ? { background: 'rgba(180,130,60,.12)', color: '#986a41' }
                    : { background: '#163146', color: '#fff' }),
            }}
          >
            {advisor.isBlurred ? (
              <>
                <UserPlus size={11} strokeWidth={2} />
                Upgrade
              </>
            ) : advisor.connectionStatus === 'connected' ? (
              <>
                <Users size={11} strokeWidth={2} />
                Connected
              </>
            ) : advisor.connectionStatus === 'pending' ? (
              <>
                <Send size={11} strokeWidth={2} />
                Sent
              </>
            ) : advisor.connectionStatus === 'received' ? (
              <>
                <UserPlus size={11} strokeWidth={2} />
                Review
              </>
            ) : (
              <>
                <Plus size={11} strokeWidth={2.5} />
                Connect
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
