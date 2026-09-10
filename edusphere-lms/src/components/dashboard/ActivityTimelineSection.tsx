import React from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiBookOpen, FiFileText, FiCheckCircle, FiAward, FiClock } from 'react-icons/fi';
import { Card } from '../ui/Card';
import type { ActivityTimelineItem } from '../../types';

interface ActivityTimelineSectionProps {
  activities: ActivityTimelineItem[];
}

export const ActivityTimelineSection: React.FC<ActivityTimelineSectionProps> = ({ activities }) => {
  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return { icon: FiBookOpen, color: 'bg-brand-500 text-white ring-brand-100 dark:ring-brand-950' };
      case 'assignment_submitted':
        return { icon: FiFileText, color: 'bg-amber-500 text-white ring-amber-100 dark:ring-amber-950' };
      case 'quiz_completed':
        return { icon: FiCheckCircle, color: 'bg-emerald-500 text-white ring-emerald-100 dark:ring-emerald-950' };
      case 'certificate_earned':
        return { icon: FiAward, color: 'bg-purple-500 text-white ring-purple-100 dark:ring-purple-950' };
      default:
        return { icon: FiActivity, color: 'bg-indigo-500 text-white ring-indigo-100 dark:ring-indigo-950' };
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-emerald-500" />
            Recent Activity Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Chronological history of your learning milestones</p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {activities.map((item, idx) => {
          const { icon: Icon, color } = getTimelineIcon(item.type);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="relative group"
            >
              {/* Timeline Marker Icon */}
              <div
                className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md ring-4 ${color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="bg-slate-50/70 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {item.timestamp}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                  <span className="text-brand-600 dark:text-brand-400 font-semibold">{item.courseTitle}</span>
                </div>

                {item.detail && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {item.detail}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
