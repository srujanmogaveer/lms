import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { NotificationsHeader } from '../../components/notifications/NotificationsHeader';
import { NotificationsStatsCards } from '../../components/notifications/NotificationsStatsCards';
import { NotificationsFilterBar, type NotificationFilterState } from '../../components/notifications/NotificationsFilterBar';
import { QuickActionsNav } from '../../components/notifications/QuickActionsNav';
import { NotificationCard } from '../../components/notifications/NotificationCard';
import { NotificationDetailsModal } from '../../components/notifications/NotificationDetailsModal';
import { NotificationPreferencesModal } from '../../components/notifications/NotificationPreferencesModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';

import { useNotifications } from '../../contexts/NotificationContext';
import { showConfirmAlert } from '../../utils/swalAlerts';
import type { AppNotification } from '../../types';

export const StudentNotifications: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  // Active Notification Details & Preferences Modals Controls
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<NotificationFilterState>({
    searchQuery: '',
    category: 'all',
    sortBy: 'newest',
  });

  // Statistics Metrics
  const totalCount = notifications.length;
  const readCount = useMemo(() => notifications.filter((n) => n.isRead || n.read).length, [notifications]);
  const importantCount = useMemo(() => notifications.filter((n) => n.type === 'error' || n.type === 'warning').length, [notifications]);
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return notifications.filter((n) => n.createdAt?.startsWith(today)).length;
  }, [notifications]);

  // Filter & Sort Logic
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notif) => {
        const isRead = notif.isRead || notif.read;
        // 1. Search Query
        if (filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase();
          const matchesTitle = notif.title.toLowerCase().includes(q);
          const matchesMsg = notif.message.toLowerCase().includes(q);
          if (!matchesTitle && !matchesMsg) return false;
        }

        // 2. Category Filter
        if (filters.category === 'unread') {
          if (isRead) return false;
        } else if (filters.category === 'read') {
          if (!isRead) return false;
        } else if (filters.category === 'important') {
          if (notif.type !== 'error' && notif.type !== 'warning') return false;
        } else if (filters.category !== 'all') {
          if (notif.category !== filters.category) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (filters.sortBy === 'oldest') {
          return timeA - timeB;
        }
        return timeB - timeA;
      });
  }, [notifications, filters]);

  // Handlers for Read/Unread State & Actions
  const handleToggleRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (id: string) => {
    const confirmed = await showConfirmAlert(
      'Delete Notification',
      'Delete this notification?'
    );
    if (confirmed) {
      await deleteNotification(id);
      if (selectedNotification?.id === id) {
        setIsDetailsModalOpen(false);
      }
    }
  };

  const handleClearAll = async () => {
    const confirmed = await showConfirmAlert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?'
    );
    if (confirmed) {
      await Promise.all(notifications.map((n) => deleteNotification(n.id)));
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'all',
      sortBy: 'newest',
    });
  };

  // Refresh
  const handleRefresh = async () => {
    await refreshNotifications();
  };

  // Modal Handlers
  const handleOpenDetails = async (notif: AppNotification) => {
    setSelectedNotification(notif);
    setIsDetailsModalOpen(true);
    if (!notif.isRead && !notif.read) {
      await markAsRead(notif.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <NotificationsHeader
        totalCount={totalCount}
        unreadCount={unreadCount}
        readCount={readCount}
        importantCount={importantCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        onOpenPreferences={() => setIsPreferencesModalOpen(true)}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Skeleton Loading State */}
      {isLoading && notifications.length === 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <SkeletonLoader className="h-20 w-full rounded-2xl" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-6"
        >
          <EmptyState
            type="notifications"
            title="No notifications available."
            description="You are all caught up! You currently have no unread activity alerts or pending notifications."
            actionLabel="Back to Dashboard"
            onAction={() => navigate('/student')}
          />
        </motion.div>
      ) : (
        /* Populated Notifications View */
        <div className="space-y-8">
          {/* Statistics Cards */}
          <NotificationsStatsCards
            totalCount={totalCount}
            unreadCount={unreadCount}
            importantCount={importantCount}
            todayCount={todayCount}
            activeStatusFilter={filters.category}
            onSelectStatusFilter={(cat) => setFilters({ ...filters, category: cat })}
          />

          {/* Quick Navigation Shortcuts */}
          <QuickActionsNav />

          {/* Filter Bar */}
          <NotificationsFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            totalFilteredCount={filteredNotifications.length}
          />

          {/* Notifications Feed Cards */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <EmptyState
                type="notifications"
                title="No notification alerts match your filter criteria"
                description="Try resetting search keywords or selecting 'All Alerts'."
                actionLabel="Reset Search Filters"
                onAction={handleResetFilters}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notif) => (
                <motion.div key={notif.id} layout>
                  <NotificationCard
                    notification={notif as any}
                    onOpenDetails={() => handleOpenDetails(notif)}
                    onToggleRead={() => handleToggleRead(notif.id)}
                    onDelete={handleDeleteNotification}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notification Details Modal */}
      <NotificationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        notification={selectedNotification as any}
        onToggleRead={handleToggleRead}
        onDelete={handleDeleteNotification}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
      />
    </motion.div>
  );
};
