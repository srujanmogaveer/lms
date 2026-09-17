import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiCheckCircle, FiShield, FiUsers, FiAward } from 'react-icons/fi';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const AuthLayout: React.FC = () => {
  const location = useLocation();

  const isRoleSelection = 
    location.pathname === '/auth' || 
    location.pathname === '/auth/' || 
    location.pathname.includes('role-selection');

  // Dynamic Background Image Selection based on URL Route
  const getBackgroundImage = () => {
    const path = location.pathname;
    if (isRoleSelection) return null;
    if (path.includes('student')) return '/images/student-auth-bg.png';
    if (path.includes('instructor') || path.includes('pending-approval')) return '/images/instructor-auth-bg.png';
    if (path.includes('admin')) return '/images/admin-auth-bg.png';
    return '/images/auth-hero-bg.png'; // default recovery pages
  };

  const getHeroContent = () => {
    const path = location.pathname;
    if (path.includes('instructor') || path.includes('pending-approval')) {
      return {
        badge: 'Instructor Teaching Suite',
        heading: 'Empowering Educators to Teach & Inspire Worldwide',
        description: 'Publish masterclasses, mentor ambitious students, and build your digital teaching career with advanced creator tools.',
        bullets: [
          { icon: FiBookOpen, text: 'Rich curriculum builder, video lessons & assignment grading' },
          { icon: FiCheckCircle, text: 'Interactive live classes, automated quizzes & student feedback' },
          { icon: FiUsers, text: 'Real-time student progress tracking & direct revenue payouts' },
        ],
      };
    }
    if (path.includes('admin')) {
      return {
        badge: 'Administrative Control Center',
        heading: 'Enterprise LMS Governance & Management',
        description: 'Complete institutional control over courses, student enrollments, instructor payouts, and platform security.',
        bullets: [
          { icon: FiShield, text: 'Role-based access control & enterprise-grade data security' },
          { icon: FiCheckCircle, text: 'Course verification, user moderation & payout management' },
          { icon: FiUsers, text: 'Comprehensive student performance & platform audit analytics' },
        ],
      };
    }
    // Default & Student Focus
    return {
      badge: 'Student Learning Platform',
      heading: 'Empowering Students to Master Future-Ready Skills',
      description: 'Join over 25,000+ students mastering real-world coding, AI, and design systems with interactive courses and expert mentors.',
      bullets: [
        { icon: FiCheckCircle, text: 'Interactive masterclasses & verifiable digital certificates' },
        { icon: FiAward, text: 'Hands-on assignments, quizzes & real-time skill evaluation' },
        { icon: FiUsers, text: 'Collaborative student forums, direct chat & live interactive classes' },
      ],
    };
  };

  const bgImg = getBackgroundImage();
  const heroContent = getHeroContent();

  if (isRoleSelection) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-950 transition-colors overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out z-0"
          style={{ backgroundImage: `url('/images/auth-hero-bg.png')` }}
        />

        {/* Balanced Dark Overlay for Frosted Glass Effect */}
        <div className="absolute inset-0 bg-slate-950/35 backdrop-brightness-95 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/50 z-0" />

        {/* Center Main Role Selection Portal */}
        <div className="relative z-10 w-full flex items-center justify-center my-auto py-6">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row bg-slate-950 transition-colors overflow-hidden">
      
      {/* Dynamic Role-Specific Background Image Layer or Ambient Mesh */}
      {bgImg ? (
        <div 
          key={bgImg}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out z-0"
          style={{ backgroundImage: `url('${bgImg}')` }}
        />
      ) : (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-[140px]" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
        </div>
      )}

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
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="my-auto py-12 space-y-6 z-10 max-w-lg"
        >
          <span className="inline-block px-3 py-1 bg-brand-500/30 border border-brand-400/40 rounded-full text-xs font-semibold uppercase tracking-wider text-brand-200">
            {heroContent.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
            {heroContent.heading}
          </h1>
          <p className="text-slate-200 text-sm leading-relaxed drop-shadow-xs">
            {heroContent.description}
          </p>

          <div className="space-y-3 pt-4 border-t border-white/20 text-xs">
            {heroContent.bullets.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              );
            })}
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
