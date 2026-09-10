import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiVideo,
  FiArrowLeft,
  FiRefreshCw,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface LiveClassesHeaderProps {
  totalCount: number;
  liveNowCount: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  isEmptyState: boolean;
  onToggleEmptyState: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const LiveClassesHeader: React.FC<LiveClassesHeaderProps> = ({
  totalCount,
  liveNowCount,
  todayCount,
  upcomingCount,
  completedCount,
  isEmptyState,
  onToggleEmptyState,
  onRefresh,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back & Title */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/courses')}
            className="mt-1 flex items-center gap-1.5 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Back to My Courses"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Courses</span>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary" className="flex items-center gap-1">
                <FiVideo className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Live Virtual Classes Studio
              </Badge>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                <span>{totalCount} Total Sessions</span>
                <span>•</span>
                {liveNowCount > 0 && (
                  <>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      {liveNowCount} Live Now
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="text-brand-600 font-semibold">{todayCount} Today</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{upcomingCount} Upcoming</span>
                <span>•</span>
                <span className="text-slate-500">{completedCount} Completed</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Interactive Live Classes & Workshops
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Join real-time video lectures, participate in live Q&A reviews, and access recorded workshops.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEmptyState}
            className="text-xs flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
            title="Toggle Empty State Demo"
          >
            {isEmptyState ? (
              <FiToggleRight className="w-4 h-4 text-brand-600" />
            ) : (
              <FiToggleLeft className="w-4 h-4 text-slate-400" />
            )}
            <span>{isEmptyState ? 'Show Data' : 'Demo Empty'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs flex items-center gap-1.5"
            title="Refresh Schedule"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
