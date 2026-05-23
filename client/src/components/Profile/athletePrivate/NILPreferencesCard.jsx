import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Card } from './shared/primitives'
import { ChevronDown, DollarSign, Clock, Target, Heart, Plus, Lock } from './shared/icons'

// NIL Preferences card — inline editing per the new design.
//
//   - Deal Size + Timeline are native `<select>` overlays inside styled tiles.
//     Changing them stages a `nilPrefs` slice into the parent's draft.
//   - Focus Areas and Interests have horizontal pill rails and a `+` button
//     that opens the existing single-section catalog modals (FocusAreasModal /
//     InterestsModal). Those modals stage their selection back into the same
//     parent draft on Save.
//   - When the draft is non-null, an "UNSAVED CHANGES" Cancel/Confirm bar
//     appears at the bottom. Confirm calls the parent's onCommit, which fires
//     `/me/nil-preferences` and/or `/me/interests` per dirty slice.
//
// Schema enums are kept in shared/CatalogTypeahead.jsx; this card only needs
// the display labels.

const NAVY = '#163146'
const BRONZE = '#986a41'

const DEAL_SIZE_OPTIONS = [
  { value: '0-1k', label: '$0 – $1K' },
  { value: '1k-5k', label: '$1K – $5K' },
  { value: '5k-10k', label: '$5K – $10K' },
  { value: '10k-25k', label: '$10K – $25K' },
  { value: '25k-50k', label: '$25K – $50K' },
  { value: '50k-100k', label: '$50K – $100K' },
  { value: '100k+', label: '$100K+' },
]

const TIMELINE_OPTIONS = [
  { value: 'short', label: 'Short term' },
  { value: 'medium', label: 'Medium term' },
  { value: 'long', label: 'Long term' },
]

// Map any legacy dealSize value into the new enum so the inline select finds
// a matching option. Server schema setter persists the upgrade on next save.
const LEGACY_DEAL_SIZE = new Set(['100k-250k', '250k-500k', '500k-1m', '1m-5m', '5m+'])
const normalizeDealSize = (v) => (LEGACY_DEAL_SIZE.has(v) ? '100k+' : v) || '0-1k'

const PrivateBadge = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 7px',
      borderRadius: 4,
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: BRONZE,
      background: 'transparent',
      border: 0,
    }}
    title='Selections in this section are never publicly visible'
  >
    <Lock size={9} />
    Private
  </span>
)

