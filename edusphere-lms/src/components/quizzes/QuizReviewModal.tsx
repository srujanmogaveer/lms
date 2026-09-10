import React from 'react';
import {
  FiAlertTriangle,
  FiSend,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { QuizQuestion } from '../../types';

interface QuizReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  onConfirmFinalSubmit: () => void;
  isSubmitting?: boolean;
}

export const QuizReviewModal: React.FC<QuizReviewModalProps> = ({
  isOpen,
  onClose,
  questions,
  onConfirmFinalSubmit,
  isSubmitting = false,
}) => {
  const answeredCount = questions.filter((q) => q.userSelectedOptionId).length;
  const unansweredCount = questions.length - answeredCount;
  const markedReviewCount = questions.filter((q) => q.isMarkedForReview).length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Review Answers Before Final Submission"
    >
      <div className="space-y-5 py-2">
        {/* Status Summary Banner */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl">
            <span className="text-emerald-600 font-bold block text-lg">{answeredCount}</span>
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">Answered</span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl">
            <span className="text-amber-600 font-bold block text-lg">{unansweredCount}</span>
            <span className="text-amber-800 dark:text-amber-300 font-medium">Unanswered</span>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 rounded-xl">
            <span className="text-purple-600 font-bold block text-lg">{markedReviewCount}</span>
            <span className="text-purple-800 dark:text-purple-300 font-medium">For Review</span>
          </div>
        </div>

        {/* Warning if there are unanswered questions */}
        {unansweredCount > 0 && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300">
            <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You have <strong>{unansweredCount} unanswered questions</strong>. You can return to answer them before submitting.
            </span>
          </div>
        )}

        {/* Questions Status Table */}
        <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 custom-scrollbar">
          {questions.map((q, idx) => {
            const isAnswered = !!q.userSelectedOptionId;
            const isMarked = !!q.isMarkedForReview;

            return (
              <div
                key={q.id}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between text-xs border border-slate-100 dark:border-slate-700/60"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  Q{idx + 1}: {q.questionText}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  {isMarked && <Badge variant="warning">For Review</Badge>}
                  {isAnswered ? (
                    <Badge variant="success">Answered</Badge>
                  ) : (
                    <Badge variant="neutral">Unanswered</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="disabled:opacity-50"
          >
            Back to Questions
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onConfirmFinalSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Quiz...</span>
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" />
                <span>Confirm & Submit Quiz</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
