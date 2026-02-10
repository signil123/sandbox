import FeaturesSection from '@/components/Home/FeaturesSection';
import FoundersNote from '@/components/Home/FoundersNote';
import ProblemSolution from '@/components/Home/ProblemSolution';
import ScoutSection from '@/components/Home/ScoutSection';
import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import MagneticButton from '@/components/ui/MagneticButton';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { openAuthModal } from '../../redux/uiSlice';

const words = ["Champions", "Athletes", "Agents", "Advisors", "Institutions"];

const HomePage = () => {
  const [index, setIndex] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#fdfdfd] flex flex-col relative overflow-x-hidden font-sans selection:bg-[#986a41]/20 selection:text-[#163146]">

      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 overflow-hidden pt-32 pb-20 bg-[#fdfdfd]">
        
        {/* Advanced Background System */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main Gradient Mesh */}
          <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[70%] bg-radial from-[#986a41]/10 via-transparent to-transparent opacity-60 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[60%] bg-radial from-[#163146]/5 via-transparent to-transparent opacity-40 blur-[120px]" />
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#163146 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          {/* Noise Overlay for Texture */}
          <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

          {/* Animated Floaties - Decorative */}
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-[10%] w-32 h-32 border border-[#986a41]/10 rounded-3xl rotate-12" 
          />
        </div>

        <div className="relative z-10 max-w-8xl w-full mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-10 group">
              


              {/* Massive Headline */}
              <div className="space-y-2">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black text-[#163146] tracking-tighter leading-[0.95]"
                >
                  Empowering <br />
                  <span className="relative inline-block text-[#986a41]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={words[index]}
                        initial={{ opacity: 0, y: 30, rotateX: 90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, y: -30, rotateX: -90 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-block"
                      >
                        {words[index]}
                      </motion.span>
                    </AnimatePresence>
                    <motion.div 
                      className="absolute -bottom-2 left-0 h-1 bg-[#986a41]/30 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </span>
                  <br />
                  to Win.
                </motion.h1>
              </div>

              {/* Refined Description */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-6 max-w-xl border-l-2 border-[#986a41]/20 pl-8"
              >
                <p className="text-xl sm:text-2xl text-slate-500 font-normal leading-relaxed">
                  We match NIL athletes with trusted advisors - fast, smart, and free.
                </p>
                
                <div className="flex flex-col gap-3">
                  {["Free for Athletes", "Vetted Professionals", "AI-Powered Matching"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-[#163146] font-bold text-sm sm:text-base">
                      <div className="w-5 h-5 rounded-full bg-[#986a41] flex items-center justify-center text-white shrink-0">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="10 3 4.5 9 2 6.5" />
                        </svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Action Group */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-wrap items-center gap-8"
              >
                <MagneticButton
                  type="button"
                  onClick={() => dispatch(openAuthModal({ step: 'email-form' }))}
                  className="group bg-[#163146] hover:bg-[#1f4563] text-white px-10 py-6 text-lg font-bold rounded-2xl flex items-center gap-4 transition-all shadow-2xl shadow-[#163146]/20"
                >
                  Join the Inner Circle
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-[#986a41] transition-colors duration-500">
                    <svg className="w-5 h-5 transition-transform duration-500 group-hover:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </div>
                </MagneticButton>

                <button className="group relative overflow-hidden flex flex-col items-start gap-0.5 text-[#163146] font-black text-sm uppercase tracking-[0.2em]">
                  <span className="group-hover:text-[#986a41] transition-colors duration-300">See the Experience</span>
                  <span className="w-full h-0.5 bg-[#163146]/10 relative overflow-hidden">
                    <span className="absolute inset-0 bg-[#986a41] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                  </span>
                </button>
              </motion.div>
            </div>

            {/* Right Visual Column (5 cols) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative aspect-[4/5] w-full max-w-[480px] mx-auto">
                {/* Main Hero Card */}
                <div className="absolute inset-0 rounded-[3rem] overflow-hidden border border-[#163146]/10 shadow-[0_50px_100px_-20px_rgba(22,49,70,0.15)] bg-white p-3 z-10 transition-transform duration-700 hover:scale-[1.02]">
                  <div className="relative w-full h-full rounded-[2.4rem] overflow-hidden group shadow-inner">
                    <img 
                      src="/authbg.png" 
                      alt="Signil Elite" 
                      className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110 grayscale-[0.2] hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#163146]/80 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
                    
                    {/* Glassy Tag on Image */}
                    <div className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                      Authentic NIL
                    </div>
                  </div>
                </div>

                {/* Floating UI Elements */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 z-20 bg-white/90 backdrop-blur-2xl p-4 sm:p-5 rounded-[1.5rem] border border-white shadow-2xl shadow-[#163146]/10 flex flex-col gap-1 min-w-[140px] sm:min-w-[160px]"
                >
                  <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400 font-black">Success Rate</p>
                  <p className="text-xl sm:text-2xl font-black text-[#163146] tracking-tighter">99.2%</p>
                  <div className="h-0.5 sm:h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5 flex">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-linear-to-r from-[#986a41] to-[#163146]" 
                    />
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-6 -left-6 z-20 bg-[#163146] p-4 sm:p-5 rounded-[1.5rem] border border-[#163146] shadow-2xl shadow-[#163146]/40 flex items-center gap-3 sm:gap-4 text-white"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#986a41] flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-white/40 font-black">Security</p>
                    <p className="text-xs sm:text-sm font-black tracking-tight">Enterprise Shield</p>
                  </div>
                </motion.div>

                {/* Decorative Shapes */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-[#986a41]/5 rounded-full blur-[100px] animate-pulse" />
              </div>
            </motion.div>

          </div>
        </div>

        {/* Dynamic Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-5 cursor-pointer group"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <div className="flex flex-col items-center gap-1">
             <span className="text-[8px] font-black uppercase tracking-[0.5em] text-[#163146]/30 group-hover:text-[#986a41] transition-colors">Experience Signil</span>
             <svg className="w-3 h-3 text-[#163146]/20 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
          <div className="w-[1px] h-14 bg-[#163146]/5 relative overflow-hidden">
            <motion.div 
              animate={{ y: [0, 56, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-1/4 bg-[#986a41]" 
            />
          </div>
        </motion.div>
      </section>

      <ProblemSolution />

      <FeaturesSection />

      <ScoutSection />

      <FoundersNote />

      <Footer />
    </div>
  )
}

export default HomePage
