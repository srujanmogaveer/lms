import React from 'react';
import { FiTarget, FiAward, FiClock, FiTrendingUp } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

interface MyCoursesProgressSummaryProps {
  overallProgress: number;
  completedCount: number;
  totalHoursLearned?: number;
}

export const MyCoursesProgressSummary: React.FC<MyCoursesProgressSummaryProps> = ({
  overallProgress,
  completedCount,
  totalHoursLearned = 64.5,
}) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-white via-slate-50 to-brand-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/20 border border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Metric 1: Overall Learning Progress */}
        <div className="space-y-2 pr-0 md:pr-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FiTarget className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Overall Progress
            </span>
            <span className="text-sm font-black text-brand-600 dark:text-brand-400">
              {overallProgress}%
            </span>
          </div>

          <ProgressBar progress={overallProgress} size="md" color="brand" />

          <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
            <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Average completion rate across all enrolled courses</span>
          </p>
        </div>

        {/* Metric 2: Courses Completed & Certificates */}
        <div className="space-y-2 pt-4 md:pt-0 px-0 md:px-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FiAward className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Completed Masterclasses
          </span>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {completedCount}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-full">
              {completedCount} Verified Certificates
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Successfully passed all lessons, lab projects & capstones
          </p>
        </div>

        {/* Metric 3: Total Hours Learned */}
        <div className="space-y-2 pt-4 md:pt-0 pl-0 md:pl-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FiClock className="w-4 h-4 text-amber-500" />
            Total Hours Learned
          </span>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalHoursLearned}
            </span>
            <span className="text-xs font-bold text-slate-500">Hours Completed</span>
          </div>

          <p className="text-[11px] text-slate-500">
            Dedicated video lesson time & interactive coding labs
          </p>
        </div>
      </div>
    </Card>
  );
};
