import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendResponse } from '../utils/apiResponse';

export class NotificationController {
  /**
   * Get user's notifications and unread count
   */
  public static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await NotificationService.getNotifications(userId, limit);
      sendResponse(res, 200, 'Notifications retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   */
  public static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const count = await NotificationService.getUnreadCount(userId);
      sendResponse(res, 200, 'Unread count retrieved successfully', { unreadCount: count });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a single notification as read
   */
  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const id = String(req.params.id);

      const updated = await NotificationService.markAsRead(id, userId);
      sendResponse(res, 200, 'Notification marked as read', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const result = await NotificationService.markAllAsRead(userId);
      sendResponse(res, 200, 'All notifications marked as read', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   */
  public static async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const id = String(req.params.id);

      await NotificationService.deleteNotification(id, userId);
      sendResponse(res, 200, 'Notification deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin broadcast notification
   */
  public static async broadcastNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, message, audience, priority, category, targetUserIds, actionUrl } = req.body;
      const result = await NotificationService.broadcastAdminNotification({
        title,
        message,
        audience: audience || 'all',
        priority,
        category,
        targetUserIds,
        actionUrl,
      });
      sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin get all notifications across system
   */
  public static async getAllSystemNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const notifications = await NotificationService.getAllSystemNotifications(limit);
      sendResponse(res, 200, 'All system notifications retrieved successfully', notifications);
    } catch (error) {
      next(error);
    }
  }
}
