import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { FiAward } from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { QuizHeader } from '../../components/quizzes/QuizHeader';
import { QuizStatsCards } from '../../components/quizzes/QuizStatsCards';
import { QuizFilterBar, type QuizFilterState } from '../../components/quizzes/QuizFilterBar';
import { QuizCard } from '../../components/quizzes/QuizCard';
import { QuizInstructionsModal } from '../../components/quizzes/QuizInstructionsModal';
import { QuizAttemptWorkspace } from '../../components/quizzes/QuizAttemptWorkspace';
import { QuizReviewModal } from '../../components/quizzes/QuizReviewModal';
import { QuizResultScreen } from '../../components/quizzes/QuizResultScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';

import { showSuccessAlert, showWarningAlert, showConfirmAlert, showErrorAlert } from '../../utils/swalAlerts';
import { quizService } from '../../services/quizService';
import { progressService } from '../../services/progressService';
import type { StudentQuizDetail, QuizQuestion } from '../../types';

export const StudentQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get('courseId');

  // Core Real Datasets State with Instant Cache Initialization (0ms UI render)
  const cachedQuizzes = quizService.getCachedStudentEnrolledQuizzes(courseIdParam || undefined);
  const [quizzes, setQuizzes] = useState<StudentQuizDetail[]>(() => cachedQuizzes || []);
  const [isLoading, setIsLoading] = useState(() => !cachedQuizzes || cachedQuizzes.length === 0);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

  // View Mode: 'dashboard' | 'attempt' | 'results'
  const [viewMode, setViewMode] = useState<'dashboard' | 'attempt' | 'results'>('dashboard');

  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Helper to clean quiz questions answers for a fresh attempt
  const cleanQuizQuestions = (questions: QuizQuestion[]): QuizQuestion[] => {
    return (questions || []).map((q) => ({
      ...q,
      userSelectedOptionId: undefined,
      correctOptionId: '',
      isMarkedForReview: false,
    }));
  };

  // Active Quiz Selected State
  const [selectedQuiz, setSelectedQuiz] = useState<StudentQuizDetail | null>(null);

  // Instructions Modal Control
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);

  // Review Modal Control during test attempt
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [attemptQuestionsState, setAttemptQuestionsState] = useState<QuizQuestion[]>([]);

  // Results State
  const [lastResultsData, setLastResultsData] = useState<{
    quiz: StudentQuizDetail;
    questionsResult: QuizQuestion[];
    timeTakenMinutes: number;
  } | null>(null);

  // Filters State
  const [filters, setFilters] = useState<QuizFilterState>({
    searchQuery: '',
    course: 'all',
    status: 'all',
    difficulty: 'all',
    sortBy: 'newest',
  });

  // Load Real Quizzes from Backend
  const loadQuizzes = async () => {
    try {
      const hasCached = Boolean(quizService.getCachedStudentEnrolledQuizzes(courseIdParam || undefined));
      if (!hasCached) {
        setIsLoading(true);
      }
      const res = await quizService.getStudentEnrolledQuizzes(courseIdParam || undefined);
      if (res.success && Array.isArray(res.data)) {
        setQuizzes(res.data);
        // If courseIdParam is present, automatically set course filter if matching
        if (courseIdParam && res.data.length > 0) {
          const matchingQuiz = res.data.find((q) => q.courseId === courseIdParam);
          if (matchingQuiz) {
            setFilters((prev) => ({ ...prev, course: matchingQuiz.courseTitle }));
          }
        }
      } else if (!hasCached) {
        setQuizzes([]);
      }
    } catch {
      if (!quizService.getCachedStudentEnrolledQuizzes(courseIdParam || undefined)) {
        setQuizzes([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [courseIdParam]);

  // Unique Courses List
  const coursesList = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => set.add(q.courseTitle));
    return Array.from(set);
  }, [quizzes]);

  // Statistics Metrics
  const totalCount = quizzes.length;
  const availableCount = useMemo(() => quizzes.filter((q) => !q.isLocked && q.status !== 'passed' && q.status !== 'failed').length, [quizzes]);
  const inProgressCount = useMemo(() => quizzes.filter((q) => q.status === 'in_progress').length, [quizzes]);
  const completedCount = useMemo(() => quizzes.filter((q) => q.status === 'completed' || q.status === 'passed' || q.status === 'failed').length, [quizzes]);
  const passedCount = useMemo(() => quizzes.filter((q) => q.status === 'passed').length, [quizzes]);
  const failedCount = useMemo(() => quizzes.filter((q) => q.status === 'failed').length, [quizzes]);

  const averageScore = useMemo(() => {
    const evaluatedQuizzes = quizzes.filter((q) => q.lastScore !== undefined);
    if (evaluatedQuizzes.length === 0) return 0;
    const sum = evaluatedQuizzes.reduce((acc, curr) => acc + (curr.lastScore || 0), 0);
    return Math.round(sum / evaluatedQuizzes.length);
  }, [quizzes]);

  // Filter & Search Logic
  const filteredQuizzes = useMemo(() => {
    return quizzes
      .filter((q) => {
        // Search
        if (filters.searchQuery.trim() !== '') {
          const query = filters.searchQuery.toLowerCase();
          if (!q.title.toLowerCase().includes(query) && !q.courseTitle.toLowerCase().includes(query)) {
            return false;
          }
        }
        // Course Filter
        if (filters.course !== 'all' && q.courseTitle !== filters.course) return false;
        // Status Filter
        if (filters.status !== 'all' && q.status !== filters.status) return false;
        // Difficulty Filter
        if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        if (filters.sortBy === 'oldest') {
          return a.id.localeCompare(b.id);
        }
        return b.id.localeCompare(a.id);
      });
  }, [quizzes, filters]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      course: 'all',
      status: 'all',
      difficulty: 'all',
      sortBy: 'newest',
    });
  };

  // Refresh
  const handleRefresh = () => {
    loadQuizzes();
  };

  // Handlers for Quiz Flow
  const handleOpenDetails = (quiz: StudentQuizDetail) => {
    setSelectedQuiz(quiz);
    setIsInstructionsModalOpen(true);
  };

  const handleStartQuizFromCard = (quiz: StudentQuizDetail) => {
    if (quiz.isLocked) {
      showWarningAlert(
        'Quiz Locked',
        quiz.lockReason || 'You must complete and pass all required course assignments before attempting this quiz.'
      );
      return;
    }
    setSelectedQuiz(quiz);
    setIsInstructionsModalOpen(true);
  };

  const handleConfirmStartQuiz = async (quiz: StudentQuizDetail) => {
    try {
      setIsLoading(true);
      const res = await quizService.startAttempt(quiz.id);
      if (res.success && res.data) {
        const cleanQuiz: StudentQuizDetail = {
          ...quiz,
          questions: cleanQuizQuestions(quiz.questions),
        };
        setActiveAttemptId(res.data.id);
        setIsInstructionsModalOpen(false);
        setSelectedQuiz(cleanQuiz);
        setAttemptQuestionsState(cleanQuiz.questions);
        setViewMode('attempt');
      } else {
        showErrorAlert('Cannot Start Quiz', res.message || 'Failed to start quiz attempt');
      }
    } catch (err: any) {
      showErrorAlert(
        'Quiz Access Restriction',
        err?.response?.data?.message || err?.message || 'Failed to start quiz attempt'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakeQuiz = async (quiz: StudentQuizDetail) => {
    if (quiz.isLocked) {
      showWarningAlert(
        'Quiz Locked',
        quiz.lockReason || 'You must complete and pass all required course assignments before attempting this quiz.'
      );
      return;
    }
    if (quiz.attemptRequestStatus === 'rejected') {
      showErrorAlert(
        'Request Rejected',
        'Your request for an additional attempt on this quiz was rejected by your instructor.'
      );
      return;
    }
    if (quiz.attemptsUsed >= (quiz.maxAttempts || 3) && quiz.attemptRequestStatus !== 'approved') {
      showWarningAlert(
        'Maximum Attempts Reached',
        `You have used all ${quiz.maxAttempts || 3} attempts. You can request another attempt from your instructor.`
      );
      return;
    }

    try {
      setIsLoading(true);
      const res = await quizService.startAttempt(quiz.id);
      if (res.success && res.data) {
        const cleanQuiz: StudentQuizDetail = {
          ...quiz,
          questions: cleanQuizQuestions(quiz.questions),
        };
        setActiveAttemptId(res.data.id);
        setSelectedQuiz(cleanQuiz);
        setAttemptQuestionsState(cleanQuiz.questions);
        setViewMode('attempt');
      } else {
        showErrorAlert('Cannot Start Retake', res.message || 'Failed to start new quiz attempt');
      }
    } catch (err: any) {
      showErrorAlert(
        'Retake Error',
        err?.response?.data?.message || err?.message || 'Failed to start new quiz attempt'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewModal = (questionsState: QuizQuestion[]) => {
    setAttemptQuestionsState(questionsState);
    setIsReviewModalOpen(true);
  };

  const handleConfirmFinalSubmit = async () => {
    if (!selectedQuiz || !activeAttemptId || isSubmittingQuiz) return;

    try {
      setIsSubmittingQuiz(true);
      // Format answers payload for backend evaluation
      const answersPayload = attemptQuestionsState.map((q) => ({
        questionId: q.id,
        answer: q.userSelectedOptionId,
      }));

      // Safe diagnostic logging (no sensitive secrets or tokens)
      console.log('[QuizSubmit]', {
        quizId: selectedQuiz.id,
        attemptId: activeAttemptId,
        studentAttemptsUsed: selectedQuiz.attemptsUsed,
        numberOfAnswers: answersPayload.length,
      });

      const res = await quizService.submitAttempt(activeAttemptId, answersPayload);
      if (res.success && res.data) {
        setIsReviewModalOpen(false);
        const attemptData = res.data;
        const percentage = Math.round(Number(attemptData.percentage));
        const isPassed = attemptData.passed === true;

        // Fetch attempt result with question answers review
        const resultRes = await quizService.getAttemptResult(activeAttemptId);
        const reviewedAnswers = resultRes.success && resultRes.data ? resultRes.data.answers || [] : [];

        const questionsWithReview: QuizQuestion[] = attemptQuestionsState.map((q) => {
          const ans = reviewedAnswers.find((a: any) => a.questionId === q.id);
          return {
            ...q,
            userSelectedOptionId: ans ? ans.answer : q.userSelectedOptionId,
            correctOptionId: ans?.correctOptionId || (ans?.isCorrect ? (q.userSelectedOptionId as any) : ''),
            correctAnswer: ans?.correctAnswer,
            isAnswerCorrect: ans ? ans.isCorrect : undefined,
          };
        });

        // Set results view
        const updatedQuizState: StudentQuizDetail = {
          ...selectedQuiz,
          attemptsUsed: selectedQuiz.attemptsUsed + 1,
          status: isPassed ? 'passed' : 'failed',
          lastScore: percentage,
        };

        setLastResultsData({
          quiz: updatedQuizState,
          questionsResult: questionsWithReview,
          timeTakenMinutes: 10,
        });

        // Update overall course progress in cache & reload list
        await progressService.getCourseProgress(selectedQuiz.courseId);
        loadQuizzes();

        if (isPassed) {
          showSuccessAlert(
            'Congratulations! Quiz Passed 🎉',
            `You scored ${percentage}%! Passing mark was ${selectedQuiz.passingScore}%. Course progress updated!`
          );
        } else {
          showWarningAlert(
            'Quiz Submitted',
            `You scored ${percentage}%. Required passing score is ${selectedQuiz.passingScore}%.`
          );
        }

        setViewMode('results');
      } else {
        showErrorAlert('Submission Failed', res.message || 'Failed to submit quiz attempt');
      }
    } catch (err: any) {
      console.error('[QuizSubmitError]', {
        status: err?.response?.status,
        message: err?.response?.data?.message || err?.message,
      });
      showErrorAlert(
        'Submission Error',
        err?.response?.data?.message || err?.message || 'Error occurred during quiz submission'
      );
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleRequestExtraAttempt = async (quizToRequest?: StudentQuizDetail) => {
    const targetQuiz = quizToRequest || selectedQuiz;
    if (!targetQuiz) return;

    if (targetQuiz.attemptRequestStatus === 'rejected') {
      showErrorAlert('Request Rejected', 'Your request for an additional attempt on this quiz was rejected by your instructor.');
      return;
    }
    if (targetQuiz.attemptRequestStatus === 'pending') {
      showWarningAlert('Request Pending', 'An additional attempt request is already pending review by your instructor.');
      return;
    }

    showConfirmAlert(
      'Request another quiz attempt?',
      'Your request will be submitted to your instructor for approval. You will receive 1 additional attempt once approved.',
      'Request Attempt',
      'Cancel'
    ).then(async (confirmed) => {
      if (confirmed) {
        try {
          setIsLoading(true);
          const res = await quizService.requestReattempt(targetQuiz.id, 'Requesting extra attempt after exhausting configured attempts.');
          if (res.success) {
            showSuccessAlert('Request Sent!', 'Your request has been submitted to your instructor for review.');
            setLastResultsData((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                quiz: {
                  ...prev.quiz,
                  attemptRequestStatus: 'pending',
                },
              };
            });
            await loadQuizzes();
          } else {
            showErrorAlert('Request Failed', res.message || 'Failed to send reattempt request');
          }
        } catch (err: any) {
          showErrorAlert('Request Error', err?.response?.data?.message || err?.message || 'Failed to send reattempt request');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleViewResultFromCard = async (quiz: StudentQuizDetail) => {
    setSelectedQuiz(quiz);
    const latestAttemptId = quiz.attemptHistory?.[0]?.id;
    let questionsWithReview = quiz.questions;

    if (latestAttemptId) {
      try {
        const res = await quizService.getAttemptResult(latestAttemptId);
        if (res.success && res.data?.answers) {
          const reviewedAnswers = res.data.answers;
          questionsWithReview = quiz.questions.map((q) => {
            const ans = reviewedAnswers.find((a: any) => a.questionId === q.id);
            return {
              ...q,
              userSelectedOptionId: ans ? ans.answer : undefined,
              correctOptionId: ans?.correctOptionId || (ans?.isCorrect ? (ans.answer as string) : ''),
              correctAnswer: ans?.correctAnswer,
            };
          });
        }
      } catch (err) {
        console.error('Failed to fetch attempt details for result view:', err);
      }
    }

    setLastResultsData({
      quiz,
      questionsResult: questionsWithReview,
      timeTakenMinutes: 10,
    });
    setViewMode('results');
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* 1. Quiz Test Attempt View */}
      {viewMode === 'attempt' && selectedQuiz && activeAttemptId && (
        <QuizAttemptWorkspace
          key={activeAttemptId}
          quiz={selectedQuiz}
          onCancelAttempt={() => setViewMode('dashboard')}
          onOpenReviewModal={handleOpenReviewModal}
        />
      )}

      {/* 2. Quiz Result View */}
      {viewMode === 'results' && lastResultsData && (
        <QuizResultScreen
          quiz={lastResultsData.quiz}
          questionsResult={lastResultsData.questionsResult}
          timeTakenMinutes={lastResultsData.timeTakenMinutes}
          onBackToList={() => setViewMode('dashboard')}
          onRetakeQuiz={() => handleRetakeQuiz(lastResultsData.quiz)}
          onRequestExtraAttempt={() => handleRequestExtraAttempt(lastResultsData.quiz)}
        />
      )}

      {/* 3. Quiz Dashboard Listing View */}
      {viewMode === 'dashboard' && (
        <div className="space-y-8">
          {/* Header */}
          <QuizHeader
            totalCount={totalCount}
            availableCount={availableCount}
            completedCount={passedCount + failedCount}
            passedCount={passedCount}
            failedCount={failedCount}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />

          {/* Progression Unlock Banner - Only displayed if all quizzes are passed or student has completed courses */}
          {passedCount > 0 && availableCount === 0 && (
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-900/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl font-extrabold text-sm shrink-0">
                  🎓
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                    Congratulations! All required coursework and quizzes are passed.
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Sequence requirement met: Lessons (100%) → Assignments (100%) → Quizzes (Passed) → Certificate Unlocked.
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/student/certificates')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shrink-0 text-xs shadow-sm"
              >
                <FiAward className="w-4 h-4" />
                <span>View Certificates</span>
              </Button>
            </div>
          )}

          {/* Skeleton Loading State */}
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
              <SkeletonLoader className="h-20 w-full rounded-2xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : quizzes.length === 0 ? (
            /* Empty State View */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-6"
            >
              <EmptyState
                type="courses"
                title="No quizzes available."
                description="You currently have no active or completed knowledge verification quizzes assigned to your enrolled courses."
                actionLabel="Back to My Courses"
                onAction={() => navigate('/student/courses')}
              />
            </motion.div>
          ) : (
            /* Populated Quizzes View */
            <div className="space-y-8">
              {/* Statistics Cards */}
              <QuizStatsCards
                availableCount={availableCount}
                inProgressCount={inProgressCount}
                completedCount={completedCount}
                passedCount={passedCount}
                failedCount={failedCount}
                averageScore={averageScore}
                activeFilterStatus={filters.status}
                onSelectStatusFilter={(status) => setFilters({ ...filters, status })}
              />

              {/* Filter Bar */}
              <QuizFilterBar
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={handleResetFilters}
                courses={coursesList}
                totalFilteredCount={filteredQuizzes.length}
              />

              {/* Quiz Cards Grid */}
              {filteredQuizzes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                  <EmptyState
                    type="courses"
                    title="No quizzes match your filter criteria"
                    description="Try resetting search keywords or expanding difficulty filters."
                    actionLabel="Reset Search Filters"
                    onAction={handleResetFilters}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQuizzes.map((quiz) => (
                    <motion.div key={quiz.id} layout>
                      <QuizCard
                        quiz={quiz}
                        onOpenDetails={handleOpenDetails}
                        onStartQuiz={handleStartQuizFromCard}
                        onViewResult={handleViewResultFromCard}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions Modal */}
      <QuizInstructionsModal
        isOpen={isInstructionsModalOpen}
        onClose={() => setIsInstructionsModalOpen(false)}
        quiz={selectedQuiz}
        onConfirmStart={handleConfirmStartQuiz}
      />

      {/* Review Modal during attempt */}
      <QuizReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        questions={attemptQuestionsState}
        onConfirmFinalSubmit={handleConfirmFinalSubmit}
        isSubmitting={isSubmittingQuiz}
      />
    </motion.div>
  );
};
