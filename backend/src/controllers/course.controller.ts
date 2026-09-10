import { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/course.service';
import { StorageService } from '../services/storage.service';
import { sendResponse, sendPaginatedResponse, ApiError } from '../utils/apiResponse';

export class CourseController {
  /**
   * Public / Student Course Catalog
   */
  public async getPublicCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await courseService.getPublicCourses(req.query as any);
      sendPaginatedResponse(res, 200, 'Courses retrieved successfully', result.courses, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.page < result.pagination.totalPages,
        hasPrevPage: result.pagination.page > 1,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public Platform Statistics for landing page
   */
  public async getPublicPlatformStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await courseService.getPublicPlatformStats();
      sendResponse(res, 200, 'Public platform stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public Leadership & Faculty for About Page
   */
  public async getPublicLeadership(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaders = await courseService.getPublicLeadership();
      sendResponse(res, 200, 'Public leadership retrieved successfully', leaders);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public / Student Course Details
   */
  public async getCourseByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = (req.params.idOrSlug || req.params.id || req.params.slug) as string;
      const course = await courseService.getCourseByIdOrSlug(idOrSlug);
      sendResponse(res, 200, 'Course details retrieved successfully', course);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public / Student Course Details by Slug
   */
  public async getCourseBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const course = await courseService.getCourseByIdOrSlug(slug);
      sendResponse(res, 200, 'Course details retrieved successfully', course);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: List own courses
   */
  public async getInstructorCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const result = await courseService.getInstructorCourses(instructorProfileId, req.query as any);
      sendResponse(res, 200, 'Instructor courses retrieved successfully', result.courses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get Real Dashboard Stats & Metrics
   */
  public async getInstructorStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const stats = await courseService.getInstructorDashboardStats(instructorProfileId);
      sendResponse(res, 200, 'Instructor stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get single own course by ID
   */
  public async getInstructorCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.id as string;
      const course = await courseService.getInstructorCourseById(instructorProfileId, id);
      sendResponse(res, 200, 'Instructor course retrieved successfully', course);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Instructor: Create new course draft
   */
  public async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const newCourse = await courseService.createCourse(instructorProfileId, req.body);
      sendResponse(res, 201, 'Course created successfully', newCourse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Update course (verified ownership)
   */
  public async updateInstructorCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.id as string;
      const updated = await courseService.updateInstructorCourse(instructorProfileId, id, req.body);
      sendResponse(res, 200, 'Course updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get course completion validation summary
   */
  public async getCourseCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.id as string;
      const completion = await courseService.validateCourseCompletion(instructorProfileId, id);
      sendResponse(res, 200, 'Course completion status calculated successfully', completion);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Submit course for admin approval
   */
  public async submitCourseForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.id as string;
      const submitted = await courseService.submitCourseForApproval(instructorProfileId, id);
      sendResponse(res, 200, 'Course submitted for admin approval successfully', submitted);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Delete own course
   */
  public async deleteInstructorCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.id as string;
      await courseService.deleteInstructorCourse(instructorProfileId, id);
      sendResponse(res, 200, 'Course deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List all courses across statuses
   */
  public async getAdminCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await courseService.getAdminCourses(req.query as any);
      sendResponse(res, 200, 'Admin courses retrieved successfully', result.courses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get single course by ID for review
   */
  public async getAdminCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const reviewData = await courseService.getAdminCourseReviewDetails(id);
      sendResponse(res, 200, 'Admin course review data retrieved successfully', reviewData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Approve course
   */
  public async approveCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminProfileId = req.user?.profile?.id || req.user?.id;
      if (!adminProfileId) throw ApiError.unauthorized('Authentication required');

      const id = req.params.id as string;
      const approved = await courseService.approveCourse(adminProfileId, id);
      sendResponse(res, 200, 'Course approved and published to catalog', approved);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Reject course
   */
  public async rejectCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminProfileId = req.user?.profile?.id || req.user?.id;
      if (!adminProfileId) throw ApiError.unauthorized('Authentication required');

      const id = req.params.id as string;
      const { rejectionReason } = req.body;
      const rejected = await courseService.rejectCourse(adminProfileId, id, rejectionReason);
      sendResponse(res, 200, 'Course rejected with feedback', rejected);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Delete course
   */
  public async deleteAdminCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await courseService.deleteAdminCourse(id);
      sendResponse(res, 200, 'Course deleted successfully by administrator');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Upload course thumbnail image
   */
  public async uploadCourseThumbnail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      if (!req.file) {
        throw ApiError.badRequest('No image file provided');
      }

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const publicUrl = await StorageService.uploadCourseThumbnailImage(
        req.file,
        instructorProfileId,
        req.body?.slug
      );

      sendResponse(res, 200, 'Course thumbnail uploaded successfully', { thumbnailUrl: publicUrl });
    } catch (error) {
      next(error);
    }
  }
}

export const courseController = new CourseController();
