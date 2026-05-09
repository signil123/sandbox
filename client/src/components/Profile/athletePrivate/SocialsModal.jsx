import React, { useEffect, useMemo, useState } from 'react'
import { EditModal } from './shared/EditModal'
import { Toggle } from './shared/formFields'
import { SOCIAL_ICONS, CUSTOM_SOCIAL_ICONS, Plus } from './shared/icons'
import { profileService } from '../../../services/profileService'

const NAVY = '#163146'
const BRONZE = '#986a41'

// Canonical platform list — must match the schema's allowed enum
// (Profile.socials[].platform). Order here is the order the rows appear in.
const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', urlBase: 'https://instagram.com/', placeholder: 'yourhandle' },
  { key: 'twitter', label: 'X / Twitter', urlBase: 'https://x.com/', placeholder: 'yourhandle' },
  { key: 'tiktok', label: 'TikTok', urlBase: 'https://tiktok.com/@', placeholder: 'yourhandle' },
  { key: 'youtube', label: 'YouTube', urlBase: 'https://youtube.com/@', placeholder: 'yourchannel' },
  { key: 'linkedin', label: 'LinkedIn', urlBase: 'https://linkedin.com/in/', placeholder: 'your-name' },
  { key: 'facebook', label: 'Facebook', urlBase: 'https://facebook.com/', placeholder: 'yourhandle' },
]

