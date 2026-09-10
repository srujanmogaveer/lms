import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Error processing request ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle SyntaxError for bad JSON payloads
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request payload',
      errors: null,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Fallback for unhandled unexpected errors
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Internal Server Error',
    errors: isDev ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};
