import { api } from './apiClient';
import {
  type AdminPlatformSettings,
  defaultAdminSettings,
} from '../data/adminSettingsData';

export const platformSettingsService = {
  /**
   * Fetch public/active platform settings
   */
  fetchPlatformSettings: async (): Promise<AdminPlatformSettings> => {
    try {
      const res = await api.get<AdminPlatformSettings>('/settings');
      if (res && res.data) {
        return {
          ...defaultAdminSettings,
          ...res.data,
        };
      }
      return defaultAdminSettings;
    } catch (error) {
      console.warn('Failed to fetch platform settings from API, using defaults:', error);
      // Graceful fallback to localStorage / defaultAdminSettings
      const local = localStorage.getItem('edusphere_admin_settings');
      if (local) {
        try {
          return { ...defaultAdminSettings, ...JSON.parse(local) };
        } catch {
          // ignore
        }
      }
      return defaultAdminSettings;
    }
  },

  /**
   * Update platform settings (Admin only)
   */
  updatePlatformSettings: async (
    settings: Partial<AdminPlatformSettings>
  ): Promise<AdminPlatformSettings> => {
    const res = await api.patch<AdminPlatformSettings>('/admin/settings', settings);
    return {
      ...defaultAdminSettings,
      ...res.data,
    };
  },

  /**
   * Reset platform settings to defaults (Admin only)
   */
  resetPlatformSettings: async (): Promise<AdminPlatformSettings> => {
    const res = await api.post<AdminPlatformSettings>('/admin/settings/reset');
    return {
      ...defaultAdminSettings,
      ...res.data,
    };
  },
};
