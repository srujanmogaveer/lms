import React from 'react';
import { motion } from 'framer-motion';
import { FiVolume2, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Announcement } from '../../types';

interface RecentAnnouncementsSectionProps {
  announcements: Announcement[];
  onOpenAnnouncement: (announcement: Announcement) => void;
}

export const RecentAnnouncementsSection: React.FC<RecentAnnouncementsSectionProps> = ({
  announcements,
  onOpenAnnouncement,
}) => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiVolume2 className="w-5 h-5 text-amber-500" />
            Recent Announcements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Important course updates and platform notices</p>
        </div>
      </div>

      <div className="space-y-3">
        {announcements.map((ann, idx) => (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all space-y-2 group"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2">
                {ann.isImportant && <Badge variant="danger">Important</Badge>}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FiCalendar className="w-3.5 h-3.5" />
                  {ann.date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <img src={ann.authorAvatar} alt={ann.authorName} className="w-4 h-4 rounded-full object-cover" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{ann.authorName}</span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-600 transition-colors">
              {ann.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {ann.content}
            </p>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => onOpenAnnouncement(ann)}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>Read More</span>
                <FiArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
