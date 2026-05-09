import React, { useId, useMemo, useState } from 'react'
import { ChevronDown, Plus } from './icons'

const NAVY = '#163146'
const BRONZE = '#986a41'

// Shared visual tokens — kept inline to match the rest of the athletePrivate
// surface, which uses style props instead of a CSS framework. If we ever pull
// these into a real theme, this is the seam to replace.
const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(22,49,70,0.65)',
  marginBottom: 6,
}

const baseInputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(22,49,70,0.15)',
  background: '#fff',
  color: NAVY,
  fontSize: 13.5,
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const errorStyle = {
  borderColor: 'rgba(239,68,68,0.7)',
  background: 'rgba(239,68,68,0.04)',
}

const helpStyle = (isError) => ({
  marginTop: 6,
  fontSize: 11.5,
  color: isError ? '#9b1c1c' : 'rgba(22,49,70,0.55)',
  fontWeight: 600,
})

const Field = ({ label, htmlFor, required, error, hint, children }) => (
  <div style={{ marginBottom: 14 }}>
    {label && (
      <label htmlFor={htmlFor} style={labelStyle}>
        {label}
        {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
      </label>
    )}
    {children}
    {(error || hint) && <div style={helpStyle(!!error)}>{error || hint}</div>}
  </div>
)

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  type = 'text',
  maxLength,
  autoFocus,
}) => {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} required={required} error={error} hint={hint}>
      <input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        style={{ ...baseInputStyle, ...(error ? errorStyle : null) }}
      />
    </Field>
  )
}

export const Textarea = ({ label, value, onChange, placeholder, rows = 4, maxLength, error, hint, required }) => {
  const id = useId()
  const len = (value || '').length
  return (
    <Field
      label={label}
      htmlFor={id}
      required={required}
      error={error}
      hint={hint || (maxLength ? `${len}/${maxLength}` : undefined)}
    >
      <textarea
        id={id}
        rows={rows}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{ ...baseInputStyle, resize: 'vertical', minHeight: 80, ...(error ? errorStyle : null) }}
      />
    </Field>
  )
}

export const Select = ({ label, value, onChange, options, placeholder = 'Select…', required, error, hint }) => {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} required={required} error={error} hint={hint}>
      <div style={{ position: 'relative' }}>
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            ...baseInputStyle,
            appearance: 'none',
            paddingRight: 34,
            ...(error ? errorStyle : null),
          }}
        >
          <option value='' disabled>
            {placeholder}
          </option>
          {options.map((opt) => {
            const v = typeof opt === 'string' ? opt : opt.value
            const l = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={v} value={v}>
                {l}
              </option>
            )
          })}
        </select>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(22,49,70,0.5)',
            pointerEvents: 'none',
          }}
        >
          <ChevronDown size={14} />
        </span>
      </div>
    </Field>
  )
}

// DateField — month + year picker. Most date fields in this app are role
// start/end dates and degree years, neither of which need day precision.
// Stores as ISO 'YYYY-MM' (or 'YYYY' if `yearOnly`); empty string clears.
export const DateField = ({ label, value, onChange, required, error, hint, yearOnly = false, allowPresent = true }) => {
  const id = useId()
  const now = new Date()
  const currentYear = now.getFullYear()
  const years = useMemo(() => {
    const arr = []
    for (let y = currentYear + 5; y >= 1970; y--) arr.push(y)
    return arr
  }, [currentYear])
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const present = value === 'present'
  const [yPart, mPart] = (() => {
    if (!value || present) return ['', '']
    const [y, m] = String(value).split('-')
    return [y || '', m || '']
  })()

  const setParts = (y, m) => {
    if (!y) return onChange?.('')
    if (yearOnly) return onChange?.(String(y))
    if (!m) return onChange?.(String(y))
    onChange?.(`${y}-${String(m).padStart(2, '0')}`)
  }

  return (
    <Field label={label} htmlFor={id} required={required} error={error} hint={hint}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!yearOnly && (
          <select
            value={present ? '' : mPart}
            disabled={present}
            onChange={(e) => setParts(yPart || currentYear, e.target.value)}
            style={{ ...baseInputStyle, width: 110, ...(error ? errorStyle : null) }}
          >
            <option value=''>Month</option>
            {months.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, '0')}>
                {m}
              </option>
            ))}
          </select>
        )}
        <select
          id={id}
          value={present ? '' : yPart}
          disabled={present}
          onChange={(e) => setParts(e.target.value, mPart)}
          style={{ ...baseInputStyle, width: 110, ...(error ? errorStyle : null) }}
        >
          <option value=''>Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {allowPresent && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              color: NAVY,
              fontWeight: 600,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type='checkbox'
              checked={present}
              onChange={(e) => onChange?.(e.target.checked ? 'present' : '')}
            />
            Present
          </label>
        )}
      </div>
    </Field>
  )
}

