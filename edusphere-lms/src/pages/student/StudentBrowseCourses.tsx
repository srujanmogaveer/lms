import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiShoppingCart,
  FiAward,
  FiRotateCcw,
  FiCheck,
  FiStar,
  FiLayers,
  FiBarChart2,
  FiSliders,
  FiChevronDown,
} from 'react-icons/fi';

import { CourseCard } from '../../components/cards/CourseCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import { enrollmentService } from '../../services/enrollmentService';
import { wishlistService } from '../../services/wishlistService';
import { formatCourseDuration } from '../../utils/formatters';
import { cartService } from '../../services/cartService';
import { showSuccessAlert, showErrorAlert } from '../../utils/swalAlerts';
import { useWishlistCart } from '../../contexts/WishlistCartContext';
import type { Course } from '../../types';

const ITEMS_PER_PAGE = 6;

export const StudentBrowseCourses: React.FC = () => {
  const navigate = useNavigate();

  // Dynamic Course & Category Lists
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledCourseIdSet, setEnrolledCourseIdSet] = useState<Set<string>>(new Set());

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [quickFilter, setQuickFilter] = useState<'all' | 'free' | 'paid' | 'featured' | 'my_courses'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Load from Backend API on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        const [courseRes, catRes, enrRes, wishRes, cartRes] = await Promise.all([
          courseService.getPublicCourses(),
          categoryService.getCategories(true),
          enrollmentService.getStudentEnrollments(true).catch(() => ({ success: false, data: [] })),
          wishlistService.getWishlist().catch(() => ({ success: false, data: [] })),
          cartService.getCart().catch(() => ({ success: false, data: [] })),
        ]);

        if (courseRes.success && Array.isArray(courseRes.data)) {
          setCoursesList(courseRes.data);
        } else {
          setCoursesList([]);
        }

        if (catRes.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
          setCategories(['All', ...catRes.data.map((c) => c.name)]);
        }

        if (enrRes.success && Array.isArray(enrRes.data)) {
          const ids = new Set(enrRes.data.map((e) => e.courseId));
          setEnrolledCourseIdSet(ids);
        }

        if (wishRes.success && Array.isArray(wishRes.data)) {
          const ids = new Set(
            wishRes.data
              .map((item) => item.course?.id || item.courseId)
              .filter((id): id is string => Boolean(id))
          );
          setWishlistCourseIds(ids);
        }

        if (cartRes.success && Array.isArray(cartRes.data)) {
          const ids = new Set(
            cartRes.data
              .map((item) => item.course?.id || item.courseId)
              .filter((id): id is string => Boolean(id))
          );
          setCartCourseIds(ids);
        }
      } catch {
        setCoursesList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Student State
  const [wishlistCourseIds, setWishlistCourseIds] = useState<Set<string>>(new Set());
  const [cartCourseIds, setCartCourseIds] = useState<Set<string>>(new Set());

  // Modal Control States
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ title: string; body: string } | null>(null);

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const getEnrollmentStatus = (courseId: string): 'not_enrolled' | 'enrolled' | 'completed' => {
    if (enrolledCourseIdSet.has(courseId)) return 'enrolled';
    return 'not_enrolled';
  };

  // Filter & Sort Logic
  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      // 1. Search query
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        course.title.toLowerCase().includes(q) ||
        (course.description || '').toLowerCase().includes(q) ||
        (course.instructorName || '').toLowerCase().includes(q) ||
        (course.category || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Category
      if (selectedCategory !== 'All' && course.category !== selectedCategory) return false;

      // 3. Level
      if (selectedLevel !== 'All' && course.level !== selectedLevel) return false;

      // 4. Rating
      if (selectedRating > 0 && course.rating < selectedRating) return false;

      // 5. Student Quick Filter Chips
      const currentPrice = course.discountPrice || course.price;
      const status = getEnrollmentStatus(course.id);

      if (quickFilter === 'free' && currentPrice > 0) return false;
      if (quickFilter === 'paid' && currentPrice === 0) return false;
      if (quickFilter === 'featured' && !course.isFeatured) return false;
      if (quickFilter === 'my_courses' && status === 'not_enrolled') return false;

      return true;
    }).sort((a, b) => {
      const aEnrolled = enrolledCourseIdSet.has(a.id);
      const bEnrolled = enrolledCourseIdSet.has(b.id);

      // Prioritize unpurchased courses at the top, purchased courses below
      if (!aEnrolled && bEnrolled) return -1;
      if (aEnrolled && !bEnrolled) return 1;

      // Within the same group, sort by user's selected criteria
      if (sortBy === 'popular') return b.studentsEnrolled - a.studentsEnrolled;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      if (sortBy === 'price-high') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });
  }, [coursesList, enrolledCourseIdSet, searchTerm, selectedCategory, selectedLevel, selectedRating, sortBy, quickFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedRating(0);
    setQuickFilter('all');
    setSortBy('popular');
    setCurrentPage(1);
  };

  // Active filter count for badge indicator
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedLevel !== 'All') count++;
    if (selectedRating > 0) count++;
    return count;
  }, [selectedCategory, selectedLevel, selectedRating]);

  // Reusable Filter Options Content
  const renderFilterOptions = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FiLayers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Category
          </label>
          {selectedCategory !== 'All' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60">
              Active
            </span>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left ${
                  isSelected
                    ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200/80 dark:border-brand-800/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className="truncate pr-2">{cat}</span>
                {isSelected && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white shrink-0">
                    <FiCheck className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Level Filter */}
      <div className="space-y-2.5 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FiBarChart2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Difficulty Level
          </label>
          {selectedLevel !== 'All' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60">
              Active
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedLevel(lvl);
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left ${
                  isSelected
                    ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200/80 dark:border-brand-800/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>{lvl}</span>
                {isSelected && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white shrink-0">
                    <FiCheck className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2.5 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Minimum Rating
          </label>
          {selectedRating > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              Active
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {[4.5, 4.0, 3.5, 3.0].map((stars) => {
            const isSelected = selectedRating === stars;
            return (
              <button
                key={stars}
                onClick={() => {
                  setSelectedRating(isSelected ? 0 : stars);
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/80 dark:border-amber-800/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center text-amber-400">
                    <FiStar className="w-3.5 h-3.5 fill-current" />
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{stars}</span>
                  <span className="text-slate-400 text-[11px] font-normal">& above</span>
                </span>
                {isSelected && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white shrink-0">
                    <FiCheck className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const { refreshWishlist, refreshCart } = useWishlistCart();

  // Student Actions: Wishlist & Cart Toggles (connected to real backend)
  const handleWishlistToggle = async (course: Course) => {
    if (wishlistCourseIds.has(course.id)) {
      try {
        const res = await wishlistService.removeFromWishlist(course.id);
        if (res.success) {
          setWishlistCourseIds((prev) => {
            const next = new Set(prev);
            next.delete(course.id);
            return next;
          });
          await refreshWishlist();
          showSuccessAlert(
            'Removed from Wishlist',
            'Course has been removed from your wishlist.'
          );
        } else {
          showErrorAlert('Failed', res.message || 'Unable to update wishlist. Please try again.');
        }
      } catch (e: any) {
        showErrorAlert('Failed', e?.message || 'Unable to update wishlist. Please try again.');
      }
    } else {
      try {
        const res = await wishlistService.addToWishlist(course.id);
        if (res.success) {
          setWishlistCourseIds((prev) => new Set(prev).add(course.id));
          await refreshWishlist();
          showSuccessAlert(
            'Added to Wishlist',
            'Course has been added to your wishlist.'
          );
        } else {
          showErrorAlert('Failed', res.message || 'Unable to update wishlist. Please try again.');
        }
      } catch (e: any) {
        showErrorAlert('Failed', e?.message || 'Unable to update wishlist. Please try again.');
      }
    }
  };

  const handleCartToggle = async (course: Course) => {
    if (cartCourseIds.has(course.id)) {
      navigate('/student/cart');
    } else {
      try {
        const res = await cartService.addToCart(course.id);
        if (res.success) {
          setCartCourseIds((prev) => new Set(prev).add(course.id));
          await refreshCart();
          showSuccessAlert(
            'Added to Cart',
            'Course has been added to your shopping cart.'
          );
        } else {
          showErrorAlert('Failed', res.message || 'Unable to update cart. Please try again.');
        }
      } catch (e: any) {
        showErrorAlert('Failed', e?.message || 'Unable to update cart. Please try again.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* 1. Header & Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
              Explore Masterclasses
            </Badge>
            <span className="text-xs text-brand-100 font-medium">
              Over 500+ Verified Technology Courses
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Browse & Discover Courses
          </h1>
          <p className="text-brand-100 text-xs sm:text-sm font-medium max-w-2xl">
            Upgrade your skillsets in Full-Stack Development, UI/UX Systems, Machine Learning, and Enterprise Cloud Security.
          </p>
        </div>
      </div>

      {/* 3. Search & Student Quick Filter Chips */}
      <div className="space-y-4">
        <div className="relative max-w-2xl mx-auto">
          <FiSearch className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search course titles, instructors, or key skills..."
            className="w-full pl-12 pr-10 py-3 text-sm rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Student Quick Filters & Sort Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'my_courses', label: 'My Enrolled Courses' },
              { id: 'featured', label: 'Featured' },
              { id: 'free', label: 'Free' },
              { id: 'paid', label: 'Paid' },
            ].map((chip) => {
              const isActive = quickFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setQuickFilter(chip.id as typeof quickFilter);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 justify-between md:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
            >
              <FiSliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 ml-auto md:ml-0">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort by:</span>
              <div className="relative inline-block">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest Releases</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal / Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-100 dark:border-brand-900/60">
                  <FiSliders className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Filter Options
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600 text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close filters"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filter Scrollable Body */}
            <div className="p-5 overflow-y-auto">
              {renderFilterOptions()}
            </div>

            {/* Mobile Footer Buttons */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex-1 text-xs font-semibold py-2.5 rounded-xl border-slate-200 dark:border-slate-800"
              >
                <FiRotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset All
              </Button>
              <Button
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
              >
                Apply Filters ({filteredCourses.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Courses Grid & Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-100 dark:border-brand-900/60">
                <FiSliders className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Filter Options
              </h3>
              {activeFiltersCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600 text-white">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors group"
              title="Reset all filters"
            >
              <FiRotateCcw className="w-3 h-3 group-hover:-rotate-45 transition-transform" />
              <span>Reset All</span>
            </button>
          </div>

          {renderFilterOptions()}
        </aside>

        {/* Courses Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonLoader key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCourses.map((course: Course) => {
                  const status = getEnrollmentStatus(course.id);

                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      mode="student"
                      enrollmentStatus={status}
                      isInWishlist={wishlistCourseIds.has(course.id)}
                      isInCart={cartCourseIds.has(course.id)}
                      onSelect={() => setPreviewCourse(course)}
                      onWishlistToggle={handleWishlistToggle}
                      onCartToggle={handleCartToggle}
                      onContinueLearning={() => navigate(`/student/courses/${course.slug}`)}
                      onViewCertificate={() => setCertificateCourse(course)}
                      onPreviewModal={() => setPreviewCourse(course)}
                    />
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {paginatedCourses.length} of {filteredCourses.length} courses (Page {currentPage} of {totalPages || 1})
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <FiChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {[...Array(totalPages || 1)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold ${
                          currentPage === i + 1
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages <= 1}
                  >
                    Next <FiChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              type="courses"
              title="No courses available."
              description="We couldn't find any courses matching your search keyword or active filter criteria."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          )}
        </div>
      </div>

      {/* 5. Featured / Popular Courses Carousel Section */}
      {coursesList.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FiClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Featured Courses
              </h2>
              <p className="text-xs text-slate-500">Explore top courses curated by our leading instructors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {coursesList.slice(0, 3).map((course: Course) => (
              <CourseCard
                key={`rv-${course.id}`}
                course={course}
                mode="student"
                enrollmentStatus={getEnrollmentStatus(course.id)}
                isInWishlist={wishlistCourseIds.has(course.id)}
                isInCart={cartCourseIds.has(course.id)}
                onSelect={() => setPreviewCourse(course)}
                onWishlistToggle={handleWishlistToggle}
                onCartToggle={handleCartToggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Interactive Course Details Preview Modal */}
      <BaseModal
        isOpen={!!previewCourse}
        onClose={() => setPreviewCourse(null)}
        title={previewCourse?.title || 'Course Details Preview'}
      >
        {previewCourse && (
          <div className="space-y-4">
            <img
              src={previewCourse.thumbnail}
              alt={previewCourse.title}
              className="w-full h-48 rounded-2xl object-cover"
            />
            <div className="flex justify-between items-center text-xs">
              <Badge variant="primary">{previewCourse.category}</Badge>
              <span className="text-slate-500 font-semibold">{previewCourse.level}</span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {previewCourse.description}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Instructor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewCourse.instructorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rating:</span>
                <span className="font-bold text-amber-500">⭐ {previewCourse.rating} ({previewCourse.reviewsCount} reviews)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration & Lessons:</span>
                <span className="font-bold">{formatCourseDuration(previewCourse.durationHours)} ({previewCourse.lessonsCount} lessons)</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Course Price:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100 font-mono">
                    ₹{(previewCourse.discountPrice || previewCourse.price).toLocaleString('en-IN')}
                  </span>
                  {previewCourse.discountPrice && previewCourse.discountPrice < previewCourse.price && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ₹{previewCourse.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => navigate(`/student/courses/${previewCourse.slug}`)}>
                Full Course Page
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  handleCartToggle(previewCourse);
                  setPreviewCourse(null);
                }}
              >
                <FiShoppingCart className="w-4 h-4 mr-1.5" />
                Add to Cart
              </Button>
            </div>
          </div>
        )}
      </BaseModal>

      {/* Certificate Viewer Modal */}
      <BaseModal
        isOpen={!!certificateCourse}
        onClose={() => setCertificateCourse(null)}
        title="Student Certificate of Completion"
      >
        {certificateCourse && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <FiAward className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <Badge variant="success">Verified Credential</Badge>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                Certificate of Masterclass Completion
              </h4>
              <p className="text-xs text-slate-500">
                Awarded to Alex Johnson for successfully passing "{certificateCourse.title}".
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span>Certificate Code:</span>
                <span className="font-mono font-bold text-purple-600">EDU-2026-8849-UX</span>
              </div>
              <div className="flex justify-between">
                <span>Issue Date:</span>
                <span className="font-medium">June 20, 2026</span>
              </div>
            </div>

            <Button variant="primary" size="md" className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setCertificateCourse(null)}>
              Download PDF Certificate
            </Button>
          </div>
        )}
      </BaseModal>

      {/* General Notification Modal */}
      <BaseModal
        isOpen={!!noticeMessage}
        onClose={() => setNoticeMessage(null)}
        title={noticeMessage?.title || 'Student Action'}
      >
        <div className="space-y-4 text-center py-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">{noticeMessage?.body}</p>
          <Button variant="primary" size="md" className="w-full justify-center" onClick={() => setNoticeMessage(null)}>
            Continue Browsing
          </Button>
        </div>
      </BaseModal>
    </motion.div>
  );
};
