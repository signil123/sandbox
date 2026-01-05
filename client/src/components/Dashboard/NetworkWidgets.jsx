// File: client/src/components/Dashboard/NetworkWidgets.jsx
import { motion } from 'framer-motion'
import { MapPin, MessageSquare, Star, Users } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8800'
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

const Avatar = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
  }

  const imageUrl = getImageUrl(user.profileImage || user.profileImg)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#163146] to-[#0f1f27] flex items-center justify-center text-white font-bold border-2 border-white shadow-sm`}
    >
      {getInitials(user.name)}
    </div>
  )
}

/**
 * Advisor Roster Widget
 */
export const AdvisorRoster = ({ athletes = [], loading = false }) => {
  const navigate = useNavigate()

  return (
    <div className='bg-transparent h-full flex flex-col'>
      <div className='flex items-center justify-between mb-8 px-2'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-[#163146] rounded-xl shadow-lg shadow-[#163146]/20'>
            <Users className='text-white' size={20} />
          </div>
          <div>
            <h3 className='font-bold text-gray-900 text-xl'>Athlete Roster</h3>
            <p className='text-[10px] text-gray-400 font-bold uppercase tracking-widest'>Your Network</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
           <span className='bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-extrabold border border-gray-200'>
            {athletes.length} Connected
          </span>
        </div>
      </div>

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className='h-48 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm' />
           ))}
        </div>
      ) : athletes.length === 0 ? (
        <div className='bg-white rounded-3xl py-16 px-6 text-center border border-gray-100 shadow-sm'>
          <div className='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 mx-auto transition-transform hover:rotate-12 duration-300'>
            <Users className='text-gray-300' size={32} />
          </div>
          <h4 className='font-bold text-gray-900 mb-2'>No Athletes Yet</h4>
          <p className='text-sm text-gray-500 max-w-[240px] mx-auto font-medium leading-relaxed'>
            Start building your roster by connecting with talented athletes.
          </p>
          <button 
            onClick={() => navigate('/explore')}
            className='mt-8 px-8 py-3 bg-[#163146] text-white rounded-2xl text-xs font-bold hover:bg-[#0f2a36] transition-all shadow-xl shadow-[#163146]/20 active:scale-95'
          >
            Explore Talent
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center'>
          {athletes.map((athlete) => (
            <motion.div
              key={athlete.userId}
              whileHover={{ y: -8 }}
              className='group bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-[#163146]/10 hover:shadow-2xl hover:shadow-gray-200/50 transition-all cursor-pointer flex flex-col items-center relative overflow-hidden mx-auto w-full max-w-sm'
              onClick={() => navigate(`/profile/public/${athlete.userId}`)}
            >
              {/* Card Background Accent */}
              <div className='absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gray-50/50 to-transparent' />
              
              <div className='relative z-10 flex flex-col items-center w-full'>
                <div className='mb-4 relative'>
                  <Avatar user={athlete} size='xl' />
                  <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm' />
                </div>
                
                <div className='text-center mb-6 w-full'>
                  <p className='font-black text-gray-900 text-lg group-hover:text-[#163146] transition-colors leading-tight mb-1 truncate'>
                    {athlete.name}
                  </p>
                  <p className='text-[11px] text-[#163146] font-extrabold uppercase tracking-tighter bg-[#163146]/5 px-3 py-1 rounded-full inline-block'>
                    {athlete.sport || 'Athlete'}
                  </p>
                </div>

                <div className='w-full grid grid-cols-2 gap-2 mb-6'>
                   <div className='bg-gray-50 rounded-2xl p-2 text-center'>
                      <p className='text-[9px] text-gray-400 font-bold uppercase'>Position</p>
                      <p className='text-[10px] text-gray-900 font-black truncate'>{athlete.position || 'N/A'}</p>
                   </div>
                   <div className='bg-gray-50 rounded-2xl p-2 text-center'>
                      <p className='text-[9px] text-gray-400 font-bold uppercase'>Class</p>
                      <p className='text-[10px] text-gray-900 font-black truncate'>{athlete.classYear || 'N/A'}</p>
                   </div>
                </div>

                <div className='flex gap-2 w-full'>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/inbox', { state: { recipientId: athlete.userId }})
                    }}
                    className='flex-1 h-11 flex items-center justify-center gap-2 bg-[#163146] text-white rounded-2xl text-[11px] font-bold hover:bg-[#0f2a36] transition-all shadow-lg shadow-[#163146]/20 active:scale-95'
                  >
                    <MessageSquare size={14} /> 
                    Chat
                  </button>
                </div>
              </div>

              {/* Decorative side element */}
              <div className='absolute -right-4 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-gray-100 rounded-full group-hover:bg-[#163146]/10 transition-colors' />
            </motion.div>
          ))}

          {/* Connect More Card */}
          <motion.div
            whileHover={{ y: -8 }}
            className='group bg-dashed border-2 border-dashed border-gray-200 rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#163146]/20 hover:bg-gray-50/30 transition-all h-full min-h-[280px] mx-auto w-full max-w-sm'
            onClick={() => navigate('/explore')}
          >
            <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500'>
               <Users className='text-gray-400 group-hover:text-[#163146]' size={24} />
            </div>
            <h4 className='font-extrabold text-gray-900 mb-1 group-hover:text-[#163146] transition-all'>Expand Network</h4>
            <p className='text-[11px] font-medium text-gray-500 mb-6'>Connect with more athletes</p>
            <div className='w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-[#163146] group-hover:text-white transition-all'>
               <Users size={18} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/**
 * Current Advisors Widget (for Athletes)
 */
