import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiUser, FiSliders, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const handleSelectRole = (role: 'student' | 'instructor' | 'admin') => {
    setRole(role);
    if (role === 'student') navigate('/auth/student-login');
    else if (role === 'instructor') navigate('/auth/instructor-login');
    else if (role === 'admin') navigate('/auth/admin-login');
  };

  const roleCards = [
    {
      id: 'student' as const,
      title: 'Student Space',
      description: 'Access your enrolled courses, view video lectures, submit assignments, and track progress.',
      cta: 'Enter Student Workspace',
      icon: FiBookOpen,
      iconGradient: 'from-blue-500 to-indigo-600 shadow-blue-500/30 border-blue-400/30',
      hoverBorder: 'hover:border-blue-500/60 hover:shadow-blue-500/10 hover:bg-blue-950/20',
      accentColor: 'text-blue-400 group-hover:text-blue-300',
    },
    {
      id: 'instructor' as const,
      title: 'Instructor Space',
      description: 'Manage curriculum, create courses, review assignment submissions, and check students statistics.',
      cta: 'Enter Instructor Workspace',
      icon: FiUser,
      iconGradient: 'from-indigo-500 to-purple-600 shadow-purple-500/30 border-purple-400/30',
      hoverBorder: 'hover:border-purple-500/60 hover:shadow-purple-500/10 hover:bg-purple-950/20',
      accentColor: 'text-purple-400 group-hover:text-purple-300',
    },
    {
      id: 'admin' as const,
      title: 'Admin Control',
      description: 'Configure categories, authorize instructor profile requests, inspect platform reports, and manage memberships.',
      cta: 'Enter Admin Console',
      icon: FiSliders,
      iconGradient: 'from-rose-500 to-amber-600 shadow-rose-500/30 border-rose-400/30',
      hoverBorder: 'hover:border-rose-500/60 hover:shadow-rose-500/10 hover:bg-rose-950/20',
      accentColor: 'text-rose-400 group-hover:text-rose-300',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Main Frosted Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full rounded-[32px] p-8 sm:p-12 lg:p-14 backdrop-blur-3xl bg-[#0b1328]/85 border border-slate-700/60 shadow-[0_30px_100px_rgba(2,6,23,0.8)] text-center text-white relative overflow-hidden"
      >
        {/* Subtle Ambient Color Flare at Top */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />

        {/* Header */}
        <div className="space-y-1.5 max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            EduSphere
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Sign In Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-3 font-normal drop-shadow-xs">
            Choose your learning or administrative space to access your workspace.
          </p>
        </div>

        {/* 3 Role Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 mt-10 text-center">
          {roleCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectRole(card.id)}
                className={`group relative rounded-[24px] p-8 lg:p-9 backdrop-blur-2xl bg-[#070d1c]/80 hover:bg-[#0e1730]/90 border border-slate-800/90 ${card.hoverBorder} shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[390px]`}
              >
                {/* Top Rounded Square Icon Container with Gradient */}
                <div className={`w-16 h-16 rounded-[20px] bg-gradient-to-br ${card.iconGradient} border flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-all`}>
                  <Icon className="w-7 h-7 stroke-[1.8]" />
                </div>

                {/* Title & Description */}
                <div className="my-auto py-5 space-y-3">
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-300/90 leading-relaxed px-1 max-w-[230px] mx-auto min-h-[56px] flex items-center justify-center">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Separator and CTA with Role Accent Color */}
                <div className="w-full pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                  <span className={card.accentColor}>{card.cta}</span>
                  <FiArrowRight className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200 ${card.accentColor}`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Footer Text Outside Container */}
      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200 drop-shadow-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};
