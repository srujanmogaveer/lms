import React from 'react';
import {
  FiClock,
  FiChevronRight,
} from 'react-icons/fi';
import { Badge } from '../ui/Badge';
import type { StudentAssignmentDetail } from '../../types';

interface UpcomingDeadlinesSidebarProps {
  assignments: StudentAssignmentDetail[];
  onOpenDetails: (assignment: StudentAssignmentDetail) => void;
}

export const UpcomingDeadlinesSidebar: React.FC<UpcomingDeadlinesSidebarProps> = ({
  assignments,
  onOpenDetails,
}) => {
  const pendingAssignments = assignments.filter((a) => a.status === 'pending');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
          <FiClock className="w-4 h-4 text-brand-500" />
          <span>Pending Assignments</span>
        </h3>
        <Badge variant="primary">{pendingAssignments.length} Pending</Badge>
      </div>

      {pendingAssignments.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400 space-y-1">
          <FiClock className="w-6 h-6 mx-auto text-emerald-500" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">All Coursework Complete!</p>
          <p>No pending self-paced assignments remaining.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingAssignments.map((asg) => (
            <div
              key={asg.id}
              onClick={() => !asg.isLocked && onOpenDetails(asg)}
              className={`p-3.5 rounded-xl border transition-colors space-y-2 group ${
                asg.isLocked
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 cursor-not-allowed opacity-75'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h4 className={`font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1 ${!asg.isLocked ? 'group-hover:text-brand-600' : ''}`}>
                    {asg.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                    {asg.courseTitle}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                  asg.isLocked
                    ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800'
                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900'
                }`}>
                  {asg.isLocked ? 'Locked' : 'Self-Paced'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                {asg.isLocked && asg.totalLessons !== undefined ? (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    Lessons: {asg.completedLessons ?? 0}/{asg.totalLessons}
                  </span>
                ) : (
                  <span>Max Points: {asg.totalPoints}</span>
                )}
                <span className={`font-semibold flex items-center gap-0.5 ${asg.isLocked ? 'text-slate-400' : 'text-brand-600 dark:text-brand-400'}`}>
                  {asg.isLocked ? 'Complete Lessons' : 'Submit Now'} <FiChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