export const CurrentAdvisors = ({ advisors = [], loading = false }) => {
  const navigate = useNavigate()

  return (
    <div className='bg-transparent h-full flex flex-col'>
      <div className='flex items-center justify-between mb-8 px-2'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20'>
            <Users className='text-white' size={20} />
          </div>
          <div>
            <h3 className='font-bold text-gray-900 text-xl'>My Advisors</h3>
            <p className='text-[10px] text-gray-400 font-bold uppercase tracking-widest'>Your Trusted Experts</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
           <span className='bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-extrabold border border-emerald-100'>
            {advisors.length} Active Advisors
          </span>
        </div>
      </div>

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className='h-48 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm' />
           ))}
        </div>
      ) : advisors.length === 0 ? (
        <div className='bg-white rounded-3xl py-16 px-6 text-center border border-gray-100 shadow-sm'>
          <div className='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 mx-auto transition-transform hover:rotate-12 duration-300'>
            <Users className='text-gray-300' size={32} />
          </div>
          <h4 className='font-bold text-gray-900 mb-2'>No Advisors Yet</h4>
          <p className='text-sm text-gray-500 max-w-[240px] mx-auto font-medium leading-relaxed'>
            Connect with professional advisors to maximize your NIL potential.
          </p>
          <button 
            onClick={() => navigate('/explore')}
            className='mt-8 px-8 py-3 bg-[#163146] text-white rounded-2xl text-xs font-bold hover:bg-[#0f2a36] transition-all shadow-xl shadow-[#163146]/20'
          >
            Find Advisors
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center'>
          {advisors.map((advisor) => (
            <motion.div
              key={advisor.userId}
              whileHover={{ y: -8 }}
              className='group bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-[#163146]/10 hover:shadow-2xl hover:shadow-gray-200/50 transition-all cursor-pointer flex flex-col items-center relative overflow-hidden mx-auto w-full max-w-sm'
              onClick={() => navigate(`/profile/public/${advisor.userId}`)}
            >
              {/* Card Background Accent */}
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50/50 to-transparent -mr-12 -mt-12 rounded-full transition-transform group-hover:scale-110 duration-700' />
              
              <div className='relative z-10 flex flex-col items-center w-full'>
                <div className='mb-4 relative'>
                  <Avatar user={advisor} size='xl' />
                  {!!advisor.rating && advisor.rating > 0 && (
                    <div className='absolute -top-1 -right-4 bg-amber-400 text-white px-2 py-0.5 rounded-full text-[9px] font-black border-2 border-white flex items-center gap-0.5 shadow-sm'>
                      <Star size={8} fill='currentColor' />
                      {advisor.rating}
                    </div>
                  )}
                </div>
                
                <div className='text-center mb-6 w-full'>
                  <p className='font-black text-gray-900 text-lg group-hover:text-[#163146] transition-colors leading-tight mb-1 truncate'>
                    {advisor.name}
                  </p>
                  <div className='flex items-center justify-center gap-1 mb-2'>
                    <MapPin size={10} className='text-gray-400' />
                    <span className='text-[10px] text-gray-500 font-bold'>{advisor.location || 'Remote'}</span>
                  </div>
                  <p className='text-[11px] text-[#163146] font-extrabold uppercase tracking-tighter bg-[#163146]/5 px-3 py-1 rounded-full inline-block'>
                    {advisor.title || (advisor.userType === 'advisor' ? 'NIL Advisor' : 'NIL Agent')}
                  </p>
                </div>

                <div className='flex gap-2 w-full'>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/inbox', { state: { recipientId: advisor.userId }})
                    }}
                    className='flex-1 h-11 flex items-center justify-center gap-2 bg-[#163146] text-white rounded-2xl text-[11px] font-bold hover:bg-[#0f2a36] transition-all shadow-lg shadow-[#163146]/20 active:scale-95'
                  >
                    <MessageSquare size={14} /> 
                    Message
                  </button>
                  <button 
                    className='w-11 h-11 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-100 active:scale-95'
                    onClick={(e) => {
                       e.stopPropagation();
                       navigate(`/profile/public/${advisor.userId}`);
                    }}
                  >
                    <Users size={16} />
                  </button>
                </div>
              </div>

              {/* Decorative bottom bar */}
              <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-100 rounded-t-full group-hover:bg-[#163146]/10 transition-colors' />
            </motion.div>
          ))}

          {/* Connect More Card */}
          <motion.div
            whileHover={{ y: -8 }}
            className='group bg-dashed border-2 border-dashed border-gray-200 rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#163146]/20 hover:bg-gray-50/30 transition-all h-full min-h-[280px] mx-auto w-full max-w-sm'
            onClick={() => navigate('/explore')}
          >
            <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500'>
               <Users className='text-gray-400 group-hover:text-[#163146]' size={24} />
            </div>
            <h4 className='font-extrabold text-gray-900 mb-1 group-hover:text-[#163146] transition-all'>Find More</h4>
            <p className='text-[11px] font-medium text-gray-500 mb-6'>Grow your expert network</p>
            <div className='w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-[#163146] group-hover:text-white transition-all'>
               <Users size={18} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
