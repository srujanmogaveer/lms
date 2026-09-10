import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformSettingsService } from '../services/platformSettingsService';
import {
  type AdminPlatformSettings,
  defaultAdminSettings,
} from '../data/adminSettingsData';

export const PLATFORM_SETTINGS_QUERY_KEY = ['platformSettings'] as const;

export const usePlatformSettings = () => {
  const queryClient = useQueryClient();

  // Cross-tab synchronization via localStorage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edusphere_admin_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          queryClient.setQueryData(PLATFORM_SETTINGS_QUERY_KEY, parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);

  // 1. Fetch active platform settings
  const {
    data: settings = defaultAdminSettings,
    isLoading,
    isError,
    refetch,
  } = useQuery<AdminPlatformSettings>({
    queryKey: PLATFORM_SETTINGS_QUERY_KEY,
    queryFn: platformSettingsService.fetchPlatformSettings,
    staleTime: 1000 * 30, // 30 seconds fresh cache
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    refetchOnWindowFocus: true,
  });

  // 2. Mutation: Update platform settings
  const updateMutation = useMutation({
    mutationFn: (updated: Partial<AdminPlatformSettings>) =>
      platformSettingsService.updatePlatformSettings(updated),
    onSuccess: (newSettings) => {
      // Immediately update query cache
      queryClient.setQueryData(PLATFORM_SETTINGS_QUERY_KEY, newSettings);
      // Synchronise local fallback
      localStorage.setItem('edusphere_admin_settings', JSON.stringify(newSettings));
      // Invalidate all admin and instructor financial queries so they update instantly without reload
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['instructor'] });
      queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY });
    },
  });

  // 3. Mutation: Reset platform settings to defaults
  const resetMutation = useMutation({
    mutationFn: () => platformSettingsService.resetPlatformSettings(),
    onSuccess: (resetSettings) => {
      queryClient.setQueryData(PLATFORM_SETTINGS_QUERY_KEY, resetSettings);
      localStorage.removeItem('edusphere_admin_settings');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['instructor'] });
      queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY });
    },
  });

  return {
    settings,
    isLoading,
    isError,
    refetch,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    resetSettings: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
  };
};
