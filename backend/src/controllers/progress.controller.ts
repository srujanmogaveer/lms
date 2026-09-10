import { Request, Response, NextFunction } from 'express';
import { progressService } from '../services/progress.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class ProgressController {
  /**
   * GET /api/v1/student/courses/:courseId/progress
   */
  public async getCourseProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!courseId) {
        throw ApiError.badRequest('courseId is required');
      }

      const summary = await progressService.getCourseProgress(studentId, courseId);

      sendResponse(res, 200, 'Course progress retrieved successfully', summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/student/all-progress
   */
  public async getStudentAllCoursesProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const allProgress = await progressService.getStudentAllCoursesProgress(studentId);
      sendResponse(res, 200, 'All student course progress retrieved successfully', allProgress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/student/courses/:courseId/lessons-progress
   */
  public async getStudentCourseLessonsProgress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!courseId) {
        throw ApiError.badRequest('courseId is required');
      }

      const progressList = await progressService.getStudentCourseLessonsProgress(studentId, courseId);

      sendResponse(res, 200, 'Lesson progress list retrieved successfully', progressList);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/student/courses/:courseId/lessons/:lessonId/complete
   */
  public async completeLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
      const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!courseId || !lessonId) {
        throw ApiError.badRequest('courseId and lessonId are required');
      }

      const result = await progressService.completeLesson(studentId, courseId, lessonId);

      sendResponse(res, 200, 'Lesson marked as completed', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/student/courses/:courseId/lessons/:lessonId/access
   */
  public async trackLessonAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
      const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!courseId || !lessonId) {
        throw ApiError.badRequest('courseId and lessonId are required');
      }

      const result = await progressService.trackLessonAccess(studentId, courseId, lessonId);

      sendResponse(res, 200, 'Lesson access tracked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/student/courses/:courseId/certificate
   */
  public async getCourseCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!courseId) {
        throw ApiError.badRequest('courseId is required');
      }

      const certificateData = await progressService.verifyCertificateEligibility(studentId, courseId);

      sendResponse(res, 200, 'Certificate verification successful', certificateData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/student/certificates
   */
  public async getAllStudentCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const certificates = await progressService.getAllStudentCertificates(studentId);

      sendResponse(res, 200, 'Student certificates retrieved successfully', certificates);
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
