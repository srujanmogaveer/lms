import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiBell,
  FiCheckCircle,
  FiMail,
  FiSearch,
  FiRefreshCw,
  FiLayers,
  FiExternalLink,
  FiTrash2,
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import { showConfirmAlert } from '../../utils/swalAlerts';
import type { AppNotification } from '../../types';

export const InstructorNotifications: React.FC = () => {
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

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  // Modal State
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Metrics
  const totalCount = notifications.length;
  const readCount = useMemo(() => notifications.filter((n) => n.isRead || n.read).length, [notifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const isRead = notif.isRead || notif.read;

      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = notif.title.toLowerCase().includes(q);
        const matchesMsg = notif.message.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      // 2. Read Filter
      if (readFilter === 'unread' && isRead) return false;
      if (readFilter === 'read' && !isRead) return false;

      // 3. Category Filter
      if (categoryFilter !== 'all' && notif.category !== categoryFilter) return false;

      return true;
    });
  }, [notifications, searchQuery, readFilter, categoryFilter]);

  const handleOpenDetails = async (notif: AppNotification) => {
    setSelectedNotification(notif);
    setIsDetailsOpen(true);
    if (!notif.isRead && !notif.read) {
      await markAsRead(notif.id);
    }
  };

  const handleActionClick = (notif: AppNotification) => {
    if (!notif.isRead && !notif.read) {
      markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await showConfirmAlert(
      'Delete Notification',
      'Delete this notification?'
    );
    if (confirmed) {
      await deleteNotification(id);
      if (selectedNotification?.id === id) {
        setIsDetailsOpen(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <FiBell className="w-6 h-6" />
            </div>
            Instructor Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with student enrollments, course approvals, platform broadcasts, and activity alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={refreshNotifications}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={markAllAsRead}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Mark All as Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Alerts</span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
            <FiMail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Unread Alerts</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{unreadCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Read Alerts</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{readCount}</span>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <FiSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="all">All Categories</option>
              <option value="announcement">Announcements</option>
              <option value="course">Course Activity</option>
              <option value="assignment">Assignments</option>
              <option value="quiz">Quizzes</option>
              <option value="payment">Payouts & Revenue</option>
              <option value="system">System Notices</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="all">All Read Statuses</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {isLoading && notifications.length === 0 ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center border border-slate-200 dark:border-slate-800">
          <EmptyState
            type="notifications"
            title="No notifications available"
            description="You have no notifications matching your current filters."
            actionLabel="Back to Dashboard"
            onAction={() => navigate('/instructor')}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isRead = notif.isRead || notif.read;
            return (
              <Card
                key={notif.id}
                className={`p-4 border transition-all ${
                  !isRead
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          notif.type === 'error'
                            ? 'danger'
                            : notif.type === 'warning'
                            ? 'warning'
                            : notif.type === 'success'
                            ? 'success'
                            : 'primary'
                        }
                        size="sm"
                      >
                        {notif.category || 'General'}
                      </Badge>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Unread" />
                      )}
                    </div>

                    <h3
                      onClick={() => handleOpenDetails(notif)}
                      className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      {notif.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {notif.actionUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick(notif)}
                        className="text-xs flex items-center gap-1"
                      >
                        <span>Open Link</span>
                        <FiExternalLink className="w-3 h-3" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetails(notif)}
                      className="text-xs"
                    >
                      View
                    </Button>

                    <button
                      onClick={() => markAsRead(notif.id)}
                      className={`p-2 rounded-lg border text-xs transition-colors ${
                        isRead
                          ? 'border-slate-200 dark:border-slate-700 text-slate-400'
                          : 'border-amber-300 dark:border-amber-700 text-amber-600 bg-amber-50 dark:bg-amber-950'
                      }`}
                      title={isRead ? 'Already Read' : 'Mark as Read'}
                    >
                      <FiCheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-colors text-xs"
                      title="Delete Notification"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Category: {notif.category}</span>
                  <span>{notif.date ? `${notif.date} ${notif.time || ''}` : notif.timestamp || 'Recent'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details View Modal */}
      <BaseModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Notification Details"
      >
        {selectedNotification && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Badge variant="primary">
                {selectedNotification.category}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                {selectedNotification.date || selectedNotification.timestamp || 'Recent'}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {selectedNotification.title}
            </h2>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto custom-scrollbar p-1">
              {selectedNotification.message}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {selectedNotification.actionUrl && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      navigate(selectedNotification.actionUrl!);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
                  >
                    <span>Go to Target Page</span>
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteNotification(selectedNotification.id)}
                  className="text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900 flex items-center gap-1 text-xs"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </BaseModal>
    </motion.div>
  );
};
