import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { AnnouncementController } from '../controllers/announcement.controller';
import {
  createAnnouncementBodySchema,
  updateAnnouncementBodySchema,
  announcementParamsSchema,
} from '../validators/announcement.validator';

const router = Router();

// All announcement routes require authentication
router.use(authenticateUser);

// 1. Create announcement (Admin or Instructor only)
router.post(
  '/',
  requireRole(['admin', 'instructor']),
  validateRequest({ body: createAnnouncementBodySchema }),
  AnnouncementController.createAnnouncement
);

// 2. Get announcements list (scoped by role & eligibility)
router.get('/', AnnouncementController.getAnnouncements);

// 3. Get single announcement by ID
router.get(
  '/:id',
  validateRequest({ params: announcementParamsSchema }),
  AnnouncementController.getAnnouncementById
);

// 4. Update announcement (Admin or Creator Instructor)
router.put(
  '/:id',
  requireRole(['admin', 'instructor']),
  validateRequest({ params: announcementParamsSchema, body: updateAnnouncementBodySchema }),
  AnnouncementController.updateAnnouncement
);

// 5. Delete announcement (Admin or Creator Instructor)
router.delete(
  '/:id',
  requireRole(['admin', 'instructor']),
  validateRequest({ params: announcementParamsSchema }),
  AnnouncementController.deleteAnnouncement
);

// 6. Mark announcement as read
router.post(
  '/:id/read',
  validateRequest({ params: announcementParamsSchema }),
  AnnouncementController.markAsRead
);

export default router;
