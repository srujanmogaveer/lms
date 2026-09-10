import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiBook, 
  FiFileText, 
  FiCheckSquare, 
  FiAward, 
  FiUser, 
  FiSettings,
  FiPlusCircle,
  FiUsers,
  FiBarChart2,
  FiDollarSign,
  FiLayers,
  FiCreditCard,
  FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { resetScrollToTop } from './ScrollToTop';
import { showConfirmAlert } from '../../utils/swalAlerts';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
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

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: FiHome },
    { to: '/student/courses', label: 'My Courses', icon: FiBook },
    { to: '/student/assignments', label: 'Assignments', icon: FiFileText },
    { to: '/student/quizzes', label: 'Quizzes', icon: FiCheckSquare },
    { to: '/student/certificates', label: 'Certificates', icon: FiAward },
    { to: '/student/payments', label: 'Payment History', icon: FiCreditCard },
    { to: '/student/profile', label: 'Profile', icon: FiUser },
    { to: '/student/settings', label: 'Settings', icon: FiSettings },
  ];

  const instructorLinks = [
    { to: '/instructor', label: 'Overview', icon: FiHome },
    { to: '/instructor/courses', label: 'Manage Courses', icon: FiBook },
    { to: '/instructor/courses/new', label: 'Create Course', icon: FiPlusCircle },
    { to: '/instructor/gradebook', label: 'Gradebook', icon: FiFileText },
    { to: '/instructor/analytics', label: 'Performance', icon: FiBarChart2 },
    { to: '/instructor/students', label: 'Students', icon: FiUsers },
  ];

  const adminLinks = [
    { to: '/admin', label: 'System Overview', icon: FiHome },
    { to: '/admin/users', label: 'Manage Users', icon: FiUsers },
    { to: '/admin/categories', label: 'Categories', icon: FiLayers },
    { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
    { to: '/admin/payments', label: 'Payments', icon: FiDollarSign },
    { to: '/admin/settings', label: 'System Settings', icon: FiSettings },
  ];

  const links = role === 'student' ? studentLinks : role === 'instructor' ? instructorLinks : adminLinks;

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {role} Workspace
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === `/${role}`}
              onClick={resetScrollToTop}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>

        <div className="p-3 bg-brand-50 dark:bg-slate-800/60 rounded-xl border border-brand-100 dark:border-slate-700/50">
          <p className="text-xs font-semibold text-brand-900 dark:text-brand-200">EduSphere Pro v1.0</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Enterprise LMS Architecture</p>
        </div>
      </div>
    </aside>
  );
};
