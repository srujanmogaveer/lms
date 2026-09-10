import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const CATEGORY_BUCKET = 'category-images';
export const LESSON_DOCUMENTS_BUCKET = 'lesson-documents';
export const LESSON_RESOURCES_BUCKET = 'lesson-resources';
export const ASSIGNMENT_SUBMISSIONS_BUCKET = 'assignment-submissions';
export const AVATARS_BUCKET = 'avatars';
export const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments';

export class StorageService {
  /**
   * Helper to ensure that category storage buckets exist
   */
  public static async ensureCategoryBucket(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      if (listError) {
        logger.error('Error listing storage buckets:', listError);
        return;
      }

      const categoryBucket = buckets?.find((b) => b.name === CATEGORY_BUCKET);
      if (!categoryBucket) {
        const { error: createError } = await supabaseAdmin.storage.createBucket(CATEGORY_BUCKET, {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10 MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        });

        if (createError) {
          logger.warn(`Storage bucket '${CATEGORY_BUCKET}' creation warning:`, createError.message);
        } else {
          logger.info(`Storage bucket '${CATEGORY_BUCKET}' created successfully.`);
        }
      }
    } catch (err) {
      logger.error('Failed to verify storage bucket:', err);
    }
  }

  /**
   * Helper to ensure that chat attachments storage bucket exists
   */
  public static async ensureChatAttachmentsBucket(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      if (listError) {
        logger.error('Error listing storage buckets:', listError);
        return;
      }

      const chatBucket = buckets?.find((b) => b.name === CHAT_ATTACHMENTS_BUCKET);
      if (!chatBucket) {
        const { error: createError } = await supabaseAdmin.storage.createBucket(CHAT_ATTACHMENTS_BUCKET, {
          public: true,
          fileSizeLimit: 25 * 1024 * 1024, // 25 MB max
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
            'application/x-zip-compressed',
          ],
        });

        if (createError) {
          logger.warn(`Storage bucket '${CHAT_ATTACHMENTS_BUCKET}' creation warning:`, createError.message);
        } else {
          logger.info(`Storage bucket '${CHAT_ATTACHMENTS_BUCKET}' created as public (chat attachments).`);
        }
      } else {
        logger.info(`Storage bucket '${CHAT_ATTACHMENTS_BUCKET}' already exists.`);
      }
    } catch (err) {
      logger.error('Failed to verify chat attachments storage bucket:', err);
    }
  }

  /**
   * Helper to ensure that curriculum and submission storage buckets exist
   */
  public static async ensureCurriculumBuckets(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      if (listError) {
        logger.error('Error listing storage buckets:', listError);
        return;
      }

      const docBucket = buckets?.find((b) => b.name === LESSON_DOCUMENTS_BUCKET);
      if (!docBucket) {
        const { error: createErr } = await supabaseAdmin.storage.createBucket(LESSON_DOCUMENTS_BUCKET, {
          public: false,
          fileSizeLimit: 25 * 1024 * 1024, // 25 MB
          allowedMimeTypes: ['application/pdf'],
        });
        if (createErr) {
          logger.warn(`Storage bucket '${LESSON_DOCUMENTS_BUCKET}' creation warning:`, createErr.message);
        } else {
          logger.info(`Storage bucket '${LESSON_DOCUMENTS_BUCKET}' created as private.`);
        }
      }

      const resourceBucket = buckets?.find((b) => b.name === LESSON_RESOURCES_BUCKET);
      if (!resourceBucket) {
        const { error: createErr } = await supabaseAdmin.storage.createBucket(LESSON_RESOURCES_BUCKET, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50 MB
        });
        if (createErr) {
          logger.warn(`Storage bucket '${LESSON_RESOURCES_BUCKET}' creation warning:`, createErr.message);
        } else {
          logger.info(`Storage bucket '${LESSON_RESOURCES_BUCKET}' created as public.`);
        }
      }

      const subBucket = buckets?.find((b) => b.name === ASSIGNMENT_SUBMISSIONS_BUCKET);
      if (!subBucket) {
        const { error: createErr } = await supabaseAdmin.storage.createBucket(ASSIGNMENT_SUBMISSIONS_BUCKET, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50 MB
        });
        if (createErr) {
          logger.warn(`Storage bucket '${ASSIGNMENT_SUBMISSIONS_BUCKET}' creation warning:`, createErr.message);
        } else {
          logger.info(`Storage bucket '${ASSIGNMENT_SUBMISSIONS_BUCKET}' created as private.`);
        }
      }
    } catch (err) {
      logger.error('Failed to verify curriculum storage buckets:', err);
    }
  }

  /**
   * Ensure the public 'avatars' bucket exists for profile photo uploads.
   * This bucket is used by all user roles (student, instructor, admin).
   * Without it the frontend falls back to storing base64 Data URLs directly
   * in the profiles.avatar_url column, which bloats the DB and causes
   * localStorage quota errors when the profile is cached.
   */
  public static async ensureAvatarsBucket(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      if (listError) {
        logger.error('Error listing storage buckets:', listError);
        return;
      }

      const avatarBucket = buckets?.find((b) => b.name === AVATARS_BUCKET);
      if (!avatarBucket) {
        const { error: createError } = await supabaseAdmin.storage.createBucket(AVATARS_BUCKET, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5 MB max
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        });

        if (createError) {
          logger.warn(`Storage bucket '${AVATARS_BUCKET}' creation warning:`, createError.message);
        } else {
          logger.info(`Storage bucket '${AVATARS_BUCKET}' created as public (profile photos).`);
        }
      } else {
        logger.info(`Storage bucket '${AVATARS_BUCKET}' already exists.`);
      }
    } catch (err) {
      logger.error('Failed to verify avatars storage bucket:', err);
    }
  }

  /**
   * Upload an avatar image file to Supabase Storage (bucket: avatars) and return public URL.
   * Uses supabaseAdmin so it succeeds even for unregistered/pre-registered applicants.
   */
  public static async uploadAvatarImage(
    file: Express.Multer.File,
    userId?: string
  ): Promise<string> {
    await this.ensureAvatarsBucket();

    if (!file || !file.buffer || file.size === 0) {
      throw ApiError.badRequest('Uploaded avatar image file is empty or missing');
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'png';
    const folder = userId || `applicant-${Date.now()}`;
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `${folder}/avatar-${uniqueId}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'image/png',
        cacheControl: '31536000, immutable',
        upsert: true,
      });

    if (uploadError) {
      logger.error('Supabase Storage avatar upload error:', uploadError);
      throw ApiError.badRequest(`Failed to upload avatar image: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw ApiError.internal('Failed to generate public URL for uploaded avatar');
    }

    return publicUrlData.publicUrl;
  }

  /**
   * Convenience method: ensure all required storage buckets exist.
   * Call this once on server startup.
   */
  public static async ensureAllBuckets(): Promise<void> {
    await Promise.allSettled([
      this.ensureAvatarsBucket(),
      this.ensureCategoryBucket(),
      this.ensureCurriculumBuckets(),
      this.ensureChatAttachmentsBucket(),
    ]);
  }

  /**
   * Upload a category image buffer to Supabase Storage and return public URL
   */
  public static async uploadCategoryImage(
    file: Express.Multer.File,
    categoryId?: string
  ): Promise<string> {
    await this.ensureCategoryBucket();

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'webp';
    const folder = categoryId || 'general';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filePath = `categories/${folder}/${uniqueId}.${extension}`;

    try {
      const { error: uploadError } = await supabaseAdmin.storage
        .from(CATEGORY_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: '31536000, immutable',
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(CATEGORY_BUCKET)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }

      // Fallback 1: Try avatars bucket
      logger.warn(`Primary category bucket upload failed, attempting fallback to avatars bucket`);
      const { error: fallbackError } = await supabaseAdmin.storage
        .from(AVATARS_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: '31536000, immutable',
          upsert: true,
        });

      if (!fallbackError) {
        const { data: fallbackUrlData } = supabaseAdmin.storage
          .from(AVATARS_BUCKET)
          .getPublicUrl(filePath);

        if (fallbackUrlData?.publicUrl) {
          return fallbackUrlData.publicUrl;
        }
      }
    } catch (storageErr) {
      logger.error('Supabase Storage category upload error:', storageErr);
    }

    // Fallback 2: Base64 data URL if storage is unavailable or offline
    logger.info('Using Base64 Data URL fallback for category image upload');
    const base64Data = file.buffer.toString('base64');
    return `data:${file.mimetype || 'image/jpeg'};base64,${base64Data}`;
  }

  /**
   * Upload a course thumbnail image buffer to Supabase Storage and return public URL
   */
  public static async uploadCourseThumbnailImage(
    file: Express.Multer.File,
    instructorId?: string,
    slug?: string
  ): Promise<string> {
    await this.ensureCategoryBucket();
    await this.ensureAvatarsBucket();

    if (!file || !file.buffer || file.size === 0) {
      throw ApiError.badRequest('Uploaded course thumbnail image file is empty or missing');
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'webp';
    const folder = slug || (instructorId ? `inst-${instructorId.substring(0, 8)}` : 'general');
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filePath = `thumbnails/${folder}/${uniqueId}.${extension}`;

    try {
      const { error: uploadError } = await supabaseAdmin.storage
        .from(CATEGORY_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: '31536000, immutable',
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(CATEGORY_BUCKET)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }

      // Fallback 1: Try avatars bucket
      logger.warn(`Primary thumbnail upload to [${CATEGORY_BUCKET}] failed, attempting fallback to avatars bucket`);
      const avatarPath = `${instructorId || 'instructor'}/thumb-${uniqueId}.${extension}`;
      const { error: fallbackError } = await supabaseAdmin.storage
        .from(AVATARS_BUCKET)
        .upload(avatarPath, file.buffer, {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: '31536000, immutable',
          upsert: true,
        });

      if (!fallbackError) {
        const { data: fallbackUrlData } = supabaseAdmin.storage
          .from(AVATARS_BUCKET)
          .getPublicUrl(avatarPath);

        if (fallbackUrlData?.publicUrl) {
          return fallbackUrlData.publicUrl;
        }
      }
    } catch (storageErr) {
      logger.error('Supabase Storage thumbnail upload error:', storageErr);
    }

    // Fallback 2: Base64 data URL if storage is unavailable or offline
    logger.info('Using Base64 Data URL fallback for course thumbnail upload');
    const base64Data = file.buffer.toString('base64');
    return `data:${file.mimetype || 'image/jpeg'};base64,${base64Data}`;
  }

  /**
   * Upload a PDF lesson document to Supabase Storage (bucket: lesson-documents)
   * Stores at path: courseId/moduleId/lessonId/filename.pdf
   */
  public static async uploadLessonDocument(
    file: Express.Multer.File,
    lessonId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<{ path: string; url: string; fileName: string; fileSize: number }> {
    await this.ensureCurriculumBuckets();

    if (file.mimetype !== 'application/pdf') {
      throw ApiError.badRequest('Only PDF files (application/pdf) are supported for lesson documents');
    }

    const cleanLessonId = lessonId || 'temp';
    const cleanCourseId = courseId || 'general';
    const cleanModuleId = moduleId || 'general';
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `${cleanCourseId}/${cleanModuleId}/${cleanLessonId}/${uniqueId}-${sanitizedOriginalName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LESSON_DOCUMENTS_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        cacheControl: '31536000, immutable',
        upsert: true,
      });

    if (uploadError) {
      logger.error('Supabase Storage PDF upload error:', uploadError);
      if (
        uploadError.message?.toLowerCase().includes('bucket not found') ||
        (uploadError as any).statusCode === 404 ||
        (uploadError as any).code === 'NoSuchBucket'
      ) {
        throw ApiError.badRequest(`Storage bucket '${LESSON_DOCUMENTS_BUCKET}' is not configured.`);
      }
      throw ApiError.badRequest(`Failed to upload lesson document: ${uploadError.message}`);
    }

    // Generate initial signed URL (1 hour validity) for immediate client preview
    const signedUrl = await this.createSignedLessonDocumentUrl(filePath, 3600);

    return {
      path: filePath,
      url: signedUrl,
      fileName: file.originalname,
      fileSize: file.size,
    };
  }

  /**
   * Generate a secure signed URL for a private PDF document in lesson-documents
   * Expiration default: 3600 seconds (1 hour)
   */
  public static async createSignedLessonDocumentUrl(
    filePath: string,
    expiresInSeconds: number = 3600,
    download?: boolean | string
  ): Promise<string> {
    await this.ensureCurriculumBuckets();

    // Clean any leading bucket names or protocol prefixes if mistakenly passed
    let cleanPath = filePath.trim();
    if (cleanPath.startsWith(`${LESSON_DOCUMENTS_BUCKET}/`)) {
      cleanPath = cleanPath.replace(`${LESSON_DOCUMENTS_BUCKET}/`, '');
    } else if (cleanPath.includes(`/storage/v1/object/public/${LESSON_DOCUMENTS_BUCKET}/`)) {
      cleanPath = cleanPath.split(`/storage/v1/object/public/${LESSON_DOCUMENTS_BUCKET}/`)[1];
    } else if (cleanPath.includes(`/storage/v1/object/sign/${LESSON_DOCUMENTS_BUCKET}/`)) {
      cleanPath = cleanPath.split(`/storage/v1/object/sign/${LESSON_DOCUMENTS_BUCKET}/`)[1].split('?')[0];
    }

    const options: { download?: string | boolean } = {};
    if (download) {
      options.download = typeof download === 'string' ? download : true;
    }

    const { data, error } = await supabaseAdmin.storage
      .from(LESSON_DOCUMENTS_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds, options);

    if (error || !data?.signedUrl) {
      logger.error('Error generating signed URL for lesson document:', error);
      if (
        error?.message?.toLowerCase().includes('bucket not found') ||
        (error as any)?.statusCode === 404 ||
        (error as any)?.code === 'NoSuchBucket'
      ) {
        throw ApiError.badRequest(`Storage bucket '${LESSON_DOCUMENTS_BUCKET}' is not configured.`);
      }
      throw ApiError.internal(`Failed to generate signed document URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
  }

  /**
   * Upload a downloadable resource file to Supabase Storage (bucket: lesson-resources)
   */
  public static async uploadLessonResource(
    file: Express.Multer.File,
    lessonId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
    await this.ensureCurriculumBuckets();

    const cleanLessonId = lessonId || 'temp';
    const cleanCourseId = courseId || 'general';
    const cleanModuleId = moduleId || 'general';
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `${cleanCourseId}/${cleanModuleId}/${cleanLessonId}/${uniqueId}-${sanitizedOriginalName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LESSON_RESOURCES_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '31536000, immutable',
        upsert: true,
      });

    if (uploadError) {
      logger.error('Supabase Storage resource upload error:', uploadError);
      throw ApiError.badRequest(`Failed to upload lesson resource: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(LESSON_RESOURCES_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw ApiError.internal('Failed to generate public URL for uploaded lesson resource');
    }

    return {
      url: publicUrlData.publicUrl,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: extension.toUpperCase(),
    };
  }

  /**
   * Upload student assignment submission file to Supabase Storage (bucket: assignment-submissions)
   * Stores at path: assignments/{assignmentId}/{studentId}/{uniquePrefix}-{fileName}
   */
  public static async uploadStudentSubmissionFile(
    file: Express.Multer.File,
    studentId: string,
    assignmentId: string,
    attemptNumber: number = 1
  ): Promise<{ path: string; fileName: string; fileSize: number }> {
    await this.ensureCurriculumBuckets();

    if (!file || !file.buffer || file.size === 0) {
      throw ApiError.badRequest('Uploaded assignment submission file is empty or missing');
    }

    const cleanStudentId = studentId.trim();
    const cleanAssignmentId = assignmentId.trim();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `submissions/${cleanAssignmentId}/${cleanStudentId}/attempt-${attemptNumber}-${uniqueId}-${sanitizedOriginalName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ASSIGNMENT_SUBMISSIONS_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '31536000, immutable',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Supabase Storage submission upload error:', uploadError);
      throw ApiError.badRequest(`Failed to upload assignment submission file: ${uploadError.message}`);
    }

    return {
      path: filePath,
      fileName: file.originalname,
      fileSize: file.size,
    };
  }

  /**
   * Upload a video file to Supabase Storage (bucket: lesson-resources)
   */
  public static async uploadLessonVideo(
    file: Express.Multer.File,
    lessonId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<{ path: string; url: string; fileName: string; fileSize: number; fileType: string }> {
    await this.ensureCurriculumBuckets();

    if (!file || !file.buffer || file.size === 0) {
      throw ApiError.badRequest('Uploaded video file is empty or corrupted');
    }

    const cleanLessonId = lessonId || 'temp';
    const cleanCourseId = courseId || 'general';
    const cleanModuleId = moduleId || 'general';
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'mp4';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `${cleanCourseId}/${cleanModuleId}/${cleanLessonId}/${uniqueId}-${sanitizedOriginalName}`;

    // Determine strict video MIME type
    let mimeType = file.mimetype || 'video/mp4';
    if (mimeType === 'application/octet-stream' || !mimeType.startsWith('video/')) {
      if (extension === 'mp4') mimeType = 'video/mp4';
      else if (extension === 'webm') mimeType = 'video/webm';
      else if (extension === 'ogg' || extension === 'ogv') mimeType = 'video/ogg';
      else mimeType = 'video/mp4';
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LESSON_RESOURCES_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: mimeType,
        cacheControl: '31536000, immutable',
        upsert: true,
      });

    if (uploadError) {
      logger.error('Supabase Storage video upload error:', uploadError);
      throw ApiError.badRequest(`Failed to upload lesson video: ${uploadError.message}`);
    }

    // Generate signed URL (24 hours validity = 86400 seconds) to ensure playback works across private and public bucket states
    let finalVideoUrl = '';
    try {
      const { data: signedData, error: signError } = await supabaseAdmin.storage
        .from(LESSON_RESOURCES_BUCKET)
        .createSignedUrl(filePath, 86400);

      if (signedData?.signedUrl && !signError) {
        finalVideoUrl = signedData.signedUrl;
      }
    } catch {
      // fallback to public url
    }

    if (!finalVideoUrl) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(LESSON_RESOURCES_BUCKET)
        .getPublicUrl(filePath);
      finalVideoUrl = publicUrlData?.publicUrl || '';
    }

    if (!finalVideoUrl) {
      throw ApiError.internal('Failed to generate playable URL for uploaded lesson video');
    }

    return {
      path: filePath,
      url: finalVideoUrl,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: extension.toUpperCase(),
    };
  }

  /**
   * Generate a secure signed URL for a video in lesson-resources
   * Expiration default: 86400 seconds (24 hours)
   */
  public static async createSignedLessonVideoUrl(
    filePath: string,
    expiresInSeconds: number = 86400
  ): Promise<string> {
    await this.ensureCurriculumBuckets();

    let cleanPath = filePath.trim();
    if (cleanPath.startsWith(`${LESSON_RESOURCES_BUCKET}/`)) {
      cleanPath = cleanPath.replace(`${LESSON_RESOURCES_BUCKET}/`, '');
    } else if (cleanPath.includes(`/storage/v1/object/public/${LESSON_RESOURCES_BUCKET}/`)) {
      cleanPath = cleanPath.split(`/storage/v1/object/public/${LESSON_RESOURCES_BUCKET}/`)[1];
    } else if (cleanPath.includes(`/storage/v1/object/sign/${LESSON_RESOURCES_BUCKET}/`)) {
      cleanPath = cleanPath.split(`/storage/v1/object/sign/${LESSON_RESOURCES_BUCKET}/`)[1].split('?')[0];
    }

    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }

    const { data, error } = await supabaseAdmin.storage
      .from(LESSON_RESOURCES_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      // fallback to public URL
      const { data: pubData } = supabaseAdmin.storage
        .from(LESSON_RESOURCES_BUCKET)
        .getPublicUrl(cleanPath);
      if (pubData?.publicUrl) return pubData.publicUrl;
      throw ApiError.internal(`Failed to generate signed video URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete a storage asset if stored in Supabase Storage buckets
   */
  public static async deleteStorageAsset(urlOrPath?: string | null, bucketName: string = LESSON_RESOURCES_BUCKET): Promise<void> {
    if (!urlOrPath) return;

    try {
      let cleanPath = urlOrPath.trim();
      if (cleanPath.startsWith(`${bucketName}/`)) {
        cleanPath = cleanPath.replace(`${bucketName}/`, '');
      } else if (cleanPath.includes(`/storage/v1/object/public/${bucketName}/`)) {
        cleanPath = cleanPath.split(`/storage/v1/object/public/${bucketName}/`)[1];
      } else if (cleanPath.includes(`/storage/v1/object/sign/${bucketName}/`)) {
        cleanPath = cleanPath.split(`/storage/v1/object/sign/${bucketName}/`)[1].split('?')[0];
      }

      // If it's an external URL (e.g. youtube.com, vimeo.com), do not attempt deletion
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return;
      }

      cleanPath = decodeURIComponent(cleanPath);
      const { error } = await supabaseAdmin.storage.from(bucketName).remove([cleanPath]);
      if (error) {
        logger.warn(`Failed to delete storage file '${cleanPath}' in bucket '${bucketName}':`, error.message);
      } else {
        logger.info(`Deleted storage file '${cleanPath}' in bucket '${bucketName}'`);
      }
    } catch (err) {
      logger.warn(`Non-blocking error deleting storage file:`, err);
    }
  }

  /**
   * Optional cleanup: Delete old image if stored in category-images bucket
   */
  public static async deleteImageIfStored(imageUrl?: string | null): Promise<void> {
    if (!imageUrl) return;

    try {
      if (imageUrl.includes(`/storage/v1/object/public/${CATEGORY_BUCKET}/`)) {
        const parts = imageUrl.split(`/storage/v1/object/public/${CATEGORY_BUCKET}/`);
        if (parts.length > 1) {
          const filePath = decodeURIComponent(parts[1]);
          await supabaseAdmin.storage.from(CATEGORY_BUCKET).remove([filePath]);
          logger.info(`Cleaned up old storage image: ${filePath}`);
        }
      }
    } catch (err) {
      logger.warn('Non-blocking error deleting old storage image:', err);
    }
  }
}
