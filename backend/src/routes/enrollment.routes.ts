import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollment.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireInstructor, requireAdmin } from '../middleware/role.middleware';

const router = Router();

// =============================================================
// STUDENT ENROLLMENT ROUTES
// =============================================================
router.get(
  '/student/enrollments',
  authenticateUser,
  (req, res, next) => enrollmentController.getStudentEnrollments(req, res, next)
);

router.get(
  '/student/enrollments/:courseId',
  authenticateUser,
  (req, res, next) => enrollmentController.getStudentEnrollment(req, res, next)
);

router.post(
  '/courses/:courseId/enroll',
  authenticateUser,
  (req, res, next) => enrollmentController.enrollInCourse(req, res, next)
);

router.post(
  '/student/enrollments/:courseId/cancel',
  authenticateUser,
  (req, res, next) => enrollmentController.cancelEnrollment(req, res, next)
);

// =============================================================
// INSTRUCTOR ENROLLMENT ROUTES
// =============================================================
router.get(
  '/instructor/enrollments',
  authenticateUser,
  requireInstructor,
  (req, res, next) => enrollmentController.getInstructorEnrollments(req, res, next)
);

// =============================================================
// ADMIN ENROLLMENT ROUTES
// =============================================================
router.get(
  '/admin/enrollments',
  authenticateUser,
  requireAdmin,
  (req, res, next) => enrollmentController.getAdminEnrollments(req, res, next)
);

export default router;
