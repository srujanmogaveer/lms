import React, { useState } from 'react';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FiCheckCircle, FiVideo, FiCheckSquare } from 'react-icons/fi';
import type {
  PendingAssignmentReview,
  PendingQuizReview,
  UpcomingInstructorLiveClass,
} from '../../data/instructorDummyData';

interface ReviewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: PendingAssignmentReview | null;
  onGradeSubmitted: (id: string, score: number, feedback: string) => void;
}

export const ReviewAssignmentModal: React.FC<ReviewAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onGradeSubmitted,
}) => {
  const [score, setScore] = useState<number>(90);
  const [feedback, setFeedback] = useState<string>('Good job on your assignment submission!');

  if (!assignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGradeSubmitted(assignment.id, score, feedback);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Instructor Assignment Grading Console">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <Badge variant="warning">{assignment.status}</Badge>
            <span className="font-mono text-slate-400">Submitted: {assignment.submittedDate}</span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{assignment.assignmentTitle}</h3>
          <p className="text-slate-500 font-medium">{assignment.courseTitle}</p>
        </div>

        <div className="flex items-center gap-3 p-3 bg-brand-50/50 dark:bg-brand-950/40 rounded-xl border border-brand-100 dark:border-brand-900">
          <img src={assignment.studentAvatar} alt={assignment.studentName} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{assignment.studentName}</p>
            <p className="text-[11px] text-slate-500">Student Submission Evaluation</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">Student Submission Content / Notes:</label>
          <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 whitespace-pre-wrap">
            {assignment.submissionSnippet}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Score (Out of {assignment.maxScore}):</label>
            <input
              type="number"
              min="0"
              max={assignment.maxScore}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-brand-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Grade Status:</label>
            <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold rounded-xl border border-emerald-200 dark:border-emerald-900">
              {score >= 80 ? 'Pass with Distinction' : 'Pass'}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">Instructor Feedback:</label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1 justify-center" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1 justify-center bg-rose-600 hover:bg-rose-700 text-white font-bold">
            <FiCheckCircle className="w-4 h-4 mr-1.5" /> Submit Evaluation
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

interface ReviewQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: PendingQuizReview | null;
  onQuizApproved: (id: string) => void;
}

export const ReviewQuizModal: React.FC<ReviewQuizModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onQuizApproved,
}) => {
  if (!quiz) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Instructor Quiz Reattempt Review Console">
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-2xl space-y-1.5 border border-purple-100 dark:border-purple-900">
          <Badge variant="neutral">{quiz.courseTitle}</Badge>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{quiz.quizTitle}</h3>
          <p className="text-slate-500 font-medium">Requested by: {quiz.studentName} on {quiz.submittedDate}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
            <p className="text-[10px] text-slate-400">Attempt Count</p>
            <p className="font-bold text-base text-brand-600">{quiz.autoScore}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
            <p className="text-[10px] text-slate-400">Status</p>
            <p className="font-bold text-base text-purple-600">Pending Approval</p>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200">Student's Request Reason:</p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-[11px]">
            "{quiz.pendingScore || 'Student requested an additional attempt for this quiz.'}"
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 justify-center" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold"
            onClick={() => {
              onQuizApproved(quiz.id);
              onClose();
            }}
          >
            <FiCheckSquare className="w-4 h-4 mr-1.5" /> Approve Extra Attempt
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

interface JoinLiveClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveClass: UpcomingInstructorLiveClass | null;
}

export const JoinLiveClassModal: React.FC<JoinLiveClassModalProps> = ({
  isOpen,
  onClose,
  liveClass,
}) => {
  if (!liveClass) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Instructor Live Studio Studio Room">
      <div className="space-y-4 text-center py-2 text-xs">
        <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <FiVideo className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <Badge variant="primary">{liveClass.courseTitle}</Badge>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
            {liveClass.topic}
          </h3>
          <p className="text-slate-500 font-mono">
            {liveClass.date} at {liveClass.timeIST} ({liveClass.duration})
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-1 font-mono text-[11px]">
          <div className="flex justify-between">
            <span>Studio Room ID:</span>
            <span className="font-bold text-cyan-600">{liveClass.roomId}</span>
          </div>
          <div className="flex justify-between">
            <span>RSVP'd Students:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{liveClass.enrolledCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Time Zone:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">Asia/Kolkata (IST)</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold border border-emerald-200 dark:border-emerald-900">
          Studio Ready: Microphone, Camera, and Screen Share controls initialized.
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold py-2.5"
          onClick={onClose}
        >
          Enter Live Broadcast Room
        </Button>
      </div>
    </BaseModal>
  );
};
