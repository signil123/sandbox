import React from 'react'
import { Pencil } from './icons'

// Card — the white rounded panel everything sits on. `title`/`count` form the
// eyebrow row; `action` slot holds the edit pencil (or nothing). Children
// receive a min-height:0 + flex:1 wrapper so internal scroll regions work.
export const Card = ({ title, count, action, children, padding = 18, style }) => (
  <section
    style={{
      background: '#fff',
      borderRadius: 18,
      border: '1px solid rgba(22,49,70,0.06)',
      boxShadow: '0 2px 8px -2px rgba(22,49,70,0.05)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
      ...style,
    }}
  >
    {(title || action) && (
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${padding}px ${padding}px 0`,
          marginBottom: 6,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          {title && (
            <h3
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 800,
                color: '#163146',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </h3>
          )}
          {typeof count === 'number' && (
            <span style={{ fontSize: 11, color: 'rgba(22,49,70,0.45)', fontWeight: 700 }}>
              {count}
            </span>
          )}
        </div>
        {action}
      </header>
    )}
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: `0 ${padding}px ${padding}px`,
        // Card body must be a flex column so children using `flex:1` (e.g.
        // ActivityStrengthCard's chart fill region) actually flex-grow.
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  </section>
)

// EditPencil — circular gold-tint button. `disabled` greys it out for Phase B
// where the modals aren't wired yet.
export const EditPencil = ({ onClick, disabled, label = 'Edit' }) => (
  <button
    type='button'
    onClick={disabled ? undefined : onClick}
    aria-label={label}
    title={disabled ? 'Edit (coming soon)' : label}
    disabled={disabled}
    style={{
      width: 28,
      height: 28,
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: disabled ? 'rgba(22,49,70,0.04)' : 'rgba(152,106,65,0.10)',
      color: disabled ? 'rgba(22,49,70,0.30)' : '#7a5435',
      border: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0,
    }}
  >
    <Pencil size={13} />
  </button>
)

// Pill — small chip used for type tags / focus-area chips / interest pills.
export const Pill = ({ children, tone = 'navy', size = 'sm' }) => {
  const tones = {
    navy: { bg: 'rgba(22,49,70,0.06)', fg: '#163146' },
    bronze: { bg: 'rgba(152,106,65,0.10)', fg: '#7a5435' },
    bronzeSolid: { bg: '#986a41', fg: '#fff' },
    ghost: { bg: 'transparent', fg: 'rgba(22,49,70,0.55)', border: '1px solid rgba(22,49,70,0.10)' },
  }
  const t = tones[tone] || tones.navy
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: t.bg,
        color: t.fg,
        border: t.border || 0,
        fontSize: size === 'xs' ? 10.5 : 11.5,
        fontWeight: 700,
        letterSpacing: '0.01em',
        padding: size === 'xs' ? '3px 7px' : '4px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

// ProgressRing — circular percentage ring used for Profile Strength.
// Color shifts red (<50) → amber (51–79) → green (80+).
export const ProgressRing = ({ value = 0, size = 96, label }) => {
  const stroke = Math.max(6, Math.round(size * 0.10))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const dash = (pct / 100) * c

  let color = '#22c55e'
  if (pct < 50) color = '#ef4444'
  else if (pct < 80) color = '#f59e0b'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke='rgba(22,49,70,0.08)'
          strokeWidth={stroke}
          fill='none'
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill='none'
          strokeLinecap='round'
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#163146',
        }}
      >
        <div style={{ fontSize: Math.round(size * 0.26), fontWeight: 900, letterSpacing: '-0.02em' }}>
          {pct}%
        </div>
        {label && (
          <div
            style={{
              fontSize: Math.max(8, Math.round(size * 0.085)),
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(22,49,70,0.55)',
              marginTop: 2,
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

// FadeScroll — vertical scroll region with a soft fade at top + bottom edges.
export const FadeScroll = ({ children, maxHeight }) => (
  <div
    style={{
      position: 'relative',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      maxHeight,
    }}
  >
    <div
      className='no-scrollbar'
      style={{
        height: '100%',
        overflowY: 'auto',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)',
      }}
    >
      {children}
    </div>
  </div>
)

// EmptyState — used when an array is empty. Subtle, no CTA in Phase B.
export const EmptyState = ({ message }) => (
  <div
    style={{
      padding: '20px 4px',
      fontSize: 12.5,
      color: 'rgba(22,49,70,0.45)',
      fontWeight: 500,
      textAlign: 'center',
    }}
  >
    {message}
  </div>
)
