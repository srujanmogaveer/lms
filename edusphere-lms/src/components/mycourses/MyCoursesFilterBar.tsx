import React from 'react';
import { FiSearch, FiX, FiTrash2 } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface MyCoursesFilterState {
  searchQuery: string;
  category: string;
  instructor: string;
  status: string;
  difficulty: string;
  sortBy: 'newest' | 'recently_accessed' | 'alphabetical' | 'progress';
}

interface MyCoursesFilterBarProps {
  filters: MyCoursesFilterState;
  onFilterChange: (newFilters: MyCoursesFilterState) => void;
  onResetFilters: () => void;
  activeTab: 'all' | 'in_progress' | 'completed' | 'recently_accessed';
  onTabChange: (tab: 'all' | 'in_progress' | 'completed' | 'recently_accessed') => void;
  categories: string[];
  instructors: string[];
  totalFilteredCount: number;
}

export const MyCoursesFilterBar: React.FC<MyCoursesFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  activeTab,
  onTabChange,
  categories,
  instructors,
  totalFilteredCount,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.category !== 'all' ||
    filters.instructor !== 'all' ||
    filters.status !== 'all' ||
    filters.difficulty !== 'all';

  return (
    <Card className="p-5 space-y-4">
      {/* Course Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'all' as const, label: 'All Courses' },
            { id: 'in_progress' as const, label: 'In Progress' },
            { id: 'completed' as const, label: 'Completed' },
            { id: 'recently_accessed' as const, label: 'Recently Accessed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 min-w-max shrink-0">
          <span className="text-xs font-semibold text-slate-500">Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as MyCoursesFilterState['sortBy'],
              })
            }
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="newest">Newest Enrolled</option>
            <option value="recently_accessed">Recently Accessed</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
            <option value="progress">Highest Progress</option>
          </select>
        </div>
      </div>

      {/* Primary Search & Filter Dropdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search enrolled course title, instructor..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Instructor Filter */}
        <select
          value={filters.instructor}
          onChange={(e) => onFilterChange({ ...filters, instructor: e.target.value })}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          <option value="all">All Instructors</option>
          {instructors.map((ins) => (
            <option key={ins} value={ins}>
              {ins}
            </option>
          ))}
        </select>

        {/* Completion Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500">Matching ({totalFilteredCount}):</span>
            {filters.searchQuery && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 font-medium flex items-center gap-1">
                "{filters.searchQuery}"
                <FiX className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange({ ...filters, searchQuery: '' })} />
              </span>
            )}
            {filters.category !== 'all' && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 font-medium flex items-center gap-1">
                {filters.category}
                <FiX className="w-3 h-3 cursor-pointer" onClick={() => onFilterChange({ ...filters, category: 'all' })} />
              </span>
            )}
          </div>
          <Button size="sm" variant="ghost" className="text-rose-600" onClick={onResetFilters}>
            <FiTrash2 className="w-3.5 h-3.5 mr-1" /> Reset Filters
          </Button>
        </div>
      )}
    </Card>
  );
};
