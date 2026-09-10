import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiFileText, FiHelpCircle, FiVideo, FiArrowRight } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Assignment, Quiz, LiveClass } from '../../types';

interface UpcomingActivitiesSectionProps {
  assignments: Assignment[];
  quizzes: Quiz[];
  liveClasses: LiveClass[];
  onSelectActivity: (type: string, title: string) => void;
}

export const UpcomingActivitiesSection: React.FC<UpcomingActivitiesSectionProps> = ({
  assignments,
  quizzes,
  liveClasses,
  onSelectActivity,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'assignments' | 'quizzes' | 'live'>('all');

  const pendingAssignments = assignments.filter((a) => a.status === 'pending');
  const pendingQuizzes = quizzes.filter((q) => q.status === 'not_started');

  const allActivities = [
    ...pendingAssignments.map((a) => ({
      id: a.id,
      category: 'assignment' as const,
      title: a.title,
      courseTitle: a.courseTitle,
      dueDate: 'Self-Paced',
      badgeText: 'Assignment',
      badgeVariant: 'primary' as const,
      icon: FiFileText,
      metaText: `${a.totalPoints} Points`,
      actionLabel: 'Submit Assignment',
    })),
    ...pendingQuizzes.map((q) => ({
      id: q.id,
      category: 'quiz' as const,
      title: q.title,
      courseTitle: q.courseTitle,
      dueDate: 'Self-Paced',
      badgeText: 'Quiz',
      badgeVariant: 'warning' as const,
      icon: FiHelpCircle,
      metaText: `${q.timeLimitMinutes} Mins · ${q.questionsCount} Qs`,
      actionLabel: 'Start Quiz',
    })),
    ...liveClasses.map((lc) => ({
      id: lc.id,
      category: 'live' as const,
      title: lc.topic,
      courseTitle: lc.courseTitle,
      dueDate: new Date(lc.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      badgeText: 'Live Workshop',
      badgeVariant: 'danger' as const,
      icon: FiVideo,
      metaText: `Hosted by ${lc.instructorName}`,
      actionLabel: 'Join Session',
    })),
  ];

  const filteredActivities = activeFilter === 'all'
    ? allActivities
    : allActivities.filter((act) => act.category === activeFilter);

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Upcoming Deadlines & Live Classes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Assignments, quizzes, and webinars due soon</p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'assignments', 'quizzes', 'live'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          No upcoming activities found for this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((act) => {
            const Icon = act.icon;
            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-300 dark:hover:border-brand-800 transition-colors shadow-sm"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    act.category === 'live'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                      : act.category === 'quiz'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                      : 'bg-brand-100 dark:bg-brand-950 text-brand-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={act.badgeVariant}>{act.badgeText}</Badge>
                      <span className="text-xs text-slate-500 font-medium truncate">{act.courseTitle}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                      {act.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-rose-500 dark:text-rose-400">
                        <FiClock className="w-3.5 h-3.5" /> Due: {act.dueDate}
                      </span>
                      <span>•</span>
                      <span>{act.metaText}</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto shrink-0 justify-center"
                  onClick={() => onSelectActivity(act.category, act.title)}
                >
                  <span>{act.actionLabel}</span>
                  <FiArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
