import React from 'react';
import { motion } from 'framer-motion';
import { FiPlusCircle, FiStar, FiClock, FiEye } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Course } from '../../types';

interface CartRecommendedCoursesProps {
  recommendedCourses: Course[];
  onViewCourse: (course: Course) => void;
  onAddToCart: (course: Course) => void;
}

export const CartRecommendedCourses: React.FC<CartRecommendedCoursesProps> = ({
  recommendedCourses,
  onViewCourse,
  onAddToCart,
}) => {
  if (recommendedCourses.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiPlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Frequently Bought Together
          </h2>
          <p className="text-xs text-slate-500">Students who bought cart items also enrolled in these top courses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {recommendedCourses.slice(0, 3).map((course, idx) => {
          const currentPrice = course.discountPrice || course.price;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
            >
              <Card hoverEffect className="flex flex-col justify-between h-full space-y-4 p-5">
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-xl h-36 w-full group">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => onViewCourse(course)}
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="primary">{course.category}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {course.rating}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <FiClock className="w-3.5 h-3.5" /> {course.durationHours}h
                    </span>
                  </div>

                  <h3
                    onClick={() => onViewCourse(course)}
                    className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-2 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-2">
                    <img
                      src={course.instructorAvatar}
                      alt={course.instructorName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                      {course.instructorName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Course Fee</span>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-base">
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 justify-center"
                      onClick={() => onViewCourse(course)}
                    >
                      <FiEye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => onAddToCart(course)}
                    >
                      <FiPlusCircle className="w-3.5 h-3.5 mr-1" /> Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
