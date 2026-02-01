import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { openAuthModal } from '../../redux/uiSlice';

const Navbar = () => {
    const dispatch = useDispatch();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();
    
    // Adjust transform values based on screen size could be done via CSS variables or hooks
    // but for simplicity, we'll keep the transform logic and rely on the container's max-width/margin
    const navWidth = useTransform(scrollY, [0, 50], ["100%", "95%"]);
    const navPadding = useTransform(scrollY, [0, 50], ["24px", "16px"]);
    const navBg = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.8)"]);
    const navShadow = useTransform(scrollY, [0, 50], ["none", "0 20px 40px -15px rgba(22, 49, 70, 0.1)"]);
    const navBorder = useTransform(scrollY, [0, 50], ["rgba(22, 49, 70, 0)", "rgba(22, 49, 70, 0.05)"]);

    const menuItems = [
        { label: 'Athletes', path: '/athletes' },
        { label: 'Advisors & Agents', path: '/advisors' },
    ];

    return (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none pt-6 px-2 lg:px-6 text-slate-900">
            <motion.nav 
                style={{ 
                    width: navWidth,
                    backgroundColor: navBg,
                    boxShadow: navShadow,
                    borderColor: navBorder,
                    padding: navPadding,
                    backdropFilter: "blur(20px)"
                }}
                className="relative max-w-7xl mx-auto rounded-[2rem] border flex items-center justify-between gap-12 pointer-events-auto transition-[padding] duration-500"
            >
                {/* Brand Logo */}
                <div className="flex items-center gap-10 pl-6">
                    <Link to="/" className="hover:opacity-90 transition-opacity flex items-center">
                        <img src="/logo.png" alt="Signil" className="h-8 w-auto" />
                    </Link>

                    {/* Nav Links - Desktop */}
                    <div className="hidden lg:flex items-center gap-8">
                        {menuItems.map((item) => (
                            <Link 
                                key={item.label}
                                to={item.path} 
                                className="relative text-[11px] font-black text-[#163146]/60 uppercase tracking-widest hover:text-[#163146] transition-colors group/link"
                            >
                                {item.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#986a41] group-hover/link:w-full transition-all duration-300" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3 pr-2">
                    <button 
                        onClick={() => dispatch(openAuthModal({ step: 'login-form' }))}
                        className="hidden sm:block px-8 py-2.5 rounded-2xl text-[#163146] text-[11px] font-black uppercase tracking-widest hover:text-[#986a41] transition-colors"
                    >
                        Login
                    </button>
                    
                    <button 
                        onClick={() => dispatch(openAuthModal({ step: 'email-form' }))}
                        className="hidden lg:block relative overflow-hidden px-10 py-3.5 rounded-2xl bg-[#163146] text-white text-[11px] font-black uppercase tracking-widest group shadow-lg shadow-[#163146]/10"
                    >
                        <span className="relative z-10">Sign Up</span>
                        <div className="absolute inset-0 bg-[#986a41] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
                    </button>

                    {/* Mobile Toggle */}
                    <button
                        className="lg:hidden w-12 h-12 rounded-2xl bg-[#163146]/5 flex items-center justify-center text-[#163146] hover:bg-[#163146]/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <AnimatePresence mode="wait">
                            {isMobileMenuOpen ? (
                                <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                                    <X size={20} strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                                    <Menu size={20} strokeWidth={3} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-full left-0 w-full px-6 pt-4 lg:hidden"
                        >
                            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] border border-[#163146]/10 shadow-2xl p-8 flex flex-col gap-6">
                                {menuItems.map((item, idx) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Link
                                            to={item.path}
                                            className="text-[13px] font-black text-[#163146] uppercase tracking-[0.2em] hover:text-[#986a41] transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                <div className="h-px w-full bg-[#163146]/5 my-2" />
                                <div className="flex flex-col gap-4">
                                    <button 
                                        className="w-full text-center py-2 text-[11px] font-black text-[#163146] uppercase tracking-widest"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            dispatch(openAuthModal({ step: 'login-form' }));
                                        }}
                                    >
                                        Login
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            dispatch(openAuthModal({ step: 'email-form' }));
                                        }}
                                        className="w-full py-4 rounded-2xl bg-[#163146] text-white text-xs font-black uppercase tracking-widest"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </div>
    );
};

export default Navbar;
