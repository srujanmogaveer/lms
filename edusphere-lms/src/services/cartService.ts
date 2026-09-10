import { api } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { CartItem } from '../types';

export const cartService = {
  /**
   * Get all courses in the authenticated student's cart
   */
  getCart: async (): Promise<ApiResponse<CartItem[]>> => {
    return api.get<CartItem[]>('/student/cart');
  },

  /**
   * Add a course to the student's cart
   */
  addToCart: async (courseId: string): Promise<ApiResponse<CartItem>> => {
    return api.post<CartItem>(`/student/cart/${courseId}`);
  },

  /**
   * Remove a course from the student's cart
   */
  removeFromCart: async (courseId: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/student/cart/${courseId}`);
  },

  /**
   * Clear entire cart
   */
  clearCart: async (): Promise<ApiResponse<void>> => {
    return api.delete<void>('/student/cart');
  },
};
