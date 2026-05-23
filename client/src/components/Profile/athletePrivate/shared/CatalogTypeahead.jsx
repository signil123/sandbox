import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

const NAVY = '#163146'

// CatalogTypeahead — flat-list typeahead picker over a `[{category, value}]`
// catalog. Type a query, see up to 5 ranked matches; click adds it as a chip
// above. Selected chips have an X to remove. Catalog-only — no custom entries.
//
// Used by FocusAreasModal (min 3) and InterestsModal (min 5). Lifted out of
// the old NILPreferencesModal so both standalone modals share identical
// keyboard / focus / match behavior.
export const CatalogTypeahead = ({
  label,
  required,
  value,
  onChange,
  catalog,
  minSelections,
  placeholder,
  hint,
  error,
}) => {
  const id = useId()
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const selectedSet = useMemo(() => new Set(value), [value])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = catalog || []
    if (!q) {
      return all.filter((c) => !selectedSet.has(c.value)).slice(0, 5)
    }
    const starts = []
    const contains = []
    for (const c of all) {
      if (selectedSet.has(c.value)) continue
      const v = c.value.toLowerCase()
      if (v.startsWith(q)) starts.push(c)
      else if (v.includes(q)) contains.push(c)
    }
    return [...starts, ...contains].slice(0, 5)
  }, [query, catalog, selectedSet])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const addValue = (v) => {
    if (!v || selectedSet.has(v)) return
    onChange?.([...value, v])
    setQuery('')
    setActiveIdx(-1)
    inputRef.current?.focus()
  }

  const removeValue = (v) => {
    onChange?.(value.filter((x) => x !== v))
  }

  const onKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(matches.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && matches[activeIdx]) {
        e.preventDefault()
        addValue(matches[activeIdx].value)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Backspace' && !query && value.length > 0) {
      removeValue(value[value.length - 1])
    }
  }

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(22,49,70,0.65)',
    marginBottom: 6,
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: error ? '1px solid rgba(239,68,68,0.7)' : '1px solid rgba(22,49,70,0.15)',
    background: error ? 'rgba(239,68,68,0.04)' : '#fff',
    color: NAVY,
    fontSize: 13.5,
    fontWeight: 500,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const meetsMin = value.length >= minSelections

  return (
    <div style={{ marginBottom: 14 }} ref={wrapRef}>
      <label htmlFor={id} style={labelStyle}>
        {label}
        {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
        <span
          style={{
            float: 'right',
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: meetsMin ? '#1c7c4d' : '#b91c1c',
          }}
        >
          Selected ({value.length}/{minSelections})
        </span>
      </label>

      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {value.map((v) => (
            <span
              key={v}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 6px 5px 10px',
                background: 'rgba(152,106,65,0.10)',
                border: '1px solid rgba(152,106,65,0.30)',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: NAVY,
              }}
            >
              {v}
              <button
                type='button'
                onClick={() => removeValue(v)}
                aria-label={`Remove ${v}`}
                style={{
                  border: 0,
                  background: 'rgba(22,49,70,0.10)',
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  cursor: 'pointer',
                  color: NAVY,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                <svg width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round'>
                  <path d='M6 6l12 12M18 6L6 18' />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          id={id}
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIdx(-1)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete='off'
          style={inputStyle}
        />
      </div>

      {open && (
        <div
          role='listbox'
          style={{
            position: 'relative',
            marginTop: 4,
            background: '#fff',
            border: '1px solid rgba(22,49,70,0.12)',
            borderRadius: 10,
            boxShadow: '0 10px 30px -10px rgba(22,49,70,0.25)',
            zIndex: 20,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {matches.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12.5, color: 'rgba(22,49,70,0.55)' }}>
              {query.trim()
                ? 'No matches in our catalog. Try a different keyword.'
                : 'All catalog matches are already selected.'}
            </div>
          ) : (
            matches.map((m, i) => {
              const active = i === activeIdx
              return (
                <button
                  type='button'
                  key={m.value}
                  role='option'
                  aria-selected={active}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    addValue(m.value)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    border: 0,
                    background: active ? 'rgba(152,106,65,0.10)' : 'transparent',
                    color: NAVY,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(22,49,70,0.04)',
                  }}
                >
                  <span>{m.value}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'rgba(22,49,70,0.45)',
                    }}
                  >
                    {m.category}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 6,
          fontSize: 11.5,
          color: error ? '#9b1c1c' : 'rgba(22,49,70,0.55)',
          fontWeight: 600,
        }}
      >
        {error || hint}
      </div>
    </div>
  )
}

// Coerce whatever shape `nilPreferences.focusAreas` arrives in (string or
// legacy {title, description}) into a plain string list.
export const normalizeFocusAreas = (val) =>
  (Array.isArray(val) ? val : [])
    .map((v) => (typeof v === 'string' ? v : v?.title || ''))
    .map((s) => s.trim())
    .filter(Boolean)

// Map any legacy dealSize value into the new enum.
const LEGACY_DEAL_SIZE = new Set(['100k-250k', '250k-500k', '500k-1m', '1m-5m', '5m+'])
export const normalizeDealSize = (v) => (LEGACY_DEAL_SIZE.has(v) ? '100k+' : v) || '0-1k'

export const MIN_FOCUS_AREAS = 3
export const MIN_INTERESTS = 5

export const DEAL_SIZE_OPTIONS = [
  { value: '0-1k', label: '$0 – $1K' },
  { value: '1k-5k', label: '$1K – $5K' },
  { value: '5k-10k', label: '$5K – $10K' },
  { value: '10k-25k', label: '$10K – $25K' },
  { value: '25k-50k', label: '$25K – $50K' },
  { value: '50k-100k', label: '$50K – $100K' },
  { value: '100k+', label: '$100K+' },
]

export const TIMELINE_OPTIONS = [
  { value: 'short', label: 'Short term' },
  { value: 'medium', label: 'Medium term' },
  { value: 'long', label: 'Long term' },
]
