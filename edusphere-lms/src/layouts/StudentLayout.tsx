import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiHeart, FiShoppingCart } from 'react-icons/fi';
import { StudentSidebar } from '../components/navigation/StudentSidebar';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { UserDropdown } from '../components/navigation/UserDropdown';
import { NotificationPanel } from '../components/navigation/NotificationPanel';
import { GlobalSearchModal } from '../components/navigation/GlobalSearchModal';
import { useNotifications } from '../contexts/NotificationContext';
import { useWishlistCart } from '../contexts/WishlistCartContext';
import { usePlatformSettings } from '../hooks/usePlatformSettings';
import { useAuth } from '../contexts/AuthContext';
import { MaintenanceModePage } from '../pages/public/MaintenanceModePage';

export const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUnreadCountByRole } = useNotifications();
  const { settings } = usePlatformSettings();
  const { currentUser } = useAuth();
  const unreadCount = getUnreadCountByRole('student');
  const { wishlistCount, cartCount } = useWishlistCart();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isWishlistActive = location.pathname.startsWith('/student/wishlist');
  const isCartActive = location.pathname.startsWith('/student/cart');

  // If maintenance mode is active and user is not an admin, render maintenance screen
  if (settings?.enableMaintenanceMode && currentUser?.role !== 'admin') {
    return <MaintenanceModePage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Open mobile menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <span
            onClick={() => navigate('/student')}
            className="font-extrabold text-lg text-brand-600 dark:text-brand-400 cursor-pointer"
          >
            EduSphere
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FiSearch className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Search courses, quizzes...</span>
          </button>

          {/* Wishlist Top Navigation Button */}
          <button
            onClick={() => navigate('/student/wishlist')}
            className={`p-2 rounded-lg relative flex items-center gap-1 transition-colors ${
              isWishlistActive
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Wishlist"
            title="Wishlist"
          >
            <FiHeart className={`w-5 h-5 ${isWishlistActive ? 'fill-rose-500 text-rose-500' : ''}`} />
            {wishlistCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Cart Top Navigation Button */}
          <button
            onClick={() => navigate('/student/cart')}
            className={`p-2 rounded-lg relative flex items-center gap-1 transition-colors ${
              isCartActive
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Shopping Cart"
            title="Shopping Cart"
          >
            <FiShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="bg-brand-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {cartCount}
              </span>
            )}
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
                <span className="bg-brand-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
          </div>

          <UserDropdown />
        </div>
      </header>

      {/* Body Area with Sidebar and Main Content */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <StudentSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>

          {/* Student Dashboard Footer */}
          <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} EduSphere LMS Student Portal v1.0. All rights reserved.</span>
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
