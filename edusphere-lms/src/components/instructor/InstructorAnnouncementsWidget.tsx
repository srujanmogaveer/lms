import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiVolume2, FiCalendar, FiBookmark, FiPlus } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { announcementService } from '../../services/announcementService';
import type { AnnouncementItem } from '../../types';

interface InstructorAnnouncementsWidgetProps {
  onNewAnnouncement: () => void;
}

export const InstructorAnnouncementsWidget: React.FC<InstructorAnnouncementsWidgetProps> = ({
  onNewAnnouncement,
}) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await announcementService.getAnnouncements();
        if (isMounted && Array.isArray(data)) {
          setAnnouncements(data);
        }
      } catch {
        if (isMounted) setAnnouncements([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="p-6 space-y-4 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
              <FiVolume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Recent Course Announcements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Broadcasting announcements to enrolled students.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onNewAnnouncement}
            className="text-xs font-bold"
          >
            <FiPlus className="w-3.5 h-3.5 mr-1" /> New Post
          </Button>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No announcements posted yet</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Share updates, schedules, and important alerts with students across your active courses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 3).map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ x: 2 }}
                className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral" size="sm" className="truncate max-w-[200px]">
                    {item.courseTitle || 'All Enrolled Courses'}
                  </Badge>
                  {item.isPinned && (
                    <Badge variant="warning" size="sm" className="flex items-center gap-1">
                      <FiBookmark className="w-3 h-3" /> Pinned
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                  {item.title}
                </h3>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3 h-3 text-brand-500" /> {item.date}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
