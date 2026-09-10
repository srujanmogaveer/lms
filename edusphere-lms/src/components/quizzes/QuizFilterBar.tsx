import React from 'react';
import {
  FiSearch,
  FiFilter,
  FiRotateCcw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';

export interface QuizFilterState {
  searchQuery: string;
  course: string;
  status: string; // 'all' | 'available' | 'in_progress' | 'completed' | 'passed' | 'failed'
  difficulty: string; // 'all' | 'Beginner' | 'Intermediate' | 'Advanced'
  sortBy: string; // 'newest' | 'oldest' | 'alphabetical'
}

interface QuizFilterBarProps {
  filters: QuizFilterState;
  onFilterChange: (filters: QuizFilterState) => void;
  onResetFilters: () => void;
  courses: string[];
  totalFilteredCount: number;
}

export const QuizFilterBar: React.FC<QuizFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  courses,
  totalFilteredCount,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.course !== 'all' ||
    filters.status !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
      {/* Search & Main Filter Selects */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search quiz title or course..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Course Filter */}
        <div className="md:col-span-3">
          <select
            value={filters.course}
            onChange={(e) => onFilterChange({ ...filters, course: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-2">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="md:col-span-3">
          <select
            value={filters.difficulty}
            onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner Level</option>
            <option value="Intermediate">Intermediate Level</option>
            <option value="Advanced">Advanced Level</option>
          </select>
        </div>
      </div>

      {/* Secondary Bar & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <FiFilter className="w-3.5 h-3.5 text-brand-500" /> Sort By:
          </span>

          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="due_date">Due Date</option>
            <option value="alphabetical">Alphabetical A-Z</option>
            <option value="oldest">Oldest First</option>
          </select>

          <span className="text-slate-400">|</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Showing {totalFilteredCount} quizzes
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
