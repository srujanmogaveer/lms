import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiHelpCircle } from 'react-icons/fi';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { AdminSidebar } from '../components/navigation/AdminSidebar';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { UserDropdown } from '../components/navigation/UserDropdown';
import { NotificationPanel } from '../components/navigation/NotificationPanel';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { GlobalSearchModal } from '../components/navigation/GlobalSearchModal';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { preloadAdminPayments } from '../hooks/useAdminPayments';
import { contactService } from '../services/contactService';

export const AdminLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { getUnreadCountByRole } = useNotifications();
  const unreadCount = getUnreadCountByRole('admin');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Live count for new support inquiries
  const { data: newInquiriesCount = 0 } = useQuery({
    queryKey: ['admin-header-new-inquiries-count'],
    queryFn: async () => {
      try {
        const res = await contactService.getInquiries({ status: 'new', limit: 1 });
        return res?.pagination?.total || 0;
      } catch {
        return 0;
      }
    },
    enabled: currentUser?.role === 'admin',
    staleTime: 20 * 1000,
    refetchInterval: 20 * 1000,
  });

  // Preload Admin Payments data silently in the background as soon as Admin layout mounts
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      preloadAdminPayments(queryClient);
    }
  }, [currentUser?.role, queryClient]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Admin Top Navigation Header */}
      <header className="sticky top-0 z-30 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Open mobile menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-lg text-rose-600 dark:text-rose-400">EduSphere Control Panel</span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FiSearch className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Search platform users, audit logs...</span>
          </button>

          <ThemeToggle />

          {/* Top Symbol: Support Inquiries & Help (Question Mark) */}
          <button
            onClick={() => navigate('/admin/inquiries')}
            className={`p-2 rounded-lg relative flex items-center gap-1 transition-all ${
              location.pathname === '/admin/inquiries'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Help & Support Inquiries"
            aria-label="Help & Support Inquiries"
          >
            <FiHelpCircle className="w-5 h-5" />
            {newInquiriesCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {newInquiriesCount > 99 ? '99+' : newInquiriesCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative flex items-center gap-1"
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
          </div>

          <UserDropdown />
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Breadcrumb />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>

          {/* Admin Control Footer */}
          <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} EduSphere LMS Admin Control Panel v1.0. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:underline">Privacy Policy</a>
              <a href="/terms" className="hover:underline">Terms of Service</a>
            </div>
          </footer>
        </div>
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
