import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiArrowLeft,
  FiRefreshCw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface AssignmentHeaderProps {
  totalCount: number;
  pendingCount: number;
  submittedCount: number;
  gradedCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AssignmentHeader: React.FC<AssignmentHeaderProps> = ({
  totalCount,
  pendingCount,
  submittedCount,
  gradedCount,
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
                <FiFileText className="w-3.5 h-3.5" /> Student Assignments Studio
              </Badge>
            <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs text-slate-500">
              <span>{totalCount} Total Coursework</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{pendingCount} Pending</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{submittedCount} Submitted</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">{gradedCount} Evaluated</span>
            </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              My Course Assignments
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit coursework, track grading feedback, and monitor upcoming project deadlines.
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs flex items-center gap-1.5"
            title="Refresh Assignments List"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
