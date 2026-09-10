import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { sendResponse } from '../utils/apiResponse';

export class AnnouncementController {
  /**
   * Create an announcement (Admin or Instructor)
   */
  public static async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const announcement = await AnnouncementService.createAnnouncement(userId, userRole, req.body);
      sendResponse(res, 201, 'Announcement created successfully', announcement);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get announcements feed
   */
  public static async getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const filters = {
        courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      };

      const list = await AnnouncementService.getAnnouncements(userId, userRole, filters);
      sendResponse(res, 200, 'Announcements retrieved successfully', list);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single announcement by ID
   */
  public static async getAnnouncementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const id = String(req.params.id);

      const item = await AnnouncementService.getAnnouncementById(id, userId, userRole);
      sendResponse(res, 200, 'Announcement retrieved successfully', item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update announcement
   */
  public static async updateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const id = String(req.params.id);

      const updated = await AnnouncementService.updateAnnouncement(id, userId, userRole, req.body);
      sendResponse(res, 200, 'Announcement updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete announcement
   */
  public static async deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const id = String(req.params.id);

      await AnnouncementService.deleteAnnouncement(id, userId, userRole);
      sendResponse(res, 200, 'Announcement deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark announcement as read
   */
  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const id = String(req.params.id);

      await AnnouncementService.markAsRead(id, userId);
      sendResponse(res, 200, 'Announcement marked as read', { success: true, id });
    } catch (error) {
      next(error);
    }
  }
}
