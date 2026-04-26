import React from 'react'
import {
  Check,
  Clock,
  Diamond,
  Facebook,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  Youtube,
} from 'lucide-react'

const VerifiedPill = () => (
  <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[rgba(152,106,65,0.30)] bg-[rgba(152,106,65,0.08)] text-[#986a41] text-[10px] font-black tracking-[0.18em] uppercase'>
    <ShieldCheck size={12} strokeWidth={2.2} />
    Verified
  </span>
)

const SOCIAL_ICONS = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: X,
  x: X,
  facebook: Facebook,
  youtube: Youtube,
}

const buildSocialUrl = (kind, value) => {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  const handle = value.replace(/^@/, '').trim()
  if (!handle) return null
  switch (kind) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'linkedin':
      return `https://linkedin.com/in/${handle}`
    case 'twitter':
    case 'x':
      return `https://twitter.com/${handle}`
    case 'facebook':
      return `https://facebook.com/${handle}`
    case 'youtube':
      return `https://youtube.com/${handle.startsWith('@') ? handle : '@' + handle}`
    default:
      return null
  }
}

const SocialBtn = ({ kind, value }) => {
  const I = SOCIAL_ICONS[kind] || Globe
  const href = buildSocialUrl(kind, value)
  return (
    <a
      href={href || '#'}
      target='_blank'
      rel='noreferrer'
      onClick={(e) => {
        if (!href) e.preventDefault()
      }}
      className='w-[30px] h-[30px] rounded-[9px] border border-[rgba(22,49,70,0.10)] bg-[rgba(22,49,70,0.03)] text-[#163146] flex items-center justify-center transition-all hover:bg-[rgba(152,106,65,0.10)] hover:text-[#986a41] hover:border-[rgba(152,106,65,0.25)]'
    >
      <I size={14} strokeWidth={1.7} />
    </a>
  )
}

const ConnectButton = ({ status, onConnect, onAccept }) => {
  if (status === 'connected') {
    return (
      <button
        type='button'
        disabled
        className='flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-emerald-700 text-white text-[11px] font-black tracking-[0.18em] uppercase border-b-[3px] border-emerald-900 opacity-90'
      >
        <Users size={13} strokeWidth={2.2} /> Connected
      </button>
    )
  }
  if (status === 'pending') {
    return (
      <button
        type='button'
        disabled
        className='flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#d97706] text-white text-[11px] font-black tracking-[0.18em] uppercase border-b-[3px] border-[#b45309] opacity-95'
      >
        <Clock size={13} strokeWidth={2.2} /> Pending
      </button>
    )
  }
  if (status === 'received') {
    return (
      <button
        type='button'
        onClick={onAccept}
        className='flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#163146] text-white text-[11px] font-black tracking-[0.18em] uppercase border-b-[3px] border-[#0a1824] transition-all hover:bg-[#1f4563]'
      >
        <Check size={13} strokeWidth={2.2} /> Accept
      </button>
    )
  }
  return (
    <button
      type='button'
      onClick={onConnect}
      className='flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#163146] text-white text-[11px] font-black tracking-[0.18em] uppercase border-b-[3px] border-[#0a1824] transition-all hover:bg-[#1f4563]'
    >
      <UserPlus size={13} strokeWidth={2.2} /> Connect
    </button>
  )
}

