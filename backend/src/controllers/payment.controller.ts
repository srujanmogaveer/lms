import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class PaymentController {
  private paymentService = new PaymentService();

  /**
   * POST /api/v1/student/payment/create-order
   */
  public async createCheckoutOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { courseId } = req.body || {};
      const result = await this.paymentService.createCheckoutOrder(studentId, courseId);

      sendResponse(res, 201, 'Checkout order initialized successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/student/payment/verify
   */
  public async verifyPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { orderId, gatewayOrderId, gatewayPaymentId, gatewaySignature, paymentMethod } = req.body;

      const result = await this.paymentService.verifyPayment(studentId, {
        orderId,
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature,
        paymentMethod,
      });

      sendResponse(res, 200, 'Payment verified successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/student/payment/history
   */
  public async getPaymentHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const history = await this.paymentService.getStudentPaymentHistory(studentId);
      sendResponse(res, 200, 'Payment history retrieved successfully', history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/payments
   */
  public async getAdminPayments(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await this.paymentService.getAdminPayments();
      sendResponse(res, 200, 'Admin payments retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
