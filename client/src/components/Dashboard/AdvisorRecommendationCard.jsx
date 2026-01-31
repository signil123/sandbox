import { motion } from 'framer-motion'
import { ExternalLink, Send, TrendingUp, UserPlus, Users } from 'lucide-react'
import React from 'react'

export const AdvisorRecommendationCard = ({ advisor, onConnect, onView, isPrimary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white h-full group'
    >
      {/* Banner */}
      <div
        className='h-32 relative'
        style={advisor.banner}
      >
        {/* Match Percentage Badge */}
        {advisor.matchPercentage > 0 && (
          <motion.div
            className={`absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm overflow-hidden border ${
              advisor.matchPercentage >= 80 
                ? 'text-emerald-700 border-emerald-100' 
                : advisor.matchPercentage >= 50 
                  ? 'text-amber-700 border-amber-100' 
                  : 'text-slate-700 border-slate-100'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60`}
              animate={{ x: advisor.matchPercentage >= 90 ? ['-100%', '100%'] : '0%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <div className='flex items-center gap-1 relative'>
              <TrendingUp size={12} className={
                advisor.matchPercentage >= 80 ? 'text-emerald-500' :
                advisor.matchPercentage >= 50 ? 'text-amber-500' :
                'text-slate-400'
              } />
              <span>{advisor.matchPercentage >= 90 ? 'Best Match' : `${advisor.matchPercentage}% Match`}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Profile Section */}
      <div className='px-4 py-4 flex-1 flex flex-col relative'>
        {/* Profile Image - overlaps banner */}
        <div className='-mt-12 mb-3 flex-shrink-0 w-fit relative z-10'>
          <img
            src={advisor.profileImg}
            alt={advisor.name}
            className='w-16 h-16 rounded-full border-2 border-white object-cover shadow-md'
          />
        </div>

        {/* Location - Top Right */}
        <div className='absolute top-2 right-2 text-right'>
          <p className='text-[11px] font-semibold text-gray-900'>
            {advisor.location}
          </p>
        </div>

        {/* Name and Title */}
        <div className='min-h-[4rem]'>
          <div className='flex items-center gap-2 mb-1'>
            <p className='font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-[#163146] transition-colors'>
              {advisor.name}
            </p>
          </div>
          <p className='text-xs text-gray-500 mb-2 line-clamp-2'>
            {advisor.title}
          </p>
        </div>

        {/* Specialty Bubbles */}
        <div className='flex flex-wrap gap-1.5 mb-3 min-h-[2.5rem]'>
          {advisor.specialties?.slice(0, 2).map((spec, idx) => (
            <span
              key={idx}
              className='text-[10px] px-2.5 py-0.5 bg-slate-50 text-slate-700 rounded-full font-bold border border-slate-200 truncate flex items-center justify-center tracking-wide'
            >
              {spec}
            </span>
          ))}
          {advisor.specialties?.length > 2 && (
            <div className='relative group/tooltip'>
              <span className='text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold border border-slate-200 flex items-center justify-center cursor-help transition-colors hover:bg-slate-200'>
                +{advisor.specialties.length - 2}
              </span>
              
              {/* Tooltip */}
              <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl z-50 text-center leading-relaxed font-medium pointer-events-none'>
                {advisor.specialties.slice(2).join(', ')}
                <div className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800'></div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className='grid grid-cols-3 gap-1 mb-4 py-2 bg-gray-50 rounded-lg'>
          <div className='text-center px-1 min-h-[50px] flex flex-col justify-center text-ellipsis overflow-hidden'>
            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate'>
              Experience
            </p>
            <p className='text-xs font-bold text-gray-900 leading-tight'>
              {advisor.experience}y
            </p>
          </div>
          <div className='text-center px-1 border-l border-r border-gray-200 min-h-[50px] flex flex-col justify-center overflow-hidden'>
            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
              Rating
            </p>
            <p className='text-xs font-bold text-gray-900 leading-tight'>
              {advisor.rating > 0 ? Number(advisor.rating).toFixed(1) : 'N/A'}
            </p>
          </div>
          <div className='text-center px-1 min-h-[50px] flex flex-col justify-center'>
            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate'>
              Connections
            </p>
            <p className='text-xs font-bold text-gray-900 leading-tight'>
              {advisor.connections}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className='flex gap-2 mt-auto'>
          <motion.button
            onClick={() => onView(advisor)}
            className='flex-1 py-2 px-2 border border-gray-200 text-gray-900 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ExternalLink size={14} />
            View
          </motion.button>
          <motion.button
            onClick={() => onConnect(advisor)}
            disabled={advisor.connectionStatus !== 'not_connected'}
            className={`flex-1 py-2 px-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1 ${
              advisor.connectionStatus === 'connected' 
                ? 'bg-emerald-100 text-emerald-700' 
                : advisor.connectionStatus === 'pending' || advisor.connectionStatus === 'received'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-[#163146] text-white hover:bg-[#0f2a36]'
            }`}
            whileHover={advisor.connectionStatus === 'not_connected' ? { scale: 1.02 } : {}}
            whileTap={advisor.connectionStatus === 'not_connected' ? { scale: 0.98 } : {}}
          >
            {advisor.connectionStatus === 'connected' ? (
              <>
                <Users size={14} />
                Connected
              </>
            ) : advisor.connectionStatus === 'pending' ? (
              <>
                <Send size={14} />
                Sent
              </>
            ) : advisor.connectionStatus === 'received' ? (
                <>
                  <UserPlus size={14} />
                  Review
                </>
            ) : (
              <>
                <UserPlus size={14} />
                Connect
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
