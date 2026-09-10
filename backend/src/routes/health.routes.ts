import { Router } from 'express';
import { getHealthStatus, getAuthMiddlewareTest } from '../controllers/health.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { healthEchoSchema } from '../validators/health.validator';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin, requireInstructor } from '../middleware/role.middleware';

const router = Router();

// Public health check route
router.get('/', validateRequest(healthEchoSchema), getHealthStatus);

// Protected sample test routes (for verifying middleware foundation)
router.get('/protected-test', authenticateUser, getAuthMiddlewareTest);
router.get('/admin-test', authenticateUser, requireAdmin, getAuthMiddlewareTest);
router.get('/instructor-test', authenticateUser, requireInstructor, getAuthMiddlewareTest);

export default router;
