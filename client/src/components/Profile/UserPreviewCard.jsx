import { motion } from 'framer-motion'
import { ExternalLink, TrendingUp, UserPlus } from 'lucide-react'
import React from 'react'

const UserPreviewCard = ({ userData }) => {
  const {
    name,
    title,
    location,
    specialties = [],
    experience = 0,
    specialty = 'Pro',
    connections = 0,
    banner,
    profileImg,
    matchPercentage = 0,
  } = userData

  return (
    <div className='border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col bg-white h-full max-w-sm mx-auto'>
      {/* Banner */}
      <div
        className='h-32 relative'
        style={banner}
      >
        {/* Match Percentage Badge (Simulated) */}
        {matchPercentage > 0 && (
          <motion.div
            className={`absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm overflow-hidden border ${
              matchPercentage >= 80 
                ? 'text-emerald-700 border-emerald-100' 
                : matchPercentage >= 50 
                  ? 'text-amber-700 border-amber-100' 
                  : 'text-slate-700 border-slate-100'
            }`}
          >
            <div className='flex items-center gap-1 relative'>
              <TrendingUp size={12} className={
                matchPercentage >= 80 ? 'text-emerald-500' :
                matchPercentage >= 50 ? 'text-amber-500' :
                'text-slate-400'
              } />
              <span>{matchPercentage >= 90 ? 'Best Match' : `${matchPercentage}% Match`}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Profile Section */}
      <div className='px-4 py-4 flex-1 flex flex-col relative'>
        {/* Profile Image - overlaps banner */}
        <div className='-mt-12 mb-3 flex-shrink-0 w-fit'>
          <img
            src={profileImg}
            alt={name}
            className='w-16 h-16 rounded-full border-2 border-white object-cover shadow-md bg-white'
          />
        </div>

        {/* Location - Top Right */}
        {location && (
          <div className='absolute top-2 right-2 text-right'>
            <p className='text-[11px] font-semibold text-gray-900'>
              {location}
            </p>
          </div>
        )}

        {/* Name and Title */}
        <div className='min-h-[3.5rem]'>
          <p className='font-bold text-gray-900 text-sm line-clamp-1'>
            {name || 'Unknown User'}
          </p>
          <p className='text-xs text-gray-500 mb-2 line-clamp-2'>
            {title || 'User'}
          </p>
        </div>

        {/* Specialty Bubbles */}
        <div className='flex flex-wrap gap-1.5 mb-3 min-h-[2.5rem]'>
          {specialties.slice(0, 2).map((spec, idx) => (
            <span
              key={idx}
              className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium truncate flex items-center justify-center'
            >
              {spec}
            </span>
          ))}
          {specialties.length > 2 && (
            <span className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium flex items-center justify-center'>
              +{specialties.length - 2}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className='grid grid-cols-3 gap-1 mb-4 py-2 bg-gray-50 rounded-lg'>
          <div className='text-center px-1 min-h-[50px] flex flex-col justify-center text-ellipsis overflow-hidden'>
            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate'>
              Experience
            </p>
            <p className='text-xs font-bold text-gray-900 leading-tight'>
              {String(experience).match(/\d/) ? (
                  String(experience).toLowerCase().includes('year') ? experience : `${experience} years`
              ) : 'N/A'}
            </p>
          </div>
          <div className='text-center px-1 border-l border-r border-gray-200 min-h-[50px] flex flex-col justify-center overflow-hidden'>
            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
              {specialty}
            </p>
            <p className='text-xs font-bold text-gray-900 leading-tight'>
              Pro
            </p>
          </div>
          <div className='text-center px-1 min-h-[50px] flex flex-col justify-center'>
            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate'>
              Connections
            </p>
            <p className='text-xs font-bold text-gray-900 leading-tight'>
              {connections}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className='flex gap-2 mt-auto'>
          <button
            className='flex-1 py-2 px-2 border border-gray-200 text-gray-900 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1'
          >
            <ExternalLink size={14} />
            View
          </button>
          <button
            className='flex-1 py-2 px-2 bg-[#163146] text-white rounded-lg font-medium text-xs hover:bg-[#0f2a36] transition-colors flex items-center justify-center gap-1'
          >
            <UserPlus size={14} />
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserPreviewCard
