import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#060811] border-t border-white/[0.08] text-slate-400 py-16 overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 relative z-10">
        
        {/* Brand Overview */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 shadow-md text-white">
              <FiBookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">
              EduSphere<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">LMS</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Empowering students, instructors, and forward-thinking educational institutions with an immersive digital learning ecosystem.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Navigation</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/courses" className="hover:text-white transition-colors">All Courses</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Platform</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact &amp; Support</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Popular Tracks</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/courses?cat=dev" className="hover:text-white transition-colors">Full-Stack Development</Link></li>
            <li><Link to="/courses?cat=design" className="hover:text-white transition-colors">UI/UX &amp; Product Design</Link></li>
            <li><Link to="/courses?cat=ai" className="hover:text-white transition-colors">Generative AI &amp; LLMs</Link></li>
            <li><Link to="/courses?cat=cloud" className="hover:text-white transition-colors">Cloud &amp; DevOps</Link></li>
          </ul>
        </div>

        {/* Legal & Social */}
        <div>
          <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Connect &amp; Legal</h4>
          <ul className="space-y-2.5 text-xs mb-5">
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
          </ul>
          <div className="flex gap-2.5">
            <a href="#" aria-label="Github" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all">
              <FiGithub className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Twitter" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all">
              <FiTwitter className="w-4 h-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all">
              <FiLinkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 pt-8 border-t border-white/[0.06] text-xs text-center text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© {new Date().getFullYear()} EduSphere LMS. All rights reserved.</span>
        <span className="text-slate-600">Immersive Next-Gen Learning Infrastructure</span>
      </div>
    </footer>
  );
};
