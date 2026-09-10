import { Router } from 'express';
import {
  getPlatformSettings,
  updatePlatformSettings,
  resetPlatformSettings,
} from '../controllers/settings.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { updatePlatformSettingsSchema } from '../validators/settings.validator';

const router = Router();

// Public / Authenticated route to read active platform settings
router.get('/', getPlatformSettings);

// Admin-only routes for updating and resetting platform settings
router.patch(
  '/admin',
  authenticateUser,
  requireAdmin,
  validateRequest(updatePlatformSettingsSchema),
  updatePlatformSettings
);

router.post(
  '/admin/reset',
  authenticateUser,
  requireAdmin,
  resetPlatformSettings
);

export default router;
