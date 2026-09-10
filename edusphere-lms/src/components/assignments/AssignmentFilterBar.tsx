import React from 'react';
import {
  FiSearch,
  FiRotateCcw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';

export interface AssignmentFilterState {
  searchQuery: string;
  course: string;
  status: string; // 'all' | 'pending' | 'submitted' | 'under_review' | 'graded'
  sortBy: string; // 'newest' | 'oldest' | 'alphabetical'
}

interface AssignmentFilterBarProps {
  filters: AssignmentFilterState;
  onFilterChange: (filters: AssignmentFilterState) => void;
  onResetFilters: () => void;
  courses: string[];
  totalFilteredCount: number;
}

export const AssignmentFilterBar: React.FC<AssignmentFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  courses,
  totalFilteredCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, course: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value });
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.course !== 'all' ||
    filters.status !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by assignment title, course, or instructions..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Select Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Course Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Course
          </label>
          <select
            value={filters.course}
            onChange={handleCourseChange}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Enrolled Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Submission Status
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="graded">Graded</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={handleSortChange}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
          >
            <option value="newest">Sort: Newest</option>
            <option value="due_date">Sort: Due Date</option>
            <option value="alphabetical">Sort: A - Z</option>
            <option value="oldest">Sort: Oldest</option>
          </select>
        </div>
      </div>

      {/* Secondary Filter Badges Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Showing {totalFilteredCount} self-paced assignments
          </span>
        </div>

        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 py-1"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </Button>
        )}
      </div>
    </div>
  );
};
