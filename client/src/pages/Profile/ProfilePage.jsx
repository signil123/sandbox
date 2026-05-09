// ProfilePage — athlete private profile (Phase B, read-only).
//
// Layout (1440×900 desktop):
//   ┌──────────────────────────────────────────────────────────┐
//   │                     Header card                          │
//   ├─────────────────────────┬────────────────────────────────┤
//   │  Experience │ Education │  NIL Preferences               │
//   │─────────────┴───────────│  Interests (h-scroll)          │
//   │  Connection Center      │  Activity & Strength           │
//   └─────────────────────────┴────────────────────────────────┘
//
// All data comes from `profileService.getAthleteProfileBundle()`. Pencils
// render but are disabled — Phase C wires the edit modals.

import React, { useEffect, useState, useLayoutEffect } from 'react'

// Tailwind v4's md: utilities aren't reliably applied during initial render in
// some setups. Use a media-query hook instead so the desktop/mobile blocks
// never both mount.
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  )
  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}
import { useSelector } from 'react-redux'
import DashboardLayout from '../Layout/DashboardLayout'
import { profileService } from '../../services/profileService'
import { selectCurrentUser } from '../../redux/userSlice'
import HeaderCard from '../../components/Profile/athletePrivate/HeaderCard'
import IdentityModal from '../../components/Profile/athletePrivate/IdentityModal'
import SocialsModal from '../../components/Profile/athletePrivate/SocialsModal'
import ExperienceModal from '../../components/Profile/athletePrivate/ExperienceModal'
import EducationModal from '../../components/Profile/athletePrivate/EducationModal'
import ExperienceCard from '../../components/Profile/athletePrivate/ExperienceCard'
import EducationCard from '../../components/Profile/athletePrivate/EducationCard'
import ConnectionCenterCard from '../../components/Profile/athletePrivate/ConnectionCenterCard'
import NILPreferencesCard from '../../components/Profile/athletePrivate/NILPreferencesCard'
import InterestsCard from '../../components/Profile/athletePrivate/InterestsCard'
import ActivityStrengthCard from '../../components/Profile/athletePrivate/ActivityStrengthCard'
import ConnectionsModal from '../../components/Connections/ConnectionsModal'

const SIDEBAR_W = 228 // matches DashboardLayout

