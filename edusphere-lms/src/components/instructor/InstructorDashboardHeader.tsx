import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiCalendar, FiClock, FiRefreshCw, FiZap } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface InstructorDashboardHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  onCreateCourse: () => void;
}

export const InstructorDashboardHeader: React.FC<InstructorDashboardHeaderProps> = ({
  onRefresh,
  isLoading,
  onCreateCourse,
}) => {
  const { currentUser, rawProfile } = useAuth();

  const instructorName = currentUser?.name || rawProfile?.fullName || 'Instructor';
  const instructorEmail = currentUser?.email || rawProfile?.email || '';
  const instructorAvatar = currentUser?.avatar || rawProfile?.avatarUrl || '';
  const instructorDesignation =
    rawProfile?.specialization ||
    (currentUser as any)?.specialization ||
    rawProfile?.qualification ||
    'Lead Educator & Course Creator';

  const todayDateFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden space-y-6"
    >
      {/* Decorative Gradient Background Layer */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Block: Avatar & Greeting */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative shrink-0">
            <Avatar
              src={instructorAvatar}
              name={instructorName}
              email={instructorEmail}
              role="instructor"
              size="xl"
              shape="rounded"
              className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-brand-500/20 shadow-lg"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Online" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                <FiZap className="w-3 h-3 mr-1 text-amber-500 fill-amber-500" /> Lead Educator
              </Badge>
              <span className="text-xs text-slate-400 font-medium">Asia/Kolkata (IST)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back, {instructorName}! 👋
            </h1>

            {currentUser?.email && (
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {currentUser.email}
              </p>
            )}

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {instructorDesignation}
            </p>
          </div>
        </div>

        {/* Right Block: Primary Action Buttons & Metadata */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full sm:w-auto justify-center text-xs"
            aria-label="Refresh Dashboard Data"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onCreateCourse}
            className="w-full sm:w-auto justify-center bg-brand-600 hover:bg-brand-700 text-white font-extrabold shadow-md shadow-brand-500/20 text-sm"
          >
            <FiPlus className="w-4 h-4 mr-1.5" /> Create Course
          </Button>
        </div>
      </div>

      {/* Footer Info Bar: Date Format DD/MM/YYYY & Last Login */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <FiCalendar className="w-3.5 h-3.5 text-brand-500" />
          <span>Today's Date: <strong className="text-slate-800 dark:text-slate-200">{todayDateFormatted}</strong> (IST)</span>
        </div>

        <div className="flex items-center gap-2">
          <FiClock className="w-3.5 h-3.5 text-amber-500" />
          <span>Session: <strong className="text-slate-800 dark:text-slate-200">Active (Bengaluru, India)</strong></span>
        </div>
      </div>
    </motion.div>
  );
};
