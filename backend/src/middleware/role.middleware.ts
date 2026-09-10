import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiResponse';
import { UserRole } from '../types';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        ApiError.forbidden(
          `Forbidden: Role '${req.user.role}' does not have access to this resource`
        )
      );
      return;
    }

    // If user is an instructor and their application is unapproved/pending or account is inactive/suspended, block access
    if (req.user.role === 'instructor') {
      const approvalStatus = req.user.profile?.instructorApprovalStatus;
      const status = req.user.profile?.status;

      if (approvalStatus === 'pending' || status === 'pending_approval') {
        next(
          ApiError.forbidden(
            'Your instructor application is currently under review by administrators. Access to instructor resources is restricted until approved.'
          )
        );
        return;
      }

      if (approvalStatus === 'rejected') {
        next(
          ApiError.forbidden(
            'Your instructor application was not approved. Please contact platform support.'
          )
        );
        return;
      }

      if (status === 'inactive' || status === 'suspended') {
        next(
          ApiError.forbidden(
            'Your instructor account has been deactivated by an administrator. Please contact support.'
          )
        );
        return;
      }
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireInstructor = requireRole(['instructor', 'admin']);
export const requireStudent = requireRole(['student', 'instructor', 'admin']);
