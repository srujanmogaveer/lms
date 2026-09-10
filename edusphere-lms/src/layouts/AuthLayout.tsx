import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiCheckCircle, FiShield, FiUsers } from 'react-icons/fi';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const AuthLayout: React.FC = () => {
  const location = useLocation();

  // Dynamic Background Image Selection based on URL Route
  const getBackgroundImage = () => {
    const path = location.pathname;
    if (path.includes('student')) return '/images/student-auth-bg.png';
    if (path.includes('instructor') || path.includes('pending-approval')) return '/images/instructor-auth-bg.png';
    if (path.includes('admin')) return '/images/admin-auth-bg.png';
    return '/images/auth-hero-bg.png'; // Role selection & default recovery pages
  };

  const bgImg = getBackgroundImage();

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row bg-slate-950 transition-colors overflow-hidden">
      
      {/* Dynamic Role-Specific Background Image Layer */}
      <div 
        key={bgImg}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out z-0"
        style={{ backgroundImage: `url('${bgImg}')` }}
      />

      {/* Dark Gradient Overlay for High Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/90 z-0" />
      
      {/* Left Panel - Illustration & Branding Highlights */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-between relative z-10 text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <Link to="/" className="flex items-center gap-2 text-white font-extrabold text-xl">
            <FiBookOpen className="w-7 h-7 text-brand-400" />
            <span>EduSphere<span className="font-light text-brand-200">LMS</span></span>
          </Link>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Hero Copy & Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="my-auto py-12 space-y-6 z-10 max-w-lg"
        >
          <span className="inline-block px-3 py-1 bg-brand-500/30 border border-brand-400/40 rounded-full text-xs font-semibold uppercase tracking-wider text-brand-200">
            Enterprise LMS Ecosystem
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
            Empowering Next-Gen Learners, Instructors & Administrators
          </h1>
          <p className="text-slate-200 text-sm leading-relaxed drop-shadow-xs">
            Join over 25,000+ students and top-tier instructors building real-world software, AI, and design systems on EduSphere.
          </p>

          <div className="space-y-3 pt-4 border-t border-white/20 text-xs">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Interactive masterclasses & verifiable digital certificates</span>
            </div>
            <div className="flex items-center gap-2">
              <FiShield className="w-4 h-4 text-emerald-400" />
              <span>Enterprise grade security & role-based workspace control</span>
            </div>
            <div className="flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-emerald-400" />
              <span>Collaborative forums, direct chat & assignment evaluation</span>
            </div>
          </div>
        </motion.div>

        {/* Footer info */}
        <div className="z-10 text-xs text-slate-300">
          © {new Date().getFullYear()} EduSphere LMS Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Dynamic Authentication View Container */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>

    </div>
  );
};
