import { AnimatePresence, motion } from 'framer-motion'
import {
    ExternalLink,
    MapPin,
    MessageSquare,
    ShieldCheck,
    Star,
    TrendingUp,
    UserPlus,
    Users,
    X
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../pages/Profile/AdvisorPublicView'
import { profileService } from '../../services/profileService'

const PRIMARY_COLOR = '#163146'
const ACCENT_COLOR = '#986a41'

const SectionSkeleton = () => (
  <div className='px-[18px] pb-[14px] pt-2 space-y-3 flex-1'>
    {[0, 1].map((i) => (
      <div key={i} className='flex gap-3 items-start py-1'>
        <div className='w-[44px] h-[44px] rounded-xl bg-[rgba(22,49,70,0.06)] animate-pulse shrink-0' />
        <div className='flex-1 space-y-2 pt-1'>
          <div className='h-3 w-2/3 rounded bg-[rgba(22,49,70,0.06)] animate-pulse' />
          <div className='h-2.5 w-1/2 rounded bg-[rgba(22,49,70,0.05)] animate-pulse' />
          <div className='h-2.5 w-1/3 rounded bg-[rgba(22,49,70,0.05)] animate-pulse' />
        </div>
      </div>
    ))}
  </div>
)

const CenteredEmpty = ({ message }) => (
  <div className='flex-1 flex items-center justify-center px-5 py-6 text-[12px] text-[rgba(22,49,70,0.45)] font-medium text-center'>
    {message}
  </div>
)

// Compact entries — smaller logos + tighter type, used in the popup where cards are shorter.
// Shared *Entry components in AdvisorPublicView stay as-is for the full profile page.
const COMPACT_TITLE = 'font-black text-[13px] tracking-[-0.02em] text-[#163146]'
const COMPACT_HEADER_PADDING = 'px-[16px] pt-[10px] pb-0.5'

const CompactExperienceEntry = ({ e, isLast }) => {
  const logoText = e.logoText || (e.company || '?').slice(0, 3).toUpperCase()
  const logoBg = e.logoBg || '#163146'
  return (
    <div
      className={`flex gap-2.5 items-start py-2 ${
        isLast ? '' : 'border-b border-[rgba(22,49,70,0.06)]'
      }`}
    >
      <div
        className='w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white text-[9px] font-black shrink-0'
        style={{ background: logoBg, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
      >
        {logoText}
      </div>
      <div className='flex-1 min-w-0 pt-0.5'>
        <div className='text-[11.5px] font-extrabold text-[#163146] tracking-[-0.005em] leading-[1.2] truncate'>
          {e.role}
        </div>
        <div className='text-[11px] text-[#163146] font-medium mt-0.5 truncate'>
          {e.company}
          {e.type && <span className='text-[rgba(22,49,70,0.5)]'> · {e.type}</span>}
        </div>
        {(e.startDate || e.endDate) && (
          <div className='text-[10.5px] text-[rgba(22,49,70,0.55)] font-medium mt-0.5'>
            {e.startDate} {e.startDate && e.endDate && '–'} {e.endDate}
          </div>
        )}
        {e.description && (
          <p className='m-0 mt-1 text-[11px] leading-[1.45] text-[rgba(22,49,70,0.78)] font-normal'>
            {e.description}
          </p>
        )}
      </div>
    </div>
  )
}

const CompactEducationEntry = ({ e, isLast }) => {
  const logoText = e.logoText || (e.school || '?').slice(0, 1).toUpperCase()
  const logoBg = e.logoBg || '#163146'
  return (
    <div
      className={`flex gap-2.5 items-start py-2 ${
        isLast ? '' : 'border-b border-[rgba(22,49,70,0.06)]'
      }`}
    >
      <div
        className='w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white shrink-0'
        style={{
          background: logoBg,
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: 18,
          fontWeight: 600,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {logoText}
      </div>
      <div className='flex-1 min-w-0 pt-0.5'>
        <div className='text-[11.5px] font-extrabold text-[#163146] tracking-[-0.005em] leading-[1.2] truncate'>
          {e.school}
        </div>
        {e.degree && (
          <div className='text-[11px] text-[#163146] font-medium mt-0.5 truncate'>{e.degree}</div>
        )}
        {(e.startYear || e.endYear) && (
          <div className='text-[10.5px] text-[rgba(22,49,70,0.55)] font-medium mt-0.5'>
            {e.startYear} {e.startYear && e.endYear && '–'} {e.endYear}
          </div>
        )}
        {e.description && (
          <p className='m-0 mt-1 text-[11px] leading-[1.45] text-[rgba(22,49,70,0.78)] font-normal'>
            {e.description}
          </p>
        )}
      </div>
    </div>
  )
}

const CompactCertEntry = ({ c, isLast }) => {
  const logoText = c.logoText || (c.org || c.title || '?').slice(0, 3).toUpperCase()
  const logoBg = c.logoBg || '#163146'
  return (
    <div
      className={`flex gap-2.5 items-start py-2 ${
        isLast ? '' : 'border-b border-[rgba(22,49,70,0.06)]'
      }`}
    >
      <div
        className='w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white text-[9px] font-black shrink-0'
        style={{ background: logoBg }}
      >
        {logoText}
      </div>
      <div className='flex-1 min-w-0 pt-0.5'>
        <div className='text-[11.5px] font-extrabold text-[#163146] tracking-[-0.005em] leading-[1.25] truncate'>
          {c.title}
        </div>
        {c.org && (
          <div className='text-[11px] text-[rgba(22,49,70,0.65)] font-medium mt-0.5 truncate'>{c.org}</div>
        )}
        {c.issuedDate && (
          <div className='text-[10.5px] text-[rgba(22,49,70,0.45)] font-medium mt-0.5'>
            Issued {c.issuedDate}
          </div>
        )}
      </div>
    </div>
  )
}

const normalizeCertifications = (certs) => {
  if (!Array.isArray(certs)) return []
  return certs.map((c) => {
    if (typeof c === 'string') return { title: c, org: '', issuedDate: '' }
    return c || {}
  })
}

const CompactFocusAreaEntry = ({ f, isLast }) => {
  const logoText = f.logoText || (f.title || '?').slice(0, 3).toUpperCase()
  const logoBg = f.logoBg || '#163146'
  return (
    <div
      className={`flex gap-2.5 items-start py-2 ${
        isLast ? '' : 'border-b border-[rgba(22,49,70,0.06)]'
      }`}
    >
      <div
        className='w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white text-[9px] font-black shrink-0'
        style={{ background: logoBg }}
      >
        {logoText}
      </div>
      <div className='flex-1 min-w-0 pt-0.5'>
        <div className='text-[11.5px] font-extrabold text-[#163146] tracking-[-0.005em] leading-[1.25]'>
          {f.title}
        </div>
        {f.description && (
          <p className='m-0 mt-1 text-[11px] leading-[1.45] text-[rgba(22,49,70,0.78)] font-normal'>
            {f.description}
          </p>
        )}
      </div>
    </div>
  )
}

const normalizeFocusAreas = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((v) => (typeof v === 'string' ? { title: v, description: '' } : v))
    .filter((v) => v && v.title)



const ReviewModal = ({ isOpen, onClose, profileName, userType }) => {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const handleSubmit = () => {
    console.log({ rating, review })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]'
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-[70] overflow-hidden'
          >
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-gray-900'>Write a Review</h3>
              <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-full transition-colors'>
                <X size={20} className='text-gray-500' />
              </button>
            </div>

            <div className='space-y-6'>
               <div className="text-center">
                 <p className='text-sm text-gray-600 mb-3'>Rate your experience with <span className="font-semibold text-gray-900">{profileName}</span></p>
                 <div className='flex justify-center gap-2'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className='focus:outline-none transform transition-transform hover:scale-110'
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= rating
                            ? 'fill-[#986a41] text-[#986a41]'
                            : 'text-gray-200 hover:text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
               </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Review</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder='Share details of your own experience...'
                  className='w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146]/20 focus:border-[#163146] text-sm min-h-[120px] resize-none'
                />
                <div className='flex justify-end mt-2'>
                  <span className={`text-xs ${review.length < 85 ? 'text-orange-500' : 'text-green-600'}`}>
                    {review.length}/85 characters min
                  </span>
                </div>
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={review.length < 85}
                className='w-full py-3 bg-[#163146] text-white font-bold rounded-xl hover:bg-[#0f2332] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#163146]/20'
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Review
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const ProfilePopup = ({
  profile,
  onClose,
  isOpen,
  currentUserType = 'athlete',
  onConnect,
  onMessage,
  zIndexBase = 50
}) => {
  const navigate = useNavigate()
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [fullProfile, setFullProfile] = useState(null)
  const [loadingFull, setLoadingFull] = useState(false)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const targetUserId = profile?.userId || profile?.id || profile?._id

  useEffect(() => {
    if (!isOpen || !targetUserId) return
    let cancelled = false
    let timer = setTimeout(() => {
      if (cancelled) return
      setFullProfile(null)
      setLoadingFull(true)
      profileService
        .getProfileByUserId(targetUserId)
        .then((response) => {
          if (cancelled || !response) return
          if (response.status === 'success' && response.data?.profile) {
            setFullProfile(response.data.profile)
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadingFull(false)
        })
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, targetUserId])

  if (!profile) return null

  const hasRating = profile.reviewCount > 0
  const canConnect = onConnect && (currentUserType === 'athlete' || profile.verified)
  const canMessage = onMessage && (currentUserType === 'athlete' || profile.verified)

  const experienceList = Array.isArray(fullProfile?.experience) ? fullProfile.experience : []
  const educationList = Array.isArray(fullProfile?.education) ? fullProfile.education : []
  const certificationsList = normalizeCertifications(
    Array.isArray(fullProfile?.certifications) ? fullProfile.certifications : profile.certifications
  )
  const isAthleteTarget =
    (profile?.userType || profile?.type || fullProfile?.profileType) === 'athlete'
  const focusAreasList = isAthleteTarget
    ? normalizeFocusAreas(fullProfile?.nilPreferences?.focusAreas)
    : []
  const aboutText =
    fullProfile?.aboutMe || fullProfile?.bio || profile.aboutMe || profile.about || ''
  const company = fullProfile?.company || profile.company
  const titleText = fullProfile?.title || profile.title
  const locationText = fullProfile?.location || profile.location
  const verified = profile.verified || fullProfile?.verified
  const connectionsCount =
    fullProfile?.connectionsCount ?? profile.connectionsCount ?? profile.connections ?? 0

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className='fixed inset-0 h-screen w-screen bg-black/30 backdrop-blur-sm'
              style={{ zIndex: zIndexBase }}
            />

            <motion.div
              initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              className='fixed left-0 md:left-1/2 bottom-0 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[640px] max-w-full md:max-w-[95vw] bg-[#faf7f2] rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[95dvh] md:h-[680px] max-h-[100dvh] md:max-h-[90vh]'
              style={{ zIndex: zIndexBase + 1 }}
            >
              <button
                  onClick={onClose}
                  className='absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full text-gray-800 shadow-md transition-all transform hover:scale-105 border border-gray-100'
              >
                  <X size={20} />
              </button>

              {/* --- Content (modal itself doesn't scroll; only individual card bodies do) --- */}
              <div className='flex-1 min-h-0 relative flex flex-col'>

                {/* Banner */}
                <div className='relative h-32 w-full'>
                  <div
                    className='absolute inset-0 bg-cover bg-center'
                    style={typeof profile.banner === 'object' ? profile.banner : { background: profile.banner || `linear-gradient(135deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR})` }}
                  />
                  <div className='absolute inset-0 bg-gradient-to-b from-black/15 to-transparent' />
                </div>

                {/* Avatar overlapping banner, centered */}
                <div className='px-5 md:px-6 -mt-16 flex flex-col items-center'>
                  <div className='relative'>
                    <motion.img
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.05, duration: 0.35 }}
                      src={profile.profileImg}
                      alt={profile.name}
                      className='w-[120px] h-[120px] rounded-full object-cover border-[6px] border-[#faf7f2] shadow-xl bg-white'
                    />
                    {verified && (
                      <div
                        className='absolute top-1 right-1 z-10 w-7 h-7 rounded-full bg-[#986a41] border-[3px] border-[#faf7f2] flex items-center justify-center text-white shadow-md'
                        title='Verified'
                      >
                        <ShieldCheck size={13} strokeWidth={2.4} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Header row: identity (left-aligned) | meta (right-aligned, stacked) */}
                <div className='px-5 md:px-6 mt-3 flex items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <h2
                      className='font-black text-[20px] md:text-[22px] tracking-[-0.02em] text-[#163146] leading-[1.1] cursor-pointer hover:underline truncate'
                      onClick={() => navigate(`/profile/public/${targetUserId}`)}
                    >
                      {profile.name}
                    </h2>
                    {(titleText || company) && (
                      <div className='mt-1 text-[12.5px] font-bold text-[#163146] flex items-center gap-2 flex-wrap'>
                        {titleText && <span className='truncate'>{titleText}</span>}
                        {titleText && company && (
                          <span className='text-[rgba(22,49,70,0.25)]'>|</span>
                        )}
                        {company && <span className='text-[#986a41] truncate'>{company}</span>}
                      </div>
                    )}
                    {locationText && (
                      <div className='mt-1 flex items-center gap-1.5 text-[12px] text-[rgba(22,49,70,0.6)] font-medium'>
                        <MapPin size={12} strokeWidth={1.7} />
                        <span className='truncate'>{locationText}</span>
                      </div>
                    )}
                  </div>
                  <div className='shrink-0 flex flex-col items-end gap-1 text-right'>
                    <div className='flex items-center gap-1.5 text-[12px] font-bold text-[#986a41]'>
                      <Users size={12} strokeWidth={2} />
                      {connectionsCount} connection{connectionsCount === 1 ? '' : 's'}
                    </div>
                    {hasRating ? (
                      <div className='flex items-center gap-1.5 text-[#163146] font-medium text-[12.5px]'>
                        <Star size={12} className='fill-amber-400 text-amber-400' />
                        <span className='font-bold'>{profile.rating}</span>
                        <span className='text-[rgba(22,49,70,0.5)] font-normal'>({profile.reviewCount})</span>
                      </div>
                    ) : (
                      profile.matchPercentage > 0 && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                          profile.matchPercentage >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          profile.matchPercentage >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          <TrendingUp size={11} />
                          <span className='text-[10.5px] font-bold'>{profile.matchPercentage >= 90 ? 'Best Match' : `${profile.matchPercentage}%`}</span>
                        </div>
                      )
                    )}
                    <motion.button
                      whileHover={{ x: 2 }}
                      onClick={() => navigate(`/profile/public/${targetUserId}`)}
                      className='text-[#163146] text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-1.5 hover:underline'
                    >
                      View Full Profile
                      <ExternalLink size={10} />
                    </motion.button>
                  </div>
                </div>

                {/* Section cards — fixed-size cards, internal scroll if entries overflow */}
                <div className='px-4 md:px-5 mt-3 pb-3 flex-1 min-h-0 flex flex-col gap-3'>
                  {/* About Me — fixed height; body scrolls internally if bio is long */}
                  <Card
                    title='About Me'
                    className='shrink-0 h-[100px]'
                    titleClassName={COMPACT_TITLE}
                    headerPaddingClassName={COMPACT_HEADER_PADDING}
                  >
                    <div className='px-[16px] pb-[12px] pt-0.5 flex-1 min-h-0 overflow-y-auto no-scrollbar'>
                      {aboutText ? (
                        <p className='m-0 text-[11.5px] leading-[1.5] text-[#163146] font-normal'>
                          {aboutText}
                        </p>
                      ) : (
                        <p className='m-0 text-[11px] text-[rgba(22,49,70,0.5)] font-medium'>
                          {`No bio available for ${profile.name}.`}
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* Experience (left, spans both rows) | Education + Licenses (right, stacked).
                      Fixed grid height: rows are 1fr 1fr, so Experience = Education + Licenses + gap. */}
                  <div
                    className='grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0'
                    style={{ gridTemplateRows: 'minmax(0,1fr) minmax(0,1fr)' }}
                  >
                    <Card
                      title='Experience'
                      count={experienceList.length || undefined}
                      className='md:row-span-2 min-h-0'
                      titleClassName={COMPACT_TITLE}
                      headerPaddingClassName={COMPACT_HEADER_PADDING}
                    >
                      {loadingFull && experienceList.length === 0 ? (
                        <SectionSkeleton />
                      ) : experienceList.length === 0 ? (
                        <CenteredEmpty message='No experience listed yet.' />
                      ) : (
                        <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar px-[16px] pb-[10px]'>
                          {experienceList.map((e, i) => (
                            <CompactExperienceEntry key={i} e={e} isLast={i === experienceList.length - 1} />
                          ))}
                        </div>
                      )}
                    </Card>
                    <Card
                      title='Education'
                      count={educationList.length || undefined}
                      className='min-h-0'
                      titleClassName={COMPACT_TITLE}
                      headerPaddingClassName={COMPACT_HEADER_PADDING}
                    >
                      {loadingFull && educationList.length === 0 ? (
                        <SectionSkeleton />
                      ) : educationList.length === 0 ? (
                        <CenteredEmpty message='No education listed yet.' />
                      ) : (
                        <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar px-[16px] pb-[10px]'>
                          {educationList.map((e, i) => (
                            <CompactEducationEntry key={i} e={e} isLast={i === educationList.length - 1} />
                          ))}
                        </div>
                      )}
                    </Card>
                    {isAthleteTarget ? (
                      <Card
                        title='Focus Areas'
                        count={focusAreasList.length || undefined}
                        className='min-h-0'
                        titleClassName={COMPACT_TITLE}
                        headerPaddingClassName={COMPACT_HEADER_PADDING}
                      >
                        {loadingFull && focusAreasList.length === 0 ? (
                          <SectionSkeleton />
                        ) : focusAreasList.length === 0 ? (
                          <CenteredEmpty message='No focus areas listed yet.' />
                        ) : (
                          <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar px-[16px] pb-[10px]'>
                            {focusAreasList.map((f, i) => (
                              <CompactFocusAreaEntry key={i} f={f} isLast={i === focusAreasList.length - 1} />
                            ))}
                          </div>
                        )}
                      </Card>
                    ) : (
                      <Card
                        title='Licenses & Certifications'
                        count={certificationsList.length || undefined}
                        className='min-h-0'
                        titleClassName={COMPACT_TITLE}
                        headerPaddingClassName={COMPACT_HEADER_PADDING}
                      >
                        {loadingFull && certificationsList.length === 0 ? (
                          <SectionSkeleton />
                        ) : certificationsList.length === 0 ? (
                          <CenteredEmpty message='No certifications listed yet.' />
                        ) : (
                          <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar px-[16px] pb-[10px]'>
                            {certificationsList.map((c, i) => (
                              <CompactCertEntry key={i} c={c} isLast={i === certificationsList.length - 1} />
                            ))}
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar — sits flush below the cards, no absolute positioning */}
              <div className='bg-[#faf7f2] px-4 md:px-5 pt-1 pb-3 md:pb-4 shrink-0 rounded-b-[32px]'>
                <div className='flex gap-2 md:gap-3'>
                  {canMessage && profile.connectionStatus === 'connected' && (
                      <motion.button
                        className='flex-1 py-2.5 md:py-3 px-2 md:px-4 border-2 border-[#163146] text-[#163146] font-bold text-xs md:text-sm rounded-xl hover:bg-[#163146] hover:text-white transition-all flex items-center justify-center gap-1.5 md:gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowReviewModal(true)}
                      >
                         <Star size={16} />
                         Review
                      </motion.button>
                  )}
                  {canMessage && (
                    <motion.button
                        className='flex-1 py-2.5 md:py-3 px-2 md:px-4 bg-transparent border-2 border-[rgba(22,49,70,0.18)] text-[#163146] font-bold text-xs md:text-sm rounded-xl hover:bg-[rgba(22,49,70,0.05)] hover:border-[rgba(22,49,70,0.3)] transition-all flex items-center justify-center gap-1.5 md:gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onMessage(profile)}
                    >
                        <MessageSquare size={15} />
                        Message
                    </motion.button>
                  )}
                  {canConnect && (
                    <motion.button
                        className='flex-1 py-2.5 md:py-3 px-2 md:px-4 bg-[#163146] text-white font-bold text-xs md:text-sm rounded-xl hover:bg-[#0f2332] shadow-lg shadow-[#163146]/20 transition-all flex items-center justify-center gap-1.5 md:gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onConnect(profile)}
                    >
                        <UserPlus size={16} />
                        Connect
                    </motion.button>
                  )}
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        profileName={profile.name}
        userType={profile.type}
      />
    </>
  )
}

export default ProfilePopup
