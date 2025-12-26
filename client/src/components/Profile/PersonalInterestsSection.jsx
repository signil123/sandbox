// Redesigned Personal Interests Section
import { motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  Camera,
  Check,
  Code,
  Dumbbell,
  Edit3,
  Gamepad2,
  Globe,
  Music,
  Palette,
  Utensils,
} from 'lucide-react'

const interestIcons = {
  fitness: Dumbbell,
  technology: Code,
  music: Music,
  gaming: Gamepad2,
  fashion: Palette,
  cooking: Utensils,
  travel: Globe,
  photography: Camera,
  reading: BookOpen,
  art: Palette,
}

const interestColors = {
  fitness: {
    bg: 'from-red-50 to-rose-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    light: 'bg-red-100',
  },
  technology: {
    bg: 'from-blue-50 to-cyan-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    light: 'bg-blue-100',
  },
  music: {
    bg: 'from-purple-50 to-pink-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    light: 'bg-purple-100',
  },
  gaming: {
    bg: 'from-orange-50 to-amber-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    light: 'bg-orange-100',
  },
  fashion: {
    bg: 'from-pink-50 to-rose-50',
    icon: 'text-pink-600',
    border: 'border-pink-200',
    light: 'bg-pink-100',
  },
  cooking: {
    bg: 'from-amber-50 to-yellow-50',
    icon: 'text-amber-600',
    border: 'border-amber-200',
    light: 'bg-amber-100',
  },
  travel: {
    bg: 'from-teal-50 to-cyan-50',
    icon: 'text-teal-600',
    border: 'border-teal-200',
    light: 'bg-teal-100',
  },
  photography: {
    bg: 'from-indigo-50 to-blue-50',
    icon: 'text-indigo-600',
    border: 'border-indigo-200',
    light: 'bg-indigo-100',
  },
  reading: {
    bg: 'from-emerald-50 to-green-50',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
    light: 'bg-emerald-100',
  },
  art: {
    bg: 'from-violet-50 to-purple-50',
    icon: 'text-violet-600',
    border: 'border-violet-200',
    light: 'bg-violet-100',
  },
}

export const PersonalInterestsSection = ({
  interests,
  allInterestOptions,
  onEdit,
}) => {
  const selectedCount = Object.values(interests).filter(Boolean).length

  return (
    <motion.div className='mb-6 bg-white rounded-2xl border border-slate-200 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-5'>
        <div>
          <h2 className='text-base font-bold text-slate-900'>
            Personal Interests
          </h2>
          <p className='text-xs text-slate-500 mt-1'>
            {selectedCount} selected • Help brands find the perfect fit
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onEdit}
          className='p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
        >
          <Edit3 size={16} className='text-slate-600' />
        </motion.button>
      </div>

      {/* Interest Grid - Enhanced Version */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
        {allInterestOptions.map((option) => {
          const IconComponent = interestIcons[option.key]
          const isSelected = interests[option.key]
          const colors = interestColors[option.key]

          return (
            <motion.button
              key={option.key}
              whileHover={{ y: -4, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
              whileTap={{ y: -2 }}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 overflow-hidden group cursor-pointer
                ${
                  isSelected
                    ? `border-slate-900 bg-gradient-to-br ${colors.bg}`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              {/* Background gradient for selected */}
              {isSelected && (
                <motion.div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${colors.bg}`}
                />
              )}

              {/* Content */}
              <div className='relative z-10 flex flex-col items-center text-center'>
                {/* Icon Container */}
                <motion.div
                  className={`p-2.5 rounded-lg mb-2 transition-colors ${
                    isSelected ? colors.light : 'bg-slate-100'
                  }`}
                >
                  <IconComponent
                    size={18}
                    className={`${isSelected ? colors.icon : 'text-slate-400'}`}
                  />
                </motion.div>

                {/* Label */}
                <p
                  className={`text-xs font-semibold transition-colors ${
                    isSelected ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {option.label}
                </p>

                {/* Check Badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className='absolute top-1 right-1 bg-slate-900 text-white rounded-full p-0.5'
                  >
                    <Check size={12} />
                  </motion.div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Helpful tip */}
      {selectedCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'
        >
          <p className='text-xs text-blue-700'>
            💡 Select your interests to help brands find collaboration
            opportunities that match your passions
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

// Alternative Modern Minimalist Design
export const PersonalInterestsMinimal = ({
  interests,
  allInterestOptions,
  onEdit,
}) => {
  const selectedCount = Object.values(interests).filter(Boolean).length

  return (
    <motion.div className='mb-6 bg-white rounded-2xl border border-slate-200 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex-1'>
          <h2 className='text-base font-bold text-slate-900'>
            Personal Interests
          </h2>
          <p className='text-xs text-slate-500 mt-1'>
            {selectedCount} of {allInterestOptions.length} selected
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onEdit}
          className='p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
        >
          <Edit3 size={16} className='text-slate-600' />
        </motion.button>
      </div>

      {/* Selected Interests (Pills) */}
      {selectedCount > 0 && (
        <div className='mb-5'>
          <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
            Selected
          </p>
          <div className='flex flex-wrap gap-2'>
            {allInterestOptions
              .filter((option) => interests[option.key])
              .map((option) => {
                const IconComponent = interestIcons[option.key]
                const colors = interestColors[option.key]

                return (
                  <motion.div
                    key={option.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 bg-gradient-to-r ${colors.bg} ${colors.border}`}
                  >
                    <IconComponent size={14} className={colors.icon} />
                    <span className='text-xs font-semibold text-slate-900'>
                      {option.label}
                    </span>
                  </motion.div>
                )
              })}
          </div>
        </div>
      )}

      {/* All Available Interests */}
      <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>
        {selectedCount > 0 ? 'Explore more' : 'Available interests'}
      </p>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
        {allInterestOptions
          .filter((option) => !interests[option.key])
          .map((option) => {
            const IconComponent = interestIcons[option.key]

            return (
              <motion.button
                key={option.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center gap-1.5 text-center'
              >
                <IconComponent size={16} className='text-slate-400' />
                <span className='text-xs font-medium text-slate-600'>
                  {option.label}
                </span>
              </motion.button>
            )
          })}
      </div>
    </motion.div>
  )
}

// Compact Card Design
export const PersonalInterestsCompact = ({
  interests,
  allInterestOptions,
  onEdit,
}) => {
  const selectedInterests = allInterestOptions.filter(
    (opt) => interests[opt.key]
  )
  const unselectedCount = allInterestOptions.length - selectedInterests.length

  return (
    <motion.div className='mb-6 bg-white rounded-2xl border border-slate-200 p-5'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 className='text-sm font-bold text-slate-900'>
            Personal Interests
          </h2>
          <p className='text-xs text-slate-500 mt-0.5'>
            {selectedInterests.length} selected
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onEdit}
          className='p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
        >
          <Edit3 size={14} className='text-slate-600' />
        </motion.button>
      </div>

      {/* Selected Badges */}
      <div className='flex flex-wrap gap-1.5'>
        {selectedInterests.map((option) => {
          const IconComponent = interestIcons[option.key]
          const colors = interestColors[option.key]

          return (
            <motion.div
              key={option.key}
              layoutId={`interest-${option.key}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-900 bg-gradient-to-r ${colors.bg}`}
            >
              <IconComponent size={12} className={colors.icon} />
              {option.label}
            </motion.div>
          )
        })}

        {/* Add more button */}
        {unselectedCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors'
          >
            + Add {unselectedCount > 1 ? `${unselectedCount} more` : 'more'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
