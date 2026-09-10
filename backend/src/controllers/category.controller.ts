import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { StorageService } from '../services/storage.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const onlyActive = req.query.active === 'true';
    const categories = await categoryService.getCategories(onlyActive);
    sendResponse(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const category = await categoryService.getCategoryByIdOrSlug(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    sendResponse(res, 200, 'Category retrieved successfully', category);
  } catch (error) {
    next(error);
  }
};

export const uploadCategoryImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No image file provided in request (field: image)');
    }
    const categoryId = typeof req.params.id === 'string' 
      ? req.params.id 
      : typeof req.query.categoryId === 'string' 
        ? req.query.categoryId 
        : undefined;
    const publicUrl = await StorageService.uploadCategoryImage(req.file, categoryId);
    sendResponse(res, 200, 'Category image uploaded successfully', { imageUrl: publicUrl });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newCategory = await categoryService.createCategory(req.body);
    sendResponse(res, 201, 'Category created successfully', newCategory);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updatedCategory = await categoryService.updateCategory(id, req.body);
    sendResponse(res, 200, 'Category updated successfully', updatedCategory);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    await categoryService.deleteCategory(id);
    sendResponse(res, 200, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