export const Toggle = ({ label, hint, checked, onChange, disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', gap: 16 }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{label}</div>
      {hint && <div style={{ fontSize: 11.5, color: 'rgba(22,49,70,0.55)', marginTop: 2 }}>{hint}</div>}
    </div>
    <button
      type='button'
      role='switch'
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        width: 38,
        height: 22,
        borderRadius: 999,
        border: 0,
        background: checked ? BRONZE : 'rgba(22,49,70,0.18)',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 120ms ease',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          transition: 'left 120ms ease',
        }}
      />
    </button>
  </div>
)

// ChipPicker — for interests + focus areas. `options` may be flat strings or
// `{label, value}`. `selected` is an array of values. `max` shows a counter.
// `min` is informational; the modal Save button enforces it via `saveDisabled`.
export const ChipPicker = ({
  label,
  options,
  selected = [],
  onChange,
  min,
  max,
  searchable = true,
  placeholder = 'Search…',
  emptyLabel = 'No matches.',
  hint,
  error,
}) => {
  const [q, setQ] = useState('')
  const set = useMemo(() => new Set(selected), [selected])

  const flat = useMemo(
    () =>
      options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options],
  )

  const filtered = useMemo(() => {
    if (!q.trim()) return flat
    const needle = q.trim().toLowerCase()
    return flat.filter((o) => o.label.toLowerCase().includes(needle))
  }, [flat, q])

  const toggle = (v) => {
    if (set.has(v)) {
      onChange?.(selected.filter((s) => s !== v))
    } else {
      if (max && selected.length >= max) return
      onChange?.([...selected, v])
    }
  }

  const counterText =
    typeof min === 'number'
      ? `Selected ${selected.length}${max ? `/${max}` : ''} (min ${min})`
      : `Selected ${selected.length}${max ? `/${max}` : ''}`

  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={labelStyle}>{label}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color:
                typeof min === 'number' && selected.length < min ? '#b91c1c' : 'rgba(22,49,70,0.6)',
            }}
          >
            {counterText}
          </span>
        </div>
      )}
      {searchable && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          style={{ ...baseInputStyle, marginBottom: 10, ...(error ? errorStyle : null) }}
        />
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          maxHeight: 220,
          overflowY: 'auto',
          padding: 4,
          border: '1px solid rgba(22,49,70,0.08)',
          borderRadius: 10,
          background: 'rgba(22,49,70,0.02)',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: 12, fontSize: 12.5, color: 'rgba(22,49,70,0.5)' }}>{emptyLabel}</div>
        ) : (
          filtered.map((o) => {
            const on = set.has(o.value)
            return (
              <button
                type='button'
                key={o.value}
                onClick={() => toggle(o.value)}
                style={{
                  border: 0,
                  cursor: 'pointer',
                  borderRadius: 999,
                  padding: '5px 11px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: on ? BRONZE : '#fff',
                  color: on ? '#fff' : NAVY,
                  boxShadow: on ? 'none' : 'inset 0 0 0 1px rgba(22,49,70,0.12)',
                }}
              >
                {o.label}
                {on ? '  ×' : ''}
              </button>
            )
          })
        )}
      </div>
      {(hint || error) && <div style={helpStyle(!!error)}>{error || hint}</div>}
    </div>
  )
}

