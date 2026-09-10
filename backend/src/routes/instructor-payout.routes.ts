import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Requires authenticated user (instructor or admin)
router.use(authenticateUser);

/**
 * @route   GET /api/v1/instructor/earnings
 * @desc    Get authenticated instructor's real gross revenue, 15% platform commission, 85% net earnings, total paid amount, pending balance, and persistent payout history
 * @access  Private (Instructor / Admin)
 */
router.get('/earnings', (req, res, next) => payoutController.getInstructorEarnings(req, res, next));

/**
 * @route   GET /api/v1/instructor/analytics
 * @desc    Get comprehensive real database revenue analytics, enrollment metrics, and course performance
 * @access  Private (Instructor / Admin)
 */
router.get('/analytics', (req, res, next) => payoutController.getInstructorAnalytics(req, res, next));

export default router;