// Strip leading @, whitespace, and any accidentally-pasted full URL prefix.
// Keeps the stored handle clean so the derived URL stays sensible.
const cleanHandle = (raw) => {
  let h = String(raw || '').trim()
  if (!h) return ''
  h = h.replace(/^@+/, '')
  // If the user paste-dropped a full URL, pull the trailing path segment.
  const m = h.match(/^https?:\/\/[^/]+\/(?:@)?([^/?#]+)/i)
  if (m) h = m[1]
  return h
}

const deriveUrl = (platform, handle) => {
  const h = cleanHandle(handle)
  if (!h) return ''
  const meta = PLATFORMS.find((p) => p.key === platform)
  return meta ? `${meta.urlBase}${h}` : ''
}

// Build the rows array used by the form: one row per known platform, seeded
// from any existing social entry on the profile. Unknown platforms in the
// stored data flow into the customRows array instead (preserving them across
// edits — even if no UI section existed for them, the data round-trips).
const buildInitialRows = (existing) => {
  const list = Array.isArray(existing) ? existing : []
  const byPlatform = new Map(
    list.filter((s) => !s.custom).map((s) => [s.platform, s]),
  )
  const builtinRows = PLATFORMS.map((p) => {
    const found = byPlatform.get(p.key)
    return {
      platform: p.key,
      handle: found?.handle || '',
      urlOverride: found?.url && found.url !== deriveUrl(p.key, found.handle) ? found.url : '',
      public: found?.public !== false,
      overrideOpen: !!(found?.url && found.url !== deriveUrl(p.key, found.handle)),
    }
  })
  const customRows = list
    .filter((s) => s.custom)
    .map((s) => ({
      name: s.platform || '',
      handle: s.handle || '',
      url: s.url || '',
      public: s.public !== false,
    }))
  return { builtinRows, customRows }
}

// Convert the form rows back into the socials array we PATCH to the server.
// Empty handles are dropped so they hide from the public/header view.
const rowsToSocials = (builtinRows, customRows) => {
  const out = []
  for (const r of builtinRows) {
    if (!cleanHandle(r.handle)) continue
    const handle = cleanHandle(r.handle)
    const url = (r.overrideOpen && r.urlOverride.trim()) || deriveUrl(r.platform, handle)
    out.push({ platform: r.platform, handle, url, public: !!r.public, custom: false })
  }
  for (const r of customRows) {
    const name = (r.name || '').trim()
    const handle = cleanHandle(r.handle)
    const url = (r.url || '').trim()
    if (!name) continue
    if (!handle && !url) continue
    out.push({ platform: name, handle, url, public: !!r.public, custom: true })
  }
  return out
}

const SocialsModal = ({ open, bundle, onClose, onSaved }) => {
  const baseline = useMemo(() => buildInitialRows(bundle?.profile?.socials), [bundle])
  const [rows, setRows] = useState(baseline.builtinRows)
  const [customRows, setCustomRows] = useState(baseline.customRows)
  const [saving, setSaving] = useState(false)
  const [errorBanner, setErrorBanner] = useState(null)

  useEffect(() => {
    if (open) {
      setRows(baseline.builtinRows)
      setCustomRows(baseline.customRows)
      setErrorBanner(null)
    }
  }, [open, baseline])

  const update = (i, partial) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...partial } : r)))

  const updateCustom = (i, partial) =>
    setCustomRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...partial } : r)))

  const addCustom = () =>
    setCustomRows((rs) => [...rs, { name: '', handle: '', url: '', public: true }])

  const removeCustom = (i) =>
    setCustomRows((rs) => rs.filter((_, idx) => idx !== i))

  // Dirty check compares the projected save payload to the projected baseline
  // payload — so toggling a public flag on a row whose handle is empty doesn't
  // count as dirty (because that row won't be saved anyway).
  const dirty = useMemo(
    () =>
      JSON.stringify(rowsToSocials(rows, customRows)) !==
      JSON.stringify(rowsToSocials(baseline.builtinRows, baseline.customRows)),
    [rows, customRows, baseline],
  )

  const handleSave = async () => {
    setSaving(true)
    setErrorBanner(null)
    try {
      const socials = rowsToSocials(rows, customRows)
      await profileService.updateAthleteProfile({ socials })
      await onSaved?.()
      onClose?.()
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || (typeof e === 'string' ? e : 'Save failed')
      setErrorBanner(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <EditModal
      open={open}
      title='Edit social media'
      subtitle='Add a handle to display the icon on your profile. Leave a row blank to hide that platform. Visibility toggles control whether each link is shown publicly (still blurred until a connection is accepted).'
      onClose={onClose}
      onSave={handleSave}
      dirty={dirty}
      saving={saving}
      saveDisabled={!dirty}
      width={620}
      errorBanner={errorBanner}
    >
      {rows.map((row, i) => {
        const meta = PLATFORMS.find((p) => p.key === row.platform)
        const Icon = SOCIAL_ICONS[row.platform]
        const cleaned = cleanHandle(row.handle)
        const derived = cleaned ? deriveUrl(row.platform, cleaned) : ''
        const effective = row.overrideOpen && row.urlOverride.trim() ? row.urlOverride.trim() : derived

        return (
          <div
            key={row.platform}
            style={{
              border: '1px solid rgba(22,49,70,0.10)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                aria-hidden
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: cleaned ? BRONZE : 'rgba(22,49,70,0.06)',
                  color: cleaned ? '#fff' : 'rgba(22,49,70,0.55)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {Icon ? <Icon size={14} /> : null}
              </span>
              <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, flex: 1 }}>{meta.label}</div>
            </div>

            {/* Handle input with leading @ affordance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                border: '1px solid rgba(22,49,70,0.15)',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  background: 'rgba(22,49,70,0.04)',
                  color: 'rgba(22,49,70,0.55)',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRight: '1px solid rgba(22,49,70,0.10)',
                }}
              >
                @
              </span>
              <input
                value={row.handle}
                onChange={(e) => update(i, { handle: e.target.value })}
                placeholder={meta.placeholder}
                autoComplete='off'
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 0,
                  outline: 'none',
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: NAVY,
                  fontFamily: 'inherit',
                  background: 'transparent',
                }}
              />
            </div>

            {/* Live URL preview + override link */}
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'rgba(22,49,70,0.6)', fontWeight: 600 }}>
              {cleaned ? (
                <>
                  Link:{' '}
                  <span
                    style={{
                      color: NAVY,
                      fontWeight: 700,
                      wordBreak: 'break-all',
                    }}
                  >
                    {effective}
                  </span>
                  {!row.overrideOpen && (
                    <button
                      type='button'
                      onClick={() => update(i, { overrideOpen: true, urlOverride: derived })}
                      style={{
                        marginLeft: 8,
                        background: 'transparent',
                        border: 0,
                        color: BRONZE,
                        fontWeight: 800,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Override URL
                    </button>
                  )}
                </>
              ) : (
                <span style={{ fontStyle: 'italic' }}>
                  Empty — this platform will be hidden from your profile.
                </span>
              )}
            </div>

            {row.overrideOpen && (
              <div style={{ marginTop: 8 }}>
                <input
                  value={row.urlOverride}
                  onChange={(e) => update(i, { urlOverride: e.target.value })}
                  placeholder={derived || `${meta.urlBase}…`}
                  style={{
                    width: '100%',
                    padding: '9px 11px',
                    border: '1px solid rgba(22,49,70,0.15)',
                    borderRadius: 9,
                    fontSize: 13,
                    color: NAVY,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <button
                  type='button'
                  onClick={() => update(i, { overrideOpen: false, urlOverride: '' })}
                  style={{
                    marginTop: 6,
                    background: 'transparent',
                    border: 0,
                    color: 'rgba(22,49,70,0.6)',
                    fontWeight: 700,
                    fontSize: 11.5,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Reset to derived URL
                </button>
              </div>
            )}

            {/* Public toggle is meaningful only when there's a handle to hide. */}
            {cleaned && (
              <div style={{ borderTop: '1px solid rgba(22,49,70,0.06)', marginTop: 10 }}>
                <Toggle
                  label='Show on public profile'
                  hint='Off keeps it private. On still blurs until a connection is accepted.'
                  checked={row.public}
                  onChange={(v) => update(i, { public: v })}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Other platforms — unlimited custom rows. */}
      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid rgba(22,49,70,0.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(22,49,70,0.65)',
            }}
          >
            Other platforms
          </h3>
          <span style={{ fontSize: 11, color: 'rgba(22,49,70,0.5)' }}>
            {customRows.length} added
          </span>
        </div>

        {customRows.map((row, i) => {
          const key = (row.name || '').toLowerCase().replace(/\s+/g, '')
          const KnownIcon = CUSTOM_SOCIAL_ICONS[key]
          const initial = (row.name || '?').trim().charAt(0).toUpperCase()
          const ready = !!row.name.trim()

          return (
            <div
              key={i}
              style={{
                border: '1px solid rgba(22,49,70,0.10)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: ready ? BRONZE : 'rgba(22,49,70,0.06)',
                    color: ready ? '#fff' : 'rgba(22,49,70,0.55)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: 0,
                  }}
                >
                  {KnownIcon ? <KnownIcon size={14} /> : initial}
                </span>
                <input
                  value={row.name}
                  onChange={(e) => updateCustom(i, { name: e.target.value })}
                  placeholder='App name (e.g. Reddit, Strava)'
                  maxLength={40}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    border: '1px solid rgba(22,49,70,0.15)',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 700,
                    color: NAVY,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  type='button'
                  onClick={() => removeCustom(i)}
                  aria-label='Remove platform'
                  title='Remove platform'
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 0,
                    background: 'rgba(239,68,68,0.10)',
                    color: '#b91c1c',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round'>
                    <path d='M6 6l12 12M18 6L6 18' />
                  </svg>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(22,49,70,0.55)', marginBottom: 4 }}>
                    Handle
                  </div>
                  <input
                    value={row.handle}
                    onChange={(e) => updateCustom(i, { handle: e.target.value })}
                    placeholder='username'
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid rgba(22,49,70,0.15)',
                      borderRadius: 9,
                      fontSize: 13,
                      color: NAVY,
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(22,49,70,0.55)', marginBottom: 4 }}>
                    Link
                  </div>
                  <input
                    value={row.url}
                    onChange={(e) => updateCustom(i, { url: e.target.value })}
                    placeholder='https://…'
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid rgba(22,49,70,0.15)',
                      borderRadius: 9,
                      fontSize: 13,
                      color: NAVY,
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {ready && (row.handle.trim() || row.url.trim()) && (
                <div style={{ borderTop: '1px solid rgba(22,49,70,0.06)', marginTop: 10 }}>
                  <Toggle
                    label='Show on public profile'
                    hint='Off keeps it private. On still blurs until a connection is accepted.'
                    checked={row.public}
                    onChange={(v) => updateCustom(i, { public: v })}
                  />
                </div>
              )}

              {!ready && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: 'rgba(22,49,70,0.55)', fontStyle: 'italic', fontWeight: 600 }}>
                  Add an app name to save this row.
                </div>
              )}
            </div>
          )
        })}

        <button
          type='button'
          onClick={addCustom}
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
          Add another platform
        </button>
      </div>
    </EditModal>
  )
}

export default SocialsModal
