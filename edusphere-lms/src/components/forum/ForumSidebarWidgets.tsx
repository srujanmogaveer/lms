import React from 'react';
import {
  FiTrendingUp,
  FiUserCheck,
  FiChevronRight,
  FiCheckCircle,
} from 'react-icons/fi';
import { Badge } from '../ui/Badge';
import type { StudentForumDiscussion } from '../../types';

interface ForumSidebarWidgetsProps {
  discussions: StudentForumDiscussion[];
  onOpenDetails: (discussion: StudentForumDiscussion) => void;
  currentUserId?: string;
}

export const ForumSidebarWidgets: React.FC<ForumSidebarWidgetsProps> = ({
  discussions,
  onOpenDetails,
  currentUserId = '',
}) => {
  const popularDiscussions = [...discussions]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 3);

  const myDiscussions = discussions
    .filter((d) => d.authorId === currentUserId)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Popular Discussions Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Popular Discussions</span>
          </h3>
          <Badge variant="primary">Trending</Badge>
        </div>

        <div className="space-y-3">
          {popularDiscussions.map((disc) => (
            <div
              key={disc.id}
              onClick={() => onOpenDetails(disc)}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 transition-colors cursor-pointer space-y-1.5 group"
            >
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block line-clamp-1">
                {disc.courseTitle}
              </span>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                {disc.title}
              </h4>
              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                <span>{disc.viewsCount} Views • {disc.repliesCount} Replies</span>
                <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-brand-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. My Discussions Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <FiUserCheck className="w-4 h-4 text-emerald-600" />
            <span>My Post Activity</span>
          </h3>
          <Badge variant="success">{myDiscussions.length} Threads</Badge>
        </div>

        {myDiscussions.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">
            You haven't posted any questions yet. Click "Ask New Question" to create your first thread.
          </p>
        ) : (
          <div className="space-y-3">
            {myDiscussions.map((disc) => (
              <div
                key={disc.id}
                onClick={() => onOpenDetails(disc)}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-brand-400 transition-colors cursor-pointer space-y-1.5 group"
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-semibold text-slate-500">{disc.category}</span>
                  {disc.isSolved && (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <FiCheckCircle className="w-3 h-3" /> Solved
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1 group-hover:text-brand-600 transition-colors">
                  {disc.title}
                </h4>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>{disc.createdAt}</span>
                  <span className="text-brand-600 font-semibold">{disc.repliesCount} Replies</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
