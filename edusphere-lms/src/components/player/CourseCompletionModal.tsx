import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../feedback/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FiBookOpen, FiLock, FiChevronRight, FiCheckCircle, FiStar } from 'react-icons/fi';
import type { Course } from '../../types';

interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onRateCourse?: () => void;
}

export const CourseCompletionModal: React.FC<CourseCompletionModalProps> = ({
  isOpen,
  onClose,
  course,
  onRateCourse,
}) => {
  const navigate = useNavigate();

  const handleGoToAssignments = () => {
    onClose();
    navigate(course?.id ? `/student/assignments/${course.id}` : '/student/assignments');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lessons Completed & Assignments Unlocked">
      <div className="space-y-5 text-center py-2">
        {/* Big Unlocked Badge */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
          <FiBookOpen className="w-10 h-10 text-white" />
          <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
            <FiCheckCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <Badge variant="success" className="px-3 py-1 text-xs font-bold">
            100% Course Lessons Completed
          </Badge>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Congratulations on completing {course?.title || 'the course'}!
          </h3>

          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 max-w-md mx-auto leading-relaxed p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-900">
            "Congratulations! You have completed all lessons. Please complete the mandatory assignments to continue."
          </p>
        </div>

        {/* Progression Checklist Status */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2 font-medium">
          <div className="flex justify-between items-center text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-700 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <FiCheckCircle className="w-4 h-4" /> 1. Course Lessons (100%)
            </span>
            <span className="font-bold text-emerald-600">UNLOCKED</span>
          </div>

          <div className="flex justify-between items-center text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-700 pb-2">
            <span className="flex items-center gap-1.5 font-bold text-brand-600">
              <FiBookOpen className="w-4 h-4" /> 2. Mandatory Assignments
            </span>
            <Badge variant="primary">UNLOCKED NOW</Badge>
          </div>

          <div className="flex justify-between items-center text-slate-500 opacity-60">
            <span className="flex items-center gap-1.5">
              <FiLock className="w-4 h-4" /> 3. Mandatory Quizzes
            </span>
            <span>🔒 Locked (Requires Assignments)</span>
          </div>

          <div className="flex justify-between items-center text-slate-500 opacity-60">
            <span className="flex items-center gap-1.5">
              <FiLock className="w-4 h-4" /> 4. Official Certificate
            </span>
            <span>🔒 Locked (Requires Quizzes)</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleGoToAssignments}
            className="w-full justify-center bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 font-bold text-xs"
          >
            <span>Complete Assignment</span>
            <FiChevronRight className="w-4 h-4" />
          </Button>

          {onRateCourse && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                onClose();
                onRateCourse();
              }}
              className="w-full sm:w-auto justify-center text-xs border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-1.5 font-bold"
            >
              <FiStar className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Rate Course</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto justify-center text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
