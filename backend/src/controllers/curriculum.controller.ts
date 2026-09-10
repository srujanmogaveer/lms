import { Request, Response, NextFunction } from 'express';
import { curriculumService } from '../services/curriculum.service';
import { StorageService } from '../services/storage.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class CurriculumController {
  // =============================================================
  // Instructor Module Controllers
  // =============================================================

  public async getInstructorCourseModules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const courseId = req.params.courseId as string;
      const modules = await curriculumService.getInstructorCourseModules(instructorProfileId, courseId);
      sendResponse(res, 200, 'Course modules retrieved successfully', modules);
    } catch (error) {
      next(error);
    }
  }

  public async createModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const courseId = req.params.courseId as string;
      const module = await curriculumService.createModule(instructorProfileId, courseId, req.body);
      sendResponse(res, 201, 'Module created successfully', module);
    } catch (error) {
      next(error);
    }
  }

  public async updateModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const moduleId = req.params.moduleId as string;
      const module = await curriculumService.updateModule(instructorProfileId, moduleId, req.body);
      sendResponse(res, 200, 'Module updated successfully', module);
    } catch (error) {
      next(error);
    }
  }

  public async deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const moduleId = req.params.moduleId as string;
      await curriculumService.deleteModule(instructorProfileId, moduleId);
      sendResponse(res, 200, 'Module deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public async reorderModules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const courseId = req.params.courseId as string;
      const items = req.body.items || req.body;
      const modules = await curriculumService.reorderModules(instructorProfileId, courseId, items);
      sendResponse(res, 200, 'Modules reordered successfully', modules);
    } catch (error) {
      next(error);
    }
  }

  // =============================================================
  // Instructor Lesson Controllers
  // =============================================================

  public async getInstructorModuleLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const moduleId = req.params.moduleId as string;
      const lessons = await curriculumService.getInstructorModuleLessons(instructorProfileId, moduleId);
      sendResponse(res, 200, 'Module lessons retrieved successfully', lessons);
    } catch (error) {
      next(error);
    }
  }

  public async getInstructorLessonById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const lessonId = req.params.lessonId as string;
      const lesson = await curriculumService.getInstructorLessonById(instructorProfileId, lessonId);
      sendResponse(res, 200, 'Lesson retrieved successfully', lesson);
    } catch (error) {
      next(error);
    }
  }

  public async createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const moduleId = req.params.moduleId as string;
      const lesson = await curriculumService.createLesson(instructorProfileId, moduleId, req.body);
      sendResponse(res, 201, 'Lesson created successfully', lesson);
    } catch (error) {
      next(error);
    }
  }

  public async updateLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const lessonId = req.params.lessonId as string;
      const lesson = await curriculumService.updateLesson(instructorProfileId, lessonId, req.body);
      sendResponse(res, 200, 'Lesson updated successfully', lesson);
    } catch (error) {
      next(error);
    }
  }

  public async deleteLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const lessonId = req.params.lessonId as string;
      await curriculumService.deleteLesson(instructorProfileId, lessonId);
      sendResponse(res, 200, 'Lesson deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public async reorderLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await curriculumService.resolveInstructorProfileId(authUserId);
      const moduleId = req.params.moduleId as string;
      const items = req.body.items || req.body;
      const lessons = await curriculumService.reorderLessons(instructorProfileId, moduleId, items);
      sendResponse(res, 200, 'Lessons reordered successfully', lessons);
    } catch (error) {
      next(error);
    }
  }

  // =============================================================
  // Storage Upload Controllers
  // =============================================================

  public async uploadLessonDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No document file uploaded');
      }

      const lessonId = req.body.lessonId || req.query.lessonId;
      const courseId = req.body.courseId || req.query.courseId;
      const moduleId = req.body.moduleId || req.query.moduleId;

      const result = await StorageService.uploadLessonDocument(
        req.file,
        lessonId as string,
        courseId as string,
        moduleId as string
      );

      sendResponse(res, 200, 'Document uploaded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public async getSignedDocumentUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filePath = (req.query.path || req.body.path) as string;
      const download = req.query.download === 'true' || req.body.download === true;
      const filename = (req.query.filename || req.body.filename) as string | undefined;

      if (!filePath || typeof filePath !== 'string') {
        throw ApiError.badRequest('File path is required to generate signed document URL');
      }

      const signedUrl = await StorageService.createSignedLessonDocumentUrl(
        filePath,
        3600,
        download ? (filename || true) : false
      );

      sendResponse(res, 200, 'Signed document URL generated successfully', {
        signedUrl,
        path: filePath,
        expiresIn: 3600,
      });
    } catch (error) {
      next(error);
    }
  }

  public async uploadLessonResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No resource file uploaded');
      }

      const lessonId = req.body.lessonId || req.query.lessonId;
      const courseId = req.body.courseId || req.query.courseId;
      const moduleId = req.body.moduleId || req.query.moduleId;

      const result = await StorageService.uploadLessonResource(
        req.file,
        lessonId as string,
        courseId as string,
        moduleId as string
      );

      sendResponse(res, 200, 'Resource uploaded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public async uploadLessonVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No video file uploaded');
      }

      const lessonId = req.body.lessonId || req.query.lessonId;
      const courseId = req.body.courseId || req.query.courseId;
      const moduleId = req.body.moduleId || req.query.moduleId;

      const result = await StorageService.uploadLessonVideo(
        req.file,
        lessonId as string,
        courseId as string,
        moduleId as string
      );

      sendResponse(res, 200, 'Video uploaded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public async getSignedVideoUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filePath = (req.query.path || req.body.path) as string;

      if (!filePath || typeof filePath !== 'string') {
        throw ApiError.badRequest('File path is required to generate signed video URL');
      }

      const signedUrl = await StorageService.createSignedLessonVideoUrl(filePath, 86400);

      sendResponse(res, 200, 'Signed video URL generated successfully', {
        signedUrl,
        path: filePath,
        expiresIn: 86400,
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================================
  // Public & Student Access Controllers
  // =============================================================

  public async getPublicCourseCurriculum(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseIdOrSlug = (req.params.courseId || req.params.slug || req.params.id) as string;
      const curriculum = await curriculumService.getCourseCurriculum(courseIdOrSlug);
      sendResponse(res, 200, 'Course curriculum retrieved successfully', curriculum);
    } catch (error) {
      next(error);
    }
  }

  public async getPublicModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.courseId as string;
      const moduleId = req.params.moduleId as string;
      const module = await curriculumService.getPublicModule(courseId, moduleId);
      sendResponse(res, 200, 'Module retrieved successfully', module);
    } catch (error) {
      next(error);
    }
  }

  public async getPublicLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessonId = req.params.lessonId as string;
      const lesson = await curriculumService.getPublicLesson(lessonId);
      sendResponse(res, 200, 'Lesson retrieved successfully', lesson);
    } catch (error) {
      next(error);
    }
  }
}

export const curriculumController = new CurriculumController();
