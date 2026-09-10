import React from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiPlayCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface MyCoursesHeaderProps {
  totalEnrolled: number;
  inProgressCount: number;
  completedCount: number;
  notStartedCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const MyCoursesHeader: React.FC<MyCoursesHeaderProps> = ({
  totalEnrolled,
  inProgressCount,
  completedCount,
  notStartedCount,
  onRefresh,
  isLoading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-700 p-6 sm:p-8 text-white shadow-xl"
    >
      {/* Background Blurs */}
      <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-16 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Title & Badges */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm flex items-center gap-1.5">
              <FiBookOpen className="w-3.5 h-3.5" />
              Student Learning Hub
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300/40 text-emerald-100 flex items-center gap-1">
              <FiPlayCircle className="w-3.5 h-3.5 text-emerald-300" />
              Active Learning Session
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            My Enrolled Courses ({totalEnrolled})
          </h1>
          <p className="text-brand-100 text-xs sm:text-sm font-medium max-w-xl">
            Track your ongoing progress, access lesson modules, submit assignments, take quizzes, and earn course completion certificates.
          </p>
        </div>

        {/* Right Side: Quick Stats & Demo Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 border-white/15 pt-4 lg:pt-0">
          {/* Quick Metrics Badge Container */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-xs">
            <div className="px-2 border-r border-white/20">
              <span className="text-white/70 block text-[10px] uppercase font-bold">In Progress</span>
              <span className="text-base font-black text-amber-300 flex items-center gap-1">
                <FiPlayCircle className="w-4 h-4" /> {inProgressCount}
              </span>
            </div>
            <div className="px-2 border-r border-white/20">
              <span className="text-white/70 block text-[10px] uppercase font-bold">Completed</span>
              <span className="text-base font-black text-emerald-300 flex items-center gap-1">
                <FiCheckCircle className="w-4 h-4" /> {completedCount}
              </span>
            </div>
            <div className="px-2">
              <span className="text-white/70 block text-[10px] uppercase font-bold">Not Started</span>
              <span className="text-base font-black text-slate-300">{notStartedCount}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-md"
              aria-label="Refresh course status"
            >
              <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
