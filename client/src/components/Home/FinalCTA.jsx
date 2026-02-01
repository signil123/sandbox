import React from 'react';
import { motion } from 'framer-motion';
import MagneticButton from '@/components/ui/MagneticButton'

// Stardust particles - Simplified for performance
const STARDUST = [...Array(8)].map((_, i) => ({
    id: i,
    top: `${(i * 13) % 100}%`,
    left: `${(i * 23) % 100}%`,
    size: (i % 2) + 1
}));

const FinalCTA = () => {
    return (
        <section className="relative w-full bg-[#163146] py-16 lg:py-48 px-5 sm:px-8 lg:px-12 flex flex-col items-center text-center overflow-hidden">

            {/* Premium Dark Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-b from-[#163146] to-[#0a1824] -z-10" />

            {/* Advanced Ambient Glows - Simplified */}
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[80%] bg-[#986a41] blur-[150px] rounded-full pointer-events-none opacity-[0.1]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[80%] bg-[#163146] blur-[180px] rounded-full pointer-events-none opacity-[0.15]" />

            {/* Decorative Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#faf7f2 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Stardust Particle System - Static for performance */}
            {STARDUST.map(star => (
                <div
                    key={star.id}
                    className="absolute bg-white rounded-full pointer-events-none blur-[0.5px] opacity-20"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size
                    }}
                />
            ))}

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-5xl w-full flex flex-col items-center gap-12 relative z-10"
            >
                {/* Visual Accent */}
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: 80 }}
                    viewport={{ once: true }}
                    className="h-1.5 rounded-full bg-linear-to-r from-transparent via-[#986a41] to-transparent mb-4"
                />

                {/* Main Heading */}
                <h2 className="text-xl md:text-3xl lg:text-5xl text-white font-black tracking-tighter leading-tight max-w-4xl">
                    Whether you're an athlete looking for guidance or an advisor ready to share your expertise, <span className="text-[#986a41] font-serif italic font-medium">Signil</span> is building the platform that will transform NIL opportunities.
                </h2>

                {/* CTA Button Group */}
                <div className="flex flex-col items-center gap-10 pt-4">
                    <div className="relative group">
                        {/* Magnetic Glow Effect */}
                        <div className="absolute -inset-1 border border-[#986a41]/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <MagneticButton className="group bg-[#986a41] hover:bg-[#855c3a] text-white px-8 md:px-11 py-3 md:py-4.5 text-base md:text-lg font-black rounded-full transition-all shadow-2xl shadow-[#986a41]/30 hover:shadow-[#986a41]/50 flex items-center justify-center gap-4 active:scale-95 border-b-4 border-[#7a5435] w-full md:w-auto">
                            Join the Limited Waitlist
                            <svg
                                className="w-4 h-4 md:w-5 md:h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </MagneticButton>
                    </div>

                    {/* Footer Note */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest"
                    >
                        Join 500+ athletes & advisors already on the list
                    </motion.div>
                </div>
            </motion.div>
            {/* Decorative bottom border accent */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#986a41]/30 to-transparent" />
        </section>
    );
};

export default FinalCTA;
