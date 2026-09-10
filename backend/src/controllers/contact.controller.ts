import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse';

export class ContactController {
  /**
   * POST /api/v1/contact/inquire
   * Public submission of a contact inquiry
   */
  public static async submitInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inquiry = await ContactService.createInquiry(req.body);
      sendResponse(res, 201, 'Your message has been received successfully. Our support team will contact you shortly.', inquiry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contact/inquiries
   * Admin: List inquiries with filters and pagination
   */
  public static async getInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ContactService.getInquiries(req.query as any);
      sendPaginatedResponse(res, 200, 'Contact inquiries retrieved successfully.', result.inquiries, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/contact/inquiries/:id
   * Admin: Update status and notes
   */
  public static async updateInquiryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const adminId = (req as any).user?.id;
      const updated = await ContactService.updateInquiryStatus(id, {
        ...req.body,
        adminId,
      });
      sendResponse(res, 200, 'Inquiry status updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/contact/inquiries/:id
   * Admin: Delete inquiry
   */
  public static async deleteInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await ContactService.deleteInquiry(id);
      sendResponse(res, 200, 'Inquiry deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}
