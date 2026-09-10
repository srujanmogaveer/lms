import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiRefreshCw, FiZap } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Avatar } from '../common/Avatar';

interface DashboardHeaderProps {
  studentName: string;
  studentEmail?: string;
  avatarUrl: string;
  streakDays?: number;
  isLoading: boolean;
  onRefreshData: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  studentName,
  studentEmail,
  avatarUrl,
  streakDays = 12,
  isLoading,
  onRefreshData,
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl"
    >
      {/* Background Decorative Patterns */}
      <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-16 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Profile & Greeting */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="relative group shrink-0">
            <Avatar
              src={avatarUrl}
              name={studentName}
              email={studentEmail}
              role="student"
              size="xl"
              shape="rounded"
              className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white/30 shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-brand-700 rounded-full" title="Active Now" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
                Student Dashboard
              </span>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-300/40 text-amber-200 text-xs font-bold">
                <FiZap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>{streakDays} Day Streak! 🔥</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {studentName}! 👋
            </h1>

            {studentEmail && (
              <p className="text-xs font-semibold text-brand-200 tracking-wide">
                {studentEmail}
              </p>
            )}

            <div className="flex items-center gap-2 text-brand-100 text-xs sm:text-sm font-medium">
              <FiCalendar className="w-4 h-4 text-brand-200" />
              <span>{currentDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Refresh & Status */}
        <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 border-white/15 pt-4 lg:pt-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefreshData}
            disabled={isLoading}
            className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-md"
            aria-label="Refresh statistics"
          >
            <FiRefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
