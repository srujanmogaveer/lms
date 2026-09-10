import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { PaginationMeta } from '../types';
import { NotificationService } from './notification.service';

export interface ContactInquiry {
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

export class ContactService {
  private static inMemoryInquiries: ContactInquiry[] = [];

  private static formatInquiry(row: any): ContactInquiry {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      subject: row.subject || undefined,
      category: row.category || 'General',
      message: row.message,
      status: row.status || 'new',
      adminNotes: row.admin_notes || undefined,
      resolvedAt: row.resolved_at || undefined,
      resolvedBy: row.resolved_by || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Submit a new public contact inquiry
   */
  public static async createInquiry(data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    category?: 'General' | 'Courses' | 'Technical' | 'Billing';
    message: string;
  }): Promise<ContactInquiry> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const category = data.category || 'General';

    const row = {
      id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      subject: data.subject?.trim() || `Inquiry regarding ${category}`,
      category,
      message: data.message.trim(),
      status: 'new',
      created_at: now,
      updated_at: now,
    };

    let savedItem: ContactInquiry | null = null;

    try {
      const { data: inserted, error } = await supabaseAdmin
        .from('contact_inquiries')
        .insert(row)
        .select()
        .single();

      if (!error && inserted) {
        savedItem = this.formatInquiry(inserted);
      }
    } catch (err: any) {
      logger.warn(`Failed to insert contact inquiry to Supabase: ${err.message}`);
    }

    if (!savedItem) {
      savedItem = this.formatInquiry(row);
    }

    this.inMemoryInquiries.unshift(savedItem);

    // Notify Platform Admins about the new inquiry
    try {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await NotificationService.createNotification({
            userId: admin.id,
            title: `New Support Inquiry: ${category}`,
            message: `${savedItem.name} (${savedItem.email}) sent: "${savedItem.subject || savedItem.message.slice(0, 50)}..."`,
            type: 'info',
            category: 'system',
            sourceId: savedItem.id,
          });
        }
      }
    } catch (notifyErr: any) {
      logger.warn(`Failed to notify admins of contact inquiry: ${notifyErr.message}`);
    }

    return savedItem;
  }

  /**
   * Get all inquiries (Admin only)
   */
  public static async getInquiries(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{
    inquiries: ContactInquiry[];
    pagination: PaginationMeta;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from('contact_inquiries')
        .select('*', { count: 'exact' });

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }
      if (params.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,message.ilike.%${params.search}%,subject.ilike.%${params.search}%`);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (!error && Array.isArray(data)) {
        const total = count || data.length;
        const totalPages = Math.ceil(total / limit) || 1;
        return {
          inquiries: data.map(this.formatInquiry),
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch contact inquiries from Supabase: ${err.message}`);
    }

    // Fallback to in-memory store
    let filtered = [...this.inMemoryInquiries];
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((i) => i.status === params.status);
    }
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((i) => i.category === params.category);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.email.toLowerCase().includes(s) ||
          i.message.toLowerCase().includes(s) ||
          (i.subject && i.subject.toLowerCase().includes(s))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const sliced = filtered.slice(offset, offset + limit);

    return {
      inquiries: sliced,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Update inquiry status and admin notes (Admin only)
   */
  public static async updateInquiryStatus(
    id: string,
    data: {
      status: 'new' | 'in_progress' | 'resolved' | 'closed';
      adminNotes?: string;
      adminId?: string;
    }
  ): Promise<ContactInquiry> {
    const now = new Date().toISOString();
    const updatePayload: any = {
      status: data.status,
      updated_at: now,
    };

    if (data.adminNotes !== undefined) {
      updatePayload.admin_notes = data.adminNotes;
    }
    if (data.status === 'resolved' || data.status === 'closed') {
      updatePayload.resolved_at = now;
      if (data.adminId) updatePayload.resolved_by = data.adminId;
    }

    try {
      const { data: updated, error } = await supabaseAdmin
        .from('contact_inquiries')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (!error && updated) {
        return this.formatInquiry(updated);
      }
    } catch (err: any) {
      logger.warn(`Failed to update contact inquiry in Supabase: ${err.message}`);
    }

    const memoryItem = this.inMemoryInquiries.find((i) => i.id === id);
    if (!memoryItem) {
      throw new ApiError(404, 'Contact inquiry not found');
    }

    memoryItem.status = data.status;
    if (data.adminNotes !== undefined) memoryItem.adminNotes = data.adminNotes;
    if (data.status === 'resolved' || data.status === 'closed') {
      memoryItem.resolvedAt = now;
      memoryItem.resolvedBy = data.adminId;
    }
    memoryItem.updatedAt = now;

    return memoryItem;
  }

  /**
   * Delete an inquiry (Admin only)
   */
  public static async deleteInquiry(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('contact_inquiries')
        .delete()
        .eq('id', id);

      if (!error) return true;
    } catch (err: any) {
      logger.warn(`Failed to delete contact inquiry in Supabase: ${err.message}`);
    }

    const idx = this.inMemoryInquiries.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.inMemoryInquiries.splice(idx, 1);
      return true;
    }

    return true;
  }
}
