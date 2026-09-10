import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from '../controllers/category.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { imageUploadMiddleware } from '../middleware/upload.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validator';

const router = Router();

// Public Category Endpoints (Students, Instructors, Anonymous)
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin Category Image Upload (Multipart file)
router.post(
  '/upload-image',
  authenticateUser,
  requireAdmin,
  imageUploadMiddleware.single('image'),
  uploadCategoryImage
);

router.post(
  '/admin/upload-image',
  authenticateUser,
  requireAdmin,
  imageUploadMiddleware.single('image'),
  uploadCategoryImage
);

router.post(
  '/admin/:id/upload-image',
  authenticateUser,
  requireAdmin,
  imageUploadMiddleware.single('image'),
  uploadCategoryImage
);

// Admin Category Management Endpoints (Admin role only)
router.post(
  '/admin',
  authenticateUser,
  requireAdmin,
  validateRequest(createCategorySchema),
  createCategory
);

router.patch(
  '/admin/:id',
  authenticateUser,
  requireAdmin,
  validateRequest(updateCategorySchema),
  updateCategory
);

router.delete(
  '/admin/:id',
  authenticateUser,
  requireAdmin,
  deleteCategory
);

export default router;
