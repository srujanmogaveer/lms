import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiSearch, FiUser } from 'react-icons/fi';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { role, setRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400">
          <FiBookOpen className="w-7 h-7" />
          <span>EduSphere<span className="text-slate-900 dark:text-slate-100 font-normal">LMS</span></span>
        </Link>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <FiSearch className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses, instructors, subjects..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Home</Link>
          <Link to="/courses" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Courses</Link>
          <Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</Link>
        </nav>

        {/* Actions & Role Switcher Mock */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Quick Role Switcher for Phase 1 Demo */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="student">Role: Student</option>
            <option value="instructor">Role: Instructor</option>
            <option value="admin">Role: Admin</option>
          </select>

          <Link
            to={`/${role}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <FiUser className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
