import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  userQuerySchema,
  updateStatusSchema,
  rejectInstructorSchema,
  createInstructorSchema,
  updateInstructorSchema,
} from '../validators/admin.validator';

const router = Router();

// All admin routes require valid authentication and role = 'admin'
router.use(authenticateUser);
router.use(requireAdmin);

/**
 * Dashboard & Stats
 */
router.get('/dashboard/stats', (req, res, next) => adminController.getDashboardStats(req, res, next));

/**
 * User & Instructor Listings
 */
router.get('/users', validateRequest({ query: userQuerySchema }), (req, res, next) =>
  adminController.getUsers(req, res, next)
);

router.get('/students', validateRequest({ query: userQuerySchema }), (req, res, next) =>
  adminController.getStudents(req, res, next)
);

router.get('/instructors', validateRequest({ query: userQuerySchema }), (req, res, next) =>
  adminController.getInstructors(req, res, next)
);

router.get('/instructors/pending', validateRequest({ query: userQuerySchema }), (req, res, next) =>
  adminController.getPendingInstructors(req, res, next)
);

router.get('/users/:id', (req, res, next) => adminController.getUserById(req, res, next));

router.get('/instructors/:id', (req, res, next) => adminController.getInstructorById(req, res, next));

/**
 * Status Management
 */
router.patch('/users/:id/status', validateRequest({ body: updateStatusSchema }), (req, res, next) =>
  adminController.updateUserStatus(req, res, next)
);

/**
 * Instructor Approval Flow (Approve / Reject)
 */
router.post('/instructors/:id/approve', (req, res, next) =>
  adminController.approveInstructor(req, res, next)
);

router.post('/instructors/:id/reject', validateRequest({ body: rejectInstructorSchema }), (req, res, next) =>
  adminController.rejectInstructor(req, res, next)
);

router.post('/instructors/:id/reopen', (req, res, next) =>
  adminController.reopenInstructor(req, res, next)
);

router.get('/instructors/:id/history', (req, res, next) =>
  adminController.getInstructorHistory(req, res, next)
);

/**
 * Direct Instructor Creation & Profile Update
 */
router.post('/instructors', validateRequest({ body: createInstructorSchema }), (req, res, next) =>
  adminController.createInstructor(req, res, next)
);

router.put('/instructors/:id', validateRequest({ body: updateInstructorSchema }), (req, res, next) =>
  adminController.updateInstructor(req, res, next)
);

import {
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from '../controllers/category.controller';
import { imageUploadMiddleware } from '../middleware/upload.middleware';
import { courseController } from '../controllers/course.controller';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validator';
import {
  rejectCourseSchema,
  courseQuerySchema,
} from '../validators/course.validator';

/**
 * Admin Category Management Endpoints
 */
router.post('/categories', validateRequest(createCategorySchema), createCategory);
router.post(
  '/categories/upload-image',
  imageUploadMiddleware.single('image'),
  uploadCategoryImage
);
router.post(
  '/categories/:id/upload-image',
  imageUploadMiddleware.single('image'),
  uploadCategoryImage
);
router.patch('/categories/:id', validateRequest(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

/**
 * Admin Course Management Endpoints
 */
router.get('/courses', validateRequest(courseQuerySchema), (req, res, next) =>
  courseController.getAdminCourses(req, res, next)
);
router.get('/courses/:id', (req, res, next) =>
  courseController.getAdminCourseById(req, res, next)
);
router.post('/courses/:id/approve', (req, res, next) =>
  courseController.approveCourse(req, res, next)
);
router.post('/courses/:id/reject', validateRequest(rejectCourseSchema), (req, res, next) =>
  courseController.rejectCourse(req, res, next)
);
router.delete('/courses/:id', (req, res, next) =>
  courseController.deleteAdminCourse(req, res, next)
);

/**
 * User Deletion
 */
router.delete('/users/:id', (req, res, next) => adminController.deleteUser(req, res, next));

import { paymentController } from '../controllers/payment.controller';
import { payoutController } from '../controllers/payout.controller';
import { recordPayoutSchema, autoDisbursePayoutSchema } from '../validators/payout.validator';

/**
 * Admin Payments & Orders Management
 */
router.get('/payments', (req, res, next) => paymentController.getAdminPayments(req, res, next));

/**
 * Admin Instructor Payouts Management
 */
router.post('/payouts', validateRequest({ body: recordPayoutSchema }), (req, res, next) =>
  payoutController.recordPayout(req, res, next)
);
router.post(
  '/payouts/auto-disburse',
  validateRequest({ body: autoDisbursePayoutSchema }),
  (req, res, next) => payoutController.autoDisbursePayout(req, res, next)
);
router.get('/payouts', (req, res, next) => payoutController.getAllPayouts(req, res, next));

/**
 * Admin Certificate Management
 */
router.get('/certificates', (req, res, next) => adminController.getCertificates(req, res, next));

import {
  getPlatformSettings,
  updatePlatformSettings,
  resetPlatformSettings,
} from '../controllers/settings.controller';
import { updatePlatformSettingsSchema } from '../validators/settings.validator';

/**
 * Admin Platform Settings Management
 */
router.get('/settings', getPlatformSettings);
router.patch('/settings', validateRequest(updatePlatformSettingsSchema), updatePlatformSettings);
router.post('/settings/reset', resetPlatformSettings);

export default router;
