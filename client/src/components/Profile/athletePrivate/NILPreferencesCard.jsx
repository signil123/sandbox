import React, { useEffect, useRef, useState } from 'react'
import { Card, EditPencil, Pill, EmptyState } from './shared/primitives'

// NIL Preferences card. Reads bundle.nilPreferences + bundle.interests from
// the bundle response. Schema enums:
//   dealSize: '0-1k' | '1k-5k' | '5k-10k' | '10k-25k' | '25k-50k' | '50k-100k' | '100k+'
//   timeline: 'short' | 'medium' | 'long'
//   focusAreas: [String]   // catalog values from server/data/focusAreasCatalog.js
//   interests:  [String]   // catalog values from server/data/interestsCatalog.js
// Legacy {title, description} focusArea entries and pre-Phase-C dealSize
// values (250k-500k, 500k-1m, 1m-5m, 5m+) still render via the labels map.

const DEAL_SIZE_LABELS = {
  '0-1k': '$0 – $1K',
  '1k-5k': '$1K – $5K',
  '5k-10k': '$5K – $10K',
  '10k-25k': '$10K – $25K',
  '25k-50k': '$25K – $50K',
  '50k-100k': '$50K – $100K',
  '100k+': '$100K+',
  // Legacy pre-Phase-C dealSize values — collapsed into the new top bucket
  // for display. Server-side they stay as-is until the user re-saves, at
  // which point the schema setter normalizes them to '100k+'.
  '100k-250k': '$100K+',
  '250k-500k': '$100K+',
  '500k-1m': '$100K+',
  '1m-5m': '$100K+',
  '5m+': '$100K+',
}

const TIMELINE_LABELS = {
  short: 'Short term',
  medium: 'Medium term',
  long: 'Long term',
}

const NAVY = '#163146'

const Row = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10,
      padding: '3px 0',
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
    <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{value || '—'}</span>
  </div>
)

// PillRail — horizontal-scroll rail clipped to roughly two pills wide. Right
// edge fades out to hint at hidden content; native horizontal scroll reveals
// the remaining pills. The rail height is fixed so the parent card height
// doesn't change as more selections are added.
const PillRail = ({ items, tone }) => {
  const scrollerRef = useRef(null)
  const [showRightFade, setShowRightFade] = useState(false)
  const [showLeftFade, setShowLeftFade] = useState(false)

  // Recompute fade-edge visibility whenever the rail scrolls or the item set
  // changes. The fade is purely cosmetic — it tells the user "there's more
  // over here" without forcing a scrollbar.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined
    const update = () => {
      setShowLeftFade(el.scrollLeft > 4)
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [items])

  if (!items || items.length === 0) {
    return <EmptyState message='None added yet.' />
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={scrollerRef}
        className='nil-pill-rail'
        style={{
          display: 'flex',
          gap: 5,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: 0,
        }}
      >
        {items.map((label, i) => (
          <span key={i} style={{ flexShrink: 0 }}>
            <Pill tone={tone} size='xs'>{label}</Pill>
          </span>
        ))}
      </div>
      {/* Hide the WebKit scrollbar separately — inline style can't target ::-webkit-scrollbar */}
      <style>{`
        .nil-pill-rail::-webkit-scrollbar { display: none; }
      `}</style>
      {showLeftFade && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 24,
            background: 'linear-gradient(to right, #fff 30%, rgba(255,255,255,0))',
            pointerEvents: 'none',
          }}
        />
      )}
      {showRightFade && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 30,
            background: 'linear-gradient(to left, #fff 30%, rgba(255,255,255,0))',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

// SubSectionHeader — eyebrow + count badge for the Focus Areas / Interests
// rows inside the card. Mirrors the eyebrow style used by `Row` above so the
// card reads as a single visual unit.
const SubSectionHeader = ({ label, count }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginBottom: 2,
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
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: 'rgba(22,49,70,0.5)',
      }}
    >
      {count}
    </span>
  </div>
)

const NILPreferencesCard = ({ bundle, onEdit }) => {
  const nil = bundle?.nilPreferences || {}
  const focus = (Array.isArray(nil.focusAreas) ? nil.focusAreas : [])
    .map((f) => (typeof f === 'string' ? f : f?.title))
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
  const interests = Array.isArray(bundle?.interests) ? bundle.interests : []

  return (
    <Card
      title='NIL Preferences'
      action={<EditPencil onClick={onEdit} label='Edit NIL preferences' />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Row label='Deal size' value={DEAL_SIZE_LABELS[nil.dealSize] || nil.dealSize} />
        <Row label='Timeline' value={TIMELINE_LABELS[nil.timeline] || nil.timeline} />

        <div style={{ paddingTop: 4, borderTop: '1px solid rgba(22,49,70,0.06)' }}>
          <SubSectionHeader label='Focus Areas' count={focus.length} />
          <PillRail items={focus} tone='bronze' />
        </div>

        <div style={{ paddingTop: 4 }}>
          <SubSectionHeader label='Interests' count={interests.length} />
          <PillRail items={interests} tone='navy' />
        </div>
      </div>
    </Card>
  )
}

export default NILPreferencesCard
