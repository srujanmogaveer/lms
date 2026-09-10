import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

export interface PlatformSettingsData {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  enableStudentRegistration: boolean;
  enableInstructorRegistration: boolean;
  platformCommissionPercent: number;
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsData = {
  platformName: 'EduSphere Learning Management System',
  supportEmail: 'support@edusphere.edu',
  supportPhone: '9876543210',
  enableStudentRegistration: true,
  enableInstructorRegistration: true,
  platformCommissionPercent: 15,
  enableMaintenanceMode: false,
  maintenanceMessage: 'The platform is currently under maintenance.',
};

class SettingsService {
  // In-memory cache to prevent excessive DB reads
  private cachedSettings: PlatformSettingsData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 60 * 1000; // 60 seconds

  /**
   * Helper to map DB row (snake_case) to PlatformSettingsData (camelCase)
   */
  private mapRowToSettings(row: any): PlatformSettingsData {
    return {
      platformName: row.platform_name || DEFAULT_PLATFORM_SETTINGS.platformName,
      supportEmail: row.support_email || DEFAULT_PLATFORM_SETTINGS.supportEmail,
      supportPhone: row.support_phone || DEFAULT_PLATFORM_SETTINGS.supportPhone,
      enableStudentRegistration: row.enable_student_registration ?? DEFAULT_PLATFORM_SETTINGS.enableStudentRegistration,
      enableInstructorRegistration: row.enable_instructor_registration ?? DEFAULT_PLATFORM_SETTINGS.enableInstructorRegistration,
      platformCommissionPercent: Number(row.platform_commission_percent ?? DEFAULT_PLATFORM_SETTINGS.platformCommissionPercent),
      enableMaintenanceMode: row.enable_maintenance_mode ?? DEFAULT_PLATFORM_SETTINGS.enableMaintenanceMode,
      maintenanceMessage: row.maintenance_message || DEFAULT_PLATFORM_SETTINGS.maintenanceMessage,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  /**
   * Fetch current platform settings (cached in memory with auto DB refresh)
   */
  async getPlatformSettings(forceRefresh = false): Promise<PlatformSettingsData> {
    const now = Date.now();
    if (!forceRefresh && this.cachedSettings && (now - this.cacheTimestamp) < this.CACHE_TTL_MS) {
      return this.cachedSettings;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('platform_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        logger.warn('Error querying platform_settings table (falling back to defaults):', error.message);
        return this.cachedSettings || DEFAULT_PLATFORM_SETTINGS;
      }

      if (data) {
        this.cachedSettings = this.mapRowToSettings(data);
        this.cacheTimestamp = now;
        return this.cachedSettings;
      }

      // If no row exists yet, attempt to seed singleton
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('platform_settings')
        .insert({
          id: 'default',
          platform_name: DEFAULT_PLATFORM_SETTINGS.platformName,
          support_email: DEFAULT_PLATFORM_SETTINGS.supportEmail,
          support_phone: DEFAULT_PLATFORM_SETTINGS.supportPhone,
          enable_student_registration: DEFAULT_PLATFORM_SETTINGS.enableStudentRegistration,
          enable_instructor_registration: DEFAULT_PLATFORM_SETTINGS.enableInstructorRegistration,
          platform_commission_percent: DEFAULT_PLATFORM_SETTINGS.platformCommissionPercent,
          enable_maintenance_mode: DEFAULT_PLATFORM_SETTINGS.enableMaintenanceMode,
          maintenance_message: DEFAULT_PLATFORM_SETTINGS.maintenanceMessage,
        })
        .select('*')
        .maybeSingle();

      if (!insertErr && inserted) {
        this.cachedSettings = this.mapRowToSettings(inserted);
        this.cacheTimestamp = now;
        return this.cachedSettings;
      }

      this.cachedSettings = DEFAULT_PLATFORM_SETTINGS;
      this.cacheTimestamp = now;
      return this.cachedSettings;
    } catch (err: any) {
      logger.error('Failed to get platform settings from DB:', err.message);
      return this.cachedSettings || DEFAULT_PLATFORM_SETTINGS;
    }
  }

  /**
   * Update platform settings (Admin only) and invalidate in-memory cache
   */
  async updatePlatformSettings(
    updates: Partial<PlatformSettingsData>,
    adminId?: string
  ): Promise<PlatformSettingsData> {
    const dbPayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.supportEmail !== undefined) dbPayload.support_email = updates.supportEmail;
    if (updates.supportPhone !== undefined) dbPayload.support_phone = updates.supportPhone;
    if (updates.enableStudentRegistration !== undefined) dbPayload.enable_student_registration = updates.enableStudentRegistration;
    if (updates.enableInstructorRegistration !== undefined) dbPayload.enable_instructor_registration = updates.enableInstructorRegistration;
    if (updates.platformCommissionPercent !== undefined) dbPayload.platform_commission_percent = updates.platformCommissionPercent;
    if (updates.enableMaintenanceMode !== undefined) dbPayload.enable_maintenance_mode = updates.enableMaintenanceMode;
    if (updates.maintenanceMessage !== undefined) dbPayload.maintenance_message = updates.maintenanceMessage;
    if (adminId) dbPayload.updated_by = adminId;

    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({
        id: 'default',
        ...dbPayload,
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to update platform settings in Supabase:', error.message);
      throw new Error(`Database error updating platform settings: ${error.message}`);
    }

    const newSettings = this.mapRowToSettings(data);
    this.cachedSettings = newSettings;
    this.cacheTimestamp = Date.now();
    return newSettings;
  }

  /**
   * Reset platform settings to defaults (Admin only)
   */
  async resetPlatformSettings(adminId?: string): Promise<PlatformSettingsData> {
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({
        id: 'default',
        platform_name: DEFAULT_PLATFORM_SETTINGS.platformName,
        support_email: DEFAULT_PLATFORM_SETTINGS.supportEmail,
        support_phone: DEFAULT_PLATFORM_SETTINGS.supportPhone,
        enable_student_registration: DEFAULT_PLATFORM_SETTINGS.enableStudentRegistration,
        enable_instructor_registration: DEFAULT_PLATFORM_SETTINGS.enableInstructorRegistration,
        platform_commission_percent: DEFAULT_PLATFORM_SETTINGS.platformCommissionPercent,
        enable_maintenance_mode: DEFAULT_PLATFORM_SETTINGS.enableMaintenanceMode,
        maintenance_message: DEFAULT_PLATFORM_SETTINGS.maintenanceMessage,
        updated_at: new Date().toISOString(),
        updated_by: adminId || null,
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to reset platform settings in Supabase:', error.message);
      throw new Error(`Database error resetting platform settings: ${error.message}`);
    }

    const resetData = this.mapRowToSettings(data);
    this.cachedSettings = resetData;
    this.cacheTimestamp = Date.now();
    return resetData;
  }

  /**
   * Helper to fetch active commission rate multiplier (e.g., 0.15 for 15%)
   */
  async getCommissionRate(): Promise<number> {
    const settings = await this.getPlatformSettings();
    const percent = Number(settings.platformCommissionPercent) || 15;
    return percent / 100;
  }
}

export const settingsService = new SettingsService();
