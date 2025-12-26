// File: client/src/pages/Home/HomePage.jsx
import { motion } from 'framer-motion'
import React from 'react'

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  }

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-20, 20, -20],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <div className='min-h-screen w-full bg-white overflow-hidden relative'>
      {/* Decorative background elements */}
      <motion.div
        className='absolute top-20 right-10 w-72 h-72 rounded-full opacity-5'
        style={{ backgroundColor: '#9c6e3d' }}
        variants={floatingVariants}
        initial='initial'
        animate='animate'
      />
      <motion.div
        className='absolute bottom-32 left-10 w-96 h-96 rounded-full opacity-5'
        style={{ backgroundColor: '#9c6e3d' }}
        variants={floatingVariants}
        initial='initial'
        animate='animate'
        transition={{ duration: 8, delay: 1 }}
      />

      {/* Main content */}
      <div className='relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8'>
        <motion.div
          className='w-full max-w-2xl mx-auto text-center'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Logo/Brand name */}
          <motion.div variants={itemVariants} className='mb-8'>
            <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight'>
              Signil
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={itemVariants}
            className='text-lg sm:text-xl text-gray-600 mb-8 font-light leading-relaxed'
          >
            Something extraordinary is coming.
          </motion.p>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className='text-sm sm:text-base text-gray-500'
          >
            We're launching today.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
