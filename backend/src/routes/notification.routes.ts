import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticateUser);

// 1. Get notifications for current user
router.get('/', NotificationController.getNotifications);

// 2. Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// 3. Mark single notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// 4. Mark all notifications as read
router.patch('/mark-all-read', NotificationController.markAllAsRead);

// 5. Delete notification
router.delete('/:id', NotificationController.deleteNotification);

// 6. Admin broadcast notification
router.post('/broadcast', requireAdmin, NotificationController.broadcastNotification);

// 7. Admin get all notifications across system
router.get('/admin/all', requireAdmin, NotificationController.getAllSystemNotifications);

export default router;
