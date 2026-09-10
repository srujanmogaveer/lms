import React from 'react';
import {
  FiPlayCircle,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiFileText,
  FiHelpCircle,
  FiBell,
  FiMessageSquare,
  FiVideo,
  FiAward,
  FiEye,
  FiUser,
  FiCalendar,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Avatar } from '../common/Avatar';
import type { EnrolledCourseDetail } from '../../types';

interface MyCourseCardProps {
  item: EnrolledCourseDetail;
  onContinueLearning: (item: EnrolledCourseDetail) => void;
  onViewDetails: (item: EnrolledCourseDetail) => void;
  onViewInstructor: (item: EnrolledCourseDetail) => void;
  onViewCertificate: (item: EnrolledCourseDetail) => void;
  onQuickNav: (navId: string, item: EnrolledCourseDetail) => void;
}

export const MyCourseCard: React.FC<MyCourseCardProps> = ({
  item,
  onContinueLearning,
  onViewDetails,
  onViewInstructor,
  onViewCertificate,
  onQuickNav,
}) => {
  const { course, enrollmentStatus, progress, completedLessons, totalLessons, lastAccessedLesson, lastAccessedTime, enrolledDate } = item;

  const quickNavItems = [
    { id: 'lessons', label: 'Lessons', icon: FiBookOpen },
    { id: 'assignments', label: 'Assignments', icon: FiFileText },
    { id: 'quizzes', label: 'Quizzes', icon: FiHelpCircle },
    { id: 'announcements', label: 'Announcements', icon: FiBell },
    { id: 'forum', label: 'Forum', icon: FiMessageSquare },
    { id: 'chat', label: 'Chat', icon: FiMessageSquare },
    { id: 'live', label: 'Live Class', icon: FiVideo },
    { id: 'certificate', label: 'Certificate', icon: FiAward },
  ];

  return (
    <Card hoverEffect className="flex flex-col justify-between h-full space-y-4 p-5 border border-slate-200 dark:border-slate-800">
      <div className="space-y-4">
        {/* Header: Thumbnail + Category & Status Badges */}
        <div className="relative overflow-hidden rounded-xl h-44 w-full group">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={() => onViewDetails(item)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-2.5 left-2.5">
            <Badge variant="primary">{course.category}</Badge>
          </div>

          <div className="absolute top-2.5 right-2.5">
            {enrollmentStatus === 'completed' ? (
              <Badge variant="success" className="flex items-center gap-1 shadow-md">
                <FiCheckCircle className="w-3.5 h-3.5" /> Completed
              </Badge>
            ) : enrollmentStatus === 'in_progress' ? (
              <Badge variant="warning" className="flex items-center gap-1 shadow-md">
                <FiPlayCircle className="w-3.5 h-3.5" /> In Progress
              </Badge>
            ) : (
              <Badge variant="neutral" className="bg-slate-900/70 text-white border-0 backdrop-blur-sm">
                Not Started
              </Badge>
            )}
          </div>

          <div className="absolute bottom-2.5 left-2.5 text-[11px] font-medium text-white/90 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
            <FiClock className="w-3 h-3 text-amber-300" /> {lastAccessedTime}
          </div>
        </div>

        {/* Title & Instructor */}
        <div className="space-y-1">
          <h3
            onClick={() => onViewDetails(item)}
            className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1 hover:text-brand-600 transition-colors cursor-pointer"
          >
            {course.title}
          </h3>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <button
              onClick={() => onViewInstructor(item)}
              className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors"
            >
              <Avatar
                src={course.instructorAvatar}
                name={course.instructorName}
                role="instructor"
                size="xs"
              />
              <span>{course.instructorName}</span>
            </button>

            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <FiCalendar className="w-3 h-3" /> Enrolled {enrolledDate}
            </span>
          </div>
        </div>

        {/* Progress Bar & Current Lesson Block */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Progress ({completedLessons}/{totalLessons} Lessons)
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{progress}%</span>
          </div>

          <ProgressBar progress={progress} size="md" color={progress === 100 ? 'emerald' : 'brand'} />

          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-start gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">Current:</span>
            <span className="truncate">{lastAccessedLesson}</span>
          </div>
        </div>

        {/* Quick Navigation Toolbar Shortcuts */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
            Course Module Shortcuts:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {quickNavItems.map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => onQuickNav(nav.id, item)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-300 text-slate-600 dark:text-slate-300 hover:text-brand-600 flex flex-col items-center justify-center space-y-0.5 transition-all text-center group"
                  title={`Open ${nav.label}`}
                >
                  <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-semibold line-clamp-1">{nav.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary Actions Footer */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {enrollmentStatus === 'completed' ? (
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white font-extrabold"
            onClick={() => onViewCertificate(item)}
          >
            <FiAward className="w-4 h-4 mr-1.5" /> View Completion Certificate
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center bg-brand-600 hover:bg-brand-700 text-white font-extrabold"
            onClick={() => onContinueLearning(item)}
          >
            <FiPlayCircle className="w-4 h-4 mr-1.5" /> Continue Learning
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center text-xs"
            onClick={() => onViewDetails(item)}
          >
            <FiEye className="w-3.5 h-3.5 mr-1" /> View Details
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center text-xs"
            onClick={() => onViewInstructor(item)}
          >
            <FiUser className="w-3.5 h-3.5 mr-1" /> Instructor
          </Button>
        </div>
      </div>
    </Card>
  );
};
