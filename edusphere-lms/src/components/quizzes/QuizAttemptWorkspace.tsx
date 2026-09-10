import React, { useState, useEffect } from 'react';
import {
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiSend,
  FiX,
  FiCode,
  FiGrid,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { StudentQuizDetail, QuizQuestion } from '../../types';

interface QuizAttemptWorkspaceProps {
  quiz: StudentQuizDetail;
  onCancelAttempt: () => void;
  onOpenReviewModal: (questionsState: QuizQuestion[]) => void;
}

export const QuizAttemptWorkspace: React.FC<QuizAttemptWorkspaceProps> = ({
  quiz,
  onCancelAttempt,
  onOpenReviewModal,
}) => {
  // Local state of questions & user selections (initialized fresh for every attempt)
  const [questionsState, setQuestionsState] = useState<QuizQuestion[]>(() =>
    quiz.questions.map((q) => ({
      ...q,
      userSelectedOptionId: undefined,
      isMarkedForReview: false,
    }))
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Timer UI Simulation (Starts at quiz.timeLimitMinutes * 60 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(quiz.timeLimitMinutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatic submission when timer reaches 00:00
  useEffect(() => {
    if (secondsRemaining === 0) {
      onOpenReviewModal(questionsState);
    }
  }, [secondsRemaining, onOpenReviewModal, questionsState]);


  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questionsState[currentQuestionIndex];

  // Option selection handler
  const handleSelectOption = (optionId: string) => {
    setQuestionsState((prev) =>
      prev.map((q, idx) => {
        if (idx === currentQuestionIndex) {
          return { ...q, userSelectedOptionId: optionId };
        }
        return q;
      })
    );
  };

  // Toggle mark for review
  const handleToggleMarkReview = () => {
    setQuestionsState((prev) =>
      prev.map((q, idx) => {
        if (idx === currentQuestionIndex) {
          return { ...q, isMarkedForReview: !q.isMarkedForReview };
        }
        return q;
      })
    );
  };

  // Navigation handlers
  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questionsState.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Question stats summary
  const answeredCount = questionsState.filter((q) => q.userSelectedOptionId).length;
  const markedReviewCount = questionsState.filter((q) => q.isMarkedForReview).length;
  const unansweredCount = questionsState.length - answeredCount;

  return (
    <div className="space-y-6">
      {/* Top Bar: Quiz Header, Timer & Exit Controls */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Badge variant="primary" className="bg-brand-500/20 text-brand-300 border-brand-500/40">
              {quiz.courseTitle}
            </Badge>
            <span className="text-xs text-slate-400">Live Assessment Mode</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold line-clamp-1">{quiz.title}</h2>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
            <FiClock className="w-5 h-5 text-amber-400 animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Time Remaining</span>
              <span className="font-mono text-lg font-bold text-amber-400">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          </div>

          <button
            onClick={onCancelAttempt}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Pause / Exit Test"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Column: Question Canvas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
            {/* Question Progress Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Question {currentQuestionIndex + 1} of {questionsState.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMarkReview}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    currentQuestion.isMarkedForReview
                      ? 'bg-purple-50 dark:bg-purple-950 border-purple-300 text-purple-600 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <FiStar className={`w-3.5 h-3.5 ${currentQuestion.isMarkedForReview ? 'fill-purple-500 text-purple-500' : ''}`} />
                  <span>{currentQuestion.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {currentQuestion.questionText}
              </h3>

              {/* Code Snippet Box if present */}
              {currentQuestion.codeSnippet && (
                <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 p-4 border border-slate-800 font-mono text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-slate-400 pb-2 border-b border-slate-800 text-[11px]">
                    <FiCode className="w-3.5 h-3.5 text-brand-400" />
                    <span>{currentQuestion.codeSnippet.language}</span>
                  </div>
                  <pre className="pt-2 overflow-x-auto">
                    <code>{currentQuestion.codeSnippet.code}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Question Answer Controls for all question types */}
            {currentQuestion.questionType === 'Fill in the Blanks' ? (
              <div className="pt-2 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={(currentQuestion.userSelectedOptionId as string) || ''}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            ) : currentQuestion.questionType === 'Multiple Answer' ? (
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((option, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  const selectedList = Array.isArray(currentQuestion.userSelectedOptionId)
                    ? (currentQuestion.userSelectedOptionId as string[])
                    : [];
                  const isSelected = selectedList.includes(option.id) || selectedList.includes(option.text);

                  const toggleMultiOption = () => {
                    const currentList = Array.isArray(currentQuestion.userSelectedOptionId)
                      ? [...(currentQuestion.userSelectedOptionId as string[])]
                      : [];
                    const itemKey = option.id || option.text;
                    const exists = currentList.includes(itemKey);
                    const updatedList = exists
                      ? currentList.filter((k) => k !== itemKey)
                      : [...currentList, itemKey];
                    setQuestionsState((prev) =>
                      prev.map((q, qIdx) => {
                        if (qIdx === currentQuestionIndex) {
                          return { ...q, userSelectedOptionId: updatedList as any };
                        }
                        return q;
                      })
                    );
                  };

                  return (
                    <div
                      key={option.id || idx}
                      onClick={toggleMultiOption}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-50/80 dark:bg-brand-950/60 border-brand-500 text-slate-900 dark:text-slate-100 ring-2 ring-brand-500/20 font-semibold'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-brand-600 text-white shadow-md'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed">{option.text}</span>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={toggleMultiOption}
                        className="accent-brand-600 w-4 h-4 shrink-0 rounded"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Answer & True or False */
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((option, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  const isSelected =
                    currentQuestion.userSelectedOptionId === option.id ||
                    currentQuestion.userSelectedOptionId === option.text;

                  return (
                    <div
                      key={option.id || idx}
                      onClick={() => handleSelectOption(option.id || option.text)}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-50/80 dark:bg-brand-950/60 border-brand-500 text-slate-900 dark:text-slate-100 ring-2 ring-brand-500/20 font-semibold'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-brand-600 text-white shadow-md'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed">{option.text}</span>
                      </div>

                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(option.id || option.text)}
                        className="accent-brand-600 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5 disabled:opacity-40"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < questionsState.length - 1 ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    <span>Next</span>
                    <FiChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onOpenReviewModal(questionsState)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold"
                  >
                    <FiSend className="w-4 h-4" />
                    <span>Submit Quiz</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigation Grid Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <FiGrid className="w-4 h-4 text-brand-600" />
                <span>Question Navigator</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {answeredCount}/{questionsState.length} Answered
              </span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Review ({markedReviewCount})</span>
              </div>
            </div>

            {/* Questions Numbers Grid */}
            <div className="grid grid-cols-5 gap-2.5 pt-2">
              {questionsState.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = !!q.userSelectedOptionId;
                const isMarked = !!q.isMarkedForReview;

                let stateStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                if (isMarked) {
                  stateStyles = 'bg-purple-600 text-white border-purple-600 shadow-md';
                } else if (isAnswered) {
                  stateStyles = 'bg-emerald-600 text-white border-emerald-600 shadow-md';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-xl font-mono text-xs font-bold border transition-all flex items-center justify-center relative ${stateStyles} ${
                      isCurrent ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900 scale-105' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 text-yellow-300">★</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Review & Submit Quiz Trigger */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="primary"
                size="md"
                onClick={() => onOpenReviewModal(questionsState)}
                className="w-full justify-center text-xs flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                <FiSend className="w-4 h-4" />
                <span>Review & Submit Quiz</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
