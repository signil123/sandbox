import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const NAVY = '#163146'
const BRONZE = '#986a41'

// EditModal — portal-based focused modal used by every section pencil in Phase C.
//
// Why a confirm-on-save: section edits are not trivial — committing them issues
// a real PATCH and is visible on the public profile, so the second click is a
// guard against fat-fingered Save. The dirty-check on Cancel exists for the
// same reason in reverse: don't quietly discard work.
//
// `dirty` is owned by the caller because only the form knows whether its current
// state differs from the snapshot it loaded. The modal just asks for it on close.
export const EditModal = ({
  open,
  title,
  subtitle,
  onClose,
  onSave,
  saving = false,
  saveDisabled = false,
  saveLabel = 'Save changes',
  cancelLabel = 'Cancel',
  dirty = false,
  width = 560,
  errorBanner = null,
  children,
}) => {
  const [confirmKind, setConfirmKind] = useState(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setConfirmKind(null)
      return undefined
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      if (confirmKind) {
        setConfirmKind(null)
        return
      }
      requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, confirmKind, dirty])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const requestClose = useCallback(() => {
    if (saving) return
    if (dirty) {
      setConfirmKind('discard')
      return
    }
    onClose?.()
  }, [dirty, onClose, saving])

  const requestSave = useCallback(() => {
    if (saveDisabled || saving) return
    setConfirmKind('save')
  }, [saveDisabled, saving])

  const confirmSave = useCallback(async () => {
    setConfirmKind(null)
    await onSave?.()
  }, [onSave])

  const confirmDiscard = useCallback(() => {
    setConfirmKind(null)
    onClose?.()
  }, [onClose])

  if (!open) return null

  const modal = (
    <div
      role='presentation'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(22,49,70,0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-label={title || 'Edit'}
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: 'min(720px, calc(100vh - 48px))',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 30px 80px -20px rgba(22,49,70,0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid rgba(22,49,70,0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: NAVY, letterSpacing: '-0.01em' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'rgba(22,49,70,0.6)', lineHeight: 1.45 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type='button'
            onClick={requestClose}
            aria-label='Close'
            disabled={saving}
            style={{
              border: 0,
              background: 'rgba(22,49,70,0.06)',
              width: 28,
              height: 28,
              borderRadius: 999,
              cursor: saving ? 'not-allowed' : 'pointer',
              color: NAVY,
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
        </header>

        {errorBanner && (
          <div
            role='alert'
            style={{
              margin: '12px 22px 0',
              padding: '10px 12px',
              background: 'rgba(239,68,68,0.08)',
              color: '#9b1c1c',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {errorBanner}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>{children}</div>

        <footer
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(22,49,70,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
            background: '#fafbfc',
          }}
        >
          <button
            type='button'
            onClick={requestClose}
            disabled={saving}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: '1px solid rgba(22,49,70,0.15)',
              background: '#fff',
              color: NAVY,
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            onClick={requestSave}
            disabled={saveDisabled || saving}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: 0,
              background: saveDisabled || saving ? 'rgba(152,106,65,0.4)' : BRONZE,
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: saveDisabled || saving ? 'not-allowed' : 'pointer',
              minWidth: 130,
            }}
          >
            {saving ? 'Saving…' : saveLabel}
          </button>
        </footer>
      </div>

      {confirmKind && (
        <ConfirmDialog
          kind={confirmKind}
          onCancel={() => setConfirmKind(null)}
          onConfirm={confirmKind === 'save' ? confirmSave : confirmDiscard}
        />
      )}
    </div>
  )

  return createPortal(modal, document.body)
}

const ConfirmDialog = ({ kind, onCancel, onConfirm }) => {
  const isSave = kind === 'save'
  return (
    <div
      role='presentation'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(22,49,70,0.55)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        role='alertdialog'
        aria-modal='true'
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 22,
          maxWidth: 380,
          width: '100%',
          boxShadow: '0 20px 60px -20px rgba(22,49,70,0.5)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: NAVY }}>
          {isSave ? 'Apply changes?' : 'Discard changes?'}
        </h3>
        <p style={{ margin: '8px 0 18px', fontSize: 13, color: 'rgba(22,49,70,0.7)', lineHeight: 1.5 }}>
          {isSave
            ? 'Your edits will be saved and visible on your public profile.'
            : 'You have unsaved changes. They will be lost if you close now.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type='button'
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: 9,
              border: '1px solid rgba(22,49,70,0.15)',
              background: '#fff',
              color: NAVY,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {isSave ? 'Keep editing' : 'Keep editing'}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 9,
              border: 0,
              background: isSave ? BRONZE : '#b91c1c',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {isSave ? 'Apply' : 'Discard'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditModal
