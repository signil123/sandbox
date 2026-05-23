import React, { useEffect, useMemo, useRef, useState } from 'react'
import { EditModal } from './shared/EditModal'
import { TextField, Textarea, Toggle } from './shared/formFields'
import { LocationField } from './shared/LocationField'
import { SportField } from './shared/SportField'
import { Camera } from './shared/icons'
import { profileService } from '../../../services/profileService'
import { getImageUrl } from '../../../utils/imageUtils'

const NAVY = '#163146'
const BRONZE = '#986a41'
const CURRENT_YEAR = new Date().getFullYear()

const validClassYear = (raw) => {
  const n = parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n)) return false
  return n >= CURRENT_YEAR - 10 && n <= CURRENT_YEAR + 10
}

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim())

// Strip null/undefined and unchanged-from-baseline keys so the PATCH body
// is minimal. Visibility is always sent as a full pair (server expects it).
const buildPatch = (draft, baseline) => {
  const patch = {}
  const fields = ['name', 'sport', 'position', 'school', 'classYear', 'location', 'aboutMe', 'email', 'phone', 'profileImage', 'bannerImage']
  for (const k of fields) {
    if ((draft[k] ?? '') !== (baseline[k] ?? '')) patch[k] = draft[k] ?? ''
  }
  // coordinates only gets PATCHed when the location field itself changed —
  // location and coords always travel together. If the user typed a new
  // location string but didn't pick a Photon suggestion, coords come through
  // as null which clears the stored value.
  if ((draft.location ?? '') !== (baseline.location ?? '')) {
    patch.coordinates = draft.coordinates || null
  }
  if (
    draft.publicVisibility?.email !== baseline.publicVisibility?.email ||
    draft.publicVisibility?.phone !== baseline.publicVisibility?.phone
  ) {
    patch.publicVisibility = {
      email: !!draft.publicVisibility?.email,
      phone: !!draft.publicVisibility?.phone,
    }
  }
  return patch
}