const MessageButton = ({ onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className='flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-[#986a41] text-white text-[11px] font-black tracking-[0.18em] uppercase border-b-[3px] border-[#7a5435] transition-all hover:bg-[#855c3a]'
  >
    <MessageSquare size={13} strokeWidth={2.2} /> Message
  </button>
)

const HeaderCard = ({
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
  const socials = Object.entries(profile.socialMedia || {}).filter(([, v]) => Boolean(v)).slice(0, 6)
  const showSecondary =
    !isOwnProfile && (connectionStatus === 'pending' || connectionStatus === 'received')
  return (
    <section
      className='bg-white rounded-3xl border border-[rgba(22,49,70,0.05)] px-[28px] py-[22px] flex flex-col gap-4 shrink-0 transition-shadow duration-200 hover:shadow-[0_8px_20px_-4px_rgba(22,49,70,0.10),0_24px_60px_-12px_rgba(22,49,70,0.18)]'
      style={{ boxShadow: '0 2px 8px -2px rgba(22,49,70,0.04), 0 10px 30px -10px rgba(22,49,70,0.06)' }}
    >
      <div
        className='grid items-start gap-7'
        style={{ gridTemplateColumns: 'minmax(0,1.2fr) 1px minmax(0,1fr)' }}
      >
        <div className='flex gap-7 items-start min-w-0'>
          <div className='relative shrink-0'>
            <div
              className='w-[96px] h-[96px] rounded-full flex items-center justify-center text-[#faf7f2] font-black text-[32px] tracking-[-0.02em] overflow-hidden'
              style={{
                background: 'linear-gradient(135deg,#1f4563 0%,#163146 55%,#0a1824 100%)',
                boxShadow: 'inset 0 0 0 3px #fff, 0 8px 24px -8px rgba(22,49,70,0.25)',
              }}
            >
              {profileImg ? (
                <img src={profileImg} alt={user?.name} className='w-full h-full object-cover' />
              ) : (
                initials
              )}
            </div>
          </div>
          <div className='min-w-0 flex-1 pt-0.5'>
            <div className='flex items-center gap-3 flex-wrap mb-1'>
              <h1 className='m-0 font-black text-[22px] tracking-[-0.02em] text-[#163146] leading-[1.05]'>
                {user?.name}
              </h1>
              {profile.verified && <VerifiedPill />}
            </div>
            <div className='text-[14px] font-bold text-[#163146] mb-1 flex items-center gap-2.5 flex-wrap'>
              {profile.title && <span>{profile.title}</span>}
              {profile.title && profile.company && (
                <span className='text-[rgba(22,49,70,0.25)]'>|</span>
              )}
              {profile.company && <span className='text-[#986a41]'>{profile.company}</span>}
            </div>
            <div className='flex items-center gap-3 flex-wrap'>
              <div className='flex flex-col gap-1 min-w-0'>
                {profile.location && (
                  <div className='flex items-center gap-1.5 text-[12.5px] text-[rgba(22,49,70,0.6)] font-medium'>
                    <MapPin size={13} strokeWidth={1.7} /> {profile.location}
                  </div>
                )}
                <div className='flex items-center gap-1.5 text-[12.5px] font-bold text-[#986a41]'>
                  <Users size={13} strokeWidth={2} /> {profile.connectionsCount || 0} connections
                </div>
              </div>
              {!isOwnProfile && (
                <div className='flex gap-2 items-center flex-wrap'>
                  <ConnectButton
                    status={connectionStatus}
                    onConnect={onConnect}
                    onAccept={onAccept}
                  />
                  <MessageButton onClick={onMessage} />
                  {showSecondary && connectionStatus === 'pending' && (
                    <button
                      type='button'
                      onClick={onCancel}
                      className='text-[10px] font-black tracking-[0.18em] uppercase text-rose-600 hover:text-rose-700 px-2 py-1 transition-colors'
                    >
                      Withdraw
                    </button>
                  )}
                  {showSecondary && connectionStatus === 'received' && (
                    <button
                      type='button'
                      onClick={onDecline}
                      className='inline-flex items-center gap-1 text-[10px] font-black tracking-[0.18em] uppercase text-rose-600 hover:text-rose-700 px-2 py-1 transition-colors'
                    >
                      <X size={12} strokeWidth={2.2} /> Decline
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className='bg-[rgba(22,49,70,0.07)] w-px self-stretch' />
        <div className='min-w-0 flex flex-col gap-2.5'>
          <div>
            <div
              className='font-black text-[10px] uppercase text-[rgba(22,49,70,0.5)] mb-1'
              style={{ letterSpacing: '0.32em' }}
            >
              About Me
            </div>
            <p
              className='m-0 leading-[1.55] text-[#163146] font-normal text-[13px] overflow-hidden'
              style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}
            >
              {profile.aboutMe || profile.bio || 'No bio yet.'}
            </p>
          </div>
        </div>
      </div>
      <div className='h-px bg-[rgba(22,49,70,0.07)]' />
      <div
        className='grid items-center gap-7'
        style={{ gridTemplateColumns: 'minmax(0,1.2fr) 1px minmax(0,1fr)' }}
      >
        <div className='flex gap-9 flex-wrap'>
          {email && (
            <div className='min-w-0'>
              <div
                className='font-black text-[10px] uppercase text-[rgba(22,49,70,0.5)] mb-1'
                style={{ letterSpacing: '0.32em' }}
              >
                Email
              </div>
              <div className='flex items-center gap-1.5 text-[12.5px] text-[#163146] font-medium truncate'>
                <Mail size={13} strokeWidth={1.7} className='shrink-0' />
                <span className='truncate'>{email}</span>
              </div>
            </div>
          )}
          {phone && (
            <div className='min-w-0'>
              <div
                className='font-black text-[10px] uppercase text-[rgba(22,49,70,0.5)] mb-1'
                style={{ letterSpacing: '0.32em' }}
              >
                Phone
              </div>
              <div className='flex items-center gap-1.5 text-[12.5px] text-[#163146] font-medium'>
                <Phone size={13} strokeWidth={1.7} /> {phone}
              </div>
            </div>
          )}
        </div>
        <div className='w-px self-stretch' />
        <div className='flex items-center justify-end gap-2.5'>
          <div className='flex gap-1.5'>
            {socials.length > 0 ? (
              socials.map(([k, v]) => <SocialBtn key={k} kind={k} value={v} />)
            ) : (
              <span className='text-[10px] font-bold text-[rgba(22,49,70,0.35)] uppercase tracking-widest'>
                No socials
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const Card = ({
  title,
  count,
  children,
  className = '',
  titleClassName = 'font-black text-[16px] tracking-[-0.02em] text-[#163146]',
  headerPaddingClassName = 'px-[20px] pt-[14px] pb-1',
}) => (
  <section
    className={`bg-white rounded-3xl border border-[rgba(22,49,70,0.05)] flex flex-col min-h-0 min-w-0 overflow-hidden transition-shadow duration-200 hover:shadow-[0_8px_20px_-4px_rgba(22,49,70,0.10),0_24px_60px_-12px_rgba(22,49,70,0.18)] ${className}`}
    style={{ boxShadow: '0 2px 8px -2px rgba(22,49,70,0.04), 0 10px 30px -10px rgba(22,49,70,0.05)' }}
  >
    <div className={`flex items-baseline gap-2.5 shrink-0 ${headerPaddingClassName}`}>
      <h2 className={`m-0 ${titleClassName}`}>{title}</h2>
      {count != null && (
        <span className='text-[11px] font-semibold text-[rgba(22,49,70,0.45)]'>({count})</span>
      )}
    </div>
    {children}
  </section>
)

// Universal scroll container — used everywhere for the soft white-fade
// "1 full + peek" affordance. Supports vertical (cards) and horizontal (chip rails).
const FadeScroll = ({ children, direction = 'vertical', padX = 24 }) => {
  const isV = direction === 'vertical'
  const fadeSize = 56
  const positional = isV
    ? { paddingLeft: padX, paddingRight: padX, paddingBottom: fadeSize - 8 }
    : { paddingTop: 4, paddingBottom: 4, paddingRight: fadeSize - 8 }
  return (
    <div className='relative flex-1 min-h-0 min-w-0 overflow-hidden'>
      <div
        className={`no-scrollbar absolute inset-0 ${
          isV ? 'overflow-y-auto overflow-x-hidden' : 'overflow-x-auto overflow-y-hidden'
        }`}
        style={positional}
      >
        {children}
      </div>
      <div
        className='absolute pointer-events-none'
        style={
          isV
            ? {
                left: 0,
                right: 0,
                bottom: 0,
                height: fadeSize,
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 55%, #fff 100%)',
              }
            : {
                top: 0,
                bottom: 0,
                right: 0,
                width: fadeSize,
                background:
                  'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 55%, #fff 100%)',
              }
        }
      />
    </div>
  )
}

const EmptyState = ({ message }) => (
  <div className='px-[24px] pb-[20px] text-[12.5px] text-[rgba(22,49,70,0.5)] font-medium'>
    {message}
  </div>
)

const ExperienceEntry = ({ e, isLast }) => {
  const logoText = e.logoText || (e.company || '?').slice(0, 3).toUpperCase()
  const logoBg = e.logoBg || '#163146'
  return (
    <div
      className={`flex gap-3 items-start py-3 ${
        isLast ? '' : 'border-b border-[rgba(22,49,70,0.06)]'
      }`}
    >
      <div
        className='w-[48px] h-[48px] rounded-xl flex items-center justify-center text-white text-[12px] font-black shrink-0'
        style={{ background: logoBg, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
      >
        {logoText}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-[14px] font-extrabold text-[#163146] tracking-[-0.01em] leading-[1.2]'>
          {e.role}
        </div>
        <div className='text-[13px] text-[#163146] font-medium mt-0.5'>
          {e.company}
          {e.type && <span className='text-[rgba(22,49,70,0.5)]'> · {e.type}</span>}
        </div>
        {(e.startDate || e.endDate) && (
          <div className='text-[12px] text-[rgba(22,49,70,0.55)] font-medium mt-0.5'>
            {e.startDate} {e.startDate && e.endDate && '–'} {e.endDate}
          </div>
        )}
        {e.location && (
          <div className='text-[12px] text-[rgba(22,49,70,0.55)] font-medium'>{e.location}</div>
        )}
        {e.description && (
          <p className='m-0 mt-2 text-[12.5px] leading-[1.5] text-[rgba(22,49,70,0.78)] font-normal'>
            {e.description}
          </p>
        )}
      </div>
    </div>
  )
}

const EducationEntry = ({ e, isLast }) => {
  const logoText = e.logoText || (e.school || '?').slice(0, 1).toUpperCase()
  const logoBg = e.logoBg || '#163146'
  return (
    <div
      className={`flex gap-3 items-start py-3 ${
        isLast ? '' : 'border-b border-[rgba(22,49,70,0.06)]'
      }`}
    >
      <div
        className='w-[48px] h-[48px] rounded-xl flex items-center justify-center text-white shrink-0'
        style={{
          background: logoBg,
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: 26,
          fontWeight: 600,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {logoText}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-[14px] font-extrabold text-[#163146] tracking-[-0.01em] leading-[1.2]'>
          {e.school}
        </div>
        {e.degree && (
          <div className='text-[13px] text-[#163146] font-medium mt-0.5'>{e.degree}</div>
        )}
        {(e.startYear || e.endYear) && (
          <div className='text-[12px] text-[rgba(22,49,70,0.55)] font-medium mt-0.5'>
            {e.startYear} {e.startYear && e.endYear && '–'} {e.endYear}
          </div>
        )}
        {e.description && (
          <p className='m-0 mt-2 text-[12.5px] leading-[1.5] text-[rgba(22,49,70,0.78)] font-normal'>
            {e.description}
          </p>
        )}
      </div>
    </div>
  )
}

const CertEntry = ({ c, isLast }) => {
  const logoText = c.logoText || (c.org || c.title || '?').slice(0, 3).toUpperCase()
  const logoBg = c.logoBg || '#163146'
  return (
    <div
      className={`flex gap-3 items-start py-3 ${
        isLast ? '' : 'border-b border-[rgba(22,49,70,0.06)]'
      }`}
    >
      <div
        className='w-[48px] h-[48px] rounded-xl flex items-center justify-center text-white text-[11px] font-black shrink-0'
        style={{ background: logoBg }}
      >
        {logoText}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-[13px] font-extrabold text-[#163146] tracking-[-0.005em] leading-[1.25]'>
          {c.title}
        </div>
        {c.org && (
          <div className='text-[13px] text-[rgba(22,49,70,0.7)] font-medium mt-0.5'>{c.org}</div>
        )}
        {c.issuedDate && (
          <div className='text-[12px] text-[rgba(22,49,70,0.45)] font-medium mt-0.5'>
            Issued {c.issuedDate}
          </div>
        )}
      </div>
    </div>
  )
}

// Chip rail uses the same horizontal FadeScroll for consistent affordance
// (replaces the old "+N" badge; matches Experience/Education behavior the user liked)
const ChipRail = ({ title, items, accent = 'navy', icon: I, emptyLabel = 'None added' }) => (
  <Card title={title}>
    {items.length === 0 ? (
      <EmptyState message={emptyLabel} />
    ) : (
      <FadeScroll direction='horizontal' padX={24}>
        <div
          className='flex gap-2 items-center h-full'
          style={{ paddingLeft: 24, paddingRight: 8 }}
        >
          {items.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className='shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap'
              style={{
                border: `1px solid ${
                  accent === 'bronze' ? 'rgba(152,106,65,0.30)' : 'rgba(22,49,70,0.12)'
                }`,
                background: accent === 'bronze' ? 'rgba(152,106,65,0.06)' : 'rgba(22,49,70,0.03)',
                color: accent === 'bronze' ? '#986a41' : '#163146',
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '-0.005em',
              }}
            >
              {I && <I size={12} strokeWidth={2} />}
              {String(label).replace(/([A-Z])/g, ' $1').trim()}
            </span>
          ))}
        </div>
      </FadeScroll>
    )}
  </Card>
)

const AdvisorPublicView = ({
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
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : []
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

      {/* Middle row: Experience | Education — flex-1 takes remaining space */}
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

      {/* Bottom row: shorter (flex 0.55) so chip rails + cert card have room without being squeezed */}
      <div
        className='grid gap-3 min-h-0'
        style={{
          gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)',
          flex: '0.5 1 0%',
        }}
      >
        <Card title='Licenses & Certifications' count={certifications.length}>
          {certifications.length === 0 ? (
            <EmptyState message='No certifications listed yet.' />
          ) : (
            <FadeScroll>
              <div>
                {certifications.map((c, i) => (
                  <CertEntry key={i} c={c} isLast={i === certifications.length - 1} />
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

export { Card, ExperienceEntry, EducationEntry, CertEntry, VerifiedPill, EmptyState }
export default AdvisorPublicView
