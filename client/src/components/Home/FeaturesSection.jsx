// File: client/src/components/HomePage/FeaturesSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Handshake, Check } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: "AI Matchmaking That Works Like a Team Scout",
        points: [
            "Scout recommends the best connections based on your sport, goals, and experience.",
            "Whether you're just starting or already monetizing, Scout adapts your matches accordingly.",
            "Scout works in the background to find top connections for you."
        ]
    },
    {
        icon: TrendingUp,
        title: "Advisor Tools That Actually Deliver ROI",
        points: [
            "Manage outreach, messages, and follow-ups in one place.",
            "Top athletes, advisors, and agents get higher profile rankings and better exposure.",
            "Use data to spot patterns in athlete interest, so you can adjust your profile for greater impact."
        ]
    },
    {
        icon: Handshake,
        title: "Compliance & Trust Built Into the Platform",
        points: [
            "Signil's verification process to receive trust and legitimacy.",
            "NCAA ready: Built to meet NCAA's NIL regulations and school requirements.",
            "Personal info and contracts are safely stored and protected."
        ]
    }
];

const FeaturesSection = () => {
    return (
        <section className="w-full relative py-8 lg:py-20 px-4 sm:px-8 lg:px-12 bg-white overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#986a41]/5 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#163146]/5 rounded-full blur-[120px] opacity-60" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#163146 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />
            </div>

            <div className="max-w-7xl mx-auto flex flex-col gap-6 lg:gap-16">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#986a41]/10 border border-[#986a41]/20"
                    >
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#986a41]">Platform Features</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#163146] leading-tight"
                    >
                        Built for <span className="text-[#986a41] italic font-serif font-medium">athletes</span>. Trusted by <span className="text-[#986a41] italic font-serif font-medium">advisors</span>.
                        <br className="hidden md:block mt-2" />
                        Designed for the <span className="bg-linear-to-r from-[#163146] to-[#986a41] bg-clip-text text-transparent">NIL era</span>.
                    </motion.h2>
                </div>

                {/* Features Grid - Uniform Height & Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className="group relative flex flex-col p-6 lg:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full"
                        >
                            {/* Icon Container */}
                            <div className="w-12 h-12 rounded-xl bg-[#163146]/5 flex items-center justify-center mb-6 group-hover:bg-[#986a41]/10 transition-colors duration-500 shrink-0">
                                <feature.icon className="w-6 h-6 text-[#163146] group-hover:text-[#986a41] transition-colors duration-500 stroke-[1.5]" />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-4 flex-grow">
                                <h3 className="text-lg lg:text-xl font-bold text-[#163146] leading-tight group-hover:text-[#986a41] transition-colors duration-500">
                                    {feature.title}
                                </h3>

                                <ul className="flex flex-col gap-2.5">
                                    {feature.points.map((point, i) => (
                                        <li key={i} className="flex gap-3 text-slate-500 text-sm leading-relaxed group/item">
                                            <div className="mt-1 shrink-0 w-3.5 h-3.5 rounded-full bg-[#986a41]/10 flex items-center justify-center group-hover/item:bg-[#986a41]/20 transition-colors">
                                                <Check className="w-2.5 h-2.5 text-[#986a41]" />
                                            </div>
                                            <span className="font-light">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Subtle Accent Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#986a41]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
