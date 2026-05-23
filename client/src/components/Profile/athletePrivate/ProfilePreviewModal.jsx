import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { profileService } from '../../../services/profileService'
import { X } from './shared/icons'
import AthletePublicView from '../../../pages/Profile/AthletePublicView'
import AdvisorPublicView from '../../../pages/Profile/AdvisorPublicView'

// ProfilePreviewModal — in-page preview of a user's public profile. Built in
// Phase F to back the Connection mini-card "View" button. Will also back the
// HeaderCard "Preview Your Public Profile" entry point in Phase E.
//
// Pass `userId` to open. Pass `null`/undefined to keep closed. Fetches the
// public profile via `profileService.getPublicProfile(userId)` and renders
// either AthletePublicView or AdvisorPublicView based on the loaded user's
// `userType`.
const ProfilePreviewModal = ({ userId, onClose }) => {
  const open = !!userId
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!open) {
      setData(null)
      setErr(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setErr(null)
    profileService
      .getPublicProfile(userId)
      .then((res) => {
        if (cancelled) return
        setData(res?.data || res)
      })
      .catch((e) => {
        if (cancelled) return
        setErr(typeof e === 'string' ? e : e?.message || 'Failed to load profile')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, userId])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const profile = data?.profile
  const user = data?.user
  const userType = user?.userType || profile?.profileType

  const View = (() => {
    if (!data) return null
    if (userType === 'athlete') return AthletePublicView
    return AdvisorPublicView
  })()

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Profile preview'
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(10,24,36,0.55)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1100px, 96vw)',
          maxHeight: '92vh',
          background: '#fff',
          borderRadius: 22,
          border: '1px solid rgba(22,49,70,0.06)',
          boxShadow: '0 50px 100px -20px rgba(22,49,70,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(22,49,70,0.08)',
            background: 'rgba(22,49,70,0.025)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: '#986a41',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Preview
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 800,
                color: '#163146',
                letterSpacing: '-0.01em',
              }}
            >
              Public profile
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close preview'
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(22,49,70,0.06)',
              color: '#163146',
              border: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className='no-scrollbar'
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            background: '#faf7f2',
          }}
        >
          {loading && (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(22,49,70,0.55)', fontSize: 13 }}>
              Loading profile…
            </div>
          )}
          {err && (
            <div style={{ padding: 60, textAlign: 'center', color: '#b91c1c', fontSize: 13 }}>
              Couldn’t load this profile. {err}
            </div>
          )}
          {!loading && !err && View && (
            <View profile={profile} user={user} viewer={null} preview />
          )}
          {!loading && !err && !View && (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(22,49,70,0.55)', fontSize: 13 }}>
              No preview available for this profile type.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ProfilePreviewModal
