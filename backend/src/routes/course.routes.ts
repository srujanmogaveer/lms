import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { curriculumController } from '../controllers/curriculum.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireInstructor, requireAdmin } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { imageUploadMiddleware } from '../middleware/upload.middleware';
import {
  createCourseSchema,
  updateCourseSchema,
  rejectCourseSchema,
  courseQuerySchema,
} from '../validators/course.validator';

const router = Router();

// =============================================================
// Instructor Course Management Routes
// (Must be defined BEFORE dynamic /:id to prevent route shadowing)
// =============================================================
router.post(
  '/instructor/upload-thumbnail',
  authenticateUser,
  requireInstructor,
  imageUploadMiddleware.single('image'),
  (req, res, next) => courseController.uploadCourseThumbnail(req, res, next)
);

router.get(
  '/instructor/courses',
  authenticateUser,
  requireInstructor,
  validateRequest(courseQuerySchema),
  (req, res, next) => courseController.getInstructorCourses(req, res, next)
);

router.get(
  '/instructor/stats',
  authenticateUser,
  requireInstructor,
  (req, res, next) => courseController.getInstructorStats(req, res, next)
);

router.get(
  '/instructor/my-courses',
  authenticateUser,
  requireInstructor,
  validateRequest(courseQuerySchema),
  (req, res, next) => courseController.getInstructorCourses(req, res, next)
);

router.post(
  '/instructor/courses',
  authenticateUser,
  requireInstructor,
  validateRequest(createCourseSchema),
  (req, res, next) => courseController.createCourse(req, res, next)
);

router.get(
  '/instructor/courses/:id',
  authenticateUser,
  requireInstructor,
  (req, res, next) => courseController.getInstructorCourseById(req, res, next)
);

router.patch(
  '/instructor/courses/:id',
  authenticateUser,
  requireInstructor,
  validateRequest(updateCourseSchema),
  (req, res, next) => courseController.updateInstructorCourse(req, res, next)
);

router.delete(
  '/instructor/courses/:id',
  authenticateUser,
  requireInstructor,
  (req, res, next) => courseController.deleteInstructorCourse(req, res, next)
);

router.get(
  '/instructor/courses/:id/completion',
  authenticateUser,
  requireInstructor,
  (req, res, next) => courseController.getCourseCompletion(req, res, next)
);

router.post(
  '/instructor/courses/:id/submit',
  authenticateUser,
  requireInstructor,
  (req, res, next) => courseController.submitCourseForApproval(req, res, next)
);

// =============================================================
// Admin Course Management & Review Routes
// (Must be defined BEFORE dynamic /:id)
// =============================================================
router.get(
  '/admin/courses',
  authenticateUser,
  requireAdmin,
  validateRequest(courseQuerySchema),
  (req, res, next) => courseController.getAdminCourses(req, res, next)
);

router.get(
  '/admin/all',
  authenticateUser,
  requireAdmin,
  validateRequest(courseQuerySchema),
  (req, res, next) => courseController.getAdminCourses(req, res, next)
);

router.get(
  '/admin/courses/:id',
  authenticateUser,
  requireAdmin,
  (req, res, next) => courseController.getAdminCourseById(req, res, next)
);

router.post(
  '/admin/courses/:id/approve',
  authenticateUser,
  requireAdmin,
  (req, res, next) => courseController.approveCourse(req, res, next)
);

router.post(
  '/admin/:id/approve',
  authenticateUser,
  requireAdmin,
  (req, res, next) => courseController.approveCourse(req, res, next)
);

router.post(
  '/admin/courses/:id/reject',
  authenticateUser,
  requireAdmin,
  validateRequest(rejectCourseSchema),
  (req, res, next) => courseController.rejectCourse(req, res, next)
);

router.post(
  '/admin/:id/reject',
  authenticateUser,
  requireAdmin,
  validateRequest(rejectCourseSchema),
  (req, res, next) => courseController.rejectCourse(req, res, next)
);

router.delete(
  '/admin/courses/:id',
  authenticateUser,
  requireAdmin,
  (req, res, next) => courseController.deleteAdminCourse(req, res, next)
);

router.delete(
  '/admin/:id',
  authenticateUser,
  requireAdmin,
  (req, res, next) => courseController.deleteAdminCourse(req, res, next)
);

// =============================================================
// Public & Student Course Catalog Routes
// =============================================================
router.get('/public/stats', (req, res, next) =>
  courseController.getPublicPlatformStats(req, res, next)
);

router.get('/public/leadership', (req, res, next) =>
  courseController.getPublicLeadership(req, res, next)
);

router.get('/', validateRequest(courseQuerySchema), (req, res, next) =>
  courseController.getPublicCourses(req, res, next)
);

router.get('/slug/:slug', (req, res, next) =>
  courseController.getCourseBySlug(req, res, next)
);

router.get('/:courseId/curriculum', (req, res, next) =>
  curriculumController.getPublicCourseCurriculum(req, res, next)
);

router.get('/:courseId/modules/:moduleId', (req, res, next) =>
  curriculumController.getPublicModule(req, res, next)
);

router.get('/:id', (req, res, next) =>
  courseController.getCourseByIdOrSlug(req, res, next)
);

export default router;
