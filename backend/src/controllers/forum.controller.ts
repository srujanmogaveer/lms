import { Request, Response, NextFunction } from 'express';
import { ForumService } from '../services/forum.service';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse';
import {
  createDiscussionSchema,
  updateDiscussionSchema,
  createReplySchema,
  updateReplySchema,
  toggleReactionSchema,
  moderateDiscussionSchema,
  moderateReplySchema,
  createReportSchema,
  resolveReportSchema,
} from '../validators/forum.validator';

export class ForumController {
  /**
   * GET /api/v1/forum/discussions
   */
  public static async getDiscussions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const result = await ForumService.getDiscussions(userId, userRole, {
        courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
        category: typeof req.query.category === 'string' ? req.query.category : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      const totalPages = Math.ceil(result.total / result.limit) || 1;
      sendPaginatedResponse(
        res,
        200,
        'Discussions retrieved successfully',
        result.discussions,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages,
          hasNextPage: result.page < totalPages,
          hasPrevPage: result.page > 1,
        }
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forum/discussions/:id
   */
  public static async getDiscussionDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const discussionId = String(req.params.id);

      const discussion = await ForumService.getDiscussionDetails(discussionId, userId, userRole);
      sendResponse(res, 200, 'Discussion details retrieved successfully', discussion);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forum/discussions
   */
  public static async createDiscussion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const validated = createDiscussionSchema.parse(req.body);

      const discussion = await ForumService.createDiscussion(userId, userRole, validated);
      sendResponse(res, 201, 'Discussion created successfully', discussion);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/forum/discussions/:id
   */
  public static async updateDiscussion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const discussionId = String(req.params.id);
      const validated = updateDiscussionSchema.parse(req.body);

      const discussion = await ForumService.updateDiscussion(discussionId, userId, userRole, validated);
      sendResponse(res, 200, 'Discussion updated successfully', discussion);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/forum/discussions/:id
   */
  public static async deleteDiscussion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const discussionId = String(req.params.id);

      const result = await ForumService.deleteDiscussion(discussionId, userId, userRole);
      sendResponse(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forum/discussions/:id/replies
   */
  public static async createReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const discussionId = String(req.params.id);
      const validated = createReplySchema.parse(req.body);

      const reply = await ForumService.createReply(discussionId, userId, userRole, validated);
      sendResponse(res, 201, 'Reply posted successfully', reply);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/forum/replies/:id
   */
  public static async updateReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const replyId = String(req.params.id);
      const validated = updateReplySchema.parse(req.body);

      const reply = await ForumService.updateReply(replyId, userId, userRole, validated);
      sendResponse(res, 200, 'Reply updated successfully', reply);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/forum/replies/:id
   */
  public static async deleteReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const replyId = String(req.params.id);

      const result = await ForumService.deleteReply(replyId, userId, userRole);
      sendResponse(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forum/react
   */
  public static async toggleReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const validated = toggleReactionSchema.parse(req.body);

      const result = await ForumService.toggleReaction(userId, validated.targetType, validated.targetId);
      sendResponse(res, 200, 'Reaction updated successfully', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/forum/discussions/:id/moderate
   */
  public static async moderateDiscussion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const discussionId = String(req.params.id);
      const validated = moderateDiscussionSchema.parse(req.body);

      const discussion = await ForumService.moderateDiscussion(discussionId, userId, userRole, validated);
      sendResponse(res, 200, 'Discussion moderation updated successfully', discussion);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/forum/replies/:id/moderate
   */
  public static async moderateReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const replyId = String(req.params.id);
      const validated = moderateReplySchema.parse(req.body);

      const reply = await ForumService.moderateReply(replyId, userId, userRole, validated);
      sendResponse(res, 200, 'Reply moderation updated successfully', reply);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forum/reports
   */
  public static async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const validated = createReportSchema.parse(req.body);

      const result = await ForumService.createReport(userId, validated);
      sendResponse(res, 201, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forum/reports
   */
  public static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = (req as any).user.role;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;

      const reports = await ForumService.getReports(userRole, status);
      sendResponse(res, 200, 'Moderation reports retrieved successfully', reports);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/forum/reports/:id/resolve
   */
  public static async resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const reportId = String(req.params.id);
      const validated = resolveReportSchema.parse(req.body);

      const result = await ForumService.resolveReport(reportId, userId, userRole, validated);
      sendResponse(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }
}
