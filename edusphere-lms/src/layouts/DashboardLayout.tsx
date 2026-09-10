import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { FiChevronRight, FiBell, FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

import { NotificationPanel } from '../components/navigation/NotificationPanel';
import { useNotifications } from '../contexts/NotificationContext';
import { showConfirmAlert } from '../utils/swalAlerts';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();
  const { getUnreadCountByRole } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const unreadCount = getUnreadCountByRole(role);

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    const confirmed = await showConfirmAlert(
      'Sign Out?',
      'Are you sure you want to sign out of EduSphere LMS?',
      'Sign Out',
      'Cancel',
      'warning'
    );
    if (confirmed) {
      logout();
      navigate('/auth/role-selection');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Dashboard Header Bar with Breadcrumb and Notifications */}
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between gap-4">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 capitalize">
              <Link to="/" className="hover:text-brand-600">Home</Link>
              {pathSegments.map((segment, index) => {
                const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                return (
                  <React.Fragment key={url}>
                    <FiChevronRight className="w-3 h-3 text-slate-400" />
                    {isLast ? (
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{segment}</span>
                    ) : (
                      <Link to={url} className="hover:text-brand-600">{segment}</Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  aria-label="View notifications"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative flex items-center gap-1"
                >
                  <FiBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="bg-brand-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
              </div>

              {/* Profile Dropdown Menu */}
              {currentUser && (
                <div className="relative border-l border-slate-200 dark:border-slate-800 pl-2">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-colors"
                  >
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border border-brand-500" />
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{role}</p>
                    </div>
                    <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>

                      <Link
                        to={`/${role}/profile`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FiUser className="w-4 h-4 text-brand-500" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to={`/${role}/settings`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FiSettings className="w-4 h-4 text-slate-500" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
