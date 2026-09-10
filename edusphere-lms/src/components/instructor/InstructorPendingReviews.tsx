import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiCheckSquare, FiClock, FiCheckCircle } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type {
  PendingAssignmentReview,
  PendingQuizReview,
} from '../../data/instructorDummyData';
import { assignmentService } from '../../services/assignmentService';
import { quizService } from '../../services/quizService';

interface InstructorPendingReviewsProps {
  onReviewAssignment: (assignment: PendingAssignmentReview) => void;
  onReviewQuiz: (quiz: PendingQuizReview) => void;
}

export const InstructorPendingReviews: React.FC<InstructorPendingReviewsProps> = ({
  onReviewAssignment,
  onReviewQuiz,
}) => {
  const navigate = useNavigate();
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignmentReview[]>([]);
  const [pendingQuizzes, setPendingQuizzes] = useState<PendingQuizReview[]>([]);
  const [isLoadingAsgs, setIsLoadingAsgs] = useState<boolean>(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState<boolean>(true);
  const [asgError, setAsgError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const fetchPendingAssignments = async () => {
    try {
      setIsLoadingAsgs(true);
      setAsgError(null);
      const res = await assignmentService.getInstructorPendingSubmissions();
      if (res.success && Array.isArray(res.data)) {
        const mapped: PendingAssignmentReview[] = res.data.map((s) => {
          const subDate = s.submittedAt ? new Date(s.submittedAt) : new Date();
          const dateStr = subDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata',
          });

          return {
            id: s.id,
            studentName: s.studentName || 'Student',
            studentAvatar: s.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.studentName || 'Student')}&background=6366f1&color=fff`,
            courseTitle: s.courseTitle || 'Enrolled Course',
            assignmentTitle: s.assignmentTitle || 'Assignment',
            submittedDate: dateStr,
            status: s.status || 'Submitted',
            maxScore: s.maxScore || 100,
            submissionSnippet: s.submissionText || s.fileUrl || 'Assignment submission uploaded and ready for evaluation.',
          };
        });
        setPendingAssignments(mapped);
      } else {
        setPendingAssignments([]);
      }
    } catch (err: any) {
      setAsgError(err?.message || 'Unable to load pending submissions.');
    } finally {
      setIsLoadingAsgs(false);
    }
  };

  const fetchPendingQuizzes = async () => {
    try {
      setIsLoadingQuizzes(true);
      setQuizError(null);
      const res = await quizService.getInstructorReattemptRequests();
      if (res.success && Array.isArray(res.data)) {
        const pendingOnly = res.data.filter((r) => (r.status || '').toLowerCase() === 'pending');
        const mapped: PendingQuizReview[] = pendingOnly.map((q) => {
          const reqDate = q.requestedAt ? new Date(q.requestedAt) : new Date();
          const dateStr = reqDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata',
          });

          return {
            id: q.id,
            studentName: q.studentName || 'Student',
            studentAvatar: q.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(q.studentName || 'Student')}&background=8b5cf6&color=fff`,
            courseTitle: q.courseTitle || 'Course',
            quizTitle: q.quizTitle || 'Quiz',
            submittedDate: dateStr,
            autoScore: `Attempts: ${q.attemptsUsed || 0} / ${q.maxAttempts || 3}`,
            pendingScore: q.reason || 'Reattempt requested',
          };
        });
        setPendingQuizzes(mapped);
      } else {
        setPendingQuizzes([]);
      }
    } catch (err: any) {
      setQuizError(err?.message || 'Unable to load quiz review requests.');
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    fetchPendingAssignments();
    fetchPendingQuizzes();

    const handleAssignmentGraded = () => {
      fetchPendingAssignments();
    };

    const handleQuizReattemptResolved = () => {
      fetchPendingQuizzes();
    };

    window.addEventListener('assignment-graded', handleAssignmentGraded);
    window.addEventListener('quiz-reattempt-resolved', handleQuizReattemptResolved);
    return () => {
      window.removeEventListener('assignment-graded', handleAssignmentGraded);
      window.removeEventListener('quiz-reattempt-resolved', handleQuizReattemptResolved);
    };
  }, []);

  const asgPendingCount = pendingAssignments.length;
  const quizPendingCount = pendingQuizzes.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Assignment Grading Reminder Card */}
      <Card className="p-6 space-y-4 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-2xl">
                <FiFileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Assignment Grading Reminder
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pending student assignment submissions requiring evaluation.
                </p>
              </div>
            </div>

            <Badge variant={asgPendingCount > 0 ? 'warning' : 'success'} className="px-3 py-1 text-xs">
              {asgPendingCount} {asgPendingCount === 1 ? 'Submission' : 'Submissions'} Pending
            </Badge>
          </div>

          {/* Metric Summary Box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Assignments Awaiting Grading</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-lg">
                {new Set(pendingAssignments.map((a) => a.assignmentTitle)).size}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Pending Submissions</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-lg">
                {asgPendingCount}
              </span>
            </div>
          </div>

          {isLoadingAsgs ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading pending reviews...</div>
          ) : asgError ? (
            <div className="py-6 text-center text-xs text-rose-500 space-y-1">
              <p className="font-bold">Unable to load pending submissions.</p>
              <p className="text-[11px]">{asgError}</p>
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-600 dark:text-slate-300">No pending submissions.</p>
              <p className="text-[11px]">All student assignments have been reviewed and evaluated.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingAssignments.slice(0, 4).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 2 }}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.studentAvatar}
                      alt={item.studentName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-rose-500/20"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.assignmentTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.studentName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <FiClock className="w-3 h-3 text-slate-400" /> {item.submittedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shrink-0 justify-center"
                    onClick={() => onReviewAssignment(item)}
                  >
                    <FiCheckCircle className="w-3.5 h-3.5 mr-1" /> Grade Now
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Assignment Management Studio
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/instructor/assignments?tab=pending')}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            View All ({asgPendingCount}) →
          </Button>
        </div>
      </Card>

      {/* 2. Quizzes Pending Evaluation Card */}
      <Card className="p-6 space-y-4 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
                <FiCheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Quizzes & Reattempts Waiting Review
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Student quiz reattempt requests and evaluations.
                </p>
              </div>
            </div>

            <Badge variant={quizPendingCount > 0 ? 'warning' : 'neutral'}>
              {quizPendingCount} Pending
            </Badge>
          </div>

          {isLoadingQuizzes ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading quiz requests...</div>
          ) : quizError ? (
            <div className="py-6 text-center text-xs text-rose-500 space-y-1">
              <p className="font-bold">Unable to load quiz requests.</p>
              <p className="text-[11px]">{quizError}</p>
            </div>
          ) : pendingQuizzes.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-600 dark:text-slate-300">No pending quiz requests.</p>
              <p className="text-[11px]">All student quiz reattempts and evaluations are resolved.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingQuizzes.slice(0, 4).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 2 }}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.studentAvatar}
                      alt={item.studentName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-purple-500/20"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.quizTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.studentName}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-purple-600 font-bold text-[11px]">
                          {item.autoScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shrink-0 justify-center"
                    onClick={() => onReviewQuiz(item)}
                  >
                    <FiCheckCircle className="w-3.5 h-3.5 mr-1" /> Review Request
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/instructor/quizzes')}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            View All Quizzes →
          </Button>
        </div>
      </Card>
    </div>
  );
};
