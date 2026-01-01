// File: client/src/components/Dashboard/NetworkWidgets.jsx
import { motion } from 'framer-motion'
import { MapPin, MessageSquare, Star, Users } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const getInitials = (name) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

const Avatar = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  }

  if (user.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-gray-100`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#163146] to-[#0f1f27] flex items-center justify-center text-white font-bold border border-gray-100`}
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
    <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-2'>
          <Users className='text-[#163146]' size={20} />
          <h3 className='font-bold text-gray-900'>Athlete Roster</h3>
        </div>
        <span className='bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold'>
          {athletes.length} Connected
        </span>
      </div>

      {loading ? (
        <div className='space-y-4'>
           {[1, 2, 3].map((i) => (
             <div key={i} className='h-16 bg-gray-50 rounded-xl animate-pulse' />
           ))}
        </div>
      ) : athletes.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-10 text-center'>
          <div className='w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3'>
            <Users className='text-gray-400' size={20} />
          </div>
          <p className='text-sm text-gray-500 max-w-[200px]'>
            No athletes in your roster yet. Start connecting!
          </p>
        </div>
      ) : (
        <div className='space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar'>
          {athletes.map((athlete) => (
            <motion.div
              key={athlete.userId}
              whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
              className='flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-gray-200 transition-all cursor-pointer'
              onClick={() => navigate(`/profile/${athlete.userId}`)}
            >
              <div className='flex items-center gap-3'>
                <Avatar user={athlete} />
                <div className='min-w-0'>
                  <p className='font-bold text-gray-900 text-sm truncate'>
                    {athlete.name}
                  </p>
                  <p className='text-[10px] text-gray-500 truncate'>
                    {athlete.sport} • {athlete.position}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/inbox', { state: { recipientId: athlete.userId }})
                }}
                className='p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#163146] border border-transparent hover:border-gray-200 transition-all shadow-sm'
              >
                <MessageSquare size={16} />
              </button>
            </motion.div>
          ))}
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
    <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-2'>
          <Users className='text-[#163146]' size={20} />
          <h3 className='font-bold text-gray-900'>My Advisors</h3>
        </div>
        <span className='bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold'>
          {advisors.length} Active
        </span>
      </div>

      {loading ? (
        <div className='space-y-4'>
           {[1, 2, 3].map((i) => (
             <div key={i} className='h-20 bg-gray-50 rounded-xl animate-pulse' />
           ))}
        </div>
      ) : advisors.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-10 text-center'>
          <div className='w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3'>
            <Users className='text-gray-400' size={20} />
          </div>
          <p className='text-sm text-gray-500 max-w-[200px]'>
            You haven't connected with any advisors yet.
          </p>
          <button 
            onClick={() => navigate('/explore')}
            className='mt-4 text-xs font-bold text-[#163146] hover:underline'
          >
            Find Advisors
          </button>
        </div>
      ) : (
        <div className='space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar'>
          {advisors.map((advisor) => (
            <motion.div
              key={advisor.userId}
              whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
              className='p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer'
              onClick={() => navigate(`/profile/${advisor.userId}`)}
            >
              <div className='flex justify-between items-start mb-2'>
                <div className='flex items-center gap-3'>
                  <Avatar user={advisor} size='lg' />
                  <div>
                    <p className='font-bold text-gray-900 text-sm'>
                      {advisor.name}
                    </p>
                    <p className='text-[10px] text-gray-500 flex items-center gap-1'>
                      <MapPin size={10} /> {advisor.location || 'Remote'}
                    </p>
                  </div>
                </div>
                {advisor.rating && (
                  <div className='flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold'>
                    <Star size={10} fill='currentColor' />
                    {advisor.rating}
                  </div>
                )}
              </div>
              <div className='flex items-center justify-between mt-3 pt-3 border-t border-gray-50'>
                <span className='text-[10px] font-medium text-[#163146] bg-[#163146]/5 px-2 py-0.5 rounded'>
                  {advisor.title || advisor.userType}
                </span>
                <button 
                   onClick={(e) => {
                    e.stopPropagation()
                    navigate('/inbox', { state: { recipientId: advisor.userId }})
                  }}
                  className='text-xs font-bold text-[#163146] flex items-center gap-1 hover:underline'
                >
                  <MessageSquare size={12} /> Message
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
