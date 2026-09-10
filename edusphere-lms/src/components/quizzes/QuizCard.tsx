import React from 'react';
import {
  FiClock,
  FiHelpCircle,
  FiCheckCircle,
  FiXCircle,
  FiPlay,
  FiChevronRight,
  FiAward,
  FiFileText,
  FiLock,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { StudentQuizDetail } from '../../types';

interface QuizCardProps {
  quiz: StudentQuizDetail;
  onOpenDetails: (quiz: StudentQuizDetail) => void;
  onStartQuiz: (quiz: StudentQuizDetail) => void;
  onViewResult: (quiz: StudentQuizDetail) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onOpenDetails,
  onStartQuiz,
  onViewResult,
}) => {
  const {
    title,
    courseTitle,
    instructorName,
    instructorAvatar,
    category,
    difficulty,
    description,
    questionsCount,
    timeLimitMinutes,
    passingScore,
    totalPoints,
    status,
    lastScore,
    isLocked,
    lockReason,
    attemptsUsed,
    maxAttempts = 3,
    attemptRequestStatus = 'none',
  } = quiz;

  const getStatusBadge = () => {
    if (isLocked) {
      return (
        <Badge variant="neutral" className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
          <FiLock className="w-3.5 h-3.5 text-amber-500" /> Locked
        </Badge>
      );
    }
    if (attemptRequestStatus === 'approved' && attemptsUsed < maxAttempts && status !== 'passed') {
      return (
        <Badge variant="success" className="flex items-center gap-1 font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Extra Attempt Approved
        </Badge>
      );
    }
    if (attemptsUsed >= maxAttempts && status === 'failed') {
      if (attemptRequestStatus === 'pending') {
        return (
          <Badge variant="warning" className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300">
            <FiClock className="w-3.5 h-3.5 text-amber-600" /> Request Pending
          </Badge>
        );
      }
      if (attemptRequestStatus === 'rejected') {
        return (
          <Badge variant="danger" className="flex items-center gap-1 font-bold">
            <FiXCircle className="w-3.5 h-3.5" /> Request Rejected
          </Badge>
        );
      }
      return (
        <Badge variant="danger" className="flex items-center gap-1 font-bold">
          <FiLock className="w-3.5 h-3.5" /> Quiz Locked ({attemptsUsed}/{maxAttempts} Used)
        </Badge>
      );
    }
    switch (status) {
      case 'passed':
        return (
          <Badge variant="success" className="flex items-center gap-1 font-bold">
            <FiCheckCircle className="w-3.5 h-3.5" /> Passed ({lastScore || 85}%)
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" className="flex items-center gap-1 font-bold">
            <FiXCircle className="w-3.5 h-3.5" /> Failed ({lastScore || 60}%)
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <FiClock className="w-3.5 h-3.5" /> In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="primary" className="flex items-center gap-1">
            <FiHelpCircle className="w-3.5 h-3.5" /> Available
          </Badge>
        );
    }
  };

  return (
    <Card hoverEffect className={`flex flex-col justify-between h-full space-y-4 p-5 border ${isLocked ? 'border-amber-200 dark:border-amber-900/60 bg-slate-50/40 dark:bg-slate-900/40' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Badge variant="primary">{category}</Badge>
            <Badge variant="neutral">{difficulty}</Badge>
          </div>
          {getStatusBadge()}
        </div>

        {/* Quiz Title */}
        <h3
          onClick={() => !isLocked && onOpenDetails(quiz)}
          className={`font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1 transition-colors ${isLocked ? 'cursor-not-allowed opacity-75' : 'hover:text-brand-600 cursor-pointer'}`}
        >
          {title}
        </h3>

        {/* Course & Instructor */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 line-clamp-1">
            {courseTitle}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <img
              src={instructorAvatar}
              alt={instructorName}
              className="w-4 h-4 rounded-full object-cover border border-slate-300 dark:border-slate-600"
            />
            <span className="line-clamp-1">{instructorName}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Locked Notice Banner */}
        {isLocked && (
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <div className="flex items-start gap-1.5 font-bold">
              <FiLock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>🔒 {lockReason || 'Complete all mandatory assignments to unlock quizzes.'}</span>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl grid grid-cols-4 gap-1 text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Questions</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{questionsCount} Qs</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Duration</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{timeLimitMinutes} Mins</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Pass Mark</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{passingScore}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Attempt</span>
            <span className={`font-bold ${attemptsUsed >= maxAttempts && status === 'failed' ? 'text-rose-600' : 'text-brand-600 dark:text-brand-400'}`}>
              {attemptsUsed}/{maxAttempts}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
            Self-Paced
          </span>

          <div className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
            <FiAward className="w-3.5 h-3.5 text-purple-500" />
            <span>{totalPoints} Marks</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isLocked}
            onClick={() => onOpenDetails(quiz)}
            className="w-full justify-center text-xs flex items-center gap-1 disabled:opacity-50"
          >
            <FiFileText className="w-3.5 h-3.5" />
            <span>Details</span>
          </Button>

          {status === 'passed' || status === 'failed' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onViewResult(quiz)}
              className="w-full justify-center text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <span>View Result</span>
              <FiChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={isLocked}
              onClick={() => onStartQuiz(quiz)}
              className="w-full justify-center text-xs flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 font-bold"
            >
              {isLocked ? (
                <span>🔒 Locked</span>
              ) : (
                <>
                  <FiPlay className="w-3.5 h-3.5 fill-current" />
                  <span>Take Quiz</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
