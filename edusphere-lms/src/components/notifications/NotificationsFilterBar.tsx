import React from 'react';
import {
  FiSearch,
  FiRotateCcw,
  FiFilter,
} from 'react-icons/fi';
import { Button } from '../ui/Button';

export interface NotificationFilterState {
  searchQuery: string;
  category: string; // 'all' | 'unread' | 'read' | 'important' | 'assignment' | 'quiz' | 'announcement' | 'live_class' | 'certificate' | 'payment'
  sortBy: string; // 'newest' | 'oldest' | 'importance'
}

interface NotificationsFilterBarProps {
  filters: NotificationFilterState;
  onFilterChange: (filters: NotificationFilterState) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export const NotificationsFilterBar: React.FC<NotificationsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredCount,
}) => {
  const categories = [
    { id: 'all', label: 'All Alerts' },
    { id: 'unread', label: 'Unread Only' },
    { id: 'important', label: 'Important Flagged' },
    { id: 'assignment', label: 'Assignments' },
    { id: 'quiz', label: 'Quizzes' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'live_class', label: 'Live Classes' },
    { id: 'certificate', label: 'Certificates' },
    { id: 'payment', label: 'Payments' },
  ];

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.category !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
      {/* Top Search & Sort Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="lg:col-span-9 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search notification title, course name, or keywords..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="lg:col-span-3">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="importance">Sort: High Importance</option>
          </select>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <FiFilter className="w-3 h-3" /> Filters:
        </span>
        {categories.map((cat) => {
          const isActive = filters.category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onFilterChange({ ...filters, category: cat.id })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Showing {totalFilteredCount} notification alerts
        </span>

        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 py-1"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>
    </div>
  );
};
