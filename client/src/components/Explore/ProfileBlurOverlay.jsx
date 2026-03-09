// File: client/src/components/Explore/ProfileBlurOverlay.jsx
import { motion } from 'framer-motion'
import { ArrowRight, Lock } from 'lucide-react'
import React from 'react'

const ProfileBlurOverlay = ({ onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 cursor-pointer overflow-hidden rounded-2xl"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.48)_0%,rgba(255,255,255,0.84)_58%,rgba(248,250,252,0.96)_100%)] backdrop-blur-md" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center group">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[#163146] shadow-[0_18px_36px_-22px_rgba(22,49,70,0.9)] transition-transform duration-300 group-hover:scale-105">
          <Lock className="text-white" size={18} />
        </div>

        <div className="max-w-[250px]">
          <h3 className="text-[20px] font-black leading-[1.08] tracking-tight text-[#163146]">
            Discover 99+ other athletes needing your help
          </h3>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
            Upgrade to unlock full visibility.
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#163146] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#163146]/20 transition-all hover:bg-[#1f4461]"
        >
          Upgrade
          <ArrowRight size={15} />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ProfileBlurOverlay
