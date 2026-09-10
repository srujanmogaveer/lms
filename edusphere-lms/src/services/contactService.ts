import { api } from './apiClient';
import type { ApiResponse } from './apiClient';

export interface ContactInquiryItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category: 'General' | 'Courses' | 'Technical' | 'Billing';
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInquiryPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category?: 'General' | 'Courses' | 'Technical' | 'Billing';
  message: string;
}

export const contactService = {
  // Public: Submit inquiry
  submitInquiry: async (payload: ContactInquiryPayload): Promise<ApiResponse<ContactInquiryItem>> => {
    return api.post<ContactInquiryItem>('/contact/inquire', payload);
  },

  // Admin: Get all inquiries
  getInquiries: async (params?: Record<string, any>): Promise<ApiResponse<ContactInquiryItem[]>> => {
    return api.get<ContactInquiryItem[]>('/contact/inquiries', params);
  },

  // Admin: Update inquiry status
  updateInquiryStatus: async (
    id: string,
    payload: { status: 'new' | 'in_progress' | 'resolved' | 'closed'; adminNotes?: string }
  ): Promise<ApiResponse<ContactInquiryItem>> => {
    return api.patch<ContactInquiryItem>(`/contact/inquiries/${id}`, payload);
  },

  // Admin: Delete inquiry
  deleteInquiry: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/contact/inquiries/${id}`);
  },
};
