import React from 'react';
import {
  FiSearch,
  FiX,
  FiGrid,
  FiList,
  FiTrash2,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface WishlistFilterState {
  searchQuery: string;
  category: string;
  instructor: string;
  difficulty: string;
  priceRange: string;
  minRating: string;
  sortBy: 'newest' | 'alphabetical' | 'highest_rated' | 'lowest_price' | 'highest_price';
}

interface WishlistFilterBarProps {
  filters: WishlistFilterState;
  onFilterChange: (newFilters: WishlistFilterState) => void;
  onResetFilters: () => void;
  categories: string[];
  instructors: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalFilteredCount: number;
}

export const WishlistFilterBar: React.FC<WishlistFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  instructors,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.category !== 'all' ||
    filters.instructor !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.minRating !== 'all';

  return (
    <Card className="p-5 space-y-4">
      {/* Primary Row: Search Input, View Mode & Sort Dropdown */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, instructor, category..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle & Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              aria-label="List view"
              title="List view"
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Sort By:</span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  sortBy: e.target.value as WishlistFilterState['sortBy'],
                })
              }
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="newest">Newest Added</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="lowest_price">Lowest Price</option>
              <option value="highest_price">Highest Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Secondary Row: Granular Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Category Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Instructor Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Instructor</label>
          <select
            value={filters.instructor}
            onChange={(e) => onFilterChange({ ...filters, instructor: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">All Instructors</option>
            {instructors.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Difficulty</label>
          <select
            value={filters.difficulty}
            onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Price Range</label>
          <select
            value={filters.priceRange}
            onChange={(e) => onFilterChange({ ...filters, priceRange: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">All Prices</option>
            <option value="under_50">Under $50</option>
            <option value="50_to_80">$50 - $80</option>
            <option value="over_80">$80+</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Min Rating</label>
          <select
            value={filters.minRating}
            onChange={(e) => onFilterChange({ ...filters, minRating: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">Any Rating</option>
            <option value="4.5">⭐ 4.5 & above</option>
            <option value="4.8">⭐ 4.8 & above</option>
          </select>
        </div>
      </div>

      {/* Active Filter Badges & Clear Button */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500">Active Filters ({totalFilteredCount} matching):</span>

            {filters.searchQuery && (
              <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-medium flex items-center gap-1">
                Search: "{filters.searchQuery}"
                <FiX
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                />
              </span>
            )}

            {filters.category !== 'all' && (
              <span className="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900 font-medium flex items-center gap-1">
                Category: {filters.category}
                <FiX
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => onFilterChange({ ...filters, category: 'all' })}
                />
              </span>
            )}

            {filters.instructor !== 'all' && (
              <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 font-medium flex items-center gap-1">
                Instructor: {filters.instructor}
                <FiX
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => onFilterChange({ ...filters, instructor: 'all' })}
                />
              </span>
            )}

            {filters.difficulty !== 'all' && (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-medium flex items-center gap-1">
                Level: {filters.difficulty}
                <FiX
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => onFilterChange({ ...filters, difficulty: 'all' })}
                />
              </span>
            )}
          </div>

          <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-400" onClick={onResetFilters}>
            <FiTrash2 className="w-3.5 h-3.5 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}
    </Card>
  );
};