// EntryList — generic add/edit/delete/reorder for the list-shaped sections
// (experience, education). The caller renders each entry's editable form via
// `renderEntry({entry, onChange})`; this component owns add/remove/reorder UI.
//
// Reordering is HTML5 drag-and-drop on a 3x3 dot handle on the left of each
// row. We use native DnD instead of a library because the only behavior we
// need (reorder a flat list) is a few lines of state and avoids a dependency.
export const EntryList = ({
  entries = [],
  onChange,
  renderEntry,
  newEntry,
  addLabel = 'Add entry',
  emptyLabel = 'No entries yet.',
  summary, // (entry) => string, used for the collapsed header
}) => {
  const [openIdx, setOpenIdx] = useState(entries.length === 0 ? -1 : 0)
  const [dragIdx, setDragIdx] = useState(null)
  const [dropIdx, setDropIdx] = useState(null)

  const update = (i, partial) => {
    const next = entries.map((e, idx) => (idx === i ? { ...e, ...partial } : e))
    onChange?.(next)
  }
  const remove = (i) => {
    const next = entries.filter((_, idx) => idx !== i)
    onChange?.(next)
    if (openIdx === i) setOpenIdx(-1)
    else if (openIdx > i) setOpenIdx(openIdx - 1)
  }
  const reorder = (from, to) => {
    if (from === to || from == null || to == null) return
    const next = entries.slice()
    const [it] = next.splice(from, 1)
    // After the splice, indices >= from have shifted down by one. The drop
    // index given to us is relative to the pre-splice array, so when moving
    // forward we don't need to adjust (we're inserting before what was the
    // drop target, which has now shifted). When moving backward, the drop
    // index is unchanged.
    const insertAt = from < to ? to - 1 : to
    next.splice(insertAt, 0, it)
    onChange?.(next)
    // Track which row stays open across the reorder.
    if (openIdx === from) setOpenIdx(insertAt)
    else if (from < openIdx && openIdx <= insertAt) setOpenIdx(openIdx - 1)
    else if (insertAt <= openIdx && openIdx < from) setOpenIdx(openIdx + 1)
  }
  const add = () => {
    const next = [...entries, { ...(newEntry || {}) }]
    onChange?.(next)
    setOpenIdx(next.length - 1)
  }

  return (
    <div>
      {entries.length === 0 && (
        <div
          style={{
            padding: 18,
            fontSize: 12.5,
            color: 'rgba(22,49,70,0.55)',
            textAlign: 'center',
            border: '1px dashed rgba(22,49,70,0.18)',
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          {emptyLabel}
        </div>
      )}
      {entries.map((entry, i) => {
        const isOpen = openIdx === i
        const isDragging = dragIdx === i
        const isDropTarget = dropIdx === i && dragIdx !== null && dragIdx !== i
        return (
          <div
            key={i}
            onDragOver={(e) => {
              if (dragIdx === null) return
              e.preventDefault()
              if (dropIdx !== i) setDropIdx(i)
            }}
            onDrop={(e) => {
              if (dragIdx === null) return
              e.preventDefault()
              reorder(dragIdx, i)
              setDragIdx(null)
              setDropIdx(null)
            }}
            style={{
              border: isDropTarget
                ? '1px solid rgba(152,106,65,0.6)'
                : '1px solid rgba(22,49,70,0.10)',
              borderRadius: 12,
              marginBottom: 10,
              overflow: 'hidden',
              background: '#fff',
              opacity: isDragging ? 0.4 : 1,
              boxShadow: isDropTarget ? '0 0 0 3px rgba(152,106,65,0.18)' : 'none',
              transition: 'box-shadow 100ms ease, border-color 100ms ease',
            }}
          >
            <div
              className='entry-row-header'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: isOpen ? 'rgba(22,49,70,0.03)' : '#fff',
                gap: 8,
              }}
            >
              <DragHandle
                onDragStart={(e) => {
                  setDragIdx(i)
                  // Required for Firefox; the actual payload doesn't matter
                  // because we read state directly in onDrop.
                  e.dataTransfer.effectAllowed = 'move'
                  try {
                    e.dataTransfer.setData('text/plain', String(i))
                  } catch (_err) {
                    // Some sandboxes block setData; the state-based fallback
                    // still works.
                  }
                }}
                onDragEnd={() => {
                  setDragIdx(null)
                  setDropIdx(null)
                }}
              />
              <button
                type='button'
                onClick={() => setOpenIdx(isOpen ? -1 : i)}
                style={{
                  border: 0,
                  background: 'transparent',
                  textAlign: 'left',
                  flex: 1,
                  minWidth: 0,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: NAVY,
                  padding: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {summary ? summary(entry) || `Entry ${i + 1}` : `Entry ${i + 1}`}
              </button>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <IconBtn
                  label='Delete'
                  danger
                  onClick={() => remove(i)}
                  glyph={
                    <>
                      <path d='M3 6h18' />
                      <path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                      <path d='M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14' />
                    </>
                  }
                />
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: '12px 14px 4px', borderTop: '1px solid rgba(22,49,70,0.08)' }}>
                {renderEntry?.({ entry, onChange: (partial) => update(i, partial) })}
              </div>
            )}
          </div>
        )
      })}
      <button
        type='button'
        onClick={add}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '9px 14px',
          borderRadius: 10,
          border: '1px dashed rgba(152,106,65,0.5)',
          background: 'rgba(152,106,65,0.06)',
          color: BRONZE,
          fontWeight: 800,
          fontSize: 12.5,
          cursor: 'pointer',
        }}
      >
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
  )
}

