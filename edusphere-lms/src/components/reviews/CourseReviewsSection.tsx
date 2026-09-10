import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiStar,
  FiEdit3,
  FiTrash2,
  FiMessageSquare,
  FiCheckCircle,
  FiFilter,
  FiClock,
  FiLoader,
  FiLock,
} from 'react-icons/fi';
import { reviewService } from '../../services/reviewService';
import type { CourseReviewItem, CourseRatingBreakdown } from '../../types';
import { ReviewModal } from './ReviewModal';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../../utils/swalAlerts';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CourseReviewsSectionProps {
  courseId: string;
  courseTitle: string;
  isEnrolled?: boolean;
  isCourseCompleted?: boolean;
  completedLessonsCount?: number;
  totalLessonsCount?: number;
  currentUserId?: string;
  onRatingUpdated?: (newAvg: number, newCount: number) => void;
}

export const CourseReviewsSection: React.FC<CourseReviewsSectionProps> = ({
  courseId,
  courseTitle,
  isEnrolled = false,
  isCourseCompleted = true,
  completedLessonsCount,
  totalLessonsCount,
  currentUserId,
  onRatingUpdated,
}) => {
  const [reviews, setReviews] = useState<CourseReviewItem[]>([]);
  const [summary, setSummary] = useState<CourseRatingBreakdown>({
    averageRating: 5.0,
    totalReviews: 0,
    distribution: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    },
  });
  const [myReview, setMyReview] = useState<CourseReviewItem | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Keep a stable ref for onRatingUpdated to prevent dependency churn
  const onRatingUpdatedRef = useRef(onRatingUpdated);
  useEffect(() => {
    onRatingUpdatedRef.current = onRatingUpdated;
  }, [onRatingUpdated]);

  // Request counter to cancel out-of-order race conditions
  const requestSeqRef = useRef<number>(0);

  const fetchReviews = useCallback(
    async (isFirstLoad = false) => {
      const currentSeq = ++requestSeqRef.current;
      if (isFirstLoad) {
        setIsInitialLoading(true);
      } else {
        setIsFetching(true);
      }

      try {
        const data = await reviewService.getCourseReviews(courseId, {
          page: 1,
          limit: 50,
          rating: selectedRatingFilter,
          sortBy,
        });

        // Discard out-of-order responses if a newer request was dispatched
        if (currentSeq !== requestSeqRef.current) return;

        setReviews(data.reviews);
        setSummary(data.summary);
        if (onRatingUpdatedRef.current) {
          onRatingUpdatedRef.current(data.summary.averageRating, data.summary.totalReviews);
        }
      } catch (err) {
        console.warn('Failed to load course reviews:', err);
      } finally {
        if (currentSeq === requestSeqRef.current) {
          setIsInitialLoading(false);
          setIsFetching(false);
        }
      }
    },
    [courseId, selectedRatingFilter, sortBy]
  );

  const fetchMyReview = useCallback(async () => {
    if (!currentUserId || !isEnrolled) return;
    try {
      const rev = await reviewService.getMyReview(courseId);
      setMyReview(rev);
    } catch {
      // Ignore
    }
  }, [courseId, currentUserId, isEnrolled]);

  // Initial load effect
  useEffect(() => {
    fetchReviews(true);
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter and sort changes (smooth background fetch without destructive unmount)
  useEffect(() => {
    fetchReviews(false);
  }, [selectedRatingFilter, sortBy, fetchReviews]);

  // User personal review fetch (only when user/enrollment changes)
  useEffect(() => {
    fetchMyReview();
  }, [fetchMyReview]);

  // Listen to global review submission/deletion events to update UI instantly without refresh
  useEffect(() => {
    const handleGlobalReviewSubmitted = (event: Event) => {
      const customEvent = event as CustomEvent<CourseReviewItem>;
      const rev = customEvent.detail;
      if (rev && rev.courseId === courseId) {
        if (currentUserId && rev.studentId === currentUserId) {
          setMyReview(rev);
        }
        setReviews((prev) => {
          const idx = prev.findIndex((r) => r.id === rev.id || (r.studentId && r.studentId === rev.studentId));
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = rev;
            return updated;
          }
          return [rev, ...prev];
        });
        fetchReviews(false);
      }
    };

    const handleGlobalReviewDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ reviewId: string; courseId: string }>;
      const detail = customEvent.detail;
      if (detail && detail.courseId === courseId) {
        setReviews((prev) => prev.filter((r) => r.id !== detail.reviewId));
        setMyReview((prev) => (prev && prev.id === detail.reviewId ? null : prev));
        fetchReviews(false);
      }
    };

    window.addEventListener('course-review-submitted', handleGlobalReviewSubmitted);
    window.addEventListener('course-review-deleted', handleGlobalReviewDeleted);

    return () => {
      window.removeEventListener('course-review-submitted', handleGlobalReviewSubmitted);
      window.removeEventListener('course-review-deleted', handleGlobalReviewDeleted);
    };
  }, [courseId, currentUserId, fetchReviews]);

  const handleReviewSubmitted = (newRev: CourseReviewItem) => {
    setMyReview(newRev);
    // Optimistically update reviews state so user immediately sees their review in the list
    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.id === newRev.id || (r.studentId && r.studentId === newRev.studentId));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newRev;
        return updated;
      }
      return [newRev, ...prev];
    });
    fetchReviews(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = await showConfirmAlert(
      'Delete Review',
      'Are you sure you want to delete your review? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await reviewService.deleteReview(reviewId);
      showSuccessAlert('Deleted', 'Your review has been removed.');
      setMyReview(null);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      window.dispatchEvent(
        new CustomEvent('course-review-deleted', { detail: { reviewId, courseId } })
      );
      fetchReviews(false);
    } catch (err: any) {
      showErrorAlert('Error', err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-8" id="course-reviews-section">
      {/* Header & Write Review Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiStar className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>Student Ratings & Reviews</span>
            {isFetching && (
              <span className="flex items-center gap-1 text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full animate-pulse">
                <FiLoader className="w-3 h-3 animate-spin" /> Updating
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real feedback and ratings submitted by enrolled students
          </p>
        </div>

        {isEnrolled ? (
          isCourseCompleted ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md shadow-amber-500/20"
            >
              <FiEdit3 className="w-4 h-4" />
              <span>{myReview ? 'Edit Your Review' : 'Rate & Review Course'}</span>
            </Button>
          ) : (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium">
              <FiLock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Complete all lessons{totalLessonsCount !== undefined && totalLessonsCount > 0 ? ` (${completedLessonsCount || 0}/${totalLessonsCount})` : ''} to unlock course rating
              </span>
            </div>
          )
        ) : (
          <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl">
            🔒 Enroll to submit a rating & review
          </div>
        )}
      </div>

      {/* 1. Rating Overview & Distribution Card */}
      <Card className="p-6 bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/40 border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Overall Score */}
          <div className="flex flex-col items-center justify-center p-4 text-center md:border-r border-slate-200/70 dark:border-slate-800">
            <div className="text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-baseline gap-1">
              {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : '5.0'}
              <span className="text-lg font-normal text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(summary.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Based on {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Center: Rating Distribution Bars */}
          <div className="md:col-span-2 space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const item = (summary.distribution as any)[stars] || { count: 0, percentage: 0 };
              const isSelected = selectedRatingFilter === stars;
              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() =>
                    setSelectedRatingFilter(selectedRatingFilter === stars ? undefined : stars)
                  }
                  className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-lg transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-left ${
                    isSelected
                      ? 'ring-2 ring-amber-500/50 bg-amber-50 dark:bg-amber-500/15 font-bold'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1 w-12 font-semibold text-slate-700 dark:text-slate-300">
                    <span>{stars}</span>
                    <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-medium text-slate-400">
                    {item.percentage}% <span className="text-[10px]">({item.count})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 2. Your Review Highlight (if exists) */}
      {myReview && (
        <Card className="p-5 border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="bg-amber-500 text-white font-bold text-[10px]">
                Your Review
              </Badge>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= myReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
              >
                <FiEdit3 className="w-3 h-3" /> Edit
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                onClick={() => handleDeleteReview(myReview.id)}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <FiTrash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
          {myReview.reviewTitle && (
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {myReview.reviewTitle}
            </h4>
          )}
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {myReview.reviewText}
          </p>
        </Card>
      )}

      {/* 3. Filter Bar & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FiFilter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setSelectedRatingFilter(undefined)}
            className={`px-3 py-1 text-xs rounded-full font-semibold transition-all ${
              selectedRatingFilter === undefined
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Stars
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedRatingFilter(selectedRatingFilter === s ? undefined : s)}
              className={`px-3 py-1 text-xs rounded-full font-semibold flex items-center gap-1 transition-all ${
                selectedRatingFilter === s
                  ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>{s}</span>
              <FiStar className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
          >
            <option value="newest">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* 4. Reviews Feed Container */}
      <div className="relative min-h-[140px]">
        {isInitialLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
            <FiLoader className="w-5 h-5 animate-spin text-brand-600" />
            <span className="text-xs font-medium">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <Card className="p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <FiMessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {selectedRatingFilter ? `No ${selectedRatingFilter}-star reviews found.` : 'No reviews yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isEnrolled
                ? isCourseCompleted
                  ? 'Be the first student to review this course and help other learners!'
                  : 'Complete all lessons in this course to share your learning experience and write the first review.'
                : 'Enroll in this course to be the first to share your learning experience.'}
            </p>
            {isEnrolled && (
              isCourseCompleted ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Write the First Review
                </Button>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium">
                  <FiLock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Complete all lessons{totalLessonsCount !== undefined && totalLessonsCount > 0 ? ` (${completedLessonsCount || 0}/${totalLessonsCount})` : ''} to write the first review
                  </span>
                </div>
              )
            )}
          </Card>
        ) : (
          <div
            className={`space-y-4 transition-opacity duration-200 ${
              isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'
            }`}
          >
            {reviews.map((rev) => {
              const isMine = currentUserId && rev.studentId === currentUserId;
              return (
                <Card
                  key={rev.id}
                  className="p-5 space-y-3 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Student Info & Rating */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {rev.studentAvatar ? (
                          <img
                            src={rev.studentAvatar}
                            alt={rev.studentName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          rev.studentName?.charAt(0).toUpperCase() || 'S'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {rev.studentName}
                          </span>
                          <Badge
                            variant="success"
                            className="text-[9px] py-0 px-1.5 flex items-center gap-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          >
                            <FiCheckCircle className="w-2.5 h-2.5" /> Verified Student
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FiStar
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <FiClock className="w-2.5 h-2.5" />
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for review owner */}
                    {isMine && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="p-1 hover:text-amber-500 rounded transition-colors"
                          title="Edit Review"
                        >
                          <FiEdit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1 hover:text-rose-500 rounded transition-colors"
                          title="Delete Review"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Review Title & Content */}
                  {rev.reviewTitle && (
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {rev.reviewTitle}
                    </h4>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rev.reviewText}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
        courseTitle={courseTitle}
        existingReview={myReview}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};
