import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { sendResponse, ApiError } from '../utils/apiResponse';
import { UserRole } from '../types';

export class ChatController {
  /**
   * GET /api/v1/chat/conversations
   */
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const role = ((req as any).user?.role || 'student') as UserRole;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const conversations = await chatService.getConversations(userId, role);
      sendResponse(res, 200, 'Conversations retrieved successfully.', conversations);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/chat/conversations
   */
  async getOrCreateConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const role = ((req as any).user?.role || 'student') as UserRole;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const conversation = await chatService.getOrCreateConversation(userId, role, req.body);
      sendResponse(res, 200, 'Conversation retrieved/created successfully.', conversation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/chat/conversations/:id/messages
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const conversationId = req.params.id as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const before = req.query.before as string | undefined;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const messages = await chatService.getMessages(conversationId, userId, limit, before);
      sendResponse(res, 200, 'Messages retrieved successfully.', messages);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/chat/conversations/:id/messages
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const role = ((req as any).user?.role || 'student') as UserRole;
      const conversationId = req.params.id as string;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const message = await chatService.sendMessage(conversationId, userId, role, req.body);
      sendResponse(res, 201, 'Message sent successfully.', message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/chat/conversations/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const conversationId = req.params.id as string;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      await chatService.markAsRead(conversationId, userId);
      sendResponse(res, 200, 'Conversation marked as read.', { marked: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/chat/conversations/:id/clear
   */
  async clearConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const conversationId = req.params.id as string;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      await chatService.clearConversation(conversationId, userId);
      sendResponse(res, 200, 'Conversation cleared successfully.', { cleared: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/chat/contacts
   * Returns real database users that the current authenticated user is allowed to chat with
   */
  async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const role = ((req as any).user?.role || 'student') as UserRole;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const contacts = await chatService.getEligibleContacts(userId, role);
      sendResponse(res, 200, 'Eligible chat contacts retrieved successfully.', contacts);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/chat/unread-count
   * Returns total unread messages count for the authenticated user
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const role = ((req as any).user?.role || 'student') as UserRole;

      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const unreadData = await chatService.getUnreadCount(userId, role);
      sendResponse(res, 200, 'Unread messages count retrieved successfully.', unreadData);
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
