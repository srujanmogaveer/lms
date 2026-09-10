import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHelpCircle,
  FiArrowLeft,
  FiRefreshCw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface QuizHeaderProps {
  totalCount: number;
  availableCount: number;
  completedCount: number;
  passedCount: number;
  failedCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  totalCount,
  availableCount,
  completedCount,
  passedCount,
  failedCount,
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
                <FiHelpCircle className="w-3.5 h-3.5" /> Quizzes & Assessment Studio
              </Badge>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <span>{totalCount} Total Quizzes</span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">{availableCount} Available</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{completedCount} Completed</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{passedCount} Passed</span>
                {failedCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-semibold">{failedCount} Failed</span>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Quizzes & Knowledge Verification
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test your skills, satisfy course certificate criteria, and track performance metrics.
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
            title="Refresh Quizzes List"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
