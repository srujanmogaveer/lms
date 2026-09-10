import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export const registerStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.registerStudent(req.body);
    sendResponse(res, 201, 'Student account registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const registerInstructor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.registerInstructor(req.body);
    sendResponse(res, 201, 'Instructor application registered successfully and is pending review', result);
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No avatar image file provided');
    }
    const { StorageService } = await import('../services/storage.service');
    const avatarUrl = await StorageService.uploadAvatarImage(req.file);
    sendResponse(res, 200, 'Avatar image uploaded successfully', { url: avatarUrl });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    sendResponse(res, 200, 'Signed in successfully', result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    await authService.logout(token);
    sendResponse(res, 200, 'Signed out successfully');
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required');
    }
    const profile = await authService.getCurrentUser(req.user.id, req.user.rawSupabaseUser);
    sendResponse(res, 200, 'Current user profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required');
    }
    const updated = await authService.updateProfile(req.user.id, req.body);
    sendResponse(res, 200, 'Profile updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);
    sendResponse(
      res,
      200,
      'If an account with this email exists, a password reset link has been dispatched.'
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
    await authService.resetPassword(token, req.body.password);
    sendResponse(res, 200, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required');
    }
    await authService.deleteAccount(req.user.id);
    sendResponse(res, 200, 'User account and all associated data permanently deleted successfully');
  } catch (error) {
    next(error);
  }
};
