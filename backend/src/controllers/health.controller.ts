import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/apiResponse';
import { supabaseService } from '../services/supabase.service';

export const getHealthStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = await supabaseService.getStatus();
    sendResponse(res, 200, 'EduSphere LMS Backend API is healthy and running', status);
  } catch (error) {
    next(error);
  }
};

export const getAuthMiddlewareTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendResponse(res, 200, 'Authenticated route accessed successfully', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
