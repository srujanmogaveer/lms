import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { motion } from 'framer-motion';

interface CallToActionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  title = 'Ready to Redefine Your Learning Journey?',
  subtitle = 'Join over 25,000+ ambitious learners, educators, and institutions leveling up on EduSphere today.',
  buttonText = 'Explore All Courses',
  buttonLink = '/courses',
}) => {
  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 my-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#11162e] via-[#0d1226] to-[#0a0d1d] border border-white/[0.12] p-8 sm:p-14 lg:p-16 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
        
        {/* Ambient Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle Grid Accent */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-md text-xs font-semibold text-indigo-300">
            <HiSparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Transformative Learning Environment</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
            {subtitle}
          </p>

          {/* Quick Perks */}
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="w-4 h-4 text-emerald-400" /> Lifetime access &amp; updates
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="w-4 h-4 text-emerald-400" /> Verified industry certificates
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="w-4 h-4 text-emerald-400" /> 1-on-1 Mentor guidance
            </span>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={buttonLink}
                className="relative group overflow-hidden inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 hover:shadow-brand-500/50 border border-white/20 transition-all"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span>{buttonText}</span>
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/auth/role-selection"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white font-semibold text-sm backdrop-blur-md transition-all"
              >
                <span>Sign Up Free</span>
              </Link>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
};
