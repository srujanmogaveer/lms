import React from 'react';
import {
  FiSearch,
  FiRotateCcw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { announcementTypes } from '../../data/announcementsData';

export interface AnnouncementFilterState {
  searchQuery: string;
  course: string;
  type: string;
  readStatus: string; // 'all' | 'unread' | 'read'
  dateFilter: string; // 'all' | 'this_week' | 'this_month'
  sortBy: string; // 'newest' | 'oldest' | 'important'
}

interface AnnouncementsFilterBarProps {
  filters: AnnouncementFilterState;
  onFilterChange: (filters: AnnouncementFilterState) => void;
  onResetFilters: () => void;
  courses: string[];
  totalFilteredCount: number;
}

export const AnnouncementsFilterBar: React.FC<AnnouncementsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  courses,
  totalFilteredCount,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.course !== 'all' ||
    filters.type !== 'all' ||
    filters.readStatus !== 'all' ||
    filters.dateFilter !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="lg:col-span-4 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search announcement title or course..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Course Filter */}
        <div className="lg:col-span-3">
          <select
            value={filters.course}
            onChange={(e) => onFilterChange({ ...filters, course: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All Channels & Courses</option>
            <option value="System Announcement">System Announcements</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="lg:col-span-2">
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            {announcementTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Read Status Filter */}
        <div className="lg:col-span-1.5">
          <select
            value={filters.readStatus}
            onChange={(e) => onFilterChange({ ...filters, readStatus: e.target.value })}
            className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">Status: All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="lg:col-span-1.5">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="important">Important First</option>
          </select>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Showing {totalFilteredCount} announcements
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
