import { Request, Response, NextFunction } from 'express';
import { studentAiService } from '../services/ai.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class StudentAiController {
  /**
   * POST /api/v1/student/ai/chat
   */
  public chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        throw ApiError.unauthorized('Authentication required.');
      }

      const { message, conversationId, courseId, lessonId, assignmentId, quizId, contextType } = req.body;

      const result = await studentAiService.sendStudentMessage(studentId, {
        message,
        conversationId,
        courseId,
        lessonId,
        assignmentId,
        quizId,
        contextType,
      });

      sendResponse(res, 200, 'AI response generated successfully.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/student/ai/conversations
   */
  public getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        throw ApiError.unauthorized('Authentication required.');
      }

      const conversations = await studentAiService.getConversations(studentId);
      sendResponse(res, 200, 'Conversations retrieved successfully.', conversations);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/student/ai/conversations/:id
   */
  public getConversationMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        throw ApiError.unauthorized('Authentication required.');
      }

      const id = req.params.id as string;
      const result = await studentAiService.getConversationMessages(studentId, id);
      sendResponse(res, 200, 'Messages retrieved successfully.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/student/ai/usage
   */
  public getDailyUsage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        throw ApiError.unauthorized('Authentication required.');
      }

      const usage = await studentAiService.getDailyUsage(studentId);
      sendResponse(res, 200, 'Usage limit status retrieved successfully.', usage);
    } catch (err) {
      next(err);
    }
  };
}

export const studentAiController = new StudentAiController();
