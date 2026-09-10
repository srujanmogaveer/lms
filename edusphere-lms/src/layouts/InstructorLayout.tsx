import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell } from 'react-icons/fi';
import { InstructorSidebar } from '../components/navigation/InstructorSidebar';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { UserDropdown } from '../components/navigation/UserDropdown';
import { NotificationPanel } from '../components/navigation/NotificationPanel';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { GlobalSearchModal } from '../components/navigation/GlobalSearchModal';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlatformSettings } from '../hooks/usePlatformSettings';
import { useAuth } from '../contexts/AuthContext';
import { MaintenanceModePage } from '../pages/public/MaintenanceModePage';

export const InstructorLayout: React.FC = () => {
  const { getUnreadCountByRole } = useNotifications();
  const { settings } = usePlatformSettings();
  const { currentUser } = useAuth();
  const unreadCount = getUnreadCountByRole('instructor');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // If maintenance mode is active and user is not an admin, render maintenance screen
  if (settings?.enableMaintenanceMode && currentUser?.role !== 'admin') {
    return <MaintenanceModePage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Instructor Top Navigation Header */}
      <header className="sticky top-0 z-30 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Open mobile menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-lg text-brand-600 dark:text-brand-400">EduSphere Studio</span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FiSearch className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Search courses, students...</span>
          </button>

          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative flex items-center gap-1"
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
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
        <InstructorSidebar
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

          {/* Instructor Studio Footer */}
          <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} EduSphere LMS Instructor Studio v1.0. All rights reserved.</span>
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
