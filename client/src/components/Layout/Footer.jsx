import { Button } from "@/components/ui/button";
import { Instagram, Linkedin, Send, Twitter, Youtube } from 'lucide-react'; // Using icons for socials
import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-[#fdfdfd] py-4 sm:py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="w-full max-w-[1400px] bg-[#163146] text-[#faf7f2] rounded-[1.5rem] sm:rounded-[2.5rem] py-8 md:py-16 px-5 md:px-16 flex flex-col gap-8 md:gap-12 relative overflow-hidden">

                {/* Top Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-10">

                    {/* Left: Logo & Heading */}
                    <div className="flex flex-col gap-6 items-start">
                        <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5">
                            <img src="/logo.png" alt="Signil" className="h-8 w-auto object-contain" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-serif leading-tight">
                            Ready to <br /> get started?
                        </h2>
                    </div>

                    {/* Right: Links */}
                    <div className="flex flex-wrap gap-6 md:gap-10 text-sm md:text-base font-medium text-gray-300">
                        <a href="#" className="hover:text-white transition-colors">Athletes</a>
                        <a href="#" className="hover:text-white transition-colors">Advisors</a>
                        <a href="#" className="hover:text-white transition-colors">Agents</a>
                        <a href="#" className="hover:text-white transition-colors">Institutions</a>
                    </div>
                </div>

                {/* Middle Section: CTA & Socials */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-10">
                    <Button className="bg-[#986a41] hover:bg-[#855a35] text-white rounded-full px-8 py-6 text-lg font-semibold flex items-center justify-center gap-2 group transition-all w-full md:w-auto">
                        Join the Waitlist
                        <span className="bg-white/20 rounded-full p-1 group-hover:bg-white/30 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                <path d="M1 11L11 1M11 1H3M11 1V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </Button>

                    <div className="flex gap-4">
                        {[Instagram, Linkedin, Youtube, Twitter, Send].map((Icon, idx) => (
                            <a key={idx} href="#" className="border border-white/20 rounded-full p-3 hover:bg-white/10 transition-colors">
                                <Icon className="w-5 h-5 text-white" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Copyright & Legal */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400">
                    <div className="flex flex-wrap gap-4 md:gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:text-white transition-colors">Data Privacy</a>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:text-white transition-colors">Accessibility</a>
                    </div>
                    <p>© 2026 SIGNIL</p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
