import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { WishlistItem, Course } from '../../types';
import { wishlistService } from '../../services/wishlistService';
import { cartService } from '../../services/cartService';
import { showSuccessAlert, showErrorAlert } from '../../utils/swalAlerts';
import { useWishlistCart } from '../../contexts/WishlistCartContext';

// Wishlist Components
import { WishlistHeader } from '../../components/wishlist/WishlistHeader';
import { WishlistFilterBar, type WishlistFilterState } from '../../components/wishlist/WishlistFilterBar';
import { WishlistCourseCard } from '../../components/wishlist/WishlistCourseCard';
import { WishlistBulkActionsBar } from '../../components/wishlist/WishlistBulkActionsBar';
import { WishlistRecentlyAddedWidget } from '../../components/wishlist/WishlistRecentlyAddedWidget';
import { ConfirmRemoveModal, CartTransferNoticeModal } from '../../components/wishlist/WishlistModals';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { SkeletonLoader } from '../../components/loaders/Loaders';

const ITEMS_PER_PAGE = 6;

export const StudentWishlist: React.FC = () => {
  const navigate = useNavigate();
  const { refreshWishlist, refreshCart } = useWishlistCart();

  // Primary Wishlist Items State (loaded from real backend database)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Sort State
  const [filters, setFilters] = useState<WishlistFilterState>({
    searchQuery: '',
    category: 'all',
    instructor: 'all',
    difficulty: 'all',
    priceRange: 'all',
    minRating: 'all',
    sortBy: 'newest',
  });

  // Modal Control States
  const [removeTarget, setRemoveTarget] = useState<{ course?: Course; isBulk?: boolean } | null>(null);
  const [cartTransferNotice, setCartTransferNotice] = useState<Course[] | null>(null);

  // Fetch real wishlist from backend
  const fetchWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await wishlistService.getWishlist();
      if (res.success && Array.isArray(res.data)) {
        setWishlistItems(res.data);
      } else {
        setWishlistItems([]);
      }
    } catch {
      setWishlistItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Unique Categories & Instructors derived from current real wishlist items
  const categories = useMemo(() => {
    const set = new Set<string>();
    wishlistItems.forEach((item) => {
      if (item.course?.category) set.add(item.course.category);
    });
    return Array.from(set);
  }, [wishlistItems]);

  const instructors = useMemo(() => {
    const set = new Set<string>();
    wishlistItems.forEach((item) => {
      if (item.course?.instructorName) set.add(item.course.instructorName);
    });
    return Array.from(set);
  }, [wishlistItems]);

  // Filtering & Sorting Logic
  const filteredItems = useMemo(() => {
    return wishlistItems.filter((item) => {
      const { course } = item;
      if (!course) return false;

      // 1. Search Query
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = (course.title || '').toLowerCase().includes(q);
        const matchesInstructor = (course.instructorName || '').toLowerCase().includes(q);
        const matchesCategory = (course.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesInstructor && !matchesCategory) return false;
      }

      // 2. Category Filter
      if (filters.category !== 'all' && course.category !== filters.category) return false;

      // 3. Instructor Filter
      if (filters.instructor !== 'all' && course.instructorName !== filters.instructor) return false;

      // 4. Difficulty Filter
      if (filters.difficulty !== 'all' && (course.level || course.difficulty) !== filters.difficulty) return false;

      // 5. Price Range Filter
      const price = course.discountPrice !== undefined && course.discountPrice !== null ? course.discountPrice : course.price;
      if (filters.priceRange === 'under_50' && price >= 50) return false;
      if (filters.priceRange === '50_to_80' && (price < 50 || price > 80)) return false;
      if (filters.priceRange === 'over_80' && price <= 80) return false;

      // 6. Rating Filter
      if (filters.minRating !== 'all' && (course.rating || 0) < parseFloat(filters.minRating)) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.course?.discountPrice || a.course?.price || 0;
      const priceB = b.course?.discountPrice || b.course?.price || 0;

      switch (filters.sortBy) {
        case 'alphabetical':
          return (a.course?.title || '').localeCompare(b.course?.title || '');
        case 'highest_rated':
          return (b.course?.rating || 0) - (a.course?.rating || 0);
        case 'lowest_price':
          return priceA - priceB;
        case 'highest_price':
          return priceB - priceA;
        case 'newest':
        default:
          return new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
      }
    });
  }, [wishlistItems, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Pricing Aggregates
  const totalOriginalPrice = wishlistItems.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);
  const totalDiscountPrice = wishlistItems.reduce(
    (acc, curr) => acc + (curr.course?.discountPrice || curr.course?.price || 0),
    0
  );

  // Selection Handlers
  const handleToggleSelect = (courseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === wishlistItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(wishlistItems.map((item) => item.course.id));
    }
  };

  // Move to Cart Handler
  const handleMoveToCart = async (course: Course) => {
    try {
      const addRes = await cartService.addToCart(course.id);
      if (addRes.success) {
        await wishlistService.removeFromWishlist(course.id);
        setWishlistItems((prev) => prev.filter((item) => item.course.id !== course.id));
        setSelectedIds((prev) => prev.filter((id) => id !== course.id));
        setCartTransferNotice([course]);
        await Promise.all([refreshWishlist(), refreshCart()]);
        showSuccessAlert(
          'Added to Cart',
          'Course has been added to your shopping cart.'
        );
      } else {
        showErrorAlert('Failed', addRes.message || 'Unable to update cart. Please try again.');
      }
    } catch (e: any) {
      showErrorAlert('Failed', e?.message || 'Unable to update cart. Please try again.');
    }
  };

  const handleBulkMoveToCart = async () => {
    const selectedCourses = wishlistItems
      .filter((item) => selectedIds.includes(item.course.id))
      .map((item) => item.course);

    try {
      await Promise.all(
        selectedCourses.map(async (course) => {
          await cartService.addToCart(course.id);
          await wishlistService.removeFromWishlist(course.id);
        })
      );
      setWishlistItems((prev) => prev.filter((item) => !selectedIds.includes(item.course.id)));
      setSelectedIds([]);
      setCartTransferNotice(selectedCourses);
      await Promise.all([refreshWishlist(), refreshCart()]);
      showSuccessAlert(
        'Added to Cart',
        `${selectedCourses.length} courses have been added to your shopping cart.`
      );
    } catch (e: any) {
      showErrorAlert('Failed', e?.message || 'Unable to update cart. Please try again.');
    }
  };

  // Remove Handlers
  const handleConfirmRemove = async () => {
    try {
      if (removeTarget?.isBulk) {
        await Promise.all(
          selectedIds.map((courseId) => wishlistService.removeFromWishlist(courseId))
        );
        setWishlistItems((prev) => prev.filter((item) => !selectedIds.includes(item.course.id)));
        setSelectedIds([]);
        await refreshWishlist();
        showSuccessAlert(
          'Removed from Wishlist',
          'Courses have been removed from your wishlist.'
        );
      } else if (removeTarget?.course) {
        const targetId = removeTarget.course.id;
        const res = await wishlistService.removeFromWishlist(targetId);
        if (res.success) {
          setWishlistItems((prev) => prev.filter((item) => item.course.id !== targetId));
          setSelectedIds((prev) => prev.filter((id) => id !== targetId));
          await refreshWishlist();
          showSuccessAlert(
            'Removed from Wishlist',
            'Course has been removed from your wishlist.'
          );
        } else {
          showErrorAlert('Failed', res.message || 'Unable to update wishlist. Please try again.');
        }
      }
    } catch (e: any) {
      showErrorAlert('Failed', e?.message || 'Unable to update wishlist. Please try again.');
    } finally {
      setRemoveTarget(null);
    }
  };

  // View Course Navigation
  const handleViewCourse = (course: Course) => {
    navigate(`/student/courses/${course.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12"
    >
      {/* 1. Header */}
      <WishlistHeader
        totalItems={wishlistItems.length}
        totalOriginalPrice={totalOriginalPrice}
        totalDiscountPrice={totalDiscountPrice}
        onResetWishlist={fetchWishlist}
        onRefresh={fetchWishlist}
        isLoading={isLoading}
      />

      {/* 2. Recently Added Quick Widget */}
      {wishlistItems.length > 0 && (
        <WishlistRecentlyAddedWidget
          recentItems={wishlistItems}
          onViewCourse={handleViewCourse}
          onMoveToCart={handleMoveToCart}
        />
      )}

      {/* 3. Search & Filter Bar */}
      <WishlistFilterBar
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        onResetFilters={() => {
          setFilters({
            searchQuery: '',
            category: 'all',
            instructor: 'all',
            difficulty: 'all',
            priceRange: 'all',
            minRating: 'all',
            sortBy: 'newest',
          });
          setCurrentPage(1);
        }}
        categories={categories}
        instructors={instructors}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalFilteredCount={filteredItems.length}
      />

      {/* 4. Bulk Actions Floating Bar */}
      <WishlistBulkActionsBar
        selectedCount={selectedIds.length}
        totalItems={wishlistItems.length}
        isAllSelected={wishlistItems.length > 0 && selectedIds.length === wishlistItems.length}
        onToggleSelectAll={handleToggleSelectAll}
        onBulkMoveToCart={handleBulkMoveToCart}
        onBulkRemove={() => setRemoveTarget({ isBulk: true })}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* 5. Wishlist Grid / List / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md"
        >
          <EmptyState
            type="courses"
            title="No courses in your wishlist."
            description="Explore our course catalog and save your favorite masterclasses to learn at your own pace."
            actionLabel="Browse Courses"
            onAction={() => navigate('/student/browse-courses')}
          />
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {paginatedItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <WishlistCourseCard
                    course={item.course}
                    addedAt={item.addedAt}
                    isSelected={selectedIds.includes(item.course.id)}
                    onToggleSelect={handleToggleSelect}
                    onViewCourse={handleViewCourse}
                    onMoveToCart={handleMoveToCart}
                    onRemove={(course) => setRemoveTarget({ course })}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* 6. Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* 7. Interactive Modals */}
      <ConfirmRemoveModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        courseTitle={removeTarget?.course?.title}
        count={removeTarget?.isBulk ? selectedIds.length : 1}
      />

      <CartTransferNoticeModal
        isOpen={!!cartTransferNotice}
        onClose={() => setCartTransferNotice(null)}
        movedCourses={cartTransferNotice || []}
      />
    </motion.div>
  );
};
