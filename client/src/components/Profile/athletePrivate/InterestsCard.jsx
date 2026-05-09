import React from 'react'
import { Card, EditPencil, Pill, EmptyState } from './shared/primitives'

// Interests card. Reads bundle.interests (array of catalog values, Phase A).
// Horizontal scroll, pills only.

const InterestsCard = ({ bundle, onEdit }) => {
  const items = Array.isArray(bundle?.interests) ? bundle.interests : []

  return (
    <Card
      title='Interests'
      count={items.length}
      action={<EditPencil onClick={onEdit} disabled label='Edit interests' />}
    >
      {items.length === 0 ? (
        <EmptyState message='Pick at least 5 interests to complete your profile.' />
      ) : (
        <div
          className='no-scrollbar'
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 16px), transparent 100%)',
            maskImage:
              'linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 16px), transparent 100%)',
          }}
        >
          {items.map((label, i) => (
            <Pill key={i} tone='navy' size='xs'>{label}</Pill>
          ))}
        </div>
      )}
    </Card>
  )
}

export default InterestsCard
