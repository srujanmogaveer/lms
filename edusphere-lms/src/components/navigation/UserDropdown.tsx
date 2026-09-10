import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { showSignOutAlert, showSuccessAlert } from '../../utils/swalAlerts';
import { Avatar } from '../common/Avatar';

export const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, rawProfile, role, logout } = useAuth();
  const navigate = useNavigate();

  const userName = currentUser?.name || rawProfile?.fullName || '';
  const userEmail = currentUser?.email || rawProfile?.email || '';
  const userAvatar = currentUser?.avatar || rawProfile?.avatarUrl || '';

  // Role-based navigation routes for My Profile & Settings
  const getProfilePath = () => {
    switch (role) {
      case 'instructor':
        return '/instructor/profile';
      case 'admin':
        return '/admin/profile';
      case 'student':
      default:
        return '/student/profile';
    }
  };

  const getSettingsPath = () => {
    switch (role) {
      case 'instructor':
        return '/instructor/settings';
      case 'admin':
        return '/admin/settings';
      case 'student':
      default:
        return '/student/settings';
    }
  };

  const handleSignOutClick = async () => {
    setIsOpen(false);
    const confirmed = await showSignOutAlert();
    if (confirmed) {
      await logout();
      await showSuccessAlert('Success!', 'Signed out successfully.');
      navigate('/auth/role-selection');
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 p-0.5 rounded-full hover:ring-2 hover:ring-brand-500 transition-all focus:outline-none"
          aria-label="User profile menu"
        >
          <Avatar
            src={userAvatar}
            name={userName}
            email={userEmail}
            role={role}
            size="md"
            className="border-2 border-slate-200 dark:border-slate-700 shadow-sm"
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 p-2 space-y-1"
              >
                {/* User Info Header: Profile Photo, Full Name, Role */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl">
                  <Avatar
                    src={userAvatar}
                    name={userName}
                    email={userEmail}
                    role={role}
                    size="lg"
                    className="border border-brand-500 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {userName || 'EduSphere User'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                      Role: <span className="font-semibold text-brand-600 dark:text-brand-400">{role}</span>
                    </p>
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div className="pt-1 space-y-0.5">
                  <Link
                    to={getProfilePath()}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors"
                  >
                    <FiUser className="w-4 h-4 text-brand-500" />
                    <span>My Profile</span>
                  </Link>

                  {role !== 'student' && (
                    <Link
                      to={getSettingsPath()}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <FiSettings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </Link>
                  )}

                  <button
                    onClick={handleSignOutClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-left transition-colors"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
