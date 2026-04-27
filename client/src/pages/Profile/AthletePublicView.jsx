import React from 'react'
import { Diamond, Heart } from 'lucide-react'
import {
  HeaderCard,
  Card,
  FadeScroll,
  ChipRail,
  ExperienceEntry,
  EducationEntry,
  FocusAreaEntry,
  EmptyState,
} from './AdvisorPublicView'

const normalizeFocusAreas = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((v) => (typeof v === 'string' ? { title: v, description: '' } : v))
    .filter((v) => v && v.title)

const AthletePublicView = ({
  profile,
  user,
  initials,
  profileImg,
  email,
  phone,
  isOwnProfile,
  connectionStatus,
  onConnect,
  onAccept,
  onDecline,
  onCancel,
  onMessage,
}) => {
  const experience = Array.isArray(profile.experience) ? profile.experience : []
  const education = Array.isArray(profile.education) ? profile.education : []
  const focusAreas = normalizeFocusAreas(profile.nilPreferences?.focusAreas)
  const expertise = Array.isArray(profile.specialization) ? profile.specialization : []
  const interests = Array.isArray(profile.activeInterests)
    ? profile.activeInterests
    : typeof profile.interests === 'object' && profile.interests !== null
      ? Object.entries(profile.interests)
          .filter(([, active]) => active)
          .map(([key]) => key)
      : []

  return (
    <div className='hidden lg:flex flex-col h-full w-full gap-3 overflow-hidden'>
      <HeaderCard
        profile={profile}
        user={user}
        initials={initials}
        profileImg={profileImg}
        email={email}
        phone={phone}
        isOwnProfile={isOwnProfile}
        connectionStatus={connectionStatus}
        onConnect={onConnect}
        onAccept={onAccept}
        onDecline={onDecline}
        onCancel={onCancel}
        onMessage={onMessage}
      />

      {/* Middle row: Experience | Education */}
      <div
        className='grid gap-3 flex-1 min-h-0'
        style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}
      >
        <Card title='Experience' count={experience.length}>
          {experience.length === 0 ? (
            <EmptyState message='No experience listed yet.' />
          ) : (
            <FadeScroll>
              <div>
                {experience.map((e, i) => (
                  <ExperienceEntry key={i} e={e} isLast={i === experience.length - 1} />
                ))}
              </div>
            </FadeScroll>
          )}
        </Card>
        <Card title='Education' count={education.length}>
          {education.length === 0 ? (
            <EmptyState message='No education listed yet.' />
          ) : (
            <FadeScroll>
              <div>
                {education.map((e, i) => (
                  <EducationEntry key={i} e={e} isLast={i === education.length - 1} />
                ))}
              </div>
            </FadeScroll>
          )}
        </Card>
      </div>

      {/* Bottom row: Focus Areas (left) | Expertise + Interests rails (right) */}
      <div
        className='grid gap-3 min-h-0'
        style={{
          gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)',
          flex: '0.5 1 0%',
        }}
      >
        <Card title='Focus Areas' count={focusAreas.length}>
          {focusAreas.length === 0 ? (
            <EmptyState message='No focus areas listed yet.' />
          ) : (
            <FadeScroll>
              <div>
                {focusAreas.map((f, i) => (
                  <FocusAreaEntry key={i} f={f} isLast={i === focusAreas.length - 1} />
                ))}
              </div>
            </FadeScroll>
          )}
        </Card>
        <div className='grid gap-3 min-h-0' style={{ gridTemplateRows: '1fr 1fr' }}>
          <ChipRail title='Expertise' items={expertise} accent='bronze' icon={Diamond} />
          <ChipRail title='Interests' items={interests} accent='navy' icon={Heart} />
        </div>
      </div>
    </div>
  )
}

export default AthletePublicView
