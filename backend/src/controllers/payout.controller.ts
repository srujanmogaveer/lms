import { Request, Response, NextFunction } from 'express';
import { payoutService } from '../services/payout.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiResponse';

export class PayoutController {
  /**
   * POST /api/v1/admin/payouts
   * Admin records an out-of-band disbursement to an instructor with UTR
   */
  public async recordPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { instructorId, amount, payoutMethod, transactionId, paymentDate, notes } = req.body;

      const result = await payoutService.recordPayout(adminId, {
        instructorId,
        amount: Number(amount),
        payoutMethod,
        transactionId,
        paymentDate,
        notes,
      });

      sendResponse(res, 201, 'Instructor payout recorded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/payouts
   * Admin gets all persistent payout transactions across all instructors
   */
  public async getAllPayouts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payouts = await payoutService.getAllPayouts();
      sendResponse(res, 200, 'All instructor payout history retrieved successfully', payouts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/instructor/earnings
   * Instructor gets their authentic financial breakdown, balance, and payout history
   */
  public async getInstructorEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      // If called by an instructor, use their own ID. If called by admin with ?instructorId=, allow.
      let targetInstructorId = user.id;
      if (user.role === 'admin' && req.query.instructorId) {
        targetInstructorId = String(req.query.instructorId);
      }

      const financials = await payoutService.calculateInstructorFinancials(targetInstructorId);
      sendResponse(res, 200, 'Instructor earnings and payout history retrieved successfully', financials);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/instructor/analytics
   * Instructor gets full real database revenue metrics, monthly trends, and course performance
   */
  public async getInstructorAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      let targetInstructorId = user.id;
      if (user.role === 'admin' && req.query.instructorId) {
        targetInstructorId = String(req.query.instructorId);
      }

      const analytics = await payoutService.getInstructorAnalytics(targetInstructorId);
      sendResponse(res, 200, 'Instructor revenue and performance analytics retrieved successfully', analytics);
    } catch (error) {
      next(error);
    }
  }
}

export const payoutController = new PayoutController();
