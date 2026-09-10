import React from 'react';
import {
  FiSearch,
  FiRotateCcw,
} from 'react-icons/fi';
import { Button } from '../ui/Button';

export interface CertificateFilterState {
  searchQuery: string;
  category: string;
  status: string; // 'all' | 'earned' | 'pending' | 'locked'
  sortBy: string; // 'newest' | 'oldest' | 'alphabetical'
}

interface CertificatesFilterBarProps {
  filters: CertificateFilterState;
  onFilterChange: (filters: CertificateFilterState) => void;
  onResetFilters: () => void;
  categories: string[];
  totalFilteredCount: number;
}

export const CertificatesFilterBar: React.FC<CertificatesFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  totalFilteredCount,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="lg:col-span-5 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search course title or certificate code (e.g. EDU-2026-9481)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-3">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All Course Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
          >
            <option value="all">Status: All</option>
            <option value="earned">Earned & Verified</option>
            <option value="pending">Pending / In Progress</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="lg:col-span-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Showing {totalFilteredCount} certificate credentials
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
