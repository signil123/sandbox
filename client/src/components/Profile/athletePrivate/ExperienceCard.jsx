import React from 'react'
import { Card, EditPencil, EmptyState } from './shared/primitives'

// Experience card. Reads bundle.profile.experience (Phase A canonical shape).
// Field names match what AdvisorPublicView's ExperienceEntry consumes:
//   { role, company, type, startDate, endDate, location, description,
//     logoText, logoBg }

const TypePill = ({ t }) => {
  const tones = {
    'Endorsement Deal': { bg: 'rgba(152,106,65,0.10)', fg: '#7a5435', bd: 'rgba(152,106,65,0.22)' },
    'Athletic Position': { bg: 'rgba(22,49,70,0.06)', fg: '#163146', bd: 'rgba(22,49,70,0.12)' },
    'Brand Ambassador': { bg: 'rgba(152,106,65,0.10)', fg: '#7a5435', bd: 'rgba(152,106,65,0.22)' },
    Community: { bg: 'rgba(20,184,166,0.08)', fg: '#0f766e', bd: 'rgba(20,184,166,0.2)' },
    Media: { bg: 'rgba(99,102,241,0.08)', fg: '#4338ca', bd: 'rgba(99,102,241,0.2)' },
    Volunteer: { bg: 'rgba(20,184,166,0.08)', fg: '#0f766e', bd: 'rgba(20,184,166,0.2)' },
  }
  const c = tones[t] || tones['Athletic Position']
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: 6,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.bd}`,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {t}
    </span>
  )
}

const ExperienceItem = ({ e, isLast }) => {
  const logoText = (e.logoText || (e.company || '?').slice(0, 3)).toUpperCase()
  const logoBg = e.logoBg || '#163146'
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '34px 1fr',
        gap: 10,
        padding: '8px 0',
        borderBottom: isLast ? 0 : '1px solid rgba(22,49,70,0.06)',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 6,
          background: logoBg,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.02em',
          marginTop: 2,
        }}
      >
        {logoText}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#163146' }}>
          {e.role || 'Untitled role'}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#163146',
            fontWeight: 500,
            marginTop: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {e.company && <span>{e.company}</span>}
          {e.type && <TypePill t={e.type} />}
        </div>
        {(e.startDate || e.endDate) && (
          <div style={{ fontSize: 11, color: 'rgba(22,49,70,0.55)', marginTop: 1 }}>
            {e.startDate}
            {e.startDate && e.endDate && ' – '}
            {e.endDate}
          </div>
        )}
        {e.location && (
          <div style={{ fontSize: 11, color: 'rgba(22,49,70,0.55)' }}>{e.location}</div>
        )}
        {e.description && (
          <div
            style={{
              fontSize: 11,
              color: 'rgba(22,49,70,0.65)',
              marginTop: 4,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {e.description}
          </div>
        )}
      </div>
    </div>
  )
}

const ExperienceCard = ({ bundle, onEdit }) => {
  const items = Array.isArray(bundle?.profile?.experience) ? bundle.profile.experience : []
  return (
    <Card
      title='Experience'
      count={items.length}
      action={<EditPencil onClick={onEdit} label='Edit experience' />}
      padding={14}
    >
      {items.length === 0 ? (
        <EmptyState message='No experience added, yet.' />
      ) : (
        <div
          className='no-scrollbar'
          style={{ overflowY: 'auto', paddingRight: 4, flex: 1, minHeight: 0 }}
        >
          {items.map((e, i) => (
            <ExperienceItem key={i} e={e} isLast={i === items.length - 1} />
          ))}
        </div>
      )}
    </Card>
  )
}

export default ExperienceCard
