import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse';
import { UserRole, AccountStatus, InstructorApprovalStatus } from '../types';

export class AdminController {
  /**
   * GET /api/v1/admin/users
   */
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        role: req.query.role as UserRole | undefined,
        status: req.query.status as AccountStatus | undefined,
        approvalStatus: req.query.approvalStatus as InstructorApprovalStatus | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const result = await adminService.getUsers(filters);

      sendPaginatedResponse(
        res,
        200,
        'Users retrieved successfully',
        result.users,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/students
   */
  public async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        role: 'student' as UserRole,
        status: req.query.status as AccountStatus | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const result = await adminService.getUsers(filters);

      sendPaginatedResponse(
        res,
        200,
        'Students retrieved successfully',
        result.users,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/instructors
   */
  public async getInstructors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        role: 'instructor' as UserRole,
        status: req.query.status as AccountStatus | undefined,
        approvalStatus: req.query.approvalStatus as InstructorApprovalStatus | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const result = await adminService.getUsers(filters);

      sendPaginatedResponse(
        res,
        200,
        'Instructors retrieved successfully',
        result.users,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/instructors/pending
   */
  public async getPendingInstructors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        role: 'instructor' as UserRole,
        approvalStatus: 'pending' as InstructorApprovalStatus,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      };

      const result = await adminService.getUsers(filters);

      sendPaginatedResponse(
        res,
        200,
        'Pending instructor applications retrieved',
        result.users,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/users/:id
   */
  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.id);
      const user = await adminService.getUserById(userId);
      sendResponse(res, 200, 'User details retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/instructors/:id
   */
  public async getInstructorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.id);
      const user = await adminService.getUserById(userId);
      sendResponse(res, 200, 'Instructor details retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:id/status
   */
  public async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.id);
      const updatedUser = await adminService.updateUserStatus(userId, req.body.status);
      sendResponse(res, 200, `User status updated to ${req.body.status}`, updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/instructors/:id/approve
   */
  public async approveInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = String(req.params.id);
      const reviewerId = req.user!.id;
      const result = await adminService.approveInstructor(instructorId, reviewerId);
      sendResponse(res, 200, 'Instructor application approved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/instructors/:id/reject
   */
  public async rejectInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = String(req.params.id);
      const reviewerId = req.user!.id;
      const { rejectionReason } = req.body || {};
      const result = await adminService.rejectInstructor(instructorId, reviewerId, rejectionReason);
      sendResponse(res, 200, 'Instructor application rejected successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/instructors/:id/reopen
   */
  public async reopenInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructorId = String(req.params.id);
      const reviewerId = req.user!.id;
      const result = await adminService.reopenInstructor(instructorId, reviewerId);
      sendResponse(res, 200, 'Instructor application reopened successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/instructors
   */
  public async createInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newInstructor = await adminService.createInstructorDirectly(req.body);
      sendResponse(res, 201, 'Instructor account created successfully', newInstructor);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/instructors/:id
   */
  public async updateInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.id);
      const updated = await adminService.updateInstructorProfile(userId, req.body);
      sendResponse(res, 200, 'Instructor profile updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/instructors/:id/history
   */
  public async getInstructorHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.id);
      const history = await adminService.getInstructorApprovalHistory(userId);
      sendResponse(res, 200, 'Approval review history retrieved', history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/users/:id
   */
  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.id);
      await adminService.deleteUser(userId);
      sendResponse(res, 200, 'User account deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/dashboard/stats
   */
  public async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      sendResponse(res, 200, 'Dashboard statistics retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/certificates
   */
  public async getCertificates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getCertificates();
      sendResponse(res, 200, 'Admin certificates retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
