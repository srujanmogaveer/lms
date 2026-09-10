import { Request, Response, NextFunction } from 'express';
import { liveClassService } from '../services/live-class.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class LiveClassController {
  // ============================================================
  // INSTRUCTOR ACTIONS
  // ============================================================

  /**
   * POST /api/v1/instructor/courses/:courseId/live-classes
   * Schedule a new live class for an owned course
   */
  public async createLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = (req as any).user?.id;
      const courseId = req.params.courseId as string;

      if (!instructorId) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!courseId) {
        throw ApiError.badRequest('Course ID is required');
      }

      const result = await liveClassService.createLiveClass(instructorId, courseId, req.body);
      sendResponse(res, 201, 'Live class scheduled successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/instructor/live-classes
   * List all live classes for the authenticated instructor
   */
  public async getInstructorLiveClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = (req as any).user?.id;
      if (!instructorId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const filters = {
        courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      };

      const result = await liveClassService.getInstructorLiveClasses(instructorId, filters);
      sendResponse(res, 200, 'Instructor live classes retrieved successfully', result.liveClasses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/instructor/live-classes/:id
   * Get single live class details for instructor with ownership check
   */
  public async getInstructorLiveClassDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = (req as any).user?.id;
      const classId = req.params.id as string;

      if (!instructorId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.getInstructorLiveClassDetails(instructorId, classId);
      sendResponse(res, 200, 'Live class details retrieved successfully for instructor', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/instructor/live-classes/:id
   * Update live class parameters
   */
  public async updateLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = (req as any).user?.id;
      const classId = req.params.id as string;

      if (!instructorId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.updateLiveClass(instructorId, classId, req.body);
      sendResponse(res, 200, 'Live class updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/instructor/live-classes/:id/reschedule
   * Reschedule date/time for a live class
   */
  public async rescheduleLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = (req as any).user?.id;
      const classId = req.params.id as string;

      if (!instructorId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.rescheduleLiveClass(instructorId, classId, req.body);
      sendResponse(res, 200, 'Live class rescheduled successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/instructor/live-classes/:id/cancel
   * Cancel an instructor live class
   */
  public async cancelLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.cancelLiveClass(user.id, user.role, classId);
      sendResponse(res, 200, 'Live class cancelled successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/instructor/live-classes/:id
   * Permanently delete a live class
   */
  public async deleteLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.deleteLiveClass(user.id, user.role, classId);
      sendResponse(res, 200, 'Live class deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/live-classes/:id/join
   * Authorize and verify live class join/start
   */
  public async joinLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.joinLiveClass(user.id, user.role, classId);
      sendResponse(res, 200, 'Live class join access granted', result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // STUDENT ACTIONS
  // ============================================================

  /**
   * GET /api/v1/student/live-classes
   * List live classes for active enrolled courses only
   */
  public async getStudentLiveClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const filters = {
        courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      };

      const result = await liveClassService.getStudentEnrolledLiveClasses(studentId, filters);
      sendResponse(res, 200, 'Enrolled live classes retrieved successfully', result.liveClasses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/student/live-classes/:id
   * Get single live class details with active enrollment verification
   */
  public async getStudentLiveClassDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      const classId = req.params.id as string;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.getStudentLiveClassDetails(studentId, classId);
      sendResponse(res, 200, 'Live class details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // ADMIN ACTIONS
  // ============================================================

  /**
   * GET /api/v1/admin/live-classes
   * Global list of all live classes across all instructors and courses
   */
  public async getAdminLiveClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        instructorId: typeof req.query.instructorId === 'string' ? req.query.instructorId : undefined,
        courseId: typeof req.query.courseId === 'string' ? req.query.courseId : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await liveClassService.getAdminLiveClasses(filters);
      sendResponse(res, 200, 'All live classes retrieved successfully for admin', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/live-classes/:id/cancel
   */
  public async adminCancelLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      const result = await liveClassService.cancelLiveClass(user.id, 'admin', classId);
      sendResponse(res, 200, 'Live class cancelled by administrator', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/live-classes/:id
   */
  public async adminDeleteLiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      const result = await liveClassService.deleteLiveClass(user.id, 'admin', classId);
      sendResponse(res, 200, 'Live class permanently deleted by administrator', result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // PARTICIPANT ACTIONS
  // ============================================================

  /**
   * POST /api/v1/live-classes/:id/participants/join
   * Record that the authenticated user has joined the classroom.
   */
  public async joinParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      await liveClassService.recordParticipantJoin(user.id, user.role, classId);
      sendResponse(res, 200, 'Participant join recorded', { classId, userId: user.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/live-classes/:id/participants/leave
   * Record that the authenticated user has left the classroom.
   */
  public async leaveParticipant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      await liveClassService.recordParticipantLeave(user.id, classId);
      sendResponse(res, 200, 'Participant leave recorded', { classId, userId: user.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/live-classes/:id/participants
   * Fetch participant list for the classroom.
   */
  public async getParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      const participants = await liveClassService.getClassParticipants(user.id, user.role, classId);
      sendResponse(res, 200, 'Participants retrieved successfully', participants);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // Q&A ACTIONS
  // ============================================================

  /**
   * GET /api/v1/live-classes/:id/questions
   */
  public async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      const questions = await liveClassService.getQuestions(classId, user.id, user.role);
      sendResponse(res, 200, 'Live class questions retrieved successfully', questions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/live-classes/:id/questions
   */
  public async askQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      const classId = req.params.id as string;
      const { questionText } = req.body;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.askQuestion(studentId, classId, questionText);
      sendResponse(res, 201, 'Question submitted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/live-classes/:id/questions/:questionId/reply
   */
  public async replyToQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = (req as any).user?.id;
      const classId = req.params.id as string;
      const questionId = req.params.questionId as string;
      const { instructorReply } = req.body;

      if (!instructorId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.replyToQuestion(instructorId, classId, questionId, instructorReply);
      sendResponse(res, 200, 'Reply posted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/live-classes/:id/questions/:questionId/pin
   */
  public async togglePinQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = (req as any).user?.id;
      const classId = req.params.id as string;
      const questionId = req.params.questionId as string;

      if (!instructorId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.togglePinQuestion(instructorId, classId, questionId);
      sendResponse(res, 200, 'Question pin status updated', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/live-classes/:id/questions/:questionId
   */
  public async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.id as string;
      const questionId = req.params.questionId as string;

      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      const result = await liveClassService.deleteQuestion(user.id, user.role, classId, questionId);
      sendResponse(res, 200, 'Question deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export const liveClassController = new LiveClassController();
