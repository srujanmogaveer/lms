import React from 'react';
import {
  FiStar,
  FiClock,
  FiBookOpen,
  FiShoppingCart,
  FiTrash2,
  FiEye,
  FiCheckSquare,
  FiSquare,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Course } from '../../types';
import { formatCourseDurationShort } from '../../utils/formatters';

interface WishlistCourseCardProps {
  course: Course;
  addedAt: string;
  isSelected: boolean;
  onToggleSelect: (courseId: string) => void;
  onViewCourse: (course: Course) => void;
  onMoveToCart: (course: Course) => void;
  onRemove: (course: Course) => void;
  viewMode?: 'grid' | 'list';
}

export const WishlistCourseCard: React.FC<WishlistCourseCardProps> = ({
  course,
  addedAt,
  isSelected,
  onToggleSelect,
  onViewCourse,
  onMoveToCart,
  onRemove,
  viewMode = 'grid',
}) => {
  const isDiscounted = course.discountPrice && course.discountPrice < course.price;
  const currentPrice = course.discountPrice || course.price;

  if (viewMode === 'list') {
    return (
      <Card
        hoverEffect
        className={`p-4 transition-all border ${
          isSelected
            ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Checkbox + Thumbnail */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onToggleSelect(course.id)}
              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
              aria-label={isSelected ? 'Deselect course' : 'Select course'}
            >
              {isSelected ? (
                <FiCheckSquare className="w-5 h-5 text-rose-600" />
              ) : (
                <FiSquare className="w-5 h-5 text-slate-400" />
              )}
            </button>

            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-24 h-20 rounded-xl object-cover shrink-0 cursor-pointer"
              onClick={() => onViewCourse(course)}
            />

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">{course.category}</Badge>
                <span className="text-[11px] font-medium text-slate-400">{course.level}</span>
                <span className="text-[11px] text-slate-400">• Added {addedAt}</span>
              </div>
              <h3
                onClick={() => onViewCourse(course)}
                className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-rose-600 transition-colors cursor-pointer line-clamp-1"
              >
                {course.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <img
                    src={course.instructorAvatar}
                    alt={course.instructorName}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{course.instructorName}</span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {course.rating} ({course.reviewsCount})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-3.5 h-3.5" /> {formatCourseDurationShort(course.durationHours)}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
            <div className="text-left sm:text-right">
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                ₹{currentPrice.toLocaleString('en-IN')}
              </div>
              {isDiscounted && (
                <div className="text-xs text-slate-400 line-through font-mono">
                  ₹{course.price.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewCourse(course)}
                aria-label="View course details"
              >
                <FiEye className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">View</span>
              </Button>

              <Button
                size="sm"
                variant="primary"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => onMoveToCart(course)}
                aria-label="Move to shopping cart"
              >
                <FiShoppingCart className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Move to Cart</span>
              </Button>

              <button
                onClick={() => onRemove(course)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                aria-label="Remove from wishlist"
                title="Remove from wishlist"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Default Grid View
  return (
    <Card
      hoverEffect
      className={`relative flex flex-col justify-between h-full space-y-4 p-5 border transition-all ${
        isSelected
          ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-2 ring-rose-500/50'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="space-y-3">
        {/* Thumbnail & Select Checkbox Header */}
        <div className="relative overflow-hidden rounded-xl h-44 w-full group">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={() => onViewCourse(course)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

          {/* Select Checkbox Overlay */}
          <button
            onClick={() => onToggleSelect(course.id)}
            className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 shadow-md text-slate-700 hover:text-rose-600 transition-all backdrop-blur-sm"
            aria-label={isSelected ? 'Deselect course' : 'Select course'}
          >
            {isSelected ? (
              <FiCheckSquare className="w-5 h-5 text-rose-600" />
            ) : (
              <FiSquare className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {/* Category Badge Overlay */}
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="primary">{course.category}</Badge>
          </div>

          {/* Pricing Overlay */}
          <div className="absolute bottom-2.5 left-2.5 flex items-baseline gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-white">
            <span className="font-extrabold text-sm">₹{currentPrice.toLocaleString('en-IN')}</span>
            {isDiscounted && (
              <span className="text-[11px] text-slate-300 line-through">
                ₹{course.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Rating & Meta info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 font-bold text-amber-500">
            <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {course.rating} ({course.reviewsCount})
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5" /> {formatCourseDurationShort(course.durationHours)}
            </span>
            <span className="flex items-center gap-1">
              <FiBookOpen className="w-3.5 h-3.5" /> {course.lessonsCount} lessons
            </span>
          </div>
        </div>

        {/* Course Title */}
        <h3
          onClick={() => onViewCourse(course)}
          className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 hover:text-rose-600 transition-colors cursor-pointer"
        >
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Instructor info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <img
              src={course.instructorAvatar}
              alt={course.instructorName}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {course.instructorName}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">{course.level}</span>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="space-y-2 pt-2">
        <Button
          variant="primary"
          size="md"
          className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          onClick={() => onMoveToCart(course)}
        >
          <FiShoppingCart className="w-4 h-4 mr-2" />
          Move to Shopping Cart
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center"
            onClick={() => onViewCourse(course)}
          >
            <FiEye className="w-3.5 h-3.5 mr-1" /> View Course
          </Button>

          <button
            onClick={() => onRemove(course)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            aria-label="Remove from wishlist"
            title="Remove from wishlist"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
