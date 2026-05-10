import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { EditModal } from './shared/EditModal'
import { profileService } from '../../../services/profileService'

const NAVY = '#163146'

// Dropdown — custom enum picker. The native `<select>` from `formFields.jsx`
// renders an OS-level popover that's visually out of scale with the rest of
// this modal (where every other control is in-DOM). Using a custom button +
// panel keeps the open/closed states the same size and styled to match the
// typeahead controls below.
const Dropdown = ({ label, required, value, onChange, options }) => {
  const id = useId()
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div style={{ marginBottom: 14, position: 'relative' }} ref={wrapRef}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(22,49,70,0.65)',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
      </label>
      <button
        id={id}
        type='button'
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '10px 34px 10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(22,49,70,0.15)',
          background: '#fff',
          color: NAVY,
          fontSize: 13.5,
          fontWeight: 500,
          fontFamily: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {selected?.label || 'Select…'}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            color: 'rgba(22,49,70,0.5)',
            transition: 'transform 0.15s',
            display: 'inline-flex',
          }}
        >
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M6 9l6 6 6-6' />
          </svg>
        </span>
      </button>
      {open && (
        <div
          role='listbox'
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid rgba(22,49,70,0.12)',
            borderRadius: 10,
            boxShadow: '0 10px 30px -10px rgba(22,49,70,0.25)',
            zIndex: 30,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                type='button'
                key={opt.value}
                role='option'
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange?.(opt.value)
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  border: 0,
                  background: active ? 'rgba(152,106,65,0.10)' : 'transparent',
                  color: NAVY,
                  fontSize: 13,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(22,49,70,0.04)',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Schema enums (from server/models/Profile.js).
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

const MIN_FOCUS_AREAS = 3
const MIN_INTERESTS = 5

// Coerce whatever shape `nilPreferences.focusAreas` arrives in (string or
// legacy {title, description}) into a plain string list.
const normalizeFocusAreas = (val) =>
  (Array.isArray(val) ? val : [])
    .map((v) => (typeof v === 'string' ? v : v?.title || ''))
    .map((s) => s.trim())
    .filter(Boolean)

// Map any legacy dealSize value into the new enum so the Dropdown finds a
// matching option. Mirrors the schema setter; the user's next save will
// persist the upgrade.
const LEGACY_DEAL_SIZE = new Set(['100k-250k', '250k-500k', '500k-1m', '1m-5m', '5m+'])
const normalizeDealSize = (v) => (LEGACY_DEAL_SIZE.has(v) ? '100k+' : v) || '0-1k'

// CatalogTypeahead — flat-list typeahead picker over a `[{category, value}]`
// catalog. Athletes type into a search box; up to 5 catalog matches render
// below; clicking adds it as a chip above. Selected chips show an X to
// remove. Catalog-only — no custom entries.
//
// Reused for both the Focus Areas (min 3) and Interests (min 5) editors so
// the keyboard/focus/match behavior stays identical between the two.
const CatalogTypeahead = ({
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

  // Filter logic: when no query, show first 5 unselected; otherwise rank by
  // case-insensitive substring match — items whose value starts with the query
  // come first, then items containing the query, capped at 5.
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

  // Click-outside closes the dropdown without committing anything.
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

      {/* Selected chips */}
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

// NILPreferencesModal — single Save covers dealSize + timeline + focusAreas
// (via /me/nil-preferences) AND interests (via /me/interests). The two PUTs
// only fire when their respective slice is dirty so we don't write fields the
// user didn't touch.
const NILPreferencesModal = ({ open, bundle, onClose, onSaved }) => {
  const baseline = useMemo(() => {
    const nil = bundle?.nilPreferences || {}
    return {
      dealSize: normalizeDealSize(nil.dealSize),
      timeline: nil.timeline || 'medium',
      focusAreas: normalizeFocusAreas(nil.focusAreas),
      interests: Array.isArray(bundle?.interests) ? [...bundle.interests] : [],
    }
  }, [bundle])

  const [draft, setDraft] = useState(baseline)
  const [saving, setSaving] = useState(false)
  const [errorBanner, setErrorBanner] = useState(null)
  const [focusCatalog, setFocusCatalog] = useState([])
  const [interestsCatalog, setInterestsCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState(null)

  // Reset draft whenever the modal re-opens with a fresh baseline.
  useEffect(() => {
    if (open) {
      setDraft(baseline)
      setErrorBanner(null)
    }
  }, [open, baseline])

  // Fetch both catalogs in parallel the first time the modal opens. Both
  // services memoize so subsequent opens are free.
  useEffect(() => {
    if (!open || (focusCatalog.length > 0 && interestsCatalog.length > 0) || catalogLoading) return
    setCatalogLoading(true)
    setCatalogError(null)
    Promise.all([
      profileService.getFocusAreasCatalog(),
      profileService.getInterestsCatalog(),
    ])
      .then(([fa, it]) => {
        setFocusCatalog(fa?.catalog || [])
        setInterestsCatalog(it?.catalog || [])
      })
      .catch((e) => {
        setCatalogError(typeof e === 'string' ? e : e?.message || 'Failed to load catalog')
      })
      .finally(() => setCatalogLoading(false))
  }, [open, focusCatalog.length, interestsCatalog.length, catalogLoading])

  const set = (partial) => setDraft((d) => ({ ...d, ...partial }))

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  const focusMeetsMin = draft.focusAreas.length >= MIN_FOCUS_AREAS
  const interestsMeetsMin = draft.interests.length >= MIN_INTERESTS
  const focusError = !focusMeetsMin
    ? `Select at least ${MIN_FOCUS_AREAS} focus areas before saving.`
    : null
  const interestsError = !interestsMeetsMin
    ? `Select at least ${MIN_INTERESTS} interests before saving.`
    : null

  const nilDirty =
    draft.dealSize !== baseline.dealSize ||
    draft.timeline !== baseline.timeline ||
    JSON.stringify(draft.focusAreas) !== JSON.stringify(baseline.focusAreas)
  const interestsDirty = JSON.stringify(draft.interests) !== JSON.stringify(baseline.interests)

  const handleSave = async () => {
    if (!focusMeetsMin || !interestsMeetsMin) {
      setErrorBanner(
        !focusMeetsMin
          ? `Please select at least ${MIN_FOCUS_AREAS} focus areas before saving.`
          : `Please select at least ${MIN_INTERESTS} interests before saving.`
      )
      return
    }
    setSaving(true)
    setErrorBanner(null)
    try {
      const calls = []
      if (nilDirty) {
        calls.push(
          profileService.updateNILPreferences({
            dealSize: draft.dealSize,
            timeline: draft.timeline,
            focusAreas: draft.focusAreas,
          })
        )
      }
      if (interestsDirty) {
        calls.push(profileService.updateAthleteInterests(draft.interests))
      }
      if (calls.length > 0) await Promise.all(calls)
      await onSaved?.()
      onClose?.()
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        (typeof e === 'string' ? e : 'Save failed')
      setErrorBanner(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <EditModal
      open={open}
      title='Edit NIL preferences'
      subtitle='Deal size, timeline, focus areas, and interests — all in one place. Focus areas match you to advisors and agents; interests help brands find you.'
      onClose={onClose}
      onSave={handleSave}
      dirty={dirty}
      saving={saving}
      saveDisabled={!focusMeetsMin || !interestsMeetsMin || !dirty}
      width={620}
      errorBanner={errorBanner || catalogError}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Dropdown
          label='Deal size'
          required
          value={draft.dealSize}
          onChange={(v) => set({ dealSize: v })}
          options={DEAL_SIZE_OPTIONS}
        />
        <Dropdown
          label='Timeline'
          required
          value={draft.timeline}
          onChange={(v) => set({ timeline: v })}
          options={TIMELINE_OPTIONS}
        />
      </div>

      {catalogLoading && focusCatalog.length === 0 ? (
        <div
          style={{
            marginTop: 8,
            padding: 14,
            background: 'rgba(22,49,70,0.03)',
            border: '1px solid rgba(22,49,70,0.08)',
            borderRadius: 12,
            fontSize: 12.5,
            color: 'rgba(22,49,70,0.6)',
            fontWeight: 600,
          }}
        >
          Loading catalogs…
        </div>
      ) : (
        <>
          <CatalogTypeahead
            label='Focus areas'
            required
            value={draft.focusAreas}
            onChange={(next) => set({ focusAreas: next })}
            catalog={focusCatalog}
            minSelections={MIN_FOCUS_AREAS}
            placeholder='Search focus areas — e.g. "tax", "branding", "contracts"…'
            hint='Select at least 3. These match you to advisors and agents who specialize in these areas.'
            error={focusError}
          />

          <CatalogTypeahead
            label='Interests'
            required
            value={draft.interests}
            onChange={(next) => set({ interests: next })}
            catalog={interestsCatalog}
            minSelections={MIN_INTERESTS}
            placeholder='Search interests — e.g. "social media", "nutrition", "gaming"…'
            hint='Select at least 5. Brands and partners use this to find athletes who match their campaigns.'
            error={interestsError}
          />
        </>
      )}
    </EditModal>
  )
}

export default NILPreferencesModal