const ProfilePage = () => {
  const currentUser = useSelector(selectCurrentUser)
  const isDesktop = useIsDesktop()
  const [bundle, setBundle] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connsOpen, setConnsOpen] = useState(false)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [socialsOpen, setSocialsOpen] = useState(false)
  const [experienceOpen, setExperienceOpen] = useState(false)
  const [educationOpen, setEducationOpen] = useState(false)

  const loadBundle = async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await profileService.getAthleteProfileBundle()
      setBundle(r?.data || r)
    } catch (e) {
      setErr(typeof e === 'string' ? e : e?.message || 'Failed to load profile')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadBundle()
  }, [])

  return (
    <DashboardLayout>
      {/* Desktop layout — fixed-position grid that fills the space next to the
          sidebar. Mobile falls back to a stacked column under the sidebar gap. */}
      {isDesktop && (
      <div
        style={{
          display: 'grid',
          position: 'fixed',
          left: SIDEBAR_W + 32,
          right: 16,
          top: 16,
          bottom: 16,
          gridTemplateColumns: '1fr 360px',
          gridTemplateRows: '340px 220px minmax(0, 1fr)',
          gridTemplateAreas: `
            "header   header"
            "expedu   nil"
            "conns    rightrail"
          `,
          gap: 14,
          minHeight: 0,
        }}
      >
        {loading && !bundle ? (
          <LoadingState />
        ) : err ? (
          <ErrorState message={err} onRetry={loadBundle} />
        ) : (
          <>
            <div style={{ gridArea: 'header', minHeight: 0, height: '100%' }}>
              <HeaderCard bundle={bundle} currentUserId={currentUser?._id} onEdit={() => setIdentityOpen(true)} onEditSocials={() => setSocialsOpen(true)} />
            </div>

            {/* Experience + Education side-by-side */}
            <div
              style={{
                gridArea: 'expedu',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                minHeight: 0,
              }}
            >
              <ExperienceCard bundle={bundle} onEdit={() => setExperienceOpen(true)} />
              <EducationCard bundle={bundle} onEdit={() => setEducationOpen(true)} />
            </div>

            {/* NIL Prefs (top of right column) */}
            <div style={{ gridArea: 'nil', minHeight: 0 }}>
              <NILPreferencesCard bundle={bundle} />
            </div>

            {/* Connection Center (bottom-left) */}
            <div style={{ gridArea: 'conns', minHeight: 0 }}>
              <ConnectionCenterCard
                currentUserId={currentUser?._id}
                onSeeAll={() => setConnsOpen(true)}
                onMessage={(uid) => {
                  if (uid) window.location.href = `/inbox?user=${uid}`
                }}
              />
            </div>

            {/* Right rail bottom: Interests (compact) + Activity & Strength */}
            <div
              style={{
                gridArea: 'rightrail',
                display: 'grid',
                gridTemplateRows: 'auto minmax(0, 1fr)',
                gap: 14,
                minHeight: 0,
              }}
            >
              <InterestsCard bundle={bundle} />
              <ActivityStrengthCard bundle={bundle} />
            </div>
          </>
        )}
      </div>
      )}

      {/* Mobile fallback — stacked, vertically scrollable */}
      {!isDesktop && (
      <div
        style={{ padding: '16px 14px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {loading && !bundle && <LoadingState compact />}
        {err && <ErrorState message={err} onRetry={loadBundle} compact />}
        {bundle && (
          <>
            <div style={{ height: 240 }}>
              <HeaderCard bundle={bundle} currentUserId={currentUser?._id} onEdit={() => setIdentityOpen(true)} onEditSocials={() => setSocialsOpen(true)} density='compact' />
            </div>
            <div style={{ height: 220 }}>
              <ExperienceCard bundle={bundle} onEdit={() => setExperienceOpen(true)} />
            </div>
            <div style={{ height: 220 }}>
              <EducationCard bundle={bundle} onEdit={() => setEducationOpen(true)} />
            </div>
            <div style={{ height: 240 }}>
              <NILPreferencesCard bundle={bundle} />
            </div>
            <div>
              <InterestsCard bundle={bundle} />
            </div>
            <div style={{ height: 320 }}>
              <ActivityStrengthCard bundle={bundle} />
            </div>
            <div style={{ height: 280 }}>
              <ConnectionCenterCard
                currentUserId={currentUser?._id}
                onSeeAll={() => setConnsOpen(true)}
                onMessage={(uid) => {
                  if (uid) window.location.href = `/inbox?user=${uid}`
                }}
              />
            </div>
          </>
        )}
      </div>
      )}

      <ConnectionsModal
        isOpen={connsOpen}
        onClose={() => setConnsOpen(false)}
        currentUserId={currentUser?._id}
        userId={currentUser?._id}
      />

      <IdentityModal
        open={identityOpen}
        bundle={bundle}
        onClose={() => setIdentityOpen(false)}
        onSaved={loadBundle}
      />

      <SocialsModal
        open={socialsOpen}
        bundle={bundle}
        onClose={() => setSocialsOpen(false)}
        onSaved={loadBundle}
      />

      <ExperienceModal
        open={experienceOpen}
        bundle={bundle}
        onClose={() => setExperienceOpen(false)}
        onSaved={loadBundle}
      />

      <EducationModal
        open={educationOpen}
        bundle={bundle}
        onClose={() => setEducationOpen(false)}
        onSaved={loadBundle}
      />
    </DashboardLayout>
  )
}

const LoadingState = ({ compact }) => (
  <div
    style={{
      gridColumn: compact ? undefined : '1 / -1',
      gridRow: compact ? undefined : '1 / -1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(22,49,70,0.45)',
      fontSize: 13,
      fontWeight: 600,
      padding: 40,
    }}
  >
    Loading profile…
  </div>
)

const ErrorState = ({ message, onRetry, compact }) => (
  <div
    style={{
      gridColumn: compact ? undefined : '1 / -1',
      gridRow: compact ? undefined : '1 / -1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      color: '#b91c1c',
      fontSize: 13,
      padding: 40,
    }}
  >
    <div>Couldn’t load your profile.</div>
    <div style={{ color: 'rgba(22,49,70,0.5)', fontSize: 12 }}>{message}</div>
    <button
      type='button'
      onClick={onRetry}
      style={{
        background: '#163146',
        color: '#fff',
        padding: '8px 14px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 800,
        cursor: 'pointer',
        border: 0,
      }}
    >
      Retry
    </button>
  </div>
)

export default ProfilePage
