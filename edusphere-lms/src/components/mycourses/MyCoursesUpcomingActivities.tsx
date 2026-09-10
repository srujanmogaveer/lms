import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiFileText, FiHelpCircle, FiPlayCircle, FiAward, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface UpcomingActivityItem {
  id: string;
  type: string;
  title: string;
  courseTitle: string;
  due: string;
  iconType: 'assignment' | 'quiz' | 'lesson' | 'milestone';
  badgeVariant: 'primary' | 'neutral' | 'warning' | 'danger' | 'success' | 'info' | 'default';
  actionText: string;
  path: string;
}

interface MyCoursesUpcomingActivitiesProps {
  activities: UpcomingActivityItem[];
  onSelectActivity: (path: string) => void;
}

export const MyCoursesUpcomingActivities: React.FC<MyCoursesUpcomingActivitiesProps> = ({
  activities,
  onSelectActivity,
}) => {
  const getIcon = (iconType: UpcomingActivityItem['iconType']) => {
    switch (iconType) {
      case 'quiz':
        return FiHelpCircle;
      case 'lesson':
        return FiPlayCircle;
      case 'milestone':
        return FiAward;
      case 'assignment':
      default:
        return FiFileText;
    }
  };

  return (
    <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Upcoming Activities & Milestones
          </h3>
          <p className="text-xs text-slate-500">
            Pending evaluations, next lessons, and curriculum milestones from your enrolled courses
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">All caught up!</h4>
          <p className="text-xs text-slate-500">
            You have no pending assignments or quizzes across your enrolled courses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activities.map((act, idx) => {
            const Icon = getIcon(act.iconType);
            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.08 }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={act.badgeVariant}>{act.type}</Badge>
                    <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1 shrink-0">
                      <FiClock className="w-3 h-3" /> {act.due}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2 leading-snug">
                    {act.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 font-medium truncate">{act.courseTitle}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-center text-xs"
                  onClick={() => onSelectActivity(act.path)}
                >
                  <Icon className="w-3.5 h-3.5 mr-1" />
                  <span>{act.actionText}</span>
                  <FiArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
