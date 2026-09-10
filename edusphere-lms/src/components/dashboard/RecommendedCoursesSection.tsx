import React from 'react';
import { motion } from 'framer-motion';
import { FiCompass, FiStar } from 'react-icons/fi';
import { CourseCard } from '../cards/CourseCard';
import type { Course } from '../../types';

interface RecommendedCoursesSectionProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

export const RecommendedCoursesSection: React.FC<RecommendedCoursesSectionProps> = ({
  courses,
  onSelectCourse,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiCompass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Recommended For You
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Handpicked courses based on your learning interests</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full">
          <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> AI Personalization
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course, idx) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <CourseCard course={course} onSelect={onSelectCourse} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
