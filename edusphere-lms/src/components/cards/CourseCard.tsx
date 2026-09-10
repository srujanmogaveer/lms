import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiClock, FiBookOpen, FiHeart, FiShoppingCart, FiPlayCircle, FiAward, FiEye, FiCheckCircle } from 'react-icons/fi';
import type { Course } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

export interface CourseCardProps {
  course: Course;
  progress?: number;
  enrollmentStatus?: 'not_enrolled' | 'enrolled' | 'completed';
  lastLesson?: string;
  isInWishlist?: boolean;
  isInCart?: boolean;
  onSelect?: (course: Course) => void;
  onWishlistToggle?: (course: Course) => void;
  onCartToggle?: (course: Course) => void;
  onContinueLearning?: (course: Course) => void;
  onViewCertificate?: (course: Course) => void;
  onPreviewModal?: (course: Course) => void;
  mode?: 'public' | 'student';
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  progress,
  enrollmentStatus = 'not_enrolled',
  lastLesson,
  isInWishlist = false,
  isInCart = false,
  onSelect,
  onWishlistToggle,
  onCartToggle,
  onContinueLearning,
  onViewCertificate,
  onPreviewModal,
  mode = 'public',
}) => {
  const navigate = useNavigate();
  const currentPrice = course.discountPrice || course.price;
  const isDiscounted = course.discountPrice && course.discountPrice < course.price;

  const handleCardClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSelect) {
      onSelect(course);
    } else if (onPreviewModal) {
      onPreviewModal(course);
    } else {
      navigate(`/courses/${course.slug || course.id}`);
    }
  };

  return (
    <Card hoverEffect className="flex flex-col justify-between h-full space-y-4 p-5 relative group border border-slate-200 dark:border-slate-800">
      <div className="space-y-3">
        {/* Course Thumbnail Container */}
        <div className="relative overflow-hidden rounded-xl h-44 w-full bg-slate-100 dark:bg-slate-800">
          <img
            src={course.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'}
            alt={course.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={handleCardClick}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

          {/* Category Badge Top Left */}
          <div className="absolute top-2.5 left-2.5">
            <Badge variant="primary">{course.category}</Badge>
          </div>

          {/* Student Enrollment Status Badge Top Right */}
          {mode === 'student' && (
            <div className="absolute top-2.5 right-2.5">
              {enrollmentStatus === 'completed' ? (
                <Badge variant="success" className="flex items-center gap-1 shadow-md">
                  <FiCheckCircle className="w-3 h-3" /> Completed
                </Badge>
              ) : enrollmentStatus === 'enrolled' ? (
                <Badge variant="warning" className="flex items-center gap-1 shadow-md">
                  <FiPlayCircle className="w-3 h-3" /> Enrolled
                </Badge>
              ) : (
                <Badge variant="neutral" className="bg-slate-900/70 text-white backdrop-blur-sm border-0">
                  Not Enrolled
                </Badge>
              )}
            </div>
          )}

          {/* Price Overlay Bottom Left */}
          {enrollmentStatus === 'not_enrolled' && (
            <div className="absolute bottom-2.5 left-2.5 flex items-baseline gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-white">
              <span className="font-extrabold text-sm">₹{currentPrice.toLocaleString('en-IN')}</span>
              {isDiscounted && (
                <span className="text-[11px] text-slate-300 line-through">
                  ₹{course.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}

          {/* Quick Wishlist Icon Overlay for Student Mode */}
          {mode === 'student' && enrollmentStatus === 'not_enrolled' && onWishlistToggle && (
            <button
              onClick={() => onWishlistToggle(course)}
              className="absolute bottom-2.5 right-2.5 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-rose-600 shadow-md transition-all backdrop-blur-sm"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              title={isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            >
              <FiHeart className={`w-4 h-4 ${isInWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Rating, Duration & Lessons */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 font-bold text-amber-500">
            <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {course.rating} ({course.reviewsCount})
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5" /> {course.durationHours}h
            </span>
            <span className="flex items-center gap-1">
              <FiBookOpen className="w-3.5 h-3.5" /> {course.lessonsCount} lessons
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={handleCardClick}
          className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer"
        >
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Progress Bar & Last Lesson if enrolled */}
        {progress !== undefined && (
          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Progress</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">{progress}%</span>
            </div>
            <ProgressBar progress={progress} size="sm" color="brand" />
            {lastLesson && (
              <p className="text-[11px] text-slate-400 truncate pt-1">
                <span className="font-bold text-slate-600 dark:text-slate-300">Last:</span> {lastLesson}
              </p>
            )}
          </div>
        )}

        {/* Instructor */}
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
          <span className="text-[11px] text-slate-400 font-medium">{course.level}</span>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        {mode === 'student' ? (
          /* Student Dynamic Actions */
          <div className="space-y-2">
            {enrollmentStatus === 'completed' ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onViewCertificate && onViewCertificate(course)}
                >
                  <FiAward className="w-4 h-4 mr-1.5" /> View Certificate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCardClick}
                >
                  <FiEye className="w-4 h-4" />
                </Button>
              </div>
            ) : enrollmentStatus === 'enrolled' ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 justify-center bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={() => onContinueLearning ? onContinueLearning(course) : handleCardClick()}
                >
                  <FiPlayCircle className="w-4 h-4 mr-1.5" /> Continue Learning
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCardClick}
                >
                  <FiEye className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              /* Not Enrolled: Add to Wishlist, Add to Cart, View Details */
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isInCart ? 'secondary' : 'primary'}
                  className={`flex-1 justify-center ${isInCart ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  onClick={() => onCartToggle && onCartToggle(course)}
                >
                  <FiShoppingCart className="w-3.5 h-3.5 mr-1" />
                  {isInCart ? 'In Cart' : 'Add to Cart'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className={isInWishlist ? 'text-rose-600 border-rose-300' : ''}
                  onClick={() => onWishlistToggle && onWishlistToggle(course)}
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <FiHeart className={`w-3.5 h-3.5 ${isInWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCardClick}
                >
                  <FiEye className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Default Public Mode Action */
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              ₹{currentPrice.toLocaleString('en-IN')}
            </span>
            <Button size="sm" variant="outline" onClick={handleCardClick}>
              {progress !== undefined ? 'Continue' : 'View Course'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
