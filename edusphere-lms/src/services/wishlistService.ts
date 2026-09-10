import { api } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { WishlistItem } from '../types';

export const wishlistService = {
  /**
   * Get all courses in the authenticated student's wishlist
   */
  getWishlist: async (): Promise<ApiResponse<WishlistItem[]>> => {
    return api.get<WishlistItem[]>('/student/wishlist');
  },

  /**
   * Add a course to the student's wishlist
   */
  addToWishlist: async (courseId: string): Promise<ApiResponse<WishlistItem>> => {
    return api.post<WishlistItem>(`/student/wishlist/${courseId}`);
  },

  /**
   * Remove a course from the student's wishlist
   */
  removeFromWishlist: async (courseId: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/student/wishlist/${courseId}`);
  },
};
