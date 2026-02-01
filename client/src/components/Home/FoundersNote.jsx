// File: client/src/components/HomePage/FoundersNote.jsx
import React from 'react';
import { motion } from 'framer-motion';

const FoundersNote = () => {
    return (
        <section className="relative w-full bg-[#faf7f2] py-12 lg:py-24 px-4 sm:px-8 lg:px-12 flex flex-col items-center overflow-hidden">

            {/* Subtle Premium Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
                style={{
                    backgroundImage: 'radial-gradient(#163146 1px, transparent 1px)',
                    backgroundSize: '48px 48px'
                }}
            />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-[#986a41]/20 to-transparent" />

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-4xl w-full relative"
            >
                <div className="bg-white/70 backdrop-blur-md max-sm:backdrop-blur-none max-sm:bg-white border border-[#986a41]/10 rounded-[2.5rem] p-6 md:p-12 lg:p-16 shadow-[0_30px_80px_-20px_rgba(152,106,65,0.12)] max-sm:shadow-lg flex flex-col items-center gap-8 md:gap-12 text-center relative overflow-hidden group">

                    {/* Pill Label */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 bg-[#986a41] text-white text-[9px] sm:text-[10px] font-black tracking-[0.4em] px-6 py-2.5 rounded-full uppercase shadow-xl shadow-[#986a41]/20"
                    >
                        A Letter from the Founders
                    </motion.div>

                    {/* Heading */}
                    <h2 className="text-[#163146] text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none max-w-2xl">
                        From Confusion to Confidence <br />
                        <span className="text-[#986a41] font-serif italic font-medium">One Connection</span> at a Time
                    </h2>

                    {/* Body Text */}
                    <div className="flex flex-col gap-5 text-[#163146]/80 text-sm md:text-lg lg:text-xl font-light leading-relaxed max-w-3xl">
                        <p>
                            We're Ryan and Saurav, two recent graduates who saw a system full of promise, but burdened with confusion and missed opportunities. We spoke with countless athletes navigating overwhelming contracts and confusing NIL deals, and advisors eager to help but struggling to reach the people who needed them most.
                        </p>
                        <p>
                            That disconnect fueled the creation of Signil, a platform designed to bridge the gap, bringing clarity, fairness, and trusted support to athletes, advisors, agents, and institutions alike.
                        </p>
                        <motion.p
                            initial={{ opacity: 0.5 }}
                            whileInView={{ opacity: 1 }}
                            className="font-bold text-[#163146] italic bg-[#986a41]/5 p-6 rounded-[2rem] border border-[#986a41]/10 mt-2"
                        >
                            Signil is the platform we wish existed for our friends and every athlete stepping into the future of NIL, because everyone deserves a team they can trust.
                        </motion.p>
                    </div>

                    {/* Sign-off */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mt-2 flex flex-col items-center gap-3"
                    >
                        <div className="w-12 h-px bg-[#986a41]/40 mb-1" />
                        <p className="text-[#163146] font-black text-lg tracking-tight">Join us in this journey,</p>

                        {/* Animated Signature Effect */}
                        <div className="relative group/sig">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: "100%" }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.6, ease: "easeInOut" }}
                                className="text-[#986a41] font-serif text-3xl md:text-5xl italic font-medium mt-1 whitespace-nowrap overflow-hidden"
                            >
                                Ryan & Saurav
                            </motion.div>
                        </div>

                        <div className="inline-block px-5 py-1.5 rounded-lg bg-[#163146]/5 text-[#163146]/60 text-[10px] uppercase tracking-[0.2em] font-black mt-2 border border-[#163146]/5">
                            Co-Founders, Signil
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </section>
    );
};

export default FoundersNote;
