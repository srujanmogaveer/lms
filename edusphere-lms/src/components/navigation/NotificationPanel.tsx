import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheckCircle,
  FiInfo,
  FiAlertCircle,
  FiBookOpen,
  FiAward,
  FiVideo,
  FiFileText,
  FiHelpCircle,
  FiDollarSign,
  FiUserCheck,
  FiCheck,
  FiExternalLink,
  FiTrash2
} from 'react-icons/fi';
import { useNotifications, type AppNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { showConfirmAlert } from '../../utils/swalAlerts';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { role, currentUser } = useAuth();
  const effectiveRole = (currentUser as any)?.role || role || 'student';
  const { getNotificationsByRole, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // If clicked on the toggle button inside the parent container, let the button handle toggle
        const parentContainer = panelRef.current.parentElement;
        if (parentContainer && parentContainer.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const roleNotifications = getNotificationsByRole(effectiveRole);

  // Helper to determine notification icon based on category or type
  const getNotificationIcon = (item: AppNotification) => {
    switch (item.category) {
      case 'assignment':
        return <FiFileText className="w-4 h-4 text-blue-500" />;
      case 'quiz':
        return <FiHelpCircle className="w-4 h-4 text-purple-500" />;
      case 'live_class':
        return <FiVideo className="w-4 h-4 text-rose-500" />;
      case 'certificate':
        return <FiAward className="w-4 h-4 text-amber-500" />;
      case 'payment':
        return <FiDollarSign className="w-4 h-4 text-emerald-500" />;
      case 'enrollment':
        return <FiUserCheck className="w-4 h-4 text-indigo-500" />;
      case 'announcement':
        return <FiInfo className="w-4 h-4 text-sky-500" />;
      default:
        if (item.type === 'success') return <FiCheckCircle className="w-4 h-4 text-emerald-500" />;
        if (item.type === 'warning') return <FiAlertCircle className="w-4 h-4 text-amber-500" />;
        if (item.type === 'error') return <FiAlertCircle className="w-4 h-4 text-rose-500" />;
        return <FiBookOpen className="w-4 h-4 text-brand-500" />;
    }
  };

  const getRoleNotificationPath = () => {
    if (effectiveRole === 'admin') return '/admin/notifications';
    if (effectiveRole === 'instructor') return '/instructor/notifications';
    return '/student/notifications';
  };

  const handleNotificationItemClick = (item: AppNotification) => {
    markAsRead(item.id);
    onClose();
    if (item.actionUrl) {
      navigate(item.actionUrl);
    } else {
      navigate(getRoleNotificationPath());
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate(getRoleNotificationPath());
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await showConfirmAlert(
      'Delete Notification',
      'Delete this notification?'
    );
    if (confirmed) {
      await deleteNotification(id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <FiBell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Notifications
                </h3>
              </div>
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <FiCheck className="w-3.5 h-3.5" />
                Mark All as Read
              </button>
            </div>

            {/* Notification List or Empty State */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {roleNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <FiBell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No new notifications.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    You're all caught up for now!
                  </p>
                </div>
              ) : (
                roleNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationItemClick(n)}
                    className={`p-3.5 flex gap-3 transition-colors cursor-pointer group ${
                      !n.read
                        ? 'bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-100/40 dark:hover:bg-brand-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 self-start">
                      {getNotificationIcon(n)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>
                          {n.date} {n.time ? `• ${n.time}` : ''} ({n.timestamp})
                        </span>
                        <div className="flex items-center gap-2">
                          {!n.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(n.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                            title="Delete this notification?"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Action */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
              <button
                onClick={handleViewAll}
                className="w-full py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>View All Notifications</span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
