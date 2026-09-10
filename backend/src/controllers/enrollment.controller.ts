import { Request, Response, NextFunction } from 'express';
import { enrollmentService } from '../services/enrollment.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class EnrollmentController {
  // =============================================================
  // STUDENT ENROLLMENT ENDPOINTS
  // =============================================================

  public getStudentEnrollments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const enrollments = await enrollmentService.getStudentEnrollments(req.user.id);
      sendResponse(res, 200, 'Student enrollments retrieved successfully', enrollments);
    } catch (error) {
      next(error);
    }
  };

  public getStudentEnrollment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.params.courseId as string;
      const enrollment = await enrollmentService.getStudentEnrollment(req.user.id, courseId);
      sendResponse(res, 200, 'Student enrollment retrieved successfully', enrollment);
    } catch (error) {
      next(error);
    }
  };

  public enrollInCourse = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.params.courseId as string;
      const enrollment = await enrollmentService.createEnrollment(req.user.id, courseId);
      sendResponse(res, 201, 'Enrolled in course successfully', enrollment);
    } catch (error) {
      next(error);
    }
  };

  public cancelEnrollment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.params.courseId as string;
      await enrollmentService.cancelEnrollment(req.user.id, courseId);
      sendResponse(res, 200, 'Enrollment cancelled successfully', null);
    } catch (error) {
      next(error);
    }
  };

  // =============================================================
  // INSTRUCTOR ENROLLMENT ENDPOINTS
  // =============================================================

  public getInstructorEnrollments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const filters = {
        courseId: req.query.courseId as string | undefined,
        status: req.query.status as any,
        search: req.query.search as string | undefined,
      };
      const enrollments = await enrollmentService.getInstructorEnrollments(req.user.id, filters);
      sendResponse(res, 200, 'Instructor enrollments retrieved successfully', enrollments);
    } catch (error) {
      next(error);
    }
  };

  // =============================================================
  // ADMIN ENROLLMENT ENDPOINTS
  // =============================================================

  public getAdminEnrollments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = {
        courseId: req.query.courseId as string | undefined,
        status: req.query.status as any,
        search: req.query.search as string | undefined,
      };
      const enrollments = await enrollmentService.getAdminEnrollments(filters);
      sendResponse(res, 200, 'Admin enrollments retrieved successfully', enrollments);
    } catch (error) {
      next(error);
    }
  };
}

export const enrollmentController = new EnrollmentController();
