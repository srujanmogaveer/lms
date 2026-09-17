import React from 'react';
import {
  FiClock,
  FiBookOpen,
  FiStar,
  FiHeart,
  FiTrash2,
  FiEye,
  FiTag,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Course } from '../../types';
import { formatCourseDuration } from '../../utils/formatters';

interface CartItemCardProps {
  course: Course;
  addedAt: string;
  onViewCourse: (course: Course) => void;
  onMoveToWishlist: (course: Course) => void;
  onRemove: (course: Course) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  course,
  addedAt,
  onViewCourse,
  onMoveToWishlist,
  onRemove,
}) => {
  const isDiscounted = course.discountPrice && course.discountPrice < course.price;
  const currentPrice = course.discountPrice || course.price;
  const savingsAmount = isDiscounted ? course.price - course.discountPrice! : 0;
  const savingsPercent = isDiscounted ? Math.round((savingsAmount / course.price) * 100) : 0;

  return (
    <Card hoverEffect className="p-4 sm:p-5 transition-all border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
        {/* Course Thumbnail */}
        <div className="relative overflow-hidden rounded-xl w-full sm:w-44 h-32 shrink-0 group">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={() => onViewCourse(course)}
          />
          <div className="absolute top-2 left-2">
            <Badge variant="primary">{course.category}</Badge>
          </div>
          <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm">
            Added {addedAt}
          </div>
        </div>

        {/* Course Main Details */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{course.level}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {course.rating} ({course.reviewsCount})
              </span>
            </div>

            {isDiscounted && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                <FiTag className="w-3 h-3" /> Save {savingsPercent}% (₹{savingsAmount.toLocaleString('en-IN')})
              </span>
            )}
          </div>

          <h3
            onClick={() => onViewCourse(course)}
            className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1 hover:text-brand-600 transition-colors cursor-pointer"
          >
            {course.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <img
                src={course.instructorAvatar}
                alt={course.instructorName}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span>{course.instructorName}</span>
            </div>

            <div className="flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5 text-brand-500" />
              <span>{formatCourseDuration(course.durationHours)} total</span>
            </div>

            <div className="flex items-center gap-1">
              <FiBookOpen className="w-3.5 h-3.5 text-brand-500" />
              <span>{course.lessonsCount} lessons</span>
            </div>
          </div>
        </div>

        {/* Pricing & Action Buttons Column */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 gap-3">
          <div className="text-left sm:text-right">
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              ₹{currentPrice.toLocaleString('en-IN')}
            </div>
            {isDiscounted && (
              <div className="text-xs text-slate-400 line-through">
                ₹{course.price.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewCourse(course)}
              aria-label="View course"
              title="View course details"
            >
              <FiEye className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">View</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60"
              onClick={() => onMoveToWishlist(course)}
              aria-label="Move to wishlist"
              title="Save to wishlist"
            >
              <FiHeart className="w-4 h-4 sm:mr-1 fill-rose-500/20" />
              <span className="hidden sm:inline">Wishlist</span>
            </Button>

            <button
              onClick={() => onRemove(course)}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
              aria-label="Remove from cart"
              title="Remove from cart"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
