import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import categoryRoutes from './category.routes';
import courseRoutes from './course.routes';
import curriculumRoutes from './curriculum.routes';
import assignmentRoutes from './assignment.routes';
import quizRoutes from './quiz.routes';
import enrollmentRoutes from './enrollment.routes';
import progressRoutes from './progress.routes';
import wishlistCartRoutes from './wishlist-cart.routes';
import { paymentRoutes } from './payment.routes';
import aiRoutes from './ai.routes';
import instructorPayoutRoutes from './instructor-payout.routes';
import liveClassRoutes from './live-class.routes';
import chatRoutes from './chat.routes';
import announcementRoutes from './announcement.routes';
import notificationRoutes from './notification.routes';
import forumRoutes from './forum.routes';
import reviewRoutes from './review.routes';
import settingsRoutes from './settings.routes';
import contactRoutes from './contact.routes';

const router = Router();

// ============================================================================
// 1. SPECIFIC PREFIXED SUB-ROUTERS (Must be registered before root '/' routers)
// ============================================================================
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);
router.use('/settings', settingsRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/forum', forumRoutes);
router.use('/categories', categoryRoutes);
router.use('/curriculum', curriculumRoutes);
router.use('/courses', reviewRoutes);
router.use('/courses', courseRoutes);
router.use('/chat', chatRoutes);
router.use('/student', wishlistCartRoutes);
router.use('/student/payment', paymentRoutes);
router.use('/student/ai', aiRoutes);
router.use('/instructor', instructorPayoutRoutes);

// ============================================================================
// 2. ROOT & DYNAMIC ROUTERS (Must be registered last to avoid route shadowing)
// ============================================================================
router.use('/', curriculumRoutes);
router.use('/', assignmentRoutes);
router.use('/', quizRoutes);
router.use('/', enrollmentRoutes);
router.use('/', progressRoutes);
router.use('/', liveClassRoutes);
router.use('/', reviewRoutes);
router.use('/', courseRoutes);

export default router;

