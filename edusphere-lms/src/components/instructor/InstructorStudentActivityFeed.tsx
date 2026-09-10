import React from 'react';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiUserCheck,
  FiFileText,
  FiCheckCircle,
  FiAward,
  FiMessageSquare,
  FiClock,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { StudentActivityFeedItem } from '../../data/instructorDummyData';

interface InstructorStudentActivityFeedProps {
  activityFeed?: StudentActivityFeedItem[];
}

export const InstructorStudentActivityFeed: React.FC<InstructorStudentActivityFeedProps> = ({
  activityFeed,
}) => {
  const activities = activityFeed && Array.isArray(activityFeed) ? activityFeed : [];

  const getActivityBadge = (type: StudentActivityFeedItem['type']) => {
    switch (type) {
      case 'enrollment':
        return (
          <Badge variant="primary" size="sm" className="flex items-center gap-1">
            <FiUserCheck className="w-3 h-3" /> Enrollment
          </Badge>
        );
      case 'assignment':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <FiFileText className="w-3 h-3" /> Assignment
          </Badge>
        );
      case 'quiz':
        return (
          <Badge variant="neutral" size="sm" className="flex items-center gap-1">
            <FiCheckCircle className="w-3 h-3" /> Quiz
          </Badge>
        );
      case 'certificate':
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <FiAward className="w-3 h-3" /> Certificate
          </Badge>
        );
      case 'forum':
        return (
          <Badge variant="neutral" size="sm" className="flex items-center gap-1">
            <FiMessageSquare className="w-3 h-3 text-indigo-500" /> Forum Question
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">Activity</Badge>;
    }
  };

  const formatRelativeOrTime = (isoString?: string, defaultStr?: string) => {
    if (!isoString) return defaultStr || 'Recently';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }) + ' IST';
    } catch {
      return defaultStr || 'Recently';
    }
  };

  return (
    <Card className="p-6 space-y-6 shadow-md border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-brand-50 dark:bg-brand-950 text-brand-600 rounded-xl">
            <FiActivity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Recent Student Activity Stream
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live updates on student enrollments, submissions, and course milestones.
            </p>
          </div>
        </div>

        <Badge variant={activities.length > 0 ? 'success' : 'neutral'} className="text-xs">
          {activities.length} Recent Events
        </Badge>
      </div>

      {activities.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FiClock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Student Activity Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            When students enroll in your courses or submit assignments, their actions will appear in this live feed.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {activities.map((activity, idx) => (
            <motion.div
              key={activity.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80"
            >
              {/* Timeline Dot */}
              <span className="absolute -left-[31px] top-5 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-900" />

              <div className="flex items-center gap-3">
                <img
                  src={activity.studentAvatar}
                  alt={activity.studentName}
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-brand-500/20"
                />
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {activity.studentName}
                    </span>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {activity.actionText}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                <p>{formatRelativeOrTime(activity.timestamp, activity.date)}</p>
                <p className="text-[10px] text-slate-500">{activity.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
};
