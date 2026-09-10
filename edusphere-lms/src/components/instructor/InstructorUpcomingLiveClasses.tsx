import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiCalendar, FiClock, FiUsers, FiPlayCircle, FiPlusCircle } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  type UpcomingInstructorLiveClass,
} from '../../data/instructorDummyData';
import { liveClassService, type BackendLiveClass } from '../../services/liveClassService';

interface InstructorUpcomingLiveClassesProps {
  onJoinLiveClass: (liveClass: UpcomingInstructorLiveClass) => void;
}

export const InstructorUpcomingLiveClasses: React.FC<InstructorUpcomingLiveClassesProps> = ({
  onJoinLiveClass,
}) => {
  const navigate = useNavigate();
  const [liveClasses, setLiveClasses] = useState<UpcomingInstructorLiveClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: BackendLiveClass[] = await liveClassService.getInstructorLiveClasses();
      const scheduledOnly = (data || []).filter(
        (c) => c.status === 'Scheduled' || c.status === 'Live'
      );

      const mapped: UpcomingInstructorLiveClass[] = scheduledOnly.map((c) => {
        const start = c.startTime ? new Date(c.startTime) : new Date();
        const dateStr = start.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        });
        const timeStr = start.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }) + ' IST';

        return {
          id: c.id,
          courseTitle: c.courseTitle || 'Live Course Session',
          topic: c.title,
          date: dateStr,
          timeIST: timeStr,
          duration: `${c.durationMinutes || 60} mins`,
          enrolledCount: c.enrolledStudentsCount || 0,
          roomId: c.meetingUrl || c.meetingId || c.id,
          status: c.status === 'Live' ? 'live' : 'scheduled',
        };
      });

      setLiveClasses(mapped);
    } catch (err: any) {
      setError(err?.message || 'Unable to load scheduled live classes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  return (
    <Card className="p-6 space-y-6 shadow-md border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950 text-cyan-600 rounded-xl">
            <FiVideo className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Upcoming Scheduled Live Classes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive video studio sessions scheduled in Asia/Kolkata (IST) time zone.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" className="bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
            {liveClasses.length} Sessions Scheduled
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/instructor/live-classes')}
            className="text-xs font-bold"
          >
            <FiPlusCircle className="w-3.5 h-3.5 mr-1" /> Schedule Class
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Loading scheduled live classes...
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs text-rose-500 space-y-1">
          <p className="font-bold">Unable to load live classes.</p>
          <p className="text-[11px]">{error}</p>
        </div>
      ) : liveClasses.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center mx-auto">
            <FiVideo className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Live Classes Scheduled</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Schedule your next interactive live studio class to engage directly with enrolled students.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/instructor/live-classes')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
          >
            <FiPlusCircle className="w-4 h-4 mr-1.5" /> Schedule Live Class Now
          </Button>
        </div>
      ) : (
        /* Grid of Live Classes */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveClasses.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.01 }}
              className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="neutral" size="sm" className="truncate max-w-[200px]">
                    {item.courseTitle}
                  </Badge>
                  <span className={`text-[11px] font-mono font-bold ${
                    item.status === 'live' ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-cyan-600 dark:text-cyan-400'
                  }`}>
                    {item.status === 'live' ? '🔴 LIVE NOW' : 'IST (Asia/Kolkata)'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                  {item.topic}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 text-brand-500" />
                    <span>Date: <strong>{item.date}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Time: <strong>{item.timeIST}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <FiUsers className="w-3.5 h-3.5 text-indigo-500" /> {item.enrolledCount} Students RSVP'd
                </span>

                <Button
                  size="sm"
                  variant="primary"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-500/20"
                  onClick={() => onJoinLiveClass(item)}
                >
                  <FiPlayCircle className="w-4 h-4 mr-1.5" /> Join Live Studio
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
};
