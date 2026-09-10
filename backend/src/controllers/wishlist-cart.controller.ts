import { Request, Response, NextFunction } from 'express';
import { wishlistService } from '../services/wishlist.service';
import { cartService } from '../services/cart.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class WishlistController {
  public async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('User not authenticated');

      const items = await wishlistService.getStudentWishlist(studentId);
      sendResponse(res, 200, 'Wishlist retrieved successfully', items);
    } catch (error) {
      next(error);
    }
  }

  public async addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('User not authenticated');

      const courseId = (req.params.courseId || req.body.courseId) as string;
      if (!courseId) throw ApiError.badRequest('courseId is required');

      const item = await wishlistService.addToWishlist(studentId, courseId);
      sendResponse(res, 201, 'Course added to wishlist', item);
    } catch (error) {
      next(error);
    }
  }

  public async removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('User not authenticated');

      const courseId = req.params.courseId as string;
      if (!courseId) throw ApiError.badRequest('courseId is required');

      await wishlistService.removeFromWishlist(studentId, courseId);
      sendResponse(res, 200, 'Course removed from wishlist');
    } catch (error) {
      next(error);
    }
  }
}

export class CartController {
  public async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('User not authenticated');

      const items = await cartService.getStudentCart(studentId);
      sendResponse(res, 200, 'Cart retrieved successfully', items);
    } catch (error) {
      next(error);
    }
  }

  public async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('User not authenticated');

      const courseId = (req.params.courseId || req.body.courseId) as string;
      if (!courseId) throw ApiError.badRequest('courseId is required');

      const item = await cartService.addToCart(studentId, courseId);
      sendResponse(res, 201, 'Course added to cart', item);
    } catch (error) {
      next(error);
    }
  }

  public async removeFromCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('User not authenticated');

      const courseId = req.params.courseId as string;
      if (!courseId) throw ApiError.badRequest('courseId is required');

      await cartService.removeFromCart(studentId, courseId);
      sendResponse(res, 200, 'Course removed from cart');
    } catch (error) {
      next(error);
    }
  }

  public async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('User not authenticated');

      await cartService.clearCart(studentId);
      sendResponse(res, 200, 'Cart cleared successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
export const cartController = new CartController();
