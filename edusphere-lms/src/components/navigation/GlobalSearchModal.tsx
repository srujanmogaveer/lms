import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiTrendingUp, FiClock } from 'react-icons/fi';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');

  const recentSearches = ['React 19 Hooks', 'UI/UX Design Systems', 'Machine Learning'];
  const popularSearches = ['Full-Stack Web Development', 'Python Data Science', 'Figma Prototyping', 'Cloud DevOps'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
          >
            {/* Search Bar Input */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <FiSearch className="w-5 h-5 text-brand-600 dark:text-brand-400 mr-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for courses, topics, or instructors..."
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
                autoFocus
              />
              <button
                onClick={onClose}
                aria-label="Close search modal"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions & Recent Searches */}
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  <FiClock className="w-3.5 h-3.5" /> Recent Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  <FiTrendingUp className="w-3.5 h-3.5" /> Popular Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
