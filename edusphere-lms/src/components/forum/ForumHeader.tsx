import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMessageSquare,
  FiArrowLeft,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ForumHeaderProps {
  totalDiscussions: number;
  activeDiscussions: number;
  myDiscussionsCount: number;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  isLoading: boolean;
}

export const ForumHeader: React.FC<ForumHeaderProps> = ({
  totalDiscussions,
  activeDiscussions,
  myDiscussionsCount,
  onRefresh,
  onOpenCreateModal,
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
                <FiMessageSquare className="w-3.5 h-3.5" /> Peer & Instructor Community Forum
              </Badge>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                <span>{totalDiscussions} Total Discussions</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{activeDiscussions} Active Threads</span>
                <span>•</span>
                <span className="text-brand-600 font-semibold">{myDiscussionsCount} My Posts</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Student Discussion Forum
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask questions, share code solutions, collaborate on coursework, and get instructor feedback.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs flex items-center gap-1.5"
            title="Refresh Discussions Feed"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 text-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>Ask New Question</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