const IconBtn = ({ label, onClick, disabled, danger, glyph }) => (
  <button
    type='button'
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    style={{
      width: 26,
      height: 26,
      borderRadius: 7,
      border: 0,
      background: disabled
        ? 'rgba(22,49,70,0.04)'
        : danger
          ? 'rgba(239,68,68,0.10)'
          : 'rgba(22,49,70,0.06)',
      color: disabled ? 'rgba(22,49,70,0.3)' : danger ? '#b91c1c' : NAVY,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
      {glyph}
    </svg>
  </button>
)

// DragHandle — 3x3 grid of bronze dots. Subtle by default, brightens on hover
// of the surrounding row (".entry-row-header:hover" picks up the parent row's
// hover state via the descendant selector). The handle itself is `draggable`
// so the user grabs the dots, not the whole row — clicks on the title area
// still expand/collapse without accidentally initiating a drag.
const DragHandle = ({ onDragStart, onDragEnd }) => (
  <div
    draggable
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    aria-label='Drag to reorder'
    title='Drag to reorder'
    style={{
      width: 18,
      height: 18,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 4px)',
      gridTemplateRows: 'repeat(3, 4px)',
      gap: 1,
      alignContent: 'center',
      justifyContent: 'center',
      cursor: 'grab',
      flexShrink: 0,
      padding: 4,
      boxSizing: 'content-box',
    }}
    className='entry-drag-handle'
  >
    {Array.from({ length: 9 }).map((_, i) => (
      <span
        key={i}
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: BRONZE,
          opacity: 0.35,
        }}
      />
    ))}
    <style>{`
      .entry-row-header:hover .entry-drag-handle span { opacity: 0.95; }
      .entry-drag-handle:active { cursor: grabbing; }
    `}</style>
  </div>
)
