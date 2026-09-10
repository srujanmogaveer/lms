import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiXCircle,
  FiRotateCcw,
  FiArrowLeft,
  FiHelpCircle,
  FiCheck,
  FiX,
  FiInfo,
  FiAward,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { StudentQuizDetail, QuizQuestion } from '../../types';

interface QuizResultScreenProps {
  quiz: StudentQuizDetail;
  questionsResult: QuizQuestion[];
  timeTakenMinutes?: number;
  onBackToList: () => void;
  onRetakeQuiz: () => void;
  onRequestExtraAttempt?: () => void;
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({
  quiz,
  questionsResult,
  onBackToList,
  onRetakeQuiz,
  onRequestExtraAttempt,
}) => {
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(false);

  const {
    attemptsUsed,
    maxAttempts = 3,
    attemptRequestStatus = 'none',
  } = quiz;

  // Calculate score
  const answeredQuestions = questionsResult.filter((q) => q.userSelectedOptionId !== undefined);
  let percentage = quiz.lastScore !== undefined ? quiz.lastScore : 0;
  let scoreMarks = Math.round((percentage / 100) * quiz.totalPoints);
  let isPassed = percentage >= quiz.passingScore;

  if (answeredQuestions.length > 0 && quiz.lastScore === undefined) {
    const correctCount = questionsResult.filter((q) => {
      if (Array.isArray(q.userSelectedOptionId)) {
        return q.userSelectedOptionId.length > 0;
      }
      return (
        (q.correctOptionId && q.userSelectedOptionId === q.correctOptionId) ||
        (q.correctAnswer && String(q.userSelectedOptionId).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase())
      );
    }).length;
    const totalQuestions = questionsResult.length || 1;
    percentage = Math.round((correctCount / totalQuestions) * 100);
    scoreMarks = Math.round((percentage / 100) * quiz.totalPoints);
    isPassed = percentage >= quiz.passingScore;
  }

  const isAttemptsExhausted = !isPassed && attemptsUsed >= maxAttempts;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Result Hero Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-xl border ${
          isPassed
            ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white border-emerald-700/60'
            : 'bg-gradient-to-br from-red-900 via-red-950 to-slate-950 text-white border-red-700/60'
        }`}
      >
        {/* Pass/Fail Icon Badge */}
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
          {isPassed ? (
            <FiCheckCircle className="w-10 h-10 text-emerald-400" />
          ) : (
            <FiXCircle className="w-10 h-10 text-red-400" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge
              variant={isPassed ? 'success' : 'danger'}
              className="px-3 py-1 text-xs uppercase tracking-widest font-bold"
            >
              {isPassed ? 'Quiz Passed 🎉' : 'Quiz Failed'}
            </Badge>

            <Badge variant="neutral" className="px-3 py-1 text-xs font-bold bg-white/10 text-white border border-white/20">
              Attempt: {attemptsUsed}/{maxAttempts}
            </Badge>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {isPassed
              ? 'Quiz Passed 🎉'
              : isAttemptsExhausted
              ? 'Quiz Locked'
              : 'Quiz Failed'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {isPassed
              ? 'Congratulations! You met the passing requirements for this quiz. You can review your assessment answer key below.'
              : isAttemptsExhausted
              ? attemptRequestStatus === 'rejected'
                ? `You have used all ${maxAttempts} attempts for this quiz and your reattempt request was rejected.`
                : attemptRequestStatus === 'pending'
                ? `You have used all ${maxAttempts} attempts. Your reattempt request is under review.`
                : `You have used all ${maxAttempts} attempts. You can request another attempt from your instructor.`
              : 'You did not achieve the required passing score. Review your course materials and try again.'}
          </p>
        </div>

        {/* Locked / Exhausted Attempt Banner */}
        {isAttemptsExhausted && (
          <div className="p-4 bg-red-950/70 border border-red-500/50 rounded-2xl max-w-lg mx-auto space-y-2 text-red-100 text-xs sm:text-sm">
            <p className="font-bold flex items-center justify-center gap-1.5 text-amber-300">
              <FiXCircle className="w-4 h-4 text-red-400" />
              <span>
                {attemptRequestStatus === 'rejected'
                  ? `You have used all ${maxAttempts} attempts. Reattempt request was rejected.`
                  : attemptRequestStatus === 'pending'
                  ? `You have used all ${maxAttempts} attempts. Reattempt request is pending review.`
                  : `You have used all ${maxAttempts} attempts. You can request another attempt from your instructor.`}
              </span>
            </p>

            {attemptRequestStatus === 'approved' && attemptsUsed < maxAttempts && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl font-bold text-emerald-200 text-xs">
                🎉 Additional Attempt Approved! You have been granted an extra attempt ({attemptsUsed + 1}/{maxAttempts}).
              </div>
            )}

            {attemptRequestStatus === 'pending' && (
              <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl font-bold text-amber-200 text-xs">
                ⌛ Request Pending: Your request has been sent to the instructor.
              </div>
            )}

            {attemptRequestStatus === 'rejected' && (
              <div className="p-3 bg-rose-900/60 border border-rose-500/40 rounded-xl space-y-1 text-xs text-left">
                <span className="font-bold text-rose-200 block">❌ Additional Attempt Request Rejected</span>
                {quiz.attemptRequestFeedback ? (
                  <span className="text-rose-300 block font-normal">Instructor Feedback: "{quiz.attemptRequestFeedback}"</span>
                ) : (
                  <span className="text-rose-300 block font-normal">Your instructor has rejected your previous request for additional attempts.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-xs">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[11px]">Score</span>
            <span className="text-xl font-black text-white font-mono">{scoreMarks} / {quiz.totalPoints}</span>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[11px]">Percentage</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{percentage}%</span>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[11px]">Passing Marks</span>
            <span className="text-xl font-black text-white font-mono">{quiz.passingScore}%</span>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[11px]">Status</span>
            <span className={`text-lg font-black font-mono uppercase ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPassed ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>

        {/* Available Next Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={onBackToList}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center justify-center gap-1.5"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Quiz Dashboard</span>
          </Button>

          {/* Review Answers & View Certificate Buttons (Available ONLY if Student Passes) */}
          {isPassed && (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/student/certificates')}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5 shadow-lg font-bold"
              >
                <FiAward className="w-4 h-4" />
                <span>View Certificate</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setShowReview(!showReview)}
                className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10 flex items-center justify-center gap-1.5 font-bold"
              >
                <FiHelpCircle className="w-4 h-4" />
                <span>{showReview ? 'Hide Answer Review' : 'Review Answers'}</span>
              </Button>
            </>
          )}

