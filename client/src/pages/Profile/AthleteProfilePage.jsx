// AthleteProfilePage — athlete private profile.
//
// Layout (1440x900 desktop, per Claude Design "Athlete Private Profile"):
//   ┌────────────────────────────────────────────────────────────────┐
//   │                       Header card                              │
//   ├──────────────┬──────────────┬──────────────────────────────────┤
//   │  Experience  │  Education   │  NIL Preferences                 │
//   ├──────────────┴──────────────┼──────────────────────────────────┤
//   │   Connection Center         │  Activity & Strength             │
//   └─────────────────────────────┴──────────────────────────────────┘
//
// All data comes from `profileService.getAthleteProfileBundle()`.

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
import FocusAreasModal from '../../components/Profile/athletePrivate/FocusAreasModal'
import InterestsModal from '../../components/Profile/athletePrivate/InterestsModal'
import ExperienceCard from '../../components/Profile/athletePrivate/ExperienceCard'
import EducationCard from '../../components/Profile/athletePrivate/EducationCard'
import ConnectionCenterCard from '../../components/Profile/athletePrivate/ConnectionCenterCard'
import NILPreferencesCard from '../../components/Profile/athletePrivate/NILPreferencesCard'
import ActivityStrengthCard from '../../components/Profile/athletePrivate/ActivityStrengthCard'
import AthleteConnectionsModal from '../../components/Profile/athletePrivate/AthleteConnectionsModal'
import ProfilePreviewModal from '../../components/Profile/athletePrivate/ProfilePreviewModal'

const SIDEBAR_W = 228 // matches DashboardLayout

