import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { Category, SubcategoryItem } from '../types';
import { logger } from '../utils/logger';

export class CategoryService {
  /**
   * Helper to format DB row to Category interface
   */
  private formatCategory(row: any, totalCourses = 0): Category {
    let subcategories: SubcategoryItem[] = [];
    if (Array.isArray(row.subcategories)) {
      subcategories = row.subcategories.map((sub: any, idx: number) => {
        if (typeof sub === 'string') {
          return {
            id: `sub-${idx + 1}`,
            name: sub,
            slug: sub.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: `Subcategory under ${row.name}`,
            coursesCount: 0,
            status: 'Active',
          };
        }
        return {
          id: sub.id || `sub-${idx + 1}`,
          name: sub.name,
          slug: sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: sub.description || '',
          coursesCount: sub.coursesCount || 0,
          status: sub.status || 'Active',
        };
      });
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      status: row.status || 'Active',
      totalCourses,
      subcategories,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * List all categories (Public / Student / Instructor / Admin)
   */
  public async getCategories(onlyActive = false): Promise<Category[]> {
    try {
      let query = supabaseAdmin
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (onlyActive) {
        query = query.eq('status', 'Active');
      }

      const { data: rows, error } = await query;
      if (error) {
        logger.warn('Error fetching categories from DB:', error);
        return [];
      }

      // Query real course counts grouped by category_id
      const { data: courseRows } = await supabaseAdmin
        .from('courses')
        .select('category_id');

      const countMap = new Map<string, number>();
      if (courseRows) {
        for (const c of courseRows) {
          if (c.category_id) {
            countMap.set(c.category_id, (countMap.get(c.category_id) || 0) + 1);
          }
        }
      }

      return (rows || []).map((row) => {
        const dbCourseCount = countMap.get(row.id) || 0;
        return this.formatCategory(row, dbCourseCount);
      });
    } catch (err) {
      logger.error('Failed to get categories:', err);
      return [];
    }
  }

  /**
   * Get single Category by ID or Slug
   */
  public async getCategoryByIdOrSlug(idOrSlug: string): Promise<Category | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabaseAdmin.from('categories').select('*');
    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;

    const { count } = await supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', data.id);

    return this.formatCategory(data, count || 0);
  }

  /**
   * Create a new Category (Admin Only)
   */
  public async createCategory(input: {
    name: string;
    description: string;
    imageUrl?: string;
    status?: 'Active' | 'Inactive';
    subcategories?: any[];
  }): Promise<Category> {
    const slug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id')
      .or(`name.ilike.${input.name.trim()},slug.eq.${slug}`)
      .maybeSingle();

    if (existing) {
      throw ApiError.conflict(`A category with the name "${input.name}" already exists`);
    }

    // Format subcategories
    const formattedSubs = (input.subcategories || []).map((sub, idx) => {
      if (typeof sub === 'string') {
        return {
          id: `sub-${Date.now()}-${idx}`,
          name: sub.trim(),
          slug: sub.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
          description: `Subcategory under ${input.name}`,
          coursesCount: 0,
          status: 'Active',
        };
      }
      return {
        id: sub.id || `sub-${Date.now()}-${idx}`,
        name: sub.name.trim(),
        slug: sub.slug || sub.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        description: sub.description || '',
        coursesCount: sub.coursesCount || 0,
        status: sub.status || 'Active',
      };
    });

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: input.name.trim(),
        slug,
        description: input.description.trim(),
        image_url: input.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        status: input.status || 'Active',
        subcategories: formattedSubs,
      })
      .select()
      .single();

    if (error || !data) {
      throw ApiError.badRequest(error?.message || 'Failed to create category');
    }

    return this.formatCategory(data, 0);
  }

  /**
   * Update existing Category (Admin Only)
   */
  public async updateCategory(
    id: string,
    updates: {
      name?: string;
      description?: string;
      imageUrl?: string;
      status?: 'Active' | 'Inactive';
      subcategories?: any[];
    }
  ): Promise<Category> {
    const existing = await this.getCategoryByIdOrSlug(id);
    if (!existing) {
      throw ApiError.notFound('Category not found');
    }

    const payload: Record<string, any> = {};
    if (updates.name !== undefined) {
      payload.name = updates.name.trim();
      payload.slug = updates.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    }
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.status !== undefined) payload.status = updates.status;

    if (updates.subcategories !== undefined) {
      payload.subcategories = updates.subcategories.map((sub, idx) => {
        if (typeof sub === 'string') {
          return {
            id: `sub-${Date.now()}-${idx}`,
            name: sub.trim(),
            slug: sub.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
            description: `Subcategory under ${updates.name || existing.name}`,
            coursesCount: 0,
            status: 'Active',
          };
        }
        return {
          id: sub.id || `sub-${Date.now()}-${idx}`,
          name: sub.name.trim(),
          slug: sub.slug || sub.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
          description: sub.description || '',
          coursesCount: sub.coursesCount || 0,
          status: sub.status || 'Active',
        };
      });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw ApiError.badRequest(error?.message || 'Failed to update category');
    }

    return this.formatCategory(data, existing.totalCourses);
  }

  /**
   * Delete Category (Admin Only)
   */
  public async deleteCategory(id: string): Promise<void> {
    const existing = await this.getCategoryByIdOrSlug(id);
    if (!existing) {
      throw ApiError.notFound('Category not found');
    }

    // Check if courses are using this category
    const { count } = await supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      throw ApiError.badRequest(
        `Cannot delete category "${existing.name}" because it currently has ${count} assigned course(s). Reassign them first.`
      );
    }

    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
    if (error) {
      throw ApiError.badRequest(error.message);
    }
  }
}

export const categoryService = new CategoryService();
