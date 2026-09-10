import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// All payment routes require authenticated student
router.use(authenticateUser);

/**
 * @route   POST /api/v1/student/payment/create-order
 * @desc    Create checkout order and initialize Gateway Order
 * @access  Private (Student)
 */
router.post('/create-order', (req, res, next) =>
  paymentController.createCheckoutOrder(req, res, next)
);

/**
 * @route   POST /api/v1/student/payment/verify
 * @desc    Cryptographically verify payment signature, complete order, enroll student & clear cart
 * @access  Private (Student)
 */
router.post('/verify', (req, res, next) =>
  paymentController.verifyPayment(req, res, next)
);

/**
 * @route   GET /api/v1/student/payment/history
 * @desc    Get authenticated student's payment history
 * @access  Private (Student)
 */
router.get('/history', (req, res, next) =>
  paymentController.getPaymentHistory(req, res, next)
);

export const paymentRoutes = router;
export default router;
