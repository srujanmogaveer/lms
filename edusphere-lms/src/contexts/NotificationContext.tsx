import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { supabase } from '../lib/supabase';
import type { AppNotification } from '../types';

export type { AppNotification };

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  getNotificationsByRole: (role: 'student' | 'instructor' | 'admin') => AppNotification[];
  getUnreadCountByRole: (role: 'student' | 'instructor' | 'admin') => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const res = await notificationService.getNotifications(50);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Keep existing state
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  const fetchRef = React.useRef(fetchNotifications);
  fetchRef.current = fetchNotifications;

  // Debounced notification fetch to coalesce burst events
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchRef.current();
    }, 500);
  }, []);

  // Initial load, Polling interval (15s) & Window focus refetch to guarantee badge updates across tabs
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchRef.current();

    const interval = setInterval(() => {
      fetchRef.current();
    }, 15000);

    const handleFocus = () => {
      fetchRef.current();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser?.id]);

  // Supabase Realtime Subscription for Live In-App Notifications (Single stable channel per user)
  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;

    const channelName = `notifications:user:${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, debouncedFetch]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await notificationService.markAsRead(id);
    } catch {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);

      await notificationService.markAllAsRead();
    } catch {
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await notificationService.deleteNotification(id);
    } catch {
      fetchNotifications();
    }
  };

  const getNotificationsByRole = (_role: 'student' | 'instructor' | 'admin') => {
    return notifications;
  };

  const getUnreadCountByRole = (_role: 'student' | 'instructor' | 'admin') => {
    return unreadCount;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
        getNotificationsByRole,
        getUnreadCountByRole,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
