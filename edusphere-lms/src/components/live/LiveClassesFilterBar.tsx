import React from 'react';
import {
  FiSearch,
  FiRotateCcw,
  FiList,
  FiCalendar,
} from 'react-icons/fi';
import { Button } from '../ui/Button';

export interface LiveClassesFilterState {
  searchQuery: string;
  course: string;
  instructor: string;
  status: string; // 'all' | 'live_now' | 'upcoming' | 'completed'
  sortBy: string; // 'nearest' | 'newest' | 'oldest'
}

interface LiveClassesFilterBarProps {
  filters: LiveClassesFilterState;
  onFilterChange: (filters: LiveClassesFilterState) => void;
  onResetFilters: () => void;
  courses: string[];
  instructors: string[];
  totalFilteredCount: number;
  viewMode: 'list' | 'calendar';
  onSelectViewMode: (mode: 'list' | 'calendar') => void;
}

export const LiveClassesFilterBar: React.FC<LiveClassesFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  courses,
  instructors,
  totalFilteredCount,
  viewMode,
  onSelectViewMode,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.course !== 'all' ||
    filters.instructor !== 'all' ||
    filters.status !== 'all' ||
    filters.sortBy !== 'nearest';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
      {/* Top Bar: View Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => onSelectViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FiList className="w-4 h-4" />
            <span>List Schedule</span>
          </button>

          <button
            onClick={() => onSelectViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FiCalendar className="w-4 h-4" />
            <span>Interactive Calendar</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} Live Calendar
        </span>
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="lg:col-span-4 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search class title, instructor, or topic..."
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
            <option value="all">All Enrolled Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Instructor Filter */}
        <div className="lg:col-span-2">
          <select
            value={filters.instructor}
            onChange={(e) => onFilterChange({ ...filters, instructor: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All Instructors</option>
            {instructors.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-1.5">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-2 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">Status: All</option>
            <option value="live_now">Live Streaming Now</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="lg:col-span-1.5">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-2 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
          >
            <option value="nearest">Nearest First</option>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Showing {totalFilteredCount} live class sessions
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