const AthleteProfilePage = () => {
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
  const [focusAreasOpen, setFocusAreasOpen] = useState(false)
  const [interestsOpen, setInterestsOpen] = useState(false)
  // NIL pref draft staged from card (deal size + timeline + focus areas + interests).
  // Card-level Confirm fires the relevant PUT calls.
  const [nilDraft, setNilDraft] = useState(null)
  // Connection mini-card View → in-page preview modal
  const [previewUserId, setPreviewUserId] = useState(null)

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

  const handleNilDraftStaged = (next) => setNilDraft(next)
  const handleNilCommit = async () => {
    if (!nilDraft) return
    try {
      const tasks = []
      const prefsDirty =
        nilDraft.nilPrefs &&
        (nilDraft.nilPrefs.dealSize !== undefined ||
          nilDraft.nilPrefs.timeline !== undefined ||
          nilDraft.focusAreas !== undefined)
      if (prefsDirty) {
        const payload = {}
        if (nilDraft.nilPrefs?.dealSize !== undefined) payload.dealSize = nilDraft.nilPrefs.dealSize
        if (nilDraft.nilPrefs?.timeline !== undefined) payload.timeline = nilDraft.nilPrefs.timeline
        if (nilDraft.focusAreas !== undefined) payload.focusAreas = nilDraft.focusAreas
        tasks.push(profileService.updateNILPreferences(payload))
      }
      if (nilDraft.interests !== undefined) {
        tasks.push(profileService.updateAthleteInterests(nilDraft.interests))
      }
      await Promise.all(tasks)
      setNilDraft(null)
      await loadBundle()
    } catch (e) {
      // Leave the draft so the user can retry; surface the error inline via card?
      // For now, log and keep the draft.
      // eslint-disable-next-line no-console
      console.error('NIL save failed', e)
    }
  }
  const handleNilCancel = () => setNilDraft(null)

  return (
    <DashboardLayout>
      {/* Desktop layout — fixed-position 3-column grid per design.
          Sidebar is 228px (DashboardLayout) + 12px gutter = 240 left offset. */}
      {isDesktop && (
      <div
        style={{
          display: 'grid',
          position: 'fixed',
          left: SIDEBAR_W + 32,
          right: 14,
          top: 14,
          bottom: 14,
          gridTemplateColumns: '1fr 1fr 340px',
          gridTemplateRows: '218px 260px minmax(0, 1fr)',
          gap: 12,
          minHeight: 0,
        }}
      >
        {loading && !bundle ? (
          <LoadingState />
        ) : err ? (
          <ErrorState message={err} onRetry={loadBundle} />
        ) : (
          <>
            {/* Row 1 — Header spans all 3 columns */}
            <div style={{ gridColumn: '1 / 4', gridRow: '1', minHeight: 0 }}>
              <HeaderCard
                bundle={bundle}
                currentUserId={currentUser?._id}
                onEdit={() => setIdentityOpen(true)}
                onEditSocials={() => setSocialsOpen(true)}
                onOpenConnections={() => setConnsOpen(true)}
              />
            </div>

            {/* Row 2 — Experience | Education | NIL Preferences */}
            <div style={{ gridColumn: '1', gridRow: '2', minHeight: 0 }}>
              <ExperienceCard bundle={bundle} onEdit={() => setExperienceOpen(true)} />
            </div>
            <div style={{ gridColumn: '2', gridRow: '2', minHeight: 0 }}>
              <EducationCard bundle={bundle} onEdit={() => setEducationOpen(true)} />
            </div>
            <div style={{ gridColumn: '3', gridRow: '2', minHeight: 0 }}>
              <NILPreferencesCard
                bundle={bundle}
                draft={nilDraft}
                onChangeDraft={handleNilDraftStaged}
                onCommit={handleNilCommit}
                onCancelDraft={handleNilCancel}
                onOpenFocusEditor={() => setFocusAreasOpen(true)}
                onOpenInterestsEditor={() => setInterestsOpen(true)}
              />
            </div>

            {/* Row 3 — Connection Center spans cols 1-2 | Activity & Strength col 3 */}
            <div style={{ gridColumn: '1 / 3', gridRow: '3', minHeight: 0 }}>
              <ConnectionCenterCard
                currentUserId={currentUser?._id}
                onSeeAll={() => setConnsOpen(true)}
                onMessage={(uid) => {
                  if (uid) window.location.href = `/inbox?user=${uid}`
                }}
                onView={(uid) => setPreviewUserId(uid)}
              />
            </div>
            <div style={{ gridColumn: '3', gridRow: '3', minHeight: 0 }}>
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
              <HeaderCard
                bundle={bundle}
                currentUserId={currentUser?._id}
                onEdit={() => setIdentityOpen(true)}
                onEditSocials={() => setSocialsOpen(true)}
                onOpenConnections={() => setConnsOpen(true)}
                density='compact'
              />
            </div>
            <div style={{ height: 220 }}>
              <ExperienceCard bundle={bundle} onEdit={() => setExperienceOpen(true)} />
            </div>
            <div style={{ height: 220 }}>
              <EducationCard bundle={bundle} onEdit={() => setEducationOpen(true)} />
            </div>
            <div style={{ height: 240 }}>
              <NILPreferencesCard
                bundle={bundle}
                draft={nilDraft}
                onChangeDraft={handleNilDraftStaged}
                onCommit={handleNilCommit}
                onCancelDraft={handleNilCancel}
                onOpenFocusEditor={() => setFocusAreasOpen(true)}
                onOpenInterestsEditor={() => setInterestsOpen(true)}
              />
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
                onView={(uid) => setPreviewUserId(uid)}
              />
            </div>
          </>
        )}
      </div>
      )}

      <AthleteConnectionsModal
        open={connsOpen}
        onClose={() => setConnsOpen(false)}
        currentUserId={currentUser?._id}
        viewerProfile={bundle?.profile}
        onMessage={(uid) => {
          if (uid) window.location.href = `/inbox?user=${uid}`
        }}
        onView={(uid) => {
          setConnsOpen(false)
          setPreviewUserId(uid)
        }}
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

      <FocusAreasModal
        open={focusAreasOpen}
        bundle={bundle}
        draft={nilDraft}
        onClose={() => setFocusAreasOpen(false)}
        onStage={(focusAreas) => {
          setNilDraft((d) => ({ ...(d || {}), focusAreas }))
          setFocusAreasOpen(false)
        }}
      />

      <InterestsModal
        open={interestsOpen}
        bundle={bundle}
        draft={nilDraft}
        onClose={() => setInterestsOpen(false)}
        onStage={(interests) => {
          setNilDraft((d) => ({ ...(d || {}), interests }))
          setInterestsOpen(false)
        }}
      />

      <ProfilePreviewModal
        userId={previewUserId}
        onClose={() => setPreviewUserId(null)}
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

export default AthleteProfilePage
