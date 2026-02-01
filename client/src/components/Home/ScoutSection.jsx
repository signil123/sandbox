import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ShieldCheck, Zap, CornerDownLeft, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const scoutFeatures = [
    {
        icon: MessageSquare,
        title: "Personalized Matching",
        description: "Our AI understands your sport, goals, and specific needs to recommend the most qualified advisors for your situation."
    },
    {
        icon: ShieldCheck,
        title: "Verified Professionals Only",
        description: "Every advisor on Signil is verified and credentialed through Signil's very own process, ensuring you receive guidance from qualified experts."
    },
    {
        icon: Zap,
        title: "Fast Connections",
        description: "Get matched with the right advisors in minutes, not days, allowing you to take advantage of time-sensitive opportunities."
    }
];

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
    }
};

const ScoutSection = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'scout',
            content: "Hi, I'm Scout—here to help you explore everything NIL, whether you're an athlete, advisor, school, or just curious about how it all works. I can guide you through what Signil offers and answer any questions along the way. What would you like to know?"
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatContainerRef = useRef(null);

    const scrollToBottom = (behavior = "smooth") => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current;
            chatContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior
            });
        }
    };

    useEffect(() => {
        if (messages.length > 1 || isTyping) {
            scrollToBottom();
        }
    }, [messages, isTyping]);

    const handleSendMessage = (e) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        setTimeout(() => {
            const scoutReply = {
                id: Date.now() + 1,
                role: 'scout',
                content: "That's a great question! I'm currently in 'mock mode', but in the full version of Signil, I'll analyze your specific profile and connect you with the most relevant advisors instantly. Would you like to join the waitlist to be among the first to try it?"
            };
            setMessages(prev => [...prev, scoutReply]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <section className="relative w-full bg-[#10202F] py-10 lg:py-24 px-4 sm:px-8 lg:px-12 flex justify-center text-[#faf7f2] overflow-hidden">

            {/* Premium Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none max-sm:hidden">
                <div
                    className="absolute top-0 right-0 w-[600px] h-[600px] blur-[120px] rounded-full opacity-[0.15]"
                    style={{ background: 'radial-gradient(circle, #986a41 0%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-0 left-0 w-[700px] h-[700px] blur-[150px] rounded-full opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #163146 0%, transparent 70%)' }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #faf7f2 1px, transparent 1px)',
                        backgroundSize: '48px 48px'
                    }}
                />
            </div>

            <div className="max-w-7xl w-full flex flex-col gap-8 lg:gap-16 relative z-10">

                {/* Heading Area */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center space-y-6"
                >
                    <div className="flex flex-col gap-6 items-center">
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-3 bg-[#986a41]/10 border border-[#986a41]/20 px-5 py-2 rounded-full w-fit"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#986a41] animate-pulse" />
                            <span className="text-[#986a41] text-[10px] font-black uppercase tracking-[0.2em]">Signil's AI Assistant</span>
                        </motion.div>

                        <motion.h2
                            variants={itemVariants}
                            className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[0.95] text-white"
                        >
                            Meet <span className="text-[#986a41] italic font-serif font-medium">Scout</span>. <br />
                            Your bridge to the right team.
                        </motion.h2>
                    </div>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Scout helps identify your specific needs and connects you with the perfect advisors for your NIL journey.
                    </p>
                </motion.div>

                {/* Content Grid - Tighter Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-center">

                    {/* Left: Feature Cards - More Compact */}
                    <div className="flex flex-col gap-6">
                        {scoutFeatures.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                                className="group relative p-6 rounded-[2rem] bg-white/2 border border-white/5 hover:bg-white/5 hover:border-[#986a41]/30 transition-all duration-500 flex flex-col sm:flex-row gap-4 lg:gap-6 shadow-xl"
                            >
                                <div className="shrink-0 w-12 h-12 rounded-xl bg-[#10202F] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                    <feature.icon className="w-6 h-6 text-[#986a41]" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#986a41] transition-colors duration-500">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm lg:text-base leading-relaxed font-light">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Right: User's Mockup Integration - Bento Style */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* Interactive Glow */}
                        <div className="absolute -inset-10 bg-[#986a41] blur-[80px] rounded-[4rem] -z-10 opacity-[0.05]" />

                        <div className="bg-[#faf7f2] rounded-[2.5rem] p-2 lg:p-3 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden font-sans max-w-lg mx-auto lg:max-w-none">
                            {/* Window Header */}
                            <div className="bg-[#f4f1ea] px-6 py-4 rounded-t-[2rem] border-b border-gray-200/80 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-xl bg-[#1a2e41] flex items-center justify-center text-[#986a41] shadow-2xl">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-[3px] border-[#f4f1ea] shadow-lg animate-pulse" />
                                    </div>
                                    <div>
                                        <span className="text-[#1a2e41] font-black text-sm block tracking-tight">Scout AI</span>
                                        <span className="text-green-600 text-[9px] font-black uppercase tracking-[0.1em]">Active</span>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-2 h-2 rounded-full bg-gray-300/60" />
                                    ))}
                                </div>
                            </div>

                            {/* Chat Body - Scaled Height */}
                            <div
                                ref={chatContainerRef}
                                className="p-4 md:p-6 space-y-6 h-[350px] lg:h-[450px] overflow-y-auto flex flex-col bg-[#faf7f2] rounded-b-[2rem] scrollbar-hide"
                            >
                                <AnimatePresence initial={false}>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black shrink-0 text-[10px] shadow-2xl ${msg.role === 'scout' ? 'bg-[#1a2e41]' : 'bg-[#986a41]'}`}>
                                                {msg.role === 'scout' ? 'AI' : <User className="w-4 h-4" />}
                                            </div>
                                            <div className={`p-4 rounded-[1.5rem] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border text-[14px] leading-[1.5] relative max-w-[85%] transition-all duration-300 ${msg.role === 'scout'
                                                ? 'bg-white rounded-tl-none border-gray-100 text-[#1a2e41]'
                                                : 'bg-[#1a2e41] rounded-tr-none border-white/5 text-white'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3 items-start"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-[#1a2e41] flex items-center justify-center text-white font-black shrink-0 text-[10px] shadow-2xl">
                                            AI
                                        </div>
                                        <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-gray-100 flex gap-1.5">
                                            {[1, 2, 3].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                                    className="w-1.5 h-1.5 rounded-full bg-[#1a2e41]/40"
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Chat Footer/Input */}
                            <div className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-md max-sm:backdrop-blur-none max-sm:bg-white rounded-b-[2rem]">
                                <form onSubmit={handleSendMessage} className="relative group">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask Scout..."
                                        className="w-full bg-white border border-gray-200 rounded-full px-6 py-4 pr-14 text-sm focus:outline-none focus:ring-4 focus:ring-[#986a41]/10 focus:border-[#986a41]/40 transition-all shadow-sm text-[#1a2e41] placeholder:text-gray-400 font-medium"
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: -10 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="submit"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#1a2e41] hover:bg-[#986a41] text-white rounded-full shadow-lg transition-all duration-300"
                                    >
                                        <CornerDownLeft className="w-4 h-4" />
                                    </motion.button>
                                </form>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default ScoutSection;
