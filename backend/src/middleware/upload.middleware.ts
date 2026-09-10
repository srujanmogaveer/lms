import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/apiResponse';

const storage = multer.memoryStorage();

// -------------------------------------------------------------
// 1. Image Upload Middleware (5MB limit)
// -------------------------------------------------------------
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      ApiError.badRequest(
        `Invalid file type "${file.mimetype}". Only image/jpeg, image/png, and image/webp are supported.`
      )
    );
  }
};

export const imageUploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: imageFileFilter,
});

// -------------------------------------------------------------
// 2. PDF Document Upload Middleware (25MB limit)
// -------------------------------------------------------------
const MAX_PDF_SIZE = 25 * 1024 * 1024;

const pdfFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    callback(null, true);
  } else {
    callback(
      ApiError.badRequest(
        `Invalid document format "${file.mimetype}". Only PDF documents (application/pdf) are supported.`
      )
    );
  }
};

export const pdfUploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_PDF_SIZE },
  fileFilter: pdfFileFilter,
});

// -------------------------------------------------------------
// 3. Resource File Upload Middleware (50MB limit)
// -------------------------------------------------------------
const MAX_RESOURCE_SIZE = 50 * 1024 * 1024;
const ALLOWED_RESOURCE_EXTS = [
  '.pdf',
  '.zip',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
  '.json',
  '.js',
  '.ts',
  '.py',
  '.java',
  '.cpp',
  '.c',
  '.html',
  '.css',
  '.sql',
  '.md',
  '.png',
  '.jpg',
  '.jpeg',
];

const resourceFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
  if (ALLOWED_RESOURCE_EXTS.includes(ext) || file.mimetype.includes('zip') || file.mimetype.includes('pdf')) {
    callback(null, true);
  } else {
    callback(
      ApiError.badRequest(
        `Invalid resource file format "${ext}". Supported types: PDF, ZIP, DOC, PPT, XLS, Code files, text, images.`
      )
    );
  }
};

export const resourceUploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_RESOURCE_SIZE },
  fileFilter: resourceFileFilter,
});

// -------------------------------------------------------------
// 4. Video File Upload Middleware (100MB limit)
// -------------------------------------------------------------
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const ALLOWED_VIDEO_EXTS = ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi'];

const videoFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
  if (ALLOWED_VIDEO_EXTS.includes(ext) || file.mimetype.startsWith('video/')) {
    callback(null, true);
  } else {
    callback(
      ApiError.badRequest(
        `Invalid video file format "${ext}". Supported video formats: MP4, WebM, OGG, MOV, MKV, AVI.`
      )
    );
  }
};

export const videoUploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: videoFileFilter,
});
