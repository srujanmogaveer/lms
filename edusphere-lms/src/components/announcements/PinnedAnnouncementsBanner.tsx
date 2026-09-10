import React from 'react';
import {
  FiStar,
  FiChevronRight,
  FiAlertCircle,
} from 'react-icons/fi';
import { Badge } from '../ui/Badge';
import type { StudentAnnouncement } from '../../types';

interface PinnedAnnouncementsBannerProps {
  pinnedAnnouncements: StudentAnnouncement[];
  onOpenDetails: (announcement: StudentAnnouncement) => void;
}

export const PinnedAnnouncementsBanner: React.FC<PinnedAnnouncementsBannerProps> = ({
  pinnedAnnouncements,
  onOpenDetails,
}) => {
  if (pinnedAnnouncements.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 border border-amber-300/80 dark:border-amber-900/60 p-5 rounded-2xl space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2">
          <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Pinned & Critical Broadcasts ({pinnedAnnouncements.length})</span>
        </h3>
        <Badge variant="warning">Top Priority</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pinnedAnnouncements.map((anc) => (
          <div
            key={anc.id}
            onClick={() => onOpenDetails(anc)}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 transition-colors cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span className="font-bold text-brand-600 dark:text-brand-400 truncate">
                {anc.courseTitle || 'System Announcement'}
              </span>
              {anc.isImportant && (
                <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-0.5 shrink-0">
                  <FiAlertCircle className="w-3 h-3" /> Important
                </span>
              )}
            </div>

            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1 group-hover:text-brand-600 transition-colors">
              {anc.title}
            </h4>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
              <span>{anc.date}</span>
              <span className="text-brand-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                Read Notice <FiChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
