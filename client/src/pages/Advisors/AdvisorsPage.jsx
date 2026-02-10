// File: client/src/pages/Advisors/AdvisorsPage.jsx
import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/Layout/Navbar';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BadgeCheck, CheckCircle, LayoutGrid, Sparkles, Star, Target, UserPlus } from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AdvisorsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = location.hash === '#agents' ? 'agents' : 'advisors';
    const containerRef = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const backgroundY2 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

    const handleTabChange = (tab) => {
        navigate(`#${tab}`);
    };

    const content = {
        advisors: {
            title: "Advisors",
            cards: [
                {
                    icon: UserPlus,
                    title: "CONNECT WITH ATHLETES",
                    description: "Our AI matching system connects you with athletes whose needs align perfectly with your expertise and experience.",
                    size: "md:col-span-2"
                },
                {
                    icon: BadgeCheck,
                    title: "VERIFIED STATUS",
                    description: "Earn Signil's verification badge by completing our thorough vetting process.",
                    size: "md:col-span-1"
                },
                {
                    icon: LayoutGrid,
                    title: "GROW YOUR PRACTICE",
                    description: "Access our advisor dashboard with client management tools, educational resources, and insights to build a thriving NIL advisory practice.",
                    size: "md:col-span-3"
                }
            ]
        },
        agents: {
            title: "Agents",
            cards: [
                {
                    icon: Star,
                    title: "CONNECT WITH PURPOSE",
                    description: "Signil curates connections where value and trust come first.",
                    size: "md:col-span-1"
                },
                {
                    icon: Target,
                    title: "SMART ATHLETE DISCOVERY",
                    description: "Signil's AI surfaces athletes based on your specialization, no more cold outreach, just warm, qualified leads.",
                    size: "md:col-span-2"
                },
                {
                    icon: BadgeCheck,
                    title: "VERIFIED STATUS",
                    description: "Earn Signil's verification badge by completing our thorough vetting process, building instant trust with athletes and their families.",
                    size: "md:col-span-3"
                }
            ],
            pricingTitle: "Agent Pricing Tiers"
        }
    };

    const pricingTiers = [
        {
            name: "ASSOCIATE",
            price: "$0",
            period: "/month",
            features: [
                "Access to Scout",
                "Basic profile listing",
                "Standard athlete-matching tools",
                "Secure messaging with matched athletes"
            ],
            buttonText: "Join Waitlist",
            isBestValue: false
        },
        {
            name: "BUSINESS",
            price: "Pricing coming soon",
            period: "",
            features: [
                "Access to Scout",
                "Enhanced profile recommendations",
                "Limited athlete matches",
                "SIGNIL verification badge",
                "Basic analytics dashboard"
            ],
            buttonText: "Join Waitlist",
            isBestValue: false
        },
        {
            name: "CORPORATION",
            price: "Pricing coming soon",
            period: "",
            features: [
                "Access to Scout",
                "Unlimited athlete matching",
                "Advanced analytics dashboard",
                "Priority matching algorithm",
                "Dedicated account manager"
            ],
            buttonText: "Join Waitlist",
            isBestValue: true
        },
        {
            name: "ENTERPRISE",
            price: "Pricing coming soon",
            period: "",
            features: [
                "All Corporation benefits",
                "Multiple user accounts & permissions",
                "Custom branding & white-label portal",
                "Tailored pricing & feature bundles",
                "Full API access for integrations"
            ],
            buttonText: "Join Waitlist",
            isBestValue: false
        }
    ];

    return (
        <div ref={containerRef} className="min-h-screen w-full bg-[#fdfdfd] flex flex-col font-sans selection:bg-[#163146] selection:text-white overflow-x-hidden">
            <Navbar />

            {/* Elite Mesh Background - Hidden on mobile */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden max-sm:hidden">
                <motion.div
                    style={{ y: backgroundY }}
                    className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-[#163146]/5 rounded-full blur-[120px] mix-blend-multiply opacity-60"
                />
                <motion.div
                    style={{ y: backgroundY2 }}
                    className="absolute top-[30%] -right-[5%] w-[50%] h-[50%] bg-[#986a41]/5 rounded-full blur-[120px] mix-blend-multiply opacity-40"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-[clamp(8rem,16vh,12rem)] pb-[clamp(3rem,6vh,6rem)] px-[clamp(1rem,5vw,2rem)] z-10 transition-all duration-700">
                <div className="max-w-8xl mx-auto flex flex-col items-center text-center">

                    {/* Elite Eyebrow */}
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
                        <span className="text-[#163146] text-[10px] font-bold tracking-[0.2em] uppercase">Professional Success</span>
                    </motion.div>

                    {/* Elite Heading */}
                    <div className="relative mb-[clamp(1.5rem,3vh,2.5rem)] px-4">
                        <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-serif font-medium text-[#163146] leading-[0.95] tracking-tight">
                            Empowering <br />
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="italic text-[#986a41] relative inline-block"
                                >
                                    {content[activeTab].title}
                                    <motion.span
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="absolute -bottom-2 left-0 w-full h-[clamp(2px,0.5vw,4px)] bg-[#986a41]/20 origin-left"
                                    />
                                </motion.span>
                            </AnimatePresence>
                        </h1>
                    </div>

                    {/* Elite Description */}
                    <p className="text-gray-500 text-[clamp(1rem,2vw,1.25rem)] font-light max-w-2xl mb-[clamp(2rem,6vh,4rem)] px-4 sm:px-0 italic">
                        Connect with the right athletes, build your NIL advisory practice, and make a real impact on the future of college sports.
                    </p>

                    {/* Elite Tab Toggle */}
                    <div className="relative p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm inline-flex gap-1.5 mb-[clamp(3rem,8vh,6rem)]">
                        {['advisors', 'agents'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`relative px-[clamp(1.5rem,4vw,3rem)] py-[clamp(0.75rem,1.5vh,1rem)] text-[10px] sm:text-[11px] font-black tracking-[0.2em] transition-all duration-500 rounded-xl z-10 uppercase ${activeTab === tab
                                    ? 'text-white'
                                    : 'text-[#163146]/50 hover:text-[#163146]'
                                    }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTabBadge"
                                        className="absolute inset-0 bg-[#163146] rounded-xl shadow-lg shadow-[#163146]/20 -z-10"
                                        transition={{ type: 'spring', bounce: 0.1, duration: 0.8 }}
                                    />
                                )}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Elite Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[clamp(16rem,28vh,20rem)] gap-[clamp(1rem,2vw,1.5rem)] w-full max-w-8xl mx-auto px-0">
                        <AnimatePresence mode='wait'>
                            {content[activeTab].cards.map((card, idx) => (
                                <motion.div
                                    key={activeTab + idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                    className={`group relative overflow-hidden bg-white/60 backdrop-blur-sm max-sm:backdrop-blur-none max-sm:bg-white rounded-[clamp(1.5rem,3vw,2.5rem)] border border-gray-100/80 p-[clamp(1.5rem,2.5vw,2.5rem)] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(22,49,70,0.08)] max-sm:shadow-md hover:-translate-y-1 active:scale-[0.98] ${card.size === 'md:col-span-3' ? 'md:col-span-12' : card.size === 'md:col-span-2' ? 'md:col-span-8' : 'md:col-span-4'} md:text-left`}
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-[#163146]/2 to-transparent pointer-events-none" />

                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div className="space-y-[clamp(1rem,2vw,1.5rem)]">
                                            <div className="w-[clamp(2.5rem,4vw,3.5rem)] h-[clamp(2.5rem,4vw,3.5rem)] rounded-2xl bg-[#163146] flex items-center justify-center text-white shadow-2xl shadow-[#163146]/20 group-hover:scale-110 transition-transform duration-500 mx-auto md:mx-0">
                                                <card.icon className="w-[clamp(1.25rem,2vw,1.75rem)] h-[clamp(1.25rem,2vw,1.75rem)] stroke-[1.25]" />
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-[clamp(1.25rem,2vw,1.875rem)] font-serif text-[#163146] tracking-tight">
                                                    {card.title}
                                                </h3>
                                                <p className="text-[#986a41] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase italic opacity-80">
                                                    Professional Excellence
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-gray-500 text-[clamp(0.875rem,1.25vw,1.125rem)] font-light leading-relaxed max-w-2xl mt-[clamp(1rem,2vh,1.5rem)]">
                                            {card.description}
                                        </p>
                                    </div>

                                    {/* Subtle Corner Detail */}
                                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-40 transition-opacity duration-700">
                                        <Sparkles className="w-6 h-6 text-[#986a41]" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                </div>
            </section>

            {/* Elite Pricing Section */}
            <section className="relative py-[clamp(3rem,8vh,8rem)] rounded-[clamp(2rem,5vw,4rem)] bg-[#163146] overflow-hidden shadow-[0_50px_100px_-20px_rgba(22,49,70,0.3)] mx-[clamp(1rem,3vw,2rem)] mb-[clamp(4rem,10vh,8rem)]">
                <div className="absolute top-0 right-0 w-full h-full bg-linear-to-bl from-white/3 to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#986a41]/20 rounded-full blur-[100px] opacity-40" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-[100px] opacity-20" />

                <div className="relative z-10 max-w-8xl mx-auto px-[clamp(1.5rem,3vw,3rem)] items-center flex flex-col">

                    <div className="text-center mb-[clamp(3rem,6vh,5rem)] space-y-[clamp(1rem,2vh,1.5rem)]">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-lg max-sm:backdrop-blur-none max-sm:bg-white/20">
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/80">Professional Tiers</span>
                        </div>
                        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-serif text-white leading-[1.1] tracking-tight">
                            <span className="text-[#986a41] italic font-medium">{activeTab === 'advisors' ? 'Advisor' : 'Agent'}</span> <br />
                            Pricing
                        </h2>
                        <p className="text-white/80 font-light max-w-xl mx-auto text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed italic">
                            Strategic levels designed to scale with your professional impact and NIL ambitions.
                        </p>
                    </div>

                    {/* Elite Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[clamp(1rem,1.5vw,1.5rem)] w-full">
                        {pricingTiers.map((tier, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className={`group relative bg-white rounded-[clone(1.5rem,2.5vw,2.5rem)] max-sm:rounded-4xl p-[clamp(1.5rem,2.5vw,2.5rem)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.3)] max-sm:shadow-lg transition-all duration-700 hover:-translate-y-2 flex flex-col ${tier.isBestValue ? 'ring-2 ring-[#986a41]/30' : ''}`}
                            >
                                {tier.isBestValue && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                                        <div className="px-6 py-2 bg-[#986a41] rounded-full shadow-xl shadow-[#986a41]/20 transform group-hover:scale-110 transition-transform duration-500 border border-white/10">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] whitespace-nowrap">Most Popular</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-[clamp(1.5rem,3vh,2.5rem)] space-y-2">
                                    <h3 className="text-[clamp(1.25rem,1.5vw,1.5rem)] font-serif font-medium text-[#163146] tracking-tight">{tier.name}</h3>
                                    <div className="flex items-baseline gap-2">
                                        {tier.price.includes('soon') ? (
                                            <span className="text-[#163146] text-[clamp(1.25rem,1.5vw,1.5rem)] font-serif italic opacity-80">Coming Soon</span>
                                        ) : (
                                            <>
                                                <span className="text-[clamp(2.5rem,4vw,3.75rem)] font-serif font-bold text-[#163146] tracking-tighter">{tier.price}</span>
                                                <span className="text-gray-400 font-light text-base tracking-tight">{tier.period}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-[clamp(0.75rem,1.25vh,1rem)] mb-[clamp(2rem,4vh,3rem)] flex-1">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 group/item">
                                            <div className="mt-1.5 w-4 h-4 rounded-full bg-[#163146]/5 flex items-center justify-center shrink-0 group-hover/item:bg-[#986a41]/10 transition-colors">
                                                <CheckCircle className="w-2.5 h-2.5 text-[#986a41]" strokeWidth={3} />
                                            </div>
                                            <span className="text-gray-600 font-light text-[clamp(0.875rem,1vw,1rem)] leading-tight tracking-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button className="group w-full relative h-[clamp(3.5rem,5vw,4rem)] bg-[#163146] text-white rounded-[1.25rem] font-bold text-[clamp(0.875rem,1vw,1rem)] overflow-hidden transition-all duration-500 active:scale-[0.98]">
                                    <div className="absolute inset-0 bg-[#986a41] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out" />
                                    <div className="relative z-10 flex items-center justify-center gap-2">
                                        {tier.buttonText}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AdvisorsPage;
