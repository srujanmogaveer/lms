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
  FiCheck,
  FiAlertCircle,
  FiUserCheck,
  FiBookOpen,
  FiDollarSign,
  FiInfo,
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

export const AdminNotificationManagement: React.FC = () => {
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
  const readCount = useMemo(
    () => notifications.filter((n) => n.isRead || n.read).length,
    [notifications]
  );
  const urgentCount = useMemo(
    () => notifications.filter((n) => n.type === 'error' || n.type === 'warning').length,
    [notifications]
  );

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
      'Delete this notification permanently?'
    );
    if (confirmed) {
      await deleteNotification(id);
      if (selectedNotification?.id === id) {
        setIsDetailsOpen(false);
      }
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'announcement':
        return <FiInfo className="w-4 h-4 text-sky-500" />;
      case 'course':
        return <FiBookOpen className="w-4 h-4 text-brand-500" />;
      case 'payment':
        return <FiDollarSign className="w-4 h-4 text-emerald-500" />;
      case 'enrollment':
        return <FiUserCheck className="w-4 h-4 text-indigo-500" />;
      default:
        return <FiAlertCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-16 font-sans"
    >
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl shadow-xs">
              <FiBell className="w-6 h-6" />
            </div>
            Admin Notification Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">
            Real-time feed of instructor applications, course submission approvals, system alerts, and platform events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={refreshNotifications}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            title="Refresh notifications"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={markAllAsRead}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 rounded-xl shadow-xs text-xs"
            >
              <FiCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Alerts</span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
            <FiMail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Unread Alerts</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{unreadCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Read Alerts</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{readCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Important / Urgent</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{urgentCount}</span>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <FiSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter notifications by category"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Categories</option>
              <option value="system">System Alerts</option>
              <option value="announcement">Announcements</option>
              <option value="course">Course Submissions</option>
              <option value="payment">Payouts & Finance</option>
              <option value="enrollment">Enrollments</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              aria-label="Filter notifications by read status"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Statuses</option>
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
            <SkeletonLoader key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <EmptyState
            type="notifications"
            title="No notifications in your inbox"
            description={
              searchQuery || categoryFilter !== 'all' || readFilter !== 'all'
                ? 'No notifications match your selected search or filter criteria.'
                : 'You are all caught up! When instructors apply, courses are submitted, or alerts occur, they will appear here.'
            }
            actionLabel="View Dashboard"
            onAction={() => navigate('/admin')}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isRead = notif.isRead || notif.read;
            const createdDate = notif.createdAt ? new Date(notif.createdAt) : new Date();

            return (
              <Card
                key={notif.id}
                className={`p-4 sm:p-5 rounded-[20px] border transition-all ${
                  !isRead
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getCategoryIcon(notif.category)}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
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
                          {(notif.category || 'System').toUpperCase()}
                        </Badge>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" title="Unread Alert" />
                        )}
                        <span className="text-[11px] text-slate-400">
                          {createdDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3
                        onClick={() => handleOpenDetails(notif)}
                        className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        {notif.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
                    {notif.actionUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick(notif)}
                        className="text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800"
                      >
                        <span>Open Screen</span>
                        <FiExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {!isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Mark as Read"
                      >
                        <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="hidden md:inline">Read</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      className="text-xs p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700"
                      title="Delete Notification"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notification Details Modal */}
      <BaseModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedNotification?.title || 'Notification Details'}
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <Badge
                variant={
                  selectedNotification.type === 'error'
                    ? 'danger'
                    : selectedNotification.type === 'warning'
                    ? 'warning'
                    : selectedNotification.type === 'success'
                    ? 'success'
                    : 'primary'
                }
              >
                {(selectedNotification.category || 'System').toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-400">
                {selectedNotification.createdAt
                  ? new Date(selectedNotification.createdAt).toLocaleString('en-IN')
                  : 'Recent'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleDeleteNotification(selectedNotification.id, e)}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl flex items-center gap-1.5"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>

              <div className="flex gap-2">
                {selectedNotification.actionUrl && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleActionClick(selectedNotification);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5"
                  >
                    <span>Go to Screen</span>
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </BaseModal>
    </motion.div>
  );
};
