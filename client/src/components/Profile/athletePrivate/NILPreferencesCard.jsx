import React from 'react'
import { Card, EditPencil, Pill, EmptyState } from './shared/primitives'

// NIL Preferences card. Reads bundle.nilPreferences from the bundle response.
// Schema enums:
//   dealSize: '50k-100k' | '100k-250k' | '250k-500k' | '500k-1m' | '1m-5m' | '5m+'
//   timeline: 'short' | 'medium' | 'long'
//   focusAreas: [{title, description}]

const DEAL_SIZE_LABELS = {
  '50k-100k': '$50K – $100K',
  '100k-250k': '$100K – $250K',
  '250k-500k': '$250K – $500K',
  '500k-1m': '$500K – $1M',
  '1m-5m': '$1M – $5M',
  '5m+': '$5M+',
}

const TIMELINE_LABELS = {
  short: 'Short term',
  medium: 'Medium term',
  long: 'Long term',
}

const Row = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10,
      padding: '8px 0',
      borderTop: '1px solid rgba(22,49,70,0.06)',
    }}
  >
    <span
      style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'rgba(22,49,70,0.5)',
      }}
    >
      {label}
    </span>
    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#163146' }}>{value || '—'}</span>
  </div>
)

const NILPreferencesCard = ({ bundle, onEdit }) => {
  const nil = bundle?.nilPreferences || {}
  const focus = Array.isArray(nil.focusAreas) ? nil.focusAreas : []

  return (
    <Card
      title='NIL Preferences'
      action={<EditPencil onClick={onEdit} disabled label='Edit NIL preferences' />}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Row label='Deal size' value={DEAL_SIZE_LABELS[nil.dealSize] || nil.dealSize} />
        <Row label='Timeline' value={TIMELINE_LABELS[nil.timeline] || nil.timeline} />

        {/* Focus Areas */}
        <div style={{ paddingTop: 10, borderTop: '1px solid rgba(22,49,70,0.06)' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(22,49,70,0.5)',
              marginBottom: 6,
            }}
          >
            Focus Areas
          </div>
          {focus.length === 0 ? (
            <EmptyState message='No focus areas set.' />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {focus
                .map((f) => (typeof f === 'string' ? f : f?.title))
                .filter((s) => typeof s === 'string' && s.trim().length > 0)
                .map((label, i) => (
                  <Pill key={i} tone='bronze' size='xs'>{label}</Pill>
                ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default NILPreferencesCard
