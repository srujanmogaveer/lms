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
    { id: 'announcements', label: 'Notices', icon: FiBell },
    { id: 'forum', label: 'Forum', icon: FiMessageSquare },
    { id: 'chat', label: 'Chat', icon: FiMessageSquare },
    { id: 'live', label: 'Live', icon: FiVideo },
    { id: 'certificate', label: 'Cert', icon: FiAward },
  ];

  return (
    <Card hoverEffect className="flex flex-col justify-between h-full p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
      <div className="space-y-3.5">
        {/* Header: 16:9 Thumbnail + Category & Status Badges */}
        <div className="relative overflow-hidden rounded-2xl aspect-video w-full group bg-slate-950">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={() => onViewDetails(item)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-2 left-2">
            <Badge variant="primary" className="text-[10px] font-bold px-2 py-0.5 shadow-sm backdrop-blur-md bg-brand-600/90 text-white">
              {course.category}
            </Badge>
          </div>

          <div className="absolute top-2 right-2">
            {enrollmentStatus === 'completed' ? (
              <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5 shadow-md flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" /> Completed
              </Badge>
            ) : enrollmentStatus === 'in_progress' ? (
              <Badge variant="warning" className="text-[10px] font-bold px-2 py-0.5 shadow-md flex items-center gap-1">
                <FiPlayCircle className="w-3 h-3" /> In Progress
              </Badge>
            ) : (
              <Badge variant="neutral" className="text-[10px] font-bold px-2 py-0.5 bg-slate-900/80 text-white border-0 backdrop-blur-md">
                Not Started
              </Badge>
            )}
          </div>

          {lastAccessedTime && (
            <div className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
              <FiClock className="w-2.5 h-2.5 text-amber-300" /> {lastAccessedTime}
            </div>
          )}
        </div>

        {/* Title & Instructor */}
        <div className="space-y-1">
          <h3
            onClick={() => onViewDetails(item)}
            className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer min-h-[2.5rem]"
            title={course.title}
          >
            {course.title}
          </h3>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <button
              onClick={() => onViewInstructor(item)}
              className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors truncate max-w-[60%]"
            >
              <Avatar
                src={course.instructorAvatar}
                name={course.instructorName}
                role="instructor"
                size="xs"
              />
              <span className="truncate">{course.instructorName}</span>
            </button>

            {enrolledDate && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                <FiCalendar className="w-3 h-3" /> {enrolledDate}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar & Current Lesson */}
        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Progress ({completedLessons}/{totalLessons} Lessons)
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{progress}%</span>
          </div>

          <ProgressBar progress={progress} size="sm" color={progress === 100 ? 'emerald' : 'brand'} />

          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-0.5 truncate">
            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Current:</span>
            <span className="truncate font-medium">{lastAccessedLesson || 'Lesson 1'}</span>
          </div>
        </div>

        {/* Module Quick Shortcuts */}
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-1">
            {quickNavItems.map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => onQuickNav(nav.id, item)}
                  className="p-1 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:border-brand-300 text-slate-600 dark:text-slate-400 hover:text-brand-600 flex items-center justify-center gap-1 transition-all text-center group"
                  title={`Open ${nav.label}`}
                >
                  <Icon className="w-3 h-3 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-[9px] font-semibold truncate">{nav.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary Actions Footer */}
      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
        {enrollmentStatus === 'completed' ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 shadow-sm"
            onClick={() => onViewCertificate(item)}
          >
            <FiAward className="w-3.5 h-3.5 mr-1.5" /> View Certificate
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 shadow-sm shadow-brand-600/20"
            onClick={() => onContinueLearning(item)}
          >
            <FiPlayCircle className="w-3.5 h-3.5 mr-1.5" /> Continue Learning
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center text-xs py-1.5"
            onClick={() => onViewDetails(item)}
          >
            <FiEye className="w-3 h-3 mr-1" /> View Details
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center text-xs py-1.5"
            onClick={() => onViewInstructor(item)}
          >
            <FiUser className="w-3 h-3 mr-1" /> Instructor
          </Button>
        </div>
      </div>
    </Card>
  );
};
