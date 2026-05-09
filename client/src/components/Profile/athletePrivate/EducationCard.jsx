import React from 'react'
import { Card, EditPencil, FadeScroll, EmptyState } from './shared/primitives'

// Education card. Reads bundle.profile.education (Phase A canonical shape):
//   { school, degree, fieldOfStudy, startYear, endYear, description,
//     logoText, logoBg }

const EducationItem = ({ e, isLast }) => {
  const logoText = (e.logoText || (e.school || '?').slice(0, 1)).toUpperCase()
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
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 23,
          fontWeight: 600,
          flexShrink: 0,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {logoText}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#163146',
            letterSpacing: '-0.005em',
            lineHeight: 1.25,
          }}
        >
          {e.school || 'Untitled school'}
        </div>
        {(e.degree || e.fieldOfStudy) && (
          <div style={{ fontSize: 12, color: '#163146', fontWeight: 600, marginTop: 2 }}>
            {[e.degree, e.fieldOfStudy].filter(Boolean).join(' · ')}
          </div>
        )}
        {(e.startYear || e.endYear) && (
          <div style={{ fontSize: 11, color: 'rgba(22,49,70,0.55)', marginTop: 2 }}>
            {e.startYear}
            {e.startYear && e.endYear && ' – '}
            {e.endYear}
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

const EducationCard = ({ bundle, onEdit }) => {
  const items = Array.isArray(bundle?.profile?.education) ? bundle.profile.education : []
  return (
    <Card
      title='Education'
      count={items.length}
      action={<EditPencil onClick={onEdit} label='Edit education' />}
    >
      {items.length === 0 ? (
        <EmptyState message='No education added, yet.' />
      ) : (
        <FadeScroll>
          <div>
            {items.map((e, i) => (
              <EducationItem key={i} e={e} isLast={i === items.length - 1} />
            ))}
          </div>
        </FadeScroll>
      )}
    </Card>
  )
}

export default EducationCard
