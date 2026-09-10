import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTarget, FiBarChart2 } from 'react-icons/fi';
import { Card } from '../ui/Card';
import type { WeeklyActivity } from '../../types';

interface LearningProgressSectionProps {
  weeklyActivity: WeeklyActivity[];
  overallProgress: number;
}

export const LearningProgressSection: React.FC<LearningProgressSectionProps> = ({
  weeklyActivity,
  overallProgress,
}) => {
  const [activeDay, setActiveDay] = useState<WeeklyActivity | null>(weeklyActivity[3] || weeklyActivity[0]);

  const totalHoursWeekly = weeklyActivity.reduce((acc, curr) => acc + curr.hours, 0);
  const targetHoursWeekly = weeklyActivity.reduce((acc, curr) => acc + curr.targetHours, 0);
  const weeklyPercentage = Math.min(100, Math.round((totalHoursWeekly / targetHoursWeekly) * 100));

  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours), 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Progress Gauge & Summary */}
      <Card className="lg:col-span-1 flex flex-col justify-between space-y-5 p-6 bg-gradient-to-br from-white via-slate-50 to-brand-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/20">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiTarget className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Overall Goal Progress
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full">
              On Track 🚀
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated completion rate across all registered courses.
          </p>
        </div>

        {/* Circular Gauge Representation */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200 dark:text-slate-800"
                fill="transparent"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-brand-600 dark:text-brand-400"
                fill="transparent"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * overallProgress) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{overallProgress}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Completed</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Weekly Target</span>
            <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">{totalHoursWeekly} / {targetHoursWeekly} hrs</span>
          </div>
          <div className="bg-white dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Efficiency Score</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{weeklyPercentage}%</span>
          </div>
        </div>
      </Card>

      {/* Weekly Progress Chart */}
      <Card className="lg:col-span-2 space-y-4 p-6 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Weekly Learning Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hours devoted to lessons & lab assignments this week</p>
          </div>
          {activeDay && (
            <div className="text-xs bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 px-3 py-1 rounded-lg text-indigo-700 dark:text-indigo-300 font-semibold self-start sm:self-auto">
              {activeDay.fullDay}: <span className="font-extrabold">{activeDay.hours} hrs</span> learned (Goal: {activeDay.targetHours}h)
            </div>
          )}
        </div>

        {/* Visual Bar Chart */}
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-slate-100 dark:border-slate-800">
          {weeklyActivity.map((item) => {
            const heightPercent = Math.round((item.hours / maxHours) * 100);
            const isSelected = activeDay?.day === item.day;
            const isGoalMet = item.hours >= item.targetHours;

            return (
              <div
                key={item.day}
                onClick={() => setActiveDay(item)}
                className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
              >
                <span className={`text-[10px] font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isSelected ? 'opacity-100 text-brand-600 dark:text-brand-400' : 'text-slate-500'
                }`}>
                  {item.hours}h
                </span>
                
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-full flex items-end p-1 relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`w-full rounded-t-lg transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-t from-brand-600 to-indigo-500 shadow-md shadow-brand-500/30'
                        : isGoalMet
                        ? 'bg-brand-500/80 group-hover:bg-brand-600'
                        : 'bg-indigo-400/60 group-hover:bg-indigo-500'
                    }`}
                  />
                </div>
                <span className={`text-xs font-semibold mt-2 ${
                  isSelected ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Monthly Activity Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-sm bg-brand-600 inline-block" /> Completed Goal
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-sm bg-indigo-400 inline-block" /> Standard Session
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
            <FiTrendingUp className="w-4 h-4 text-emerald-500" />
            <span>+14.2% learning velocity vs last month</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
