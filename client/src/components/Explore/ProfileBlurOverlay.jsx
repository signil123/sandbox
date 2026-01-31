// File: client/src/components/Explore/ProfileBlurOverlay.jsx
import { motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'
import React from 'react'

const ProfileBlurOverlay = ({ onClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white/40 backdrop-blur-md cursor-pointer group"
      onClick={onClick}
    >
      <div className="w-16 h-16 bg-[#163146] rounded-full flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300 border-4 border-white/50">
        <Lock className="text-white" size={24} />
      </div>
      
      <div className="text-center max-w-[240px]">
        <h3 className="text-xl font-bold text-[#163146] mb-2 leading-tight">
          Discover 99+ other athletes needing your help
        </h3>
        <p className="text-sm font-medium text-[#986a41] flex items-center justify-center gap-1.5 opacity-90">
          <Sparkles size={14} />
          Upgrade to unlock full profiles
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-8 px-6 py-2.5 bg-[#163146] text-white rounded-full text-sm font-bold shadow-lg shadow-[#163146]/20 transition-all hover:bg-[#1f4461]"
      >
        View Upgrade Options
      </motion.button>
    </motion.div>
  )
}

export default ProfileBlurOverlay
