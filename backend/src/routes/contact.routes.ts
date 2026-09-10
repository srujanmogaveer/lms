import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createContactInquirySchema,
  updateContactInquiryStatusSchema,
  contactInquiryQuerySchema,
} from '../validators/contact.validator';

const router = Router();

// Public: Submit Contact Inquiry
router.post(
  '/inquire',
  validateRequest({ body: createContactInquirySchema }),
  (req, res, next) => ContactController.submitInquiry(req, res, next)
);

// Admin-only: Manage inquiries
router.get(
  '/inquiries',
  authenticateUser,
  requireAdmin,
  validateRequest({ query: contactInquiryQuerySchema }),
  (req, res, next) => ContactController.getInquiries(req, res, next)
);

router.patch(
  '/inquiries/:id',
  authenticateUser,
  requireAdmin,
  validateRequest({ body: updateContactInquiryStatusSchema }),
  (req, res, next) => ContactController.updateInquiryStatus(req, res, next)
);

router.delete(
  '/inquiries/:id',
  authenticateUser,
  requireAdmin,
  (req, res, next) => ContactController.deleteInquiry(req, res, next)
);

export default router;
