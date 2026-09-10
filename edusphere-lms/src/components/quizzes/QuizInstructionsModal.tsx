import React, { useState } from 'react';
import {
  FiAlertTriangle,
  FiPlay,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { StudentQuizDetail } from '../../types';

interface QuizInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: StudentQuizDetail | null;
  onConfirmStart: (quiz: StudentQuizDetail) => void;
}

export const QuizInstructionsModal: React.FC<QuizInstructionsModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onConfirmStart,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  if (!quiz) return null;

  const handleStart = () => {
    if (!isChecked) return;
    onConfirmStart(quiz);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assessment Instructions: ${quiz.title}`}
    >
      <div className="space-y-6 py-2">
        {/* Metadata Summary Banner */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex justify-between items-start gap-2 border-b border-slate-200/60 dark:border-slate-700 pb-3">
            <div>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {quiz.courseTitle}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {quiz.title}
              </h3>
            </div>
            <Badge variant="primary">{quiz.difficulty}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 block text-[11px]">Questions</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{quiz.questionsCount} Qs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Time Limit</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{quiz.timeLimitMinutes} Mins</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Passing Mark</span>
              <span className="font-bold text-emerald-600">{quiz.passingScore}% ({quiz.passingScore * (quiz.totalPoints / 100)} Points)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Attempts</span>
              <span className="font-semibold">{quiz.attemptsUsed} of {quiz.maxAttempts} used</span>
            </div>
          </div>
        </div>

        {/* Instructions Rules List */}
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Assessment Guidelines & Navigation Rules
          </h4>
          <ul className="space-y-2 pl-2">
            {quiz.instructions.map((inst, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold text-brand-600 shrink-0">•</span>
                <span>{inst}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Auto Submit Information Notice */}
        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
          <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Automatic Submission Policy:</span>
            <span>
              Once started, the timer will count down continuously. If you do not click "Submit Quiz" manually, the system will automatically submit your saved answers when the countdown timer reaches 00:00.
            </span>
          </div>
        </div>

        {/* Declaration Checkbox */}
        <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none text-xs text-slate-800 dark:text-slate-200 font-medium">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
          />
          <span>
            I have read and understand all assessment instructions, navigation rules, and automatic submission policies.
          </span>
        </label>

        {/* Modal Buttons */}
        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleStart}
            disabled={!isChecked}
            className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 shadow-md shadow-brand-600/20 disabled:opacity-50"
          >
            <FiPlay className="w-4 h-4 fill-current" />
            <span>Start Quiz Attempt</span>
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
