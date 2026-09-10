import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiSend,
  FiLock,
  FiArrowRight,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { quizService } from '../../services/quizService';
import { showWarningAlert } from '../../utils/swalAlerts';
import type { StudentAssignmentDetail } from '../../types';

interface AssignmentCardProps {
  assignment: StudentAssignmentDetail;
  onOpenDetails: (assignment: StudentAssignmentDetail) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onOpenDetails,
}) => {
  const {
    title,
    courseTitle,
    instructorName,
    instructorAvatar,
    totalPoints,
    category,
    isLocked,
  } = assignment;

  const attemptsUsed = assignment.attemptsUsed || assignment.submissionHistory?.length || 0;
  const maxAttempts = assignment.maxAttempts || 3;
  const passingMarks = assignment.passingMarks || 60;
  const isPassed = assignment.submissionHistory?.some(
    (sub) => sub.status === 'graded' && sub.grade !== undefined && sub.grade >= passingMarks
  ) || (assignment.status === 'graded' && assignment.grade !== undefined && assignment.grade >= passingMarks);
  const isWaiting = assignment.status === 'submitted' || assignment.status === 'under_review';

  const navigate = useNavigate();

  const handleContinueToQuiz = async () => {
    try {
      const res = await quizService.getStudentCourseQuiz(assignment.courseId);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        navigate(`/student/quizzes?courseId=${assignment.courseId}`);
      } else {
        showWarningAlert(
          'Quiz Not Available',
          'The quiz for this course is not yet published by your instructor.'
        );
      }
    } catch {
      navigate(`/student/quizzes?courseId=${assignment.courseId}`);
    }
  };

  const getStatusBadge = () => {
    if (isLocked) {
      return (
        <Badge variant="neutral" className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
          <FiLock className="w-3.5 h-3.5 text-amber-500" /> Locked
        </Badge>
      );
    }
    if (isWaiting) {
      return (
        <Badge variant="primary" className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <FiSend className="w-3.5 h-3.5" /> Under Review
        </Badge>
      );
    }
    if (isPassed) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <FiCheckCircle className="w-3.5 h-3.5" /> Passed ({assignment.grade ?? 0}/{totalPoints})
        </Badge>
      );
    }
    if (assignment.attemptRequestStatus === 'pending') {
      return (
        <Badge variant="warning" className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
          <FiClock className="w-3.5 h-3.5 text-amber-600" /> Reattempt Pending
        </Badge>
      );
    }
    if (assignment.attemptRequestStatus === 'approved' && attemptsUsed < maxAttempts) {
      return (
        <Badge variant="success" className="flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
          <FiCheckCircle className="w-3.5 h-3.5" /> Extra Attempt Approved
        </Badge>
      );
    }
    if (assignment.attemptRequestStatus === 'rejected') {
      return (
        <Badge variant="danger" className="flex items-center gap-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
          <FiClock className="w-3.5 h-3.5" /> Reattempt Rejected
        </Badge>
      );
    }
    if (attemptsUsed > 0) {
      return (
        <Badge variant="danger" className="flex items-center gap-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <FiClock className="w-3.5 h-3.5" /> Failed ({assignment.grade ?? 0}/{totalPoints})
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" className="flex items-center gap-1">
        <FiClock className="w-3.5 h-3.5" /> Pending
      </Badge>
    );
  };

  return (
    <Card hoverEffect className={`flex flex-col justify-between h-full space-y-4 p-5 border ${isLocked ? 'border-amber-200 dark:border-amber-900/60 bg-slate-50/40 dark:bg-slate-900/40' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="space-y-3">
        {/* Header: Course Category & Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="primary">{category || 'Coursework'}</Badge>
          {getStatusBadge()}
        </div>

        {/* Course & Assignment Titles */}
        <div>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 block truncate">
            {courseTitle}
          </span>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2 mt-0.5">
            {title}
          </h3>
        </div>

        {/* Instructor Info */}
        <div className="flex items-center gap-2 pt-1">
          {instructorAvatar ? (
            <img
              src={instructorAvatar}
              alt={instructorName}
              className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-bold">
              {instructorName.charAt(0)}
            </div>
          )}
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
            {instructorName}
          </span>
        </div>

        {/* Assignment Meta Details: Points, Passing Marks, Attempts */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[11px] text-slate-400 block font-normal">Max Score</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {totalPoints} pts
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-normal">Passing</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {passingMarks} pts
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-normal">Attempts</span>
            <span className="font-bold text-brand-600 dark:text-brand-400 font-mono">
              {attemptsUsed} / {maxAttempts}
            </span>
          </div>
        </div>

        {/* Locked Notice Banner */}
        {isLocked && (
          <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-900 rounded-xl text-xs text-amber-950 dark:text-amber-200 space-y-1.5 shadow-xs">
            <div className="flex items-start gap-1.5 font-bold">
              <FiLock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>Complete all course lessons before submitting this assignment.</span>
            </div>
            {assignment.totalLessons !== undefined && (
              <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 pt-0.5 border-t border-amber-200/60 dark:border-amber-900/60 font-semibold">
                <span>Lessons Completed:</span>
                <span className="font-mono font-bold">
                  {assignment.completedLessons ?? 0} / {assignment.totalLessons}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isLocked}
            onClick={() => onOpenDetails(assignment)}
            className="w-full justify-center text-xs flex items-center gap-1 disabled:opacity-50"
          >
            <FiFileText className="w-3.5 h-3.5" />
            <span>View Details</span>
          </Button>

          {isPassed ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleContinueToQuiz}
              className="w-full justify-center text-xs flex items-center gap-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              <span>Continue to Quiz</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : isWaiting ? (
            <Button
              variant="outline"
              size="sm"
              disabled={true}
              className="w-full justify-center text-xs flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 cursor-not-allowed opacity-90"
            >
              <FiClock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span className="truncate">Waiting for Grade</span>
            </Button>
          ) : attemptsUsed > 0 && attemptsUsed < maxAttempts ? (
            <Button
              variant="primary"
              size="sm"
              disabled={isLocked}
              onClick={() => onOpenDetails(assignment)}
              className="w-full justify-center text-xs flex items-center gap-1.5 shadow-sm font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            >
              <FiSend className="w-3.5 h-3.5" />
              <span>Resubmit Assignment</span>
            </Button>
          ) : attemptsUsed >= maxAttempts ? (
            <Button
              variant="outline"
              size="sm"
              disabled={true}
              className="w-full justify-center text-xs flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 cursor-not-allowed opacity-90"
            >
              <FiClock className="w-3.5 h-3.5 text-rose-500" />
              <span className="truncate">Max Attempts Reached</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={isLocked}
              onClick={() => onOpenDetails(assignment)}
              className="w-full justify-center text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              <FiSend className="w-3.5 h-3.5" />
              <span>Submit Assignment</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