// Custom dropdown overlay tile — replaces the native `<select>` overlay so
// the open popover scales to the tile (the macOS native select popover was
// rendering oversized and out-of-scale with the rest of the card).
//
// Uses a portal so the popover layer escapes the card's clip/scroll context;
// position is computed from the trigger's bounding box on every open and on
// scroll/resize so it stays anchored.
const SelectTile = ({ icon: Icon, label, value, options, onChange, changed }) => {
  const id = useId()
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const selected = options.find((o) => o.value === value)

  const updatePos = () => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left, width: r.width })
  }

  useEffect(() => {
    if (!open) return undefined
    updatePos()
    const onScroll = () => updatePos()
    const onResize = () => updatePos()
    const onDown = (e) => {
      // Close on click outside trigger AND outside popover. Popover is
      // marked via data attribute below.
      if (
        !triggerRef.current?.contains(e.target) &&
        !e.target.closest?.(`[data-niltile-popover="${id}"]`)
      ) {
        setOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, id])

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup='listbox'
        aria-expanded={open}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 7px',
          borderRadius: 8,
          background: changed ? 'rgba(152,106,65,0.08)' : 'rgba(22,49,70,0.025)',
          border: '1px solid ' + (changed ? 'rgba(152,106,65,0.35)' : 'rgba(22,49,70,0.05)'),
          minWidth: 0,
          cursor: 'pointer',
          transition: 'background 150ms, border-color 150ms',
          fontFamily: 'inherit',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: '#fff',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: BRONZE,
            border: '1px solid rgba(152,106,65,0.18)',
          }}
        >
          <Icon size={10} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: 'rgba(22,49,70,0.45)',
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: NAVY,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {selected?.label || value}
          </div>
        </div>
        <span
          style={{
            transition: 'transform 150ms',
            transform: `rotate(${open ? 180 : 0}deg)`,
            display: 'inline-flex',
          }}
        >
          <ChevronDown size={11} />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            data-niltile-popover={id}
            role='listbox'
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: 220,
              overflowY: 'auto',
              zIndex: 60,
              background: '#fff',
              border: '1px solid rgba(22,49,70,0.12)',
              borderRadius: 10,
              boxShadow: '0 10px 30px -10px rgba(22,49,70,0.25)',
              padding: 4,
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value
              return (
                <button
                  key={opt.value}
                  type='button'
                  role='option'
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 10px',
                    border: 0,
                    borderRadius: 6,
                    background: active ? 'rgba(152,106,65,0.10)' : 'transparent',
                    color: NAVY,
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'rgba(22,49,70,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}

// PillRow — one of the two chip rails inside the card. Holds a small icon +
// eyebrow label + count + plus-button on top, then a horizontal-scroll rail
// of pills below. Renders even when empty (so the user can click + to add).
const PillRow = ({ icon: Icon, label, count, items, tone, onClickEdit }) => (
  <div
    style={{
      padding: '7px 8px',
      borderRadius: 8,
      background: 'rgba(22,49,70,0.025)',
      border: '1px solid rgba(22,49,70,0.05)',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 6,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: BRONZE,
          border: '1px solid rgba(152,106,65,0.18)',
        }}
      >
        <Icon size={11} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            color: 'rgba(22,49,70,0.45)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {label}{' '}
          <span style={{ color: 'rgba(22,49,70,0.35)' }}>({count})</span>
        </div>
      </div>
      <button
        type='button'
        onClick={onClickEdit}
        title={`Edit ${label}`}
        aria-label={`Edit ${label}`}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: 'none',
          background: 'transparent',
          color: 'rgba(22,49,70,0.4)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={11} />
      </button>
    </div>
    <div
      className='no-scrollbar'
      style={{
        display: 'flex',
        gap: 4,
        paddingLeft: 30,
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {items.length === 0 ? (
        <span
          style={{
            fontSize: 10.5,
            color: 'rgba(22,49,70,0.35)',
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
          }}
        >
          None added yet — tap + to choose.
        </span>
      ) : (
        items.map((it, i) => (
          <span key={i} style={{ flexShrink: 0 }}>
            <ChipPill tone={tone}>
              {tone === 'neutral' ? (
                <>
                  <Heart size={10} />
                  {it}
                </>
              ) : (
                it
              )}
            </ChipPill>
          </span>
        ))
      )}
    </div>
  </div>
)

const ChipPill = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: { bg: 'rgba(22,49,70,0.04)', fg: '#163146', bd: 'rgba(22,49,70,0.10)' },
    bronze: { bg: 'rgba(152,106,65,0.08)', fg: '#7a5435', bd: 'rgba(152,106,65,0.22)' },
  }
  const c = tones[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 9px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.bd}`,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

// Coerce legacy `[{title, description}]` focusAreas shape to a plain string
// list so the rail renders consistently regardless of when the document was
// last written.
const normalizeFocusAreas = (val) =>
  (Array.isArray(val) ? val : [])
    .map((v) => (typeof v === 'string' ? v : v?.title || ''))
    .map((s) => s.trim())
    .filter(Boolean)

const NILPreferencesCard = ({
  bundle,
  draft,
  onChangeDraft,
  onCommit,
  onCancelDraft,
  onOpenFocusEditor,
  onOpenInterestsEditor,
}) => {
  const baselineNil = bundle?.nilPreferences || {}
  const baselineDealSize = normalizeDealSize(baselineNil.dealSize)
  const baselineTimeline = baselineNil.timeline || 'medium'
  const baselineFocus = normalizeFocusAreas(baselineNil.focusAreas)
  const baselineInterests = Array.isArray(bundle?.interests) ? bundle.interests : []

  // Effective values — what's currently shown in the card. Use draft when
  // present, otherwise baseline.
  const eff = {
    dealSize: draft?.nilPrefs?.dealSize ?? baselineDealSize,
    timeline: draft?.nilPrefs?.timeline ?? baselineTimeline,
    focusAreas: draft?.focusAreas ?? baselineFocus,
    interests: draft?.interests ?? baselineInterests,
  }

  const isDirty = !!draft && (
    draft.nilPrefs !== undefined ||
    draft.focusAreas !== undefined ||
    draft.interests !== undefined
  )
  const dealSizeChanged =
    draft?.nilPrefs?.dealSize !== undefined && draft.nilPrefs.dealSize !== baselineDealSize
  const timelineChanged =
    draft?.nilPrefs?.timeline !== undefined && draft.nilPrefs.timeline !== baselineTimeline

  const patchPrefs = (key, value) => {
    onChangeDraft({
      ...(draft || {}),
      nilPrefs: { ...(draft?.nilPrefs || {}), [key]: value },
    })
  }

  return (
    <Card title='NIL Preferences' action={<PrivateBadge />} padding={12}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          minHeight: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Deal Size + Timeline — inline native select overlays */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          <SelectTile
            icon={DollarSign}
            label='Deal Size'
            value={eff.dealSize}
            options={DEAL_SIZE_OPTIONS}
            onChange={(v) => patchPrefs('dealSize', v)}
            changed={dealSizeChanged}
          />
          <SelectTile
            icon={Clock}
            label='Timeline'
            value={eff.timeline}
            options={TIMELINE_OPTIONS}
            onChange={(v) => patchPrefs('timeline', v)}
            changed={timelineChanged}
          />
        </div>

        <PillRow
          icon={Target}
          label='Focus Areas'
          count={eff.focusAreas.length}
          items={eff.focusAreas}
          tone='bronze'
          onClickEdit={onOpenFocusEditor}
        />
        <PillRow
          icon={Heart}
          label='Interests'
          count={eff.interests.length}
          items={eff.interests}
          tone='neutral'
          onClickEdit={onOpenInterestsEditor}
        />
      </div>

      {isDirty && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            flexShrink: 0,
            borderTop: '1px solid rgba(22,49,70,0.08)',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 9,
              fontWeight: 800,
              color: '#7a5435',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Unsaved changes
          </span>
          <button
            type='button'
            onClick={onCancelDraft}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid rgba(22,49,70,0.12)',
              background: '#fff',
              fontSize: 10.5,
              fontWeight: 700,
              color: NAVY,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onCommit}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: BRONZE,
              fontSize: 10.5,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Confirm
          </button>
        </div>
      )}
    </Card>
  )
}

export default NILPreferencesCard