          {!isPassed && (
            <>
              {attemptsUsed < maxAttempts ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onRetakeQuiz}
                  className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center gap-1.5 shadow-lg font-bold"
                >
                  <FiRotateCcw className="w-4 h-4" />
                  <span>
                    {attemptRequestStatus === 'approved'
                      ? `Start Attempt ${attemptsUsed + 1} (${attemptsUsed + 1}/${maxAttempts})`
                      : `Retake Quiz (Attempt ${attemptsUsed + 1}/${maxAttempts})`}
                  </span>
                </Button>
              ) : attemptRequestStatus === 'pending' ? (
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="w-full sm:w-auto bg-amber-500/20 text-amber-200 border-amber-400/40 cursor-not-allowed font-bold"
                >
                  <span>Request Pending</span>
                </Button>
              ) : attemptRequestStatus === 'rejected' ? (
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="w-full sm:w-auto bg-rose-500/20 text-rose-300 border-rose-500/40 cursor-not-allowed font-bold"
                >
                  <span>Request Rejected</span>
                </Button>
              ) : attemptRequestStatus === 'none' ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onRequestExtraAttempt}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5 shadow-lg font-bold"
                >
                  <span>Request Another Attempt</span>
                </Button>
              ) : null}
            </>
          )}
        </div>
      </motion.div>

      {/* Detailed Answer Review (EXCLUSIVELY for Passed Attempts) */}
      {isPassed && showReview && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Assessment Answer Review & Key</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your responses against official correct answers and instructor rationales.
            </p>
          </div>

          <div className="space-y-6">
            {questionsResult.map((q, idx) => {
              // Resolve student's selected answer text
              let userSelectedText = 'No answer selected';
              if (Array.isArray(q.userSelectedOptionId)) {
                const selectedTexts = q.options
                  .filter((opt) => (q.userSelectedOptionId as string[]).includes(opt.id) || (q.userSelectedOptionId as string[]).includes(opt.text))
                  .map((opt) => opt.text);
                userSelectedText = selectedTexts.length > 0 ? selectedTexts.join(', ') : 'No options selected';
              } else if (q.userSelectedOptionId) {
                const userOpt = q.options.find((opt) => opt.id === q.userSelectedOptionId || opt.text === q.userSelectedOptionId);
                userSelectedText = userOpt ? userOpt.text : String(q.userSelectedOptionId);
              }

              // Resolve official correct answer
              const correctOpt = q.options.find((opt) => opt.id === q.correctOptionId || opt.text === q.correctOptionId || opt.isCorrect);
              const correctText = correctOpt ? correctOpt.text : q.correctAnswer ? String(q.correctAnswer) : q.correctOptionId ? String(q.correctOptionId) : null;

              // Determine correctness
              const isCorrect = q.userSelectedOptionId !== undefined && (
                (q.correctOptionId && q.userSelectedOptionId === q.correctOptionId) ||
                (q.correctAnswer && String(q.userSelectedOptionId).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase())
              );

              return (
                <div
                  key={q.id || idx}
                  className={`p-5 rounded-2xl border space-y-4 text-xs ${
                    isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  {/* Question Header & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{q.questionText}</span>
                    </div>

                    <div className="shrink-0">
                      {isCorrect ? (
                        <Badge variant="success" className="flex items-center gap-1 font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <FiCheck className="w-3.5 h-3.5" /> Correct Answer
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="flex items-center gap-1 font-bold">
                          <FiX className="w-3.5 h-3.5" /> Incorrect Answer
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Code Snippet if present */}
                  {q.codeSnippet && (
                    <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 p-4 font-mono text-[11px] leading-relaxed">
                      <code>{q.codeSnippet.code}</code>
                    </div>
                  )}

                  {/* Answer Comparison Details */}
                  <div className="space-y-2 pt-1 font-sans">
                    {/* Student's Answer */}
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                          : 'bg-rose-100/70 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Your Answer:</span>
                        <span className="font-bold text-xs">
                          {userSelectedText}
                        </span>
                      </div>
                      {isCorrect ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                          ✅ Correct Answer
                        </span>
                      ) : (
                        <span className="text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1">
                          ❌ Incorrect Answer
                        </span>
                      )}
                    </div>

                    {/* Official Correct Answer (If student answered wrong) */}
                    {!isCorrect && correctText && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200">
                        <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Correct Answer:</span>
                        <span className="font-bold text-xs">{correctText}</span>
                      </div>
                    )}
                  </div>

                  {/* Explanation Rationale */}
                  {q.explanation && (
                    <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                      <FiInfo className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-slate-100 block">Explanation Rationale:</strong>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

