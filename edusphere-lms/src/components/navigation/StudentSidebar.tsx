import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiBook, 
  FiFileText, 
  FiCheckSquare, 
  FiMessageSquare, 
  FiMessageCircle, 
  FiVolume2, 
  FiVideo, 
  FiAward, 
  FiCreditCard,
  FiBell, 
  FiUser, 
  FiChevronLeft, 
  FiChevronRight, 
  FiLogOut 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { resetScrollToTop } from '../common/ScrollToTop';
import { SignOutConfirmModal } from './SignOutConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useChatUnreadCount } from '../../hooks/useChatUnreadCount';

interface StudentSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const chatUnreadCount = useChatUnreadCount();

  const handleConfirmSignOut = async () => {
    await logout();
    setIsSignOutOpen(false);
    onCloseMobile();
    navigate('/auth/role-selection');
  };

  const studentNavItems = [
    { to: '/student', label: 'Dashboard', icon: FiHome },
    { to: '/student/browse', label: 'Browse Courses', icon: FiBook },
    { to: '/student/courses', label: 'My Courses', icon: FiBook },
    { to: '/student/assignments', label: 'Assignments', icon: FiFileText },
    { to: '/student/quizzes', label: 'Quizzes', icon: FiCheckSquare },
    { to: '/student/forum', label: 'Discussion Forum', icon: FiMessageSquare },
    { to: '/student/chat', label: 'Chat', icon: FiMessageCircle, badge: chatUnreadCount },
    { to: '/student/announcements', label: 'Announcements', icon: FiVolume2 },
    { to: '/student/live', label: 'Live Classes', icon: FiVideo },
    { to: '/student/certificates', label: 'Certificates', icon: FiAward },
    { to: '/student/payments', label: 'Payment History', icon: FiCreditCard },
    { to: '/student/notifications', label: 'Notifications', icon: FiBell },
    { to: '/student/profile', label: 'My Profile', icon: FiUser },
  ];

  const sidebarContent = (
    <aside
      className={`h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Top Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <span className="font-extrabold text-lg text-brand-600 dark:text-brand-400 tracking-tight">
            EduSphere<span className="text-slate-800 dark:text-slate-200 font-normal">Student</span>
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle sidebar collapse"
        >
          {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const hasBadge = Boolean(item.badge && item.badge > 0);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/student'}
              onClick={() => {
                resetScrollToTop();
                onCloseMobile();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {isCollapsed && hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-600 ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {hasBadge && (
                    <span className="ml-1.5 px-2 py-0.5 text-[10px] font-extrabold bg-brand-600 dark:bg-brand-500 text-white rounded-full shrink-0 shadow-xs">
                      {item.badge! > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Sidebar Footer with Sign Out Button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsSignOutOpen(true)}
          className={`w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-900 border border-transparent transition-all shadow-2xs ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          aria-label="Sign Out"
          title="Sign Out"
        >
          <FiLogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </motion.button>

        {!isCollapsed && (
          <p className="text-[10px] text-slate-400 text-center font-medium">EduSphere Student v1.0</p>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={onCloseMobile}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 z-10 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SignOutConfirmModal
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </>
  );
};
