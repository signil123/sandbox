// File: client/src/pages/Athletes/AthletesPage.jsx
import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Aperture, ArrowRight, Check, DollarSign, Shield, Sparkles } from 'lucide-react';
import React, { useRef } from 'react';

const features = [
    {
        icon: Shield,
        title: "LEGAL PROTECTION",
        tag: "Safety First",
        description: "Expert guidance on NCAA compliance, contract review, and eligibility. Secure your future with ironclad protection.",
        color: "from-blue-500/10 to-transparent"
    },
    {
        icon: Aperture,
        title: "BRAND BUILDING",
        tag: "Digital Legacy",
        description: "Personal branding strategies to help you stand out. Modern tactics for a modern athlete's career.",
        color: "from-[#986a41]/10 to-transparent"
    },
    {
        icon: DollarSign,
        title: "FINANCIAL GROWTH",
        tag: "Wealth Management",
        description: "Financial advisors specializing in tax planning and long-term wealth. Build more than just success.",
        color: "from-emerald-500/10 to-transparent"
    }
];

const AthletesPage = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const backgroundY2 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div ref={containerRef} className="relative min-h-screen w-full bg-[#fdfdfd] flex flex-col font-sans selection:bg-[#163146] selection:text-white overflow-x-hidden">
            <Navbar />

            {/* Dynamic Mesh Background Overlay - Hidden on mobile for performance */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden max-sm:hidden">
                <motion.div
                    style={{ y: backgroundY }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#163146]/5 rounded-full blur-[120px] mix-blend-multiply opacity-60"
                />
                <motion.div
                    style={{ y: backgroundY2 }}
                    className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-[#986a41]/5 rounded-full blur-[120px] mix-blend-multiply opacity-40"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <main className="grow pt-[clamp(8rem,16vh,12rem)] pb-[clamp(4rem,8vh,6rem)] px-[clamp(1rem,5vw,2rem)] relative z-10">
                <div className="max-w-7xl mx-auto">

                    {/* Elite Hero Section */}
                    <header className="flex flex-col items-center text-center mb-[clamp(3rem,8vh,8rem)]">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm mb-[clamp(1.5rem,4vh,2.5rem)]"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#986a41] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#986a41]"></span>
                            </span>
                            <span className="text-[#163146] text-[10px] font-bold tracking-[0.2em] uppercase">NIL Excellence</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] font-serif font-medium text-[#163146] mb-[clamp(1.5rem,3vh,2.5rem)] tracking-tight"
                        >
                            Elevating the <br />
                            <span className="italic text-[#986a41] relative">
                                Modern Athlete
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 1, delay: 0.8 }}
                                    className="absolute -bottom-2 left-0 w-full h-[clamp(2px,0.5vw,4px)] bg-[#986a41]/20 origin-left"
                                />
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 font-light max-w-3xl leading-relaxed mx-auto italic"
                        >
                            Navigate your NIL journey with precision. We pair elite talent with the expert guidance needed to build a sustainable, protected legacy.
                        </motion.p>
                    </header>

                    {/* Modern Bento Grid */}
                    <motion.section
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-12 auto-rows-[clamp(18rem,30vh,22rem)] gap-[clamp(1rem,2vw,1.5rem)] mb-[clamp(4rem,10vh,10rem)]"
                    >
                        {/* Feature 1 - Hero Card */}
                        <motion.div
                            variants={itemVariants}
                            className="md:col-span-8 md:row-span-2 group relative overflow-hidden bg-white/60 backdrop-blur-sm max-sm:backdrop-blur-none max-sm:bg-white rounded-[clamp(1.5rem,3vw,2.5rem)] border border-gray-100/80 p-[clamp(1.5rem,3vw,3rem)] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(22,49,70,0.08)] max-sm:shadow-md hover:-translate-y-1 active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-[#163146]/2 to-transparent pointer-events-none" />
                            <div className="relative h-full flex flex-col justify-between z-10">
                                <div className="space-y-[clamp(1rem,2vw,2rem)]">
                                    <div className="w-[clamp(3rem,5vw,4rem)] h-[clamp(3rem,5vw,4rem)] rounded-2xl bg-[#163146] flex items-center justify-center text-white shadow-2xl shadow-[#163146]/20 group-hover:scale-110 transition-transform duration-500">
                                        <Shield className="w-[clamp(1.5rem,2.5vw,2rem)] h-[clamp(1.5rem,2.5vw,2rem)] stroke-[1.25]" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-serif text-[#163146] tracking-tight">{features[0].title}</h3>
                                            <Sparkles className="w-5 h-5 text-[#986a41] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>
                                        <p className="text-[#986a41] text-[10px] font-bold tracking-[0.15em] uppercase italic opacity-80">{features[0].tag}</p>
                                    </div>
                                    <p className="text-gray-500 text-[clamp(0.875rem,1.5vw,1.125rem)] font-light leading-relaxed max-w-lg">
                                        {features[0].description}
                                    </p>
                                </div>
                                <div className="mt-[clamp(1.5rem,3vw,3rem)] p-[clamp(1rem,2vw,2rem)] bg-gray-50/50 rounded-3xl border border-gray-100/50 flex items-center justify-center overflow-hidden">
                                    <div className="w-full flex flex-col gap-4 opacity-40 group-hover:opacity-80 transition-opacity duration-700">
                                        <div className="h-2 w-1/3 bg-[#163146]/20 rounded-full" />
                                        <div className="h-2 w-full bg-linear-to-r from-[#163146]/10 to-transparent rounded-full" />
                                        <div className="h-2 w-2/3 bg-[#163146]/10 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Feature 2 & 3 - Side Cards */}
                        <div className="md:col-span-4 md:row-span-2 flex flex-col gap-[clamp(1rem,2vw,1.5rem)]">
                            {features.slice(1).map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    className="flex-1 group relative bg-white/60 backdrop-blur-sm max-sm:backdrop-blur-none max-sm:bg-white rounded-[clamp(1.5rem,3vw,2.5rem)] border border-gray-100/80 p-[clamp(1.5rem,2.5vw,2.5rem)] flex flex-col justify-between hover:shadow-[0_40px_80px_-20px_rgba(22,49,70,0.08)] max-sm:shadow-md hover:-translate-y-1 active:scale-[0.98] transition-all duration-700"
                                >
                                    <div className="space-y-[clamp(1rem,2vw,1.5rem)]">
                                        <div className="w-[clamp(2.5rem,4vw,3.5rem)] h-[clamp(2.5rem,4vw,3.5rem)] rounded-2xl bg-[#986a41]/10 flex items-center justify-center text-[#986a41] group-hover:bg-[#986a41] group-hover:text-white transition-all duration-500">
                                            <feature.icon className="w-[clamp(1.25rem,2vw,1.75rem)] h-[clamp(1.25rem,2vw,1.75rem)] stroke-[1.25]" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-[clamp(1.25rem,2vw,1.5rem)] font-serif text-[#163146] tracking-tight">{feature.title}</h3>
                                            <p className="text-[#986a41]/60 text-[10px] font-black tracking-widest uppercase">{feature.tag}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-[clamp(0.875rem,1.25vw,1rem)] font-light leading-relaxed text-balance">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Elite Pricing Section */}
                    <section className="relative py-[clamp(3rem,8vh,8rem)] rounded-[clamp(2rem,5vw,4rem)] bg-[#163146] overflow-hidden shadow-[0_50px_100px_-20px_rgba(22,49,70,0.3)]">
                        <div className="absolute top-0 right-0 w-full h-full bg-linear-to-bl from-white/3 to-transparent pointer-events-none" />
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#986a41]/20 rounded-full blur-[100px] opacity-40" />
                        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-[100px] opacity-20" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-[clamp(3rem,6vh,6rem)] px-[clamp(2rem,5vw,5rem)] max-w-6xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="flex-1 text-center lg:text-left space-y-[clamp(1.5rem,3vh,2rem)]"
                            >
                                <div className="space-y-[clamp(1rem,2vh,1.5rem)]">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-lg max-sm:backdrop-blur-none max-sm:bg-white/20">
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Membership</span>
                                    </div>
                                    <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-serif text-white leading-[1.1] tracking-tight">
                                        <span className="text-[#986a41] italic font-medium">Athlete</span> <br />
                                        Membership
                                    </h2>
                                    <p className="text-white/60 font-light max-w-md mx-auto lg:mx-0 text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed">
                                        Premium resources for athletes who demand the best in NIL representation and protection.
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 justify-center lg:justify-start pt-4 border-t border-white/5 w-fit mx-auto lg:mx-0">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-[#163146] bg-gray-100 overflow-hidden">
                                                <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-white/40 text-xs font-medium tracking-wide uppercase">Join 200+ elite talent</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full max-w-lg"
                            >
                                <div className="group relative bg-white rounded-[clamp(2rem,3vw,3rem)] p-[clamp(2rem,4vw,4rem)] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.4)] max-sm:shadow-lg transition-all duration-700 hover:-translate-y-2">
                                    <div className="absolute top-[clamp(1rem,2vw,2rem)] right-[clamp(1.5rem,3vw,3rem)]">
                                        <span className="text-[#986a41] text-[10px] font-black tracking-widest uppercase py-1.5 px-4 bg-[#986a41]/10 rounded-full">WAITLIST OPEN</span>
                                    </div>
                                    <div className="mb-[clamp(2rem,4vh,3rem)] space-y-2">
                                        <h3 className="text-[clamp(1.5rem,2.5vw,2.25rem)] font-serif font-medium text-[#163146] tracking-tight">ASSOCIATE</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[clamp(3rem,6vw,6rem)] font-serif font-bold text-[#163146] tracking-tighter">$0</span>
                                            <span className="text-gray-400 font-light text-[clamp(1rem,1.5vw,1.25rem)] tracking-tight">/ lifetime</span>
                                        </div>
                                    </div>
                                    <ul className="grid grid-cols-1 gap-[clamp(0.75rem,1.5vh,1.5rem)] mb-[clamp(2.5rem,4vh,4rem)]">
                                        {[
                                            "Personalized Advisor Matching",
                                            "Unlimited Secure Messaging",
                                            "Contract & Opportunity Screening",
                                            "Brand Growth Digital Resources",
                                            "Exclusive NIL Marketplace Access"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-[clamp(0.75rem,1.25vw,1.25rem)] group/item">
                                                <div className="mt-1.5 w-5 h-5 rounded-full bg-[#163146]/5 flex items-center justify-center shrink-0 group-hover/item:bg-[#986a41]/10 transition-colors">
                                                    <Check className="w-3 h-3 text-[#986a41]" strokeWidth={3} />
                                                </div>
                                                <span className="text-gray-600 font-light text-[clamp(0.875rem,1.25vw,1.125rem)] leading-tight tracking-tight">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="group w-full relative h-[clamp(3.5rem,5vw,5rem)] bg-[#163146] text-white rounded-3xl font-bold text-[clamp(1rem,1.25vw,1.25rem)] overflow-hidden transition-all duration-500 active:scale-[0.98]">
                                        <div className="absolute inset-0 bg-[#986a41] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out" />
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            Join the Waitlist
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AthletesPage;
