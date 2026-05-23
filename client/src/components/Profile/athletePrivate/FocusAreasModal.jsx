import React, { useEffect, useMemo, useState } from 'react'
import { EditModal } from './shared/EditModal'
import { CatalogTypeahead, normalizeFocusAreas, MIN_FOCUS_AREAS } from './shared/CatalogTypeahead'
import { profileService } from '../../../services/profileService'

// FocusAreasModal — single-section editor for NIL focus areas. Stages the
// user's selection back into the parent's NIL draft rather than committing
// directly; the NILPreferencesCard's Confirm bar is what actually persists.
const FocusAreasModal = ({ open, bundle, draft, onClose, onStage }) => {
  const baseline = useMemo(
    () => normalizeFocusAreas(bundle?.nilPreferences?.focusAreas),
    [bundle]
  )
  const initial = draft?.focusAreas !== undefined ? draft.focusAreas : baseline

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
      .getFocusAreasCatalog()
      .then((res) => setCatalog(res?.catalog || []))
      .catch((e) => setErrorBanner(typeof e === 'string' ? e : e?.message || 'Failed to load focus areas'))
      .finally(() => setLoading(false))
  }, [open, catalog.length, loading])

  const meetsMin = value.length >= MIN_FOCUS_AREAS
  const dirty = JSON.stringify(value) !== JSON.stringify(initial)

  const handleStage = () => {
    if (!meetsMin) {
      setErrorBanner(`Please select at least ${MIN_FOCUS_AREAS} focus areas before saving.`)
      return
    }
    onStage?.(value)
  }

  return (
    <EditModal
      open={open}
      title='Edit focus areas'
      subtitle='Focus areas match you to advisors and agents who specialize in these. Catalog-only — pick at least 3.'
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
          label='Focus areas'
          required
          value={value}
          onChange={setValue}
          catalog={catalog}
          minSelections={MIN_FOCUS_AREAS}
          placeholder='Search focus areas — e.g. "tax", "branding", "contracts"…'
          hint='Select at least 3. These match you to advisors and agents who specialize in these areas.'
          error={!meetsMin ? `Select at least ${MIN_FOCUS_AREAS} focus areas before saving.` : null}
        />
      )}
    </EditModal>
  )
}

export default FocusAreasModal
