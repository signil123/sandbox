import React from 'react'
import { Card, EditPencil, EmptyState } from './shared/primitives'

// Education card. Reads bundle.profile.education (Phase A canonical shape):
//   { school, degree, fieldOfStudy, startYear, endYear, description,
//     logoText, logoBg }

const EducationItem = ({ e, isLast }) => {
  const logoText = (e.logoText || (e.school || '?').slice(0, 1)).toUpperCase()
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
          marginTop: 2,
        }}
      >
        {logoText}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#163146' }}>
          {e.school || 'Untitled school'}
        </div>
        {(e.degree || e.fieldOfStudy) && (
          <div style={{ fontSize: 12, color: '#163146', fontWeight: 500, marginTop: 1 }}>
            {[e.degree, e.fieldOfStudy].filter(Boolean).join(' · ')}
          </div>
        )}
        {(e.startYear || e.endYear) && (
          <div style={{ fontSize: 11, color: 'rgba(22,49,70,0.55)', marginTop: 1 }}>
            {e.startYear}
            {e.startYear && e.endYear && ' – '}
            {e.endYear}
          </div>
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

const EducationCard = ({ bundle, onEdit }) => {
  const items = Array.isArray(bundle?.profile?.education) ? bundle.profile.education : []
  return (
    <Card
      title='Education'
      count={items.length}
      action={<EditPencil onClick={onEdit} label='Edit education' />}
      padding={14}
    >
      {items.length === 0 ? (
        <EmptyState message='No education added, yet.' />
      ) : (
        <div
          className='no-scrollbar'
          style={{ overflowY: 'auto', paddingRight: 4, flex: 1, minHeight: 0 }}
        >
          {items.map((e, i) => (
            <EducationItem key={i} e={e} isLast={i === items.length - 1} />
          ))}
        </div>
      )}
    </Card>
  )
}

export default EducationCard
