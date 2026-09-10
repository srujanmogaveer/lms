import { Router } from 'express';
import { liveClassController } from '../controllers/live-class.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireInstructor, requireAdmin } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createLiveClassSchema,
  updateLiveClassSchema,
  rescheduleLiveClassSchema,
  askQuestionSchema,
  replyQuestionSchema,
} from '../validators/live-class.validator';

const router = Router();

// =============================================================
// Instructor Live Class Routes
// =============================================================

// Schedule a new live class for a course
router.post(
  '/instructor/courses/:courseId/live-classes',
  authenticateUser,
  requireInstructor,
  validateRequest(createLiveClassSchema),
  (req, res, next) => liveClassController.createLiveClass(req, res, next)
);

// List all live classes owned by the instructor
router.get(
  '/instructor/live-classes',
  authenticateUser,
  requireInstructor,
  (req, res, next) => liveClassController.getInstructorLiveClasses(req, res, next)
);

// Get single live class details for instructor
router.get(
  '/instructor/live-classes/:id',
  authenticateUser,
  requireInstructor,
  (req, res, next) => liveClassController.getInstructorLiveClassDetails(req, res, next)
);

// Update live class details
router.patch(
  '/instructor/live-classes/:id',
  authenticateUser,
  requireInstructor,
  validateRequest(updateLiveClassSchema),
  (req, res, next) => liveClassController.updateLiveClass(req, res, next)
);

// Reschedule live class
router.patch(
  '/instructor/live-classes/:id/reschedule',
  authenticateUser,
  requireInstructor,
  validateRequest(rescheduleLiveClassSchema),
  (req, res, next) => liveClassController.rescheduleLiveClass(req, res, next)
);

// Cancel live class
router.patch(
  '/instructor/live-classes/:id/cancel',
  authenticateUser,
  requireInstructor,
  (req, res, next) => liveClassController.cancelLiveClass(req, res, next)
);

// Delete live class
router.delete(
  '/instructor/live-classes/:id',
  authenticateUser,
  requireInstructor,
  (req, res, next) => liveClassController.deleteLiveClass(req, res, next)
);

// =============================================================
// Student Live Class Routes
// =============================================================

// List live classes for courses the student is actively enrolled in
router.get(
  '/student/live-classes',
  authenticateUser,
  (req, res, next) => liveClassController.getStudentLiveClasses(req, res, next)
);

// Get single live class details with active enrollment verification
router.get(
  '/student/live-classes/:id',
  authenticateUser,
  (req, res, next) => liveClassController.getStudentLiveClassDetails(req, res, next)
);

// =============================================================
// Admin Live Class Routes
// =============================================================

// List all live classes globally across all instructors and courses
router.get(
  '/admin/live-classes',
  authenticateUser,
  requireAdmin,
  (req, res, next) => liveClassController.getAdminLiveClasses(req, res, next)
);

// Admin cancel live class
router.patch(
  '/admin/live-classes/:id/cancel',
  authenticateUser,
  requireAdmin,
  (req, res, next) => liveClassController.adminCancelLiveClass(req, res, next)
);

// Admin delete live class
router.delete(
  '/admin/live-classes/:id',
  authenticateUser,
  requireAdmin,
  (req, res, next) => liveClassController.adminDeleteLiveClass(req, res, next)
);

// =============================================================
// Live Class Join & Authorization Route
// =============================================================

// Authorize joining or starting a live class
router.post(
  '/live-classes/:id/join',
  authenticateUser,
  (req, res, next) => liveClassController.joinLiveClass(req, res, next)
);

// =============================================================
// Live Class Participant Tracking Routes
// =============================================================

// Record participant join (called on classroom mount)
router.post(
  '/live-classes/:id/participants/join',
  authenticateUser,
  (req, res, next) => liveClassController.joinParticipant(req, res, next)
);

// Record participant leave (called on classroom unmount / leave)
router.post(
  '/live-classes/:id/participants/leave',
  authenticateUser,
  (req, res, next) => liveClassController.leaveParticipant(req, res, next)
);

// Get participant list (instructor/admin sees all; students see own record)
router.get(
  '/live-classes/:id/participants',
  authenticateUser,
  (req, res, next) => liveClassController.getParticipants(req, res, next)
);

// =============================================================
// Live Class Q&A Routes
// =============================================================

// Get questions for a live class
router.get(
  '/live-classes/:id/questions',
  authenticateUser,
  (req, res, next) => liveClassController.getQuestions(req, res, next)
);

// Student ask question
router.post(
  '/live-classes/:id/questions',
  authenticateUser,
  validateRequest(askQuestionSchema),
  (req, res, next) => liveClassController.askQuestion(req, res, next)
);

// Instructor reply to question
router.post(
  '/live-classes/:id/questions/:questionId/reply',
  authenticateUser,
  requireInstructor,
  validateRequest(replyQuestionSchema),
  (req, res, next) => liveClassController.replyToQuestion(req, res, next)
);

// Instructor pin/unpin question
router.patch(
  '/live-classes/:id/questions/:questionId/pin',
  authenticateUser,
  requireInstructor,
  (req, res, next) => liveClassController.togglePinQuestion(req, res, next)
);

// Delete question
router.delete(
  '/live-classes/:id/questions/:questionId',
  authenticateUser,
  (req, res, next) => liveClassController.deleteQuestion(req, res, next)
);

export default router;
