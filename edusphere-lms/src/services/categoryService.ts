import { api } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { CategoryItem, SubcategoryItem } from '../data/categoryData';

export interface CategoryPayload {
  name: string;
  description: string;
  imageUrl?: string;
  status?: 'Active' | 'Inactive';
  subcategories?: (string | SubcategoryItem)[];
}

export const categoryService = {
  // Public list
  getCategories: async (onlyActive = false): Promise<ApiResponse<CategoryItem[]>> => {
    return api.get<CategoryItem[]>(`/categories${onlyActive ? '?active=true' : ''}`);
  },

  // Public single category
  getCategoryById: async (idOrSlug: string): Promise<ApiResponse<CategoryItem>> => {
    return api.get<CategoryItem>(`/categories/${idOrSlug}`);
  },

  // Upload image to Supabase Storage
  uploadImage: async (file: File, categoryId?: string): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    return api.upload<{ imageUrl: string }>(
      categoryId ? `/categories/admin/${categoryId}/upload-image` : '/categories/admin/upload-image',
      formData
    );
  },

  // Admin create category
  createCategory: async (payload: CategoryPayload): Promise<ApiResponse<CategoryItem>> => {
    return api.post<CategoryItem>('/categories/admin', payload);
  },

  // Admin update category
  updateCategory: async (id: string, payload: Partial<CategoryPayload>): Promise<ApiResponse<CategoryItem>> => {
    return api.patch<CategoryItem>(`/categories/admin/${id}`, payload);
  },

  // Admin delete category
  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/categories/admin/${id}`);
  },
};
