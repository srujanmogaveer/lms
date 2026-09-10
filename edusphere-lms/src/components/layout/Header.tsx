import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBookOpen, FiSearch, FiMenu, FiX, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../common/ThemeToggle';
import { GlobalSearchModal } from '../navigation/GlobalSearchModal';

export const Header: React.FC = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Courses', path: '/courses' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#ebf0f7]/85 dark:bg-slate-900/80 border-b border-slate-200/90 dark:border-slate-800 transition-colors">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400">
            <FiBookOpen className="w-7 h-7" />
            <span>EduSphere<span className="text-slate-900 dark:text-slate-100 font-normal">LMS</span></span>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors relative py-1 ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            <ThemeToggle />

            {/* Single Auth Entry Button */}
            <Link
              to="/auth/role-selection"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
            >
              <FiUser className="w-4 h-4" />
              <span>Sign In</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              aria-label="Toggle navigation drawer"
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {isMobileDrawerOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between z-10"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-lg text-brand-600 dark:text-brand-400">EduSphere</span>
                  <button onClick={() => setIsMobileDrawerOpen(false)} className="p-1 text-slate-400">
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <nav className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        location.pathname === link.path
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <Link
                  to="/auth/role-selection"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm"
                >
                  <FiUser className="w-4 h-4" /> Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Search Modal Trigger */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
