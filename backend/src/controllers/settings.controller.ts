import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

/**
 * Get current active platform settings
 * GET /api/v1/settings
 */
export const getPlatformSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.getPlatformSettings();
    sendResponse(res, 200, 'Platform settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * Update platform settings (Admin only)
 * PATCH /api/v1/admin/settings
 */
export const updatePlatformSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required to update platform settings');
    }

    const updatedSettings = await settingsService.updatePlatformSettings(
      req.body,
      req.user.id
    );
    sendResponse(res, 200, 'Platform settings updated successfully', updatedSettings);
  } catch (error) {
    next(error);
  }
};

/**
 * Reset platform settings to defaults (Admin only)
 * POST /api/v1/admin/settings/reset
 */
export const resetPlatformSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required to reset platform settings');
    }

    const resetSettings = await settingsService.resetPlatformSettings(req.user.id);
    sendResponse(res, 200, 'Platform settings reset to default successfully', resetSettings);
  } catch (error) {
    next(error);
  }
};
