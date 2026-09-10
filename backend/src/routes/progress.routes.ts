import { Router } from 'express';
import { progressController } from '../controllers/progress.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// =============================================================
// STUDENT PROGRESS & COMPLETION ROUTES
// =============================================================

router.get(
  '/student/all-progress',
  authenticateUser,
  (req, res, next) => progressController.getStudentAllCoursesProgress(req, res, next)
);

router.get(
  '/student/courses/:courseId/progress',
  authenticateUser,
  (req, res, next) => progressController.getCourseProgress(req, res, next)
);

router.get(
  '/student/courses/:courseId/lessons-progress',
  authenticateUser,
  (req, res, next) => progressController.getStudentCourseLessonsProgress(req, res, next)
);

router.post(
  '/student/courses/:courseId/lessons/:lessonId/complete',
  authenticateUser,
  (req, res, next) => progressController.completeLesson(req, res, next)
);

router.get(
  '/student/certificates',
  authenticateUser,
  (req, res, next) => progressController.getAllStudentCertificates(req, res, next)
);

router.get(
  '/student/courses/:courseId/certificate',
  authenticateUser,
  (req, res, next) => progressController.getCourseCertificate(req, res, next)
);

export default router;
