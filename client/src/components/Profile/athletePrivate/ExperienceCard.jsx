import React from 'react'
import { Card, EditPencil, FadeScroll, EmptyState, Pill } from './shared/primitives'

// Experience card. Reads bundle.profile.experience (Phase A canonical shape).
// Field names match what AdvisorPublicView's ExperienceEntry consumes:
//   { role, company, type, startDate, endDate, location, description,
//     logoText, logoBg }

const ExperienceItem = ({ e, isLast }) => {
  const logoText = (e.logoText || (e.company || '?').slice(0, 3)).toUpperCase()
  const logoBg = e.logoBg || '#163146'
  return (
    <div
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'flex-start',
        padding: '11px 0',
        borderBottom: isLast ? 0 : '1px solid rgba(22,49,70,0.06)',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: logoBg,
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.04em',
          flexShrink: 0,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {logoText}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#163146',
              letterSpacing: '-0.005em',
              lineHeight: 1.25,
            }}
          >
            {e.role || 'Untitled role'}
          </div>
          {e.type && <Pill tone='ghost' size='xs'>{e.type}</Pill>}
        </div>
        <div style={{ fontSize: 12, color: '#163146', fontWeight: 600, marginTop: 2 }}>
          {e.company}
        </div>
        {(e.startDate || e.endDate) && (
          <div style={{ fontSize: 11, color: 'rgba(22,49,70,0.55)', marginTop: 2 }}>
            {e.startDate}
            {e.startDate && e.endDate && ' – '}
            {e.endDate}
            {e.location && <span> · {e.location}</span>}
          </div>
        )}
        {e.description && (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 11.5,
              lineHeight: 1.5,
              color: 'rgba(22,49,70,0.78)',
            }}
          >
            {e.description}
          </p>
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
    >
      {items.length === 0 ? (
        <EmptyState message='No experience added, yet.' />
      ) : (
        <FadeScroll>
          <div>
            {items.map((e, i) => (
              <ExperienceItem key={i} e={e} isLast={i === items.length - 1} />
            ))}
          </div>
        </FadeScroll>
      )}
    </Card>
  )
}

export default ExperienceCard
