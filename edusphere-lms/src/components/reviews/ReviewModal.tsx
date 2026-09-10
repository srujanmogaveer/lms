import React, { useState, useEffect } from 'react';
import { FiX, FiStar, FiCheck, FiLoader } from 'react-icons/fi';
import { reviewService } from '../../services/reviewService';
import type { CourseReviewItem } from '../../types';
import { showSuccessAlert, showErrorAlert } from '../../utils/swalAlerts';


interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  existingReview?: CourseReviewItem | null;
  onReviewSubmitted: (review: CourseReviewItem) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor - Needs improvement',
  2: 'Fair - Below expectations',
  3: 'Good - Met expectations',
  4: 'Very Good - Highly recommend',
  5: 'Excellent - Outstanding course!',
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  existingReview,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>(existingReview?.reviewTitle || '');
  const [reviewText, setReviewText] = useState<string>(existingReview?.reviewText || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewTitle(existingReview.reviewTitle || '');
      setReviewText(existingReview.reviewText || '');
    } else {
      setRating(5);
      setReviewTitle('');
      setReviewText('');
    }
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      showErrorAlert('Invalid Rating', 'Please select a star rating between 1 and 5.');
      return;
    }
    if (!reviewText.trim() || reviewText.trim().length < 5) {
      showErrorAlert('Review Text Required', 'Please share at least a few words about your experience (min 5 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      const saved = await reviewService.submitReview(courseId, {
        rating,
        reviewTitle: reviewTitle.trim(),
        reviewText: reviewText.trim(),
      });
      showSuccessAlert(
        existingReview ? 'Review Updated!' : 'Review Submitted!',
        'Thank you for your feedback! Your review helps other students discover great courses.'
      );
      onReviewSubmitted(saved);
      window.dispatchEvent(new CustomEvent('course-review-submitted', { detail: saved }));
      onClose();
    } catch (err: any) {
      showErrorAlert('Submission Failed', err.message || 'Could not submit your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-scale-up">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-brand-500/5 to-transparent">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {existingReview ? 'Update Your Feedback' : 'Course Review & Rating'}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate max-w-[340px]">
              {courseTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Star Selector */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Your Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-125 duration-150"
                  aria-label={`Rate ${star} star`}
                >
                  <FiStar
                    className={`w-9 h-9 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 h-4">
              {RATING_LABELS[activeRating]}
            </p>
          </div>

          {/* Review Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Review Title <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g. Excellent explanation and real-world projects!"
              maxLength={120}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Review Text Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Review <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like about this course? How did it help your career or skills?"
              maxLength={2000}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 resize-none leading-relaxed"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Min 5 characters</span>
              <span>{reviewText.length} / 2000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reviewText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