// IdentityModal — single modal that handles every editable field on the
// Header card: name, sport, position, school, classYear, location, aboutMe,
// email, phone, public visibility, profile photo, banner image.
//
// classYear is captured as a numeric graduation year (e.g. 2028) and the
// Header card already formats it as "Class of YYYY" via formatGradClass.
//
// Photo / banner uploads happen inline (Q1 = option a): the file is uploaded
// to Cloudinary on selection so we can preview, but the secure_url is held in
// draft state and only persisted alongside the rest of the patch on Save.
const IdentityModal = ({ open, bundle, onClose, onSaved }) => {
  const baseline = useMemo(() => {
    const profile = bundle?.profile || {}
    const user = bundle?.user || {}
    return {
      name: user.name || '',
      sport: profile.sport || '',
      position: profile.position || '',
      school: profile.school || '',
      classYear: profile.classYear || '',
      location: profile.location || '',
      coordinates: profile.coordinates || null,
      aboutMe: profile.aboutMe || profile.bio || '',
      email: user.email || '',
      phone: user.phone || '',
      profileImage: profile.photo || profile.profileImage || user.profileImage || '',
      bannerImage: profile.bannerImage || '',
      publicVisibility: {
        email: profile.publicVisibility?.email !== false,
        phone: profile.publicVisibility?.phone !== false,
      },
    }
  }, [bundle])

  const [draft, setDraft] = useState(baseline)
  const [saving, setSaving] = useState(false)
  const [errorBanner, setErrorBanner] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const photoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  // Reset draft whenever the modal opens with a fresh baseline.
  useEffect(() => {
    if (open) {
      setDraft(baseline)
      setErrorBanner(null)
    }
  }, [open, baseline])

  const set = (partial) => setDraft((d) => ({ ...d, ...partial }))
  const setVisibility = (partial) =>
    setDraft((d) => ({ ...d, publicVisibility: { ...d.publicVisibility, ...partial } }))

  // ---- validation ----
  const errors = {
    name: !draft.name.trim() ? 'Name is required' : null,
    sport: !draft.sport.trim() ? 'Sport is required' : null,
    position: !draft.position.trim() ? 'Position is required' : null,
    school: !draft.school.trim() ? 'School is required' : null,
    classYear: !draft.classYear
      ? 'Graduation year is required'
      : !validClassYear(draft.classYear)
        ? `Enter a year between ${CURRENT_YEAR - 10} and ${CURRENT_YEAR + 10}`
        : null,
    email: draft.email && !isValidEmail(draft.email) ? 'Email format looks wrong' : null,
  }
  const hasError = Object.values(errors).some(Boolean)
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)

  // ---- uploads ----
  const handleUpload = async (file, kind) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setErrorBanner('Image must be 10MB or smaller.')
      return
    }
    const setBusy = kind === 'photo' ? setPhotoUploading : setBannerUploading
    setBusy(true)
    setErrorBanner(null)
    try {
      const res = await profileService.uploadFile(file)
      const url = res?.url || res?.data?.url || res?.secure_url
      if (!url) throw new Error('Upload returned no URL')
      if (kind === 'photo') set({ profileImage: url })
      else set({ bannerImage: url })
    } catch (e) {
      setErrorBanner(`Upload failed: ${e?.message || 'unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  // ---- save ----
  const handleSave = async () => {
    if (hasError) {
      setErrorBanner('Please fix the highlighted fields before saving.')
      return
    }
    setSaving(true)
    setErrorBanner(null)
    try {
      const patch = buildPatch(
        { ...draft, classYear: String(draft.classYear).trim() },
        baseline,
      )
      // Nothing changed but Save was somehow clicked — close cleanly.
      if (Object.keys(patch).length === 0) {
        onClose?.()
        return
      }
      await profileService.updateAthleteProfile(patch)
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
      title='Edit identity, bio & contacts'
      subtitle='Required fields are marked with an asterisk. Visibility toggles control whether contacts appear on your public profile.'
      onClose={onClose}
      onSave={handleSave}
      dirty={dirty}
      saving={saving}
      saveDisabled={hasError || !dirty}
      width={640}
      errorBanner={errorBanner}
    >
      {/* Photo + banner block — wrapped in a tall enough container so the
          avatar (which sits half outside the banner) is fully visible. */}
      <div style={{ position: 'relative', marginBottom: 22, paddingBottom: 50 }}>
        {/* Banner: clicking anywhere on it opens the banner file picker. */}
        <button
          type='button'
          onClick={() => bannerInputRef.current?.click()}
          disabled={bannerUploading || saving}
          aria-label='Change banner image'
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            height: 140,
            padding: 0,
            borderRadius: 14,
            border: '1px solid rgba(22,49,70,0.10)',
            backgroundColor: '#0a1824',
            backgroundImage: draft.bannerImage
              ? `url(${getImageUrl(draft.bannerImage)})`
              : 'linear-gradient(135deg, #163146 0%, #1c3e5a 50%, #0a1824 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: bannerUploading ? 'wait' : 'pointer',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.28)',
              padding: '7px 12px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              pointerEvents: 'none',
            }}
          >
            <Camera size={12} />
            {bannerUploading ? 'Uploading…' : 'Change banner'}
          </span>
        </button>
        <input
          ref={bannerInputRef}
          type='file'
          accept='image/*'
          style={{ display: 'none' }}
          onChange={(e) => {
            handleUpload(e.target.files?.[0], 'banner')
            e.target.value = ''
          }}
        />

        {/* Avatar — separate clickable element, sibling (not child) of the
            banner so a click here never falls through to the banner's
            handler. Overflows the wrapper bottom; the wrapper's paddingBottom
            reserves the space so it isn't clipped by the modal scroll area. */}
        <button
          type='button'
          onClick={() => photoInputRef.current?.click()}
          disabled={photoUploading || saving}
          aria-label='Change profile photo'
          style={{
            position: 'absolute',
            left: 18,
            top: 102,
            width: 84,
            height: 84,
            padding: 0,
            border: '4px solid #fff',
            borderRadius: '50%',
            backgroundColor: '#163146',
            backgroundImage: draft.profileImage
              ? `url(${getImageUrl(draft.profileImage)})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 6px 18px -4px rgba(22,49,70,0.30)',
            cursor: photoUploading ? 'wait' : 'pointer',
            zIndex: 2,
          }}
        >
          {/* Camera badge — visual only; clicks pass through to the avatar
              button thanks to pointer-events:none. */}
          <span
            style={{
              position: 'absolute',
              right: -2,
              bottom: 2,
              width: 28,
              height: 28,
              borderRadius: 999,
              background: BRONZE,
              color: '#fff',
              border: '2px solid #fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Camera size={13} />
          </span>
        </button>
        <input
          ref={photoInputRef}
          type='file'
          accept='image/*'
          style={{ display: 'none' }}
          onChange={(e) => {
            handleUpload(e.target.files?.[0], 'photo')
            e.target.value = ''
          }}
        />
      </div>

      {/* Identity fields */}
      <TextField
        label='Full name'
        required
        value={draft.name}
        onChange={(v) => set({ name: v })}
        error={errors.name}
      />

      <SportField
        label='Sport'
        required
        value={draft.sport}
        onChange={(v) => set({ sport: v })}
        error={errors.sport}
        hint='Start typing — pick from the dropdown or use a custom sport.'
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <TextField
          label='Position'
          required
          value={draft.position}
          onChange={(v) => set({ position: v })}
          error={errors.position}
        />
        <TextField
          label='Graduation year'
          required
          type='number'
          value={draft.classYear}
          onChange={(v) => set({ classYear: v.replace(/[^\d]/g, '').slice(0, 4) })}
          error={errors.classYear}
          hint={
            errors.classYear
              ? null
              : draft.classYear && validClassYear(draft.classYear)
                ? `Will display as: Class of ${draft.classYear}`
                : `e.g. ${CURRENT_YEAR + 2}`
          }
        />
      </div>

      <TextField
        label='School'
        required
        value={draft.school}
        onChange={(v) => set({ school: v })}
        error={errors.school}
      />

      <LocationField
        label='Location'
        value={draft.location}
        onChange={(v, coords) => set({ location: v, coordinates: coords || null })}
        hint='Search any US city, pick Remote, or use manual entry.'
      />

      {/* Bio */}
      <Textarea
        label='About me'
        value={draft.aboutMe}
        onChange={(v) => set({ aboutMe: v })}
        maxLength={400}
        placeholder='A short bio for advisors and brands.'
      />

      {/* Contacts + visibility */}
      <div
        style={{
          marginTop: 6,
          padding: 14,
          background: 'rgba(22,49,70,0.03)',
          border: '1px solid rgba(22,49,70,0.08)',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(22,49,70,0.6)',
            marginBottom: 10,
          }}
        >
          Contacts
        </div>
        <TextField
          label='Email'
          type='email'
          value={draft.email}
          onChange={(v) => set({ email: v })}
          error={errors.email}
        />
        <TextField
          label='Phone'
          type='tel'
          value={draft.phone}
          onChange={(v) => set({ phone: v })}
        />
        <div style={{ borderTop: '1px solid rgba(22,49,70,0.08)', marginTop: 4, paddingTop: 4 }}>
          <Toggle
            label='Show email on public profile'
            hint='Off keeps it private. On still blurs until a connection is accepted.'
            checked={draft.publicVisibility?.email}
            onChange={(v) => setVisibility({ email: v })}
          />
          <Toggle
            label='Show phone on public profile'
            hint='Same blur-until-connected rule applies.'
            checked={draft.publicVisibility?.phone}
            onChange={(v) => setVisibility({ phone: v })}
          />
        </div>
      </div>
    </EditModal>
  )
}

export default IdentityModal
