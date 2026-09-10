import type { StudentQuizDetail, QuizAttemptRequest } from '../types';
import { mockQuizData } from './quizData';

export const initialAttemptRequests: QuizAttemptRequest[] = [
  {
    id: 'req-101',
    quizId: 'qz-103',
    quizTitle: 'Design Tokens & Typography Standards Quiz',
    studentId: 'std-101',
    studentName: 'Rahul Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    courseId: 'crs-2',
    courseTitle: 'UI/UX Design Systems & Figma Masterclass',
    attemptsUsed: 3,
    maxAttempts: 3,
    requestDate: '2026-08-08 11:30 AM',
    status: 'pending',
  },
  {
    id: 'req-102',
    quizId: 'qz-105',
    quizTitle: 'Advanced State Management & Redux Toolkit',
    studentId: 'std-102',
    studentName: 'Ananya Roy',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    courseId: 'crs-1',
    courseTitle: 'Full-Stack Web Development Masterclass 2026',
    attemptsUsed: 3,
    maxAttempts: 3,
    requestDate: '2026-08-07 04:15 PM',
    status: 'approved',
  },
  {
    id: 'req-103',
    quizId: 'qz-106',
    quizTitle: 'CSS Grid & Flexbox Architectural Layouts',
    studentId: 'std-103',
    studentName: 'Vikram Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    courseId: 'crs-1',
    courseTitle: 'Full-Stack Web Development Masterclass 2026',
    attemptsUsed: 3,
    maxAttempts: 3,
    requestDate: '2026-08-06 02:00 PM',
    status: 'rejected',
    rejectionReason: 'Please review module material before requesting further attempts.',
  },
];

// Memory store state initialized from mock data
let currentQuizzes: StudentQuizDetail[] = mockQuizData.map((q) => {
  if (q.id === 'qz-103') {
    return {
      ...q,
      maxAttempts: 3,
      attemptsUsed: 3,
      attemptCycle: 1,
      status: 'failed',
      attemptRequestStatus: 'pending',
    };
  }
  return {
    ...q,
    maxAttempts: 3,
    attemptCycle: 1,
    attemptRequestStatus: 'none',
  };
});

let currentRequests: QuizAttemptRequest[] = [...initialAttemptRequests];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const quizAttemptStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getQuizzes(): StudentQuizDetail[] {
    return currentQuizzes;
  },

  getRequests(): QuizAttemptRequest[] {
    return currentRequests;
  },

  updateQuizState(updatedQuiz: StudentQuizDetail) {
    currentQuizzes = currentQuizzes.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q));
    notifyListeners();
  },

  setQuizzes(newQuizzes: StudentQuizDetail[]) {
    currentQuizzes = newQuizzes;
    notifyListeners();
  },

  requestExtraAttempt(quizId: string, studentName = 'Rahul Sharma'): QuizAttemptRequest {
    const targetQuiz = currentQuizzes.find((q) => q.id === quizId);
    
    // Update quiz status
    if (targetQuiz) {
      currentQuizzes = currentQuizzes.map((q) =>
        q.id === quizId
          ? {
              ...q,
              attemptRequestStatus: 'pending',
            }
          : q
      );
    }

    const newRequest: QuizAttemptRequest = {
      id: `req-${Date.now()}`,
      quizId,
      quizTitle: targetQuiz ? targetQuiz.title : 'Quiz Assessment',
      studentId: 'std-101',
      studentName,
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      courseId: targetQuiz ? targetQuiz.courseId : 'crs-1',
      courseTitle: targetQuiz ? targetQuiz.courseTitle : 'Course Assessment',
      attemptsUsed: targetQuiz ? targetQuiz.attemptsUsed : 3,
      maxAttempts: 3,
      requestDate: 'Just Now',
      status: 'pending',
    };

    currentRequests = [newRequest, ...currentRequests];
    notifyListeners();
    return newRequest;
  },

  approveAttemptRequest(requestId: string): QuizAttemptRequest | null {
    const req = currentRequests.find((r) => r.id === requestId);
    if (!req) return null;

    currentRequests = currentRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'approved' as const } : r
    );

    // Reset attempt counter for student and set attemptRequestStatus to approved
    currentQuizzes = currentQuizzes.map((q) => {
      if (q.id === req.quizId) {
        return {
          ...q,
          attemptsUsed: 0, // Reset attempt count to 0 in new cycle (so next attempt is 1/3)
          attemptCycle: (q.attemptCycle || 1) + 1,
          status: 'available' as const,
          attemptRequestStatus: 'approved' as const,
          isLocked: false,
        };
      }
      return q;
    });

    notifyListeners();
    return req;
  },

  rejectAttemptRequest(requestId: string, reason?: string): QuizAttemptRequest | null {
    const req = currentRequests.find((r) => r.id === requestId);
    if (!req) return null;

    currentRequests = currentRequests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'rejected' as const, rejectionReason: reason || 'Request rejected by instructor' }
        : r
    );

    // Update student quiz status to rejected and keep quiz locked
    currentQuizzes = currentQuizzes.map((q) => {
      if (q.id === req.quizId) {
        return {
          ...q,
          attemptRequestStatus: 'rejected' as const,
          status: 'failed' as const,
        };
      }
      return q;
    });

    notifyListeners();
    return req;
  },
};
