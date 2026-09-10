import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: any;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, errors?: any, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors?: any): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden: Access is denied'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error', errors?: any): ApiError {
    return new ApiError(500, message, errors, false);
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  const payload: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
};

export const sendPaginatedResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T[],
  pagination: PaginationMeta
): Response => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};
