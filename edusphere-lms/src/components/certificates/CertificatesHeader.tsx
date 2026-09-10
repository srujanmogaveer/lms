import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAward,
  FiArrowLeft,
  FiRefreshCw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CertificatesHeaderProps {
  totalCount: number;
  earnedCount: number;
  pendingCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const CertificatesHeader: React.FC<CertificatesHeaderProps> = ({
  totalCount,
  earnedCount,
  pendingCount,
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
              <Badge variant="primary" className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                <FiAward className="w-3.5 h-3.5 text-amber-500" /> Official Academic Certificates Studio
              </Badge>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                <span>{totalCount} Total Courses</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{earnedCount} Earned Certificates</span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">{pendingCount} In Progress</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              My Verified Course Certificates & Credentials
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Certificates are unlocked automatically when you reach 100% lesson progress, submit all mandatory assignments, and pass all course quizzes.
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
            title="Refresh Feed"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
