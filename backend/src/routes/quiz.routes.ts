import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createQuizSchema,
  updateQuizSchema,
  reorderQuizzesSchema,
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
  submitAttemptSchema,
} from '../validators/quiz.validator';

const router = Router();

// =============================================================
// PUBLIC / STUDENT COURSE QUIZZES
// =============================================================
router.get('/student/quizzes', authenticateUser, (req, res, next) => quizController.getStudentEnrolledQuizzes(req, res, next));
router.get('/courses/:courseId/quizzes', (req, res, next) => quizController.getPublicCourseQuizzes(req, res, next));
router.get('/courses/:courseId/quiz', authenticateUser, (req, res, next) => quizController.getStudentCourseQuiz(req, res, next));
router.get('/quizzes/:quizId', authenticateUser, (req, res, next) => quizController.getQuizById(req, res, next));

// =============================================================
// STUDENT QUIZ ATTEMPTS
// =============================================================
router.post(
  '/quizzes/:quizId/attempts',
  authenticateUser,
  (req, res, next) => quizController.startAttempt(req, res, next)
);

router.post(
  '/attempts/:attemptId/submit',
  authenticateUser,
  validateRequest(submitAttemptSchema),
  (req, res, next) => quizController.submitAttempt(req, res, next)
);

router.get(
  '/attempts/:attemptId/result',
  authenticateUser,
  (req, res, next) => quizController.getAttemptResult(req, res, next)
);

// =============================================================
// STUDENT REATTEMPT REQUESTS
// =============================================================
router.post(
  '/quizzes/:quizId/reattempt-requests',
  authenticateUser,
  (req, res, next) => quizController.requestReattempt(req, res, next)
);

router.get(
  '/student/quiz-reattempt-requests',
  authenticateUser,
  (req, res, next) => quizController.getStudentReattemptRequests(req, res, next)
);

// =============================================================
// INSTRUCTOR QUIZ MANAGEMENT
// =============================================================
router.get(
  '/instructor/courses/:courseId/quizzes',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.getInstructorCourseQuizzes(req, res, next)
);

router.post(
  '/instructor/courses/:courseId/quizzes',
  authenticateUser,
  requireInstructor,
  validateRequest(createQuizSchema),
  (req, res, next) => quizController.createQuiz(req, res, next)
);

router.get(
  '/instructor/quizzes/:quizId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.getQuizById(req, res, next)
);

router.patch(
  '/instructor/quizzes/:quizId',
  authenticateUser,
  requireInstructor,
  validateRequest(updateQuizSchema),
  (req, res, next) => quizController.updateQuiz(req, res, next)
);

router.delete(
  '/instructor/quizzes/:quizId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.deleteQuiz(req, res, next)
);

router.post(
  '/instructor/quizzes/:quizId/publish',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.publishQuiz(req, res, next)
);

router.post(
  '/instructor/quizzes/:quizId/archive',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.archiveQuiz(req, res, next)
);

router.patch(
  '/instructor/courses/:courseId/quizzes/reorder',
  authenticateUser,
  requireInstructor,
  validateRequest(reorderQuizzesSchema),
  (req, res, next) => quizController.reorderQuizzes(req, res, next)
);

// =============================================================
// INSTRUCTOR QUESTIONS MANAGEMENT
// =============================================================
router.get(
  '/instructor/quizzes/:quizId/questions',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.getQuizQuestions(req, res, next)
);

router.post(
  '/instructor/quizzes/:quizId/questions',
  authenticateUser,
  requireInstructor,
  validateRequest(createQuestionSchema),
  (req, res, next) => quizController.createQuestion(req, res, next)
);

router.post(
  '/instructor/quizzes/:quizId/questions/batch',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.createQuestionsBatch(req, res, next)
);

router.patch(
  '/instructor/questions/:questionId',
  authenticateUser,
  requireInstructor,
  validateRequest(updateQuestionSchema),
  (req, res, next) => quizController.updateQuestion(req, res, next)
);

router.delete(
  '/instructor/questions/:questionId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.deleteQuestion(req, res, next)
);

router.patch(
  '/instructor/quizzes/:quizId/questions/reorder',
  authenticateUser,
  requireInstructor,
  validateRequest(reorderQuestionsSchema),
  (req, res, next) => quizController.reorderQuestions(req, res, next)
);

// =============================================================
// INSTRUCTOR REATTEMPT REQUESTS
// =============================================================
router.get(
  '/instructor/quiz-reattempt-requests',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.getInstructorReattemptRequests(req, res, next)
);

router.post(
  '/instructor/quiz-reattempt-requests/:requestId/approve',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.approveReattemptRequest(req, res, next)
);

router.post(
  '/instructor/quiz-reattempt-requests/:requestId/reject',
  authenticateUser,
  requireInstructor,
  (req, res, next) => quizController.rejectReattemptRequest(req, res, next)
);

export default router;
