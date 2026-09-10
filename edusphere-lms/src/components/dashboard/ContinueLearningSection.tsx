import React from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiClock, FiBookOpen, FiChevronRight } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import type { EnrolledCourseProgress } from '../../types';

interface ContinueLearningSectionProps {
  coursesProgress: EnrolledCourseProgress[];
  onContinueCourse: (courseId: string) => void;
}

export const ContinueLearningSection: React.FC<ContinueLearningSectionProps> = ({
  coursesProgress,
  onContinueCourse,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiPlay className="w-5 h-5 text-brand-600 dark:text-brand-400 fill-brand-600/20" />
            Continue Learning
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pick up right where you left off</p>
        </div>
        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full">
          {coursesProgress.length} Courses Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coursesProgress.map((item, idx) => (
          <motion.div
            key={item.course.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <Card hoverEffect className="flex flex-col justify-between h-full space-y-4 p-5">
              <div className="space-y-3">
                {/* Image & Category Header */}
                <div className="relative overflow-hidden rounded-xl h-36 w-full group">
                  <img
                    src={item.course.thumbnail}
                    alt={item.course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="primary">{item.course.category}</Badge>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[11px] text-white/90 font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <FiClock className="w-3 h-3 text-amber-300" />
                    <span>{item.lastAccessedTime}</span>
                  </div>
                </div>

                {/* Course Title & Instructor */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {item.course.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <img
                      src={item.course.instructorAvatar}
                      alt={item.course.instructorName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {item.course.instructorName}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Lesson Count */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <FiBookOpen className="w-3.5 h-3.5 text-brand-500" />
                      Progress ({item.completedLessons}/{item.totalLessons} lessons)
                    </span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{item.progress}%</span>
                  </div>
                  <ProgressBar progress={item.progress} size="md" color="brand" />
                </div>

                {/* Last Accessed Lesson */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 bg-brand-50/50 dark:bg-brand-950/30 p-2.5 rounded-lg">
                  <span className="font-bold text-brand-600 dark:text-brand-400 shrink-0">Current:</span>
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.lastAccessedLesson}</span>
                </div>
              </div>

              {/* Continue Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center shadow-md shadow-brand-500/10 group"
                  onClick={() => onContinueCourse(item.course.id)}
                >
                  <FiPlay className="w-4 h-4 mr-2 fill-current" />
                  <span>Resume Lesson</span>
                  <FiChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
