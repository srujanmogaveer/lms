import { Router } from 'express';
import { curriculumController } from '../controllers/curriculum.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  pdfUploadMiddleware,
  resourceUploadMiddleware,
  videoUploadMiddleware,
} from '../middleware/upload.middleware';
import {
  createModuleSchema,
  updateModuleSchema,
  reorderSchema,
  createLessonSchema,
  updateLessonSchema,
} from '../validators/curriculum.validator';

const router = Router();

// =============================================================
// 1. Storage Upload Endpoints (Instructor/Admin)
// =============================================================
router.post(
  '/instructor/upload/document',
  authenticateUser,
  requireInstructor,
  pdfUploadMiddleware.single('file'),
  (req, res, next) => curriculumController.uploadLessonDocument(req, res, next)
);

router.get(
  '/instructor/signed-document-url',
  authenticateUser,
  requireInstructor,
  (req, res, next) => curriculumController.getSignedDocumentUrl(req, res, next)
);

router.get(
  '/storage/signed-document-url',
  authenticateUser,
  (req, res, next) => curriculumController.getSignedDocumentUrl(req, res, next)
);

router.post(
  '/instructor/upload/resource',
  authenticateUser,
  requireInstructor,
  resourceUploadMiddleware.single('file'),
  (req, res, next) => curriculumController.uploadLessonResource(req, res, next)
);

router.post(
  '/instructor/upload/video',
  authenticateUser,
  requireInstructor,
  videoUploadMiddleware.single('file'),
  (req, res, next) => curriculumController.uploadLessonVideo(req, res, next)
);

router.get(
  '/instructor/signed-video-url',
  authenticateUser,
  requireInstructor,
  (req, res, next) => curriculumController.getSignedVideoUrl(req, res, next)
);

router.get(
  '/storage/signed-video-url',
  authenticateUser,
  (req, res, next) => curriculumController.getSignedVideoUrl(req, res, next)
);

// =============================================================
// 2. Instructor Module Management Endpoints
// =============================================================
router.get(
  '/instructor/courses/:courseId/modules',
  authenticateUser,
  requireInstructor,
  (req, res, next) => curriculumController.getInstructorCourseModules(req, res, next)
);

router.post(
  '/instructor/courses/:courseId/modules',
  authenticateUser,
  requireInstructor,
  validateRequest({ body: createModuleSchema }),
  (req, res, next) => curriculumController.createModule(req, res, next)
);

router.patch(
  '/instructor/courses/:courseId/modules/reorder',
  authenticateUser,
  requireInstructor,
  validateRequest({ body: reorderSchema }),
  (req, res, next) => curriculumController.reorderModules(req, res, next)
);

router.patch(
  '/instructor/modules/:moduleId',
  authenticateUser,
  requireInstructor,
  validateRequest({ body: updateModuleSchema }),
  (req, res, next) => curriculumController.updateModule(req, res, next)
);

router.delete(
  '/instructor/modules/:moduleId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => curriculumController.deleteModule(req, res, next)
);

// =============================================================
// 3. Instructor Lesson Management Endpoints
// =============================================================
router.get(
  '/instructor/modules/:moduleId/lessons',
  authenticateUser,
  requireInstructor,
  (req, res, next) => curriculumController.getInstructorModuleLessons(req, res, next)
);

router.post(
  '/instructor/modules/:moduleId/lessons',
  authenticateUser,
  requireInstructor,
  validateRequest({ body: createLessonSchema }),
  (req, res, next) => curriculumController.createLesson(req, res, next)
);

router.patch(
  '/instructor/modules/:moduleId/lessons/reorder',
  authenticateUser,
  requireInstructor,
  validateRequest({ body: reorderSchema }),
  (req, res, next) => curriculumController.reorderLessons(req, res, next)
);

router.get(
  '/instructor/lessons/:lessonId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => curriculumController.getInstructorLessonById(req, res, next)
);

router.patch(
  '/instructor/lessons/:lessonId',
  authenticateUser,
  requireInstructor,
  validateRequest({ body: updateLessonSchema }),
  (req, res, next) => curriculumController.updateLesson(req, res, next)
);

router.delete(
  '/instructor/lessons/:lessonId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => curriculumController.deleteLesson(req, res, next)
);

// =============================================================
// 4. Public & Student Curriculum Access Endpoints
// =============================================================
router.get(
  '/courses/:courseId/curriculum',
  (req, res, next) => curriculumController.getPublicCourseCurriculum(req, res, next)
);

router.get(
  '/courses/:courseId/modules/:moduleId',
  (req, res, next) => curriculumController.getPublicModule(req, res, next)
);

router.get(
  '/lessons/:lessonId',
  (req, res, next) => curriculumController.getPublicLesson(req, res, next)
);

export default router;
