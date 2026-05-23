import React, { useEffect, useMemo, useState } from 'react'
import { EditModal } from './shared/EditModal'
import { CatalogTypeahead, MIN_INTERESTS } from './shared/CatalogTypeahead'
import { profileService } from '../../../services/profileService'

// InterestsModal — single-section editor for athlete interests. Stages the
// selection into the parent's NIL draft; the NILPreferencesCard's Confirm
// bar is what persists via /me/interests.
const InterestsModal = ({ open, bundle, draft, onClose, onStage }) => {
  const baseline = useMemo(
    () => (Array.isArray(bundle?.interests) ? [...bundle.interests] : []),
    [bundle]
  )
  const initial = draft?.interests !== undefined ? draft.interests : baseline

  const [value, setValue] = useState(initial)
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorBanner, setErrorBanner] = useState(null)

  useEffect(() => {
    if (open) {
      setValue(initial)
      setErrorBanner(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || catalog.length > 0 || loading) return
    setLoading(true)
    profileService
      .getInterestsCatalog()
      .then((res) => setCatalog(res?.catalog || []))
      .catch((e) => setErrorBanner(typeof e === 'string' ? e : e?.message || 'Failed to load interests'))
      .finally(() => setLoading(false))
  }, [open, catalog.length, loading])

  const meetsMin = value.length >= MIN_INTERESTS
  const dirty = JSON.stringify(value) !== JSON.stringify(initial)

  const handleStage = () => {
    if (!meetsMin) {
      setErrorBanner(`Please select at least ${MIN_INTERESTS} interests before saving.`)
      return
    }
    onStage?.(value)
  }

  return (
    <EditModal
      open={open}
      title='Edit interests'
      subtitle='Brands and partners use this to find athletes who match their campaigns. Catalog-only — pick at least 5.'
      onClose={onClose}
      onSave={handleStage}
      dirty={dirty}
      saveDisabled={!meetsMin || !dirty}
      width={560}
      saveLabel='Apply changes'
      errorBanner={errorBanner}
    >
      {loading && catalog.length === 0 ? (
        <div
          style={{
            padding: 14,
            background: 'rgba(22,49,70,0.03)',
            border: '1px solid rgba(22,49,70,0.08)',
            borderRadius: 12,
            fontSize: 12.5,
            color: 'rgba(22,49,70,0.6)',
            fontWeight: 600,
          }}
        >
          Loading catalog…
        </div>
      ) : (
        <CatalogTypeahead
          label='Interests'
          required
          value={value}
          onChange={setValue}
          catalog={catalog}
          minSelections={MIN_INTERESTS}
          placeholder='Search interests — e.g. "social media", "nutrition", "gaming"…'
          hint='Select at least 5. Brands and partners use this to find athletes who match their campaigns.'
          error={!meetsMin ? `Select at least ${MIN_INTERESTS} interests before saving.` : null}
        />
      )}
    </EditModal>
  )
}

export default InterestsModal
