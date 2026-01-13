import { AnimatePresence, motion } from 'framer-motion'
import {
    Award,
    Briefcase,
    CheckCircle,
    ExternalLink,
    MapPin,
    MessageSquare,
    Shield,
    Star,
    TrendingUp,
    UserPlus,
    X
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PRIMARY_COLOR = '#163146'
const ACCENT_COLOR = '#986a41'

// --- Components ---

const Badge = ({ children, className = '' }) => (
  <span
    className={`px-3 py-1 text-xs font-medium rounded-full ${className}`}
  >
    {children}
  </span>
)

const StatCard = ({ label, value, icon: Icon, subValue }) => (
  <div className='flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors'>
    {Icon && <Icon size={14} className='text-gray-400 mb-1' />}
    <span className='text-sm font-bold text-gray-900 text-center leading-tight'>{value}</span>
    <span className='text-[9px] uppercase tracking-wider text-gray-500 font-medium mt-0.5 text-center'>
      {label}
    </span>
     {subValue && <span className='text-[9px] text-gray-400 text-center leading-none'>{subValue}</span>}
  </div>
)



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
  onMessage
}) => {
  const navigate = useNavigate()
  const [showReviewModal, setShowReviewModal] = useState(false)

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

  if (!profile) return null

  const hasRating = profile.reviewCount > 0
  const canConnect = onConnect && (currentUserType === 'athlete' || profile.verified)
  const canMessage = onMessage && (currentUserType === 'athlete' || profile.verified)

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
              className='fixed inset-0 h-screen w-screen bg-black/30 backdrop-blur-sm z-50'
            />

            <motion.div
              initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              className='fixed left-0 md:left-1/2 bottom-0 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[600px] max-w-full md:max-w-[95vw] bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl z-50 overflow-hidden flex flex-col h-[85vh] md:max-h-[85vh]'
            >
              <button
                  onClick={onClose}
                  className='absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full text-gray-800 shadow-md transition-all transform hover:scale-105 border border-gray-100'
              >
                  <X size={20} />
              </button>

              {/* --- Scrollable Content --- */}
              <div className='overflow-y-auto custom-scrollbar flex-1 relative bg-white'>

                {/* Banner */}
                <div className='relative h-40 w-full'>
                  <div 
                    className='absolute inset-0 bg-cover bg-center'
                    style={typeof profile.banner === 'object' ? profile.banner : { background: profile.banner || `linear-gradient(135deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR})` }}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                </div>

                {/* Header Profile Info */}
                <div className='px-6 md:px-8 pb-6 -mt-16 relative flex flex-col'>
                  {/* Image Centered */}
                  <div className='flex justify-center mb-4'>
                    <div className='relative'>
                            <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            src={profile.profileImg}
                            alt={profile.name}
                            className='w-32 h-32 rounded-full object-cover border-[6px] border-white shadow-xl bg-white'
                            />
                    </div>
                  </div>

                  {/* Text Details Left Aligned */}
                  <div className='text-left w-full'>
                    <div className='flex items-center justify-between'>
                      <h2 
                        className='text-2xl md:text-3xl font-bold text-gray-900 leading-tight hover:text-[#163146] cursor-pointer transition-colors flex items-center gap-2'
                        onClick={() => navigate(`/profile/public/${profile.userId || profile.id || profile._id}`)}
                      >
                          {profile.name}
                          <ExternalLink size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h2>
                      {profile.matchPercentage > 0 && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
                          profile.matchPercentage >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          profile.matchPercentage >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          <TrendingUp size={14} className={
                            profile.matchPercentage >= 80 ? 'text-emerald-500' :
                            profile.matchPercentage >= 50 ? 'text-amber-500' :
                            'text-slate-400'
                          } />
                          <span className='text-xs font-bold'>{profile.matchPercentage >= 90 ? 'Best Match' : `${profile.matchPercentage}% Match`}</span>
                        </div>
                      )}
                    </div>
                    <p className='text-sm md:text-base text-gray-500 font-medium mt-1 mb-1'>
                        {profile.title}
                    </p>
                    <div className='flex items-center gap-4 text-gray-500 text-sm mt-2'>
                        <div className='flex items-center gap-1.5'>
                            <MapPin size={14} />
                            {profile.location}
                        </div>
                        {hasRating && (
                            <div className='flex items-center gap-1.5 text-gray-700 font-medium'>
                                <Star size={14} className='fill-amber-400 text-amber-400' />
                                <span>{profile.rating}</span>
                                <span className='text-gray-400 font-normal'>({profile.reviewCount})</span>
                            </div>
                        )}
                    </div>
                    
                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={() => navigate(`/profile/public/${profile.userId || profile.id || profile._id}`)}
                      className='text-[#163146] text-xs font-bold uppercase tracking-widest mt-4 flex items-center gap-1.5 hover:underline'
                    >
                      View Full Profile
                      <ExternalLink size={12} />
                    </motion.button>
                  </div>

                  {/* Stats Grid */}
                  <div className='grid grid-cols-3 gap-2 mt-8'>
                    <StatCard 
                        label="Experience" 
                        value={`${profile.experience}y`} 
                        icon={Briefcase}
                    />
                    <StatCard 
                        label="Specialty" 
                        value={profile.specialty || 'General'} 
                        icon={Award}
                    />
                    <StatCard 
                        label="Network" 
                        value={profile.connections} 
                        icon={UserPlus}
                        subValue="connections"
                    />
                  </div>

                  {/* About Section */}
                  <div className='mt-8 space-y-6'>
                    
                    <section>
                         <h4 className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2'>
                            <div className='w-full h-[1px] bg-gray-100 flex-1 order-last ml-2'></div>
                            About
                         </h4>
                         <p className='text-gray-600 text-sm leading-relaxed'>
                            {profile.about || `No bio available for ${profile.name}.`}
                         </p>
                    </section>

                    {profile.certifications?.length > 0 && (
                        <section>
                             <h4 className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2'>
                                <div className='w-full h-[1px] bg-gray-100 flex-1 order-last ml-2'></div>
                                Certifications
                             </h4>
                            <div className='flex flex-wrap gap-2'>
                                {profile.certifications.map((cert, idx) => (
                                    <div key={idx} className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#163146] text-xs font-semibold rounded-lg border border-blue-100'>
                                        <Shield size={12} />
                                        {cert}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {profile.expertise?.length > 0 && (
                        <section>
                            <h4 className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2'>
                                <div className='w-full h-[1px] bg-gray-100 flex-1 order-last ml-2'></div>
                                Expertise
                             </h4>
                            <div className='flex flex-wrap gap-2'>
                                {profile.expertise.map((exp, idx) => (
                                    <span key={idx} className='px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100'>
                                        {exp}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                  </div>
                </div>
                
                {/* Spacer for bottom bar */}
                <div className='h-20'></div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className='border-t border-gray-100 bg-white/90 backdrop-blur-md p-3 md:p-4 absolute bottom-0 left-0 right-0 z-20'>
                <div className='flex gap-2 md:gap-3'>
                  {canMessage && (
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
                        className='flex-1 py-2.5 md:py-3 px-2 md:px-4 border-2 border-transparent bg-gray-100 text-gray-900 font-bold text-xs md:text-sm rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5 md:gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onMessage(profile)}
                    >
                        <MessageSquare size={16} />
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
                        <UserPlus size={18} />
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