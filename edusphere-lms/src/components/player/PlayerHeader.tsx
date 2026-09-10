import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiAward,
  FiClock,
  FiBookOpen,
  FiCheckCircle,
  FiShare2,
  FiStar,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import type { Course } from '../../types';


interface PlayerHeaderProps {
  course: Course;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  onOpenCertificateModal: () => void;
  onShareCourse?: () => void;
  onRateCourse?: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  course,
  progressPercentage,
  completedLessonsCount,
  totalLessonsCount,
  onOpenCertificateModal,
  onShareCourse,
  onRateCourse,
}) => {

  const navigate = useNavigate();
  const isCompleted = progressPercentage >= 100;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back Button & Course Info */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/courses')}
            className="mt-1 flex items-center gap-1.5 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Back to My Courses"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to My Courses</span>
          </Button>

          <div className="flex items-start gap-3">
            <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hidden xs:block">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary">{course.category}</Badge>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <FiClock className="w-3.5 h-3.5 text-slate-400" /> Updated {course.updatedAt}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
                {course.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <img
                    src={course.instructorAvatar}
                    alt={course.instructorName}
                    className="w-5 h-5 rounded-full object-cover border border-brand-500"
                  />
                  <span>{course.instructorName}</span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <FiBookOpen className="w-3.5 h-3.5" /> {totalLessonsCount} Lessons Total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Progress Summary & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="w-full sm:w-48 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1">
                {isCompleted ? (
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  'Course Progress'
                )}
              </span>
              <span className={isCompleted ? 'text-emerald-600 font-extrabold' : 'text-brand-600 dark:text-brand-400'}>
                {progressPercentage}%
              </span>
            </div>
            <ProgressBar
              progress={progressPercentage}
              size="md"
              color={isCompleted ? 'emerald' : 'brand'}
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
              {completedLessonsCount} of {totalLessonsCount} lessons completed
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isCompleted ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(course?.id ? `/student/assignments/${course.id}` : '/student/assignments')}
                className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 w-full sm:w-auto justify-center shadow-md font-bold"
              >
                <FiBookOpen className="w-4 h-4" />
                Complete Assignment
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCertificateModal}
                disabled={!isCompleted}
                className="flex items-center gap-1.5 opacity-70 cursor-not-allowed w-full sm:w-auto justify-center"
                title="Complete all lessons to unlock certificate"
              >
                <FiAward className="w-4 h-4 text-slate-400" />
                Certificate Locked
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/student/chat?courseId=${course.id}`)}
              className="flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 w-full sm:w-auto justify-center text-slate-700 dark:text-slate-200"
              title="Chat with course instructor"
            >
              <FiBookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Ask Instructor</span>
            </Button>

            {onRateCourse && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRateCourse}
                className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 w-full sm:w-auto justify-center font-bold"
                title="Rate and review this course"
              >
                <FiStar className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Rate Course</span>
              </Button>
            )}

            {onShareCourse && (

              <button
                onClick={onShareCourse}
                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shrink-0"
                title="Share Course"
                aria-label="Share Course"
              >
                <FiShare2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
