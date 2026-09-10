import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem, Course } from '../../types';
import { cartService } from '../../services/cartService';
import { wishlistService } from '../../services/wishlistService';
import { courseService } from '../../services/courseService';
import { showSuccessAlert, showErrorAlert } from '../../utils/swalAlerts';
import { useWishlistCart } from '../../contexts/WishlistCartContext';

// Cart Sub-components
import { CartHeader } from '../../components/cart/CartHeader';
import { CartItemCard } from '../../components/cart/CartItemCard';
import { CartOrderSummary } from '../../components/cart/CartOrderSummary';
import { CartPaymentInfoUI } from '../../components/cart/CartPaymentInfoUI';
import { CartRecommendedCourses } from '../../components/cart/CartRecommendedCourses';
import {
  ConfirmRemoveCartModal,
  WishlistTransferNoticeModal,
  CheckoutPreparationModal,
} from '../../components/cart/CartModals';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';

export const StudentCart: React.FC = () => {
  const navigate = useNavigate();
  const { refreshWishlist, refreshCart } = useWishlistCart();

  // Primary Cart State (loaded from real backend database)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [removeTargetCourse, setRemoveTargetCourse] = useState<Course | null>(null);
  const [wishlistTransferTarget, setWishlistTransferTarget] = useState<Course | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch real cart items and catalog from backend
  const fetchCartAndCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cartRes, coursesRes] = await Promise.all([
        cartService.getCart(),
        courseService.getPublicCourses({ limit: 10 }),
      ]);

      if (cartRes.success && Array.isArray(cartRes.data)) {
        setCartItems(cartRes.data);
      } else {
        setCartItems([]);
      }

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setAvailableCourses(coursesRes.data);
      } else {
        setAvailableCourses([]);
      }
    } catch {
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartAndCatalog();
  }, [fetchCartAndCatalog]);

  // Calculate Subtotals & Savings from live cart items
  const originalSubtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);
  }, [cartItems]);

  const discountSubtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, curr) => acc + (curr.course?.discountPrice !== undefined && curr.course?.discountPrice !== null ? curr.course.discountPrice : curr.course?.price || 0),
      0
    );
  }, [cartItems]);

  const grandTotal = discountSubtotal;
  const coursesDiscount = Math.max(0, originalSubtotal - discountSubtotal);

  // Real Courses currently NOT in cart (for recommended section)
  const cartCourseIds = useMemo(() => new Set(cartItems.map((item) => item.course?.id)), [cartItems]);
  const recommendedCourses = useMemo(() => {
    return availableCourses.filter((course) => !cartCourseIds.has(course.id));
  }, [availableCourses, cartCourseIds]);

  // Move to Wishlist Handler
  const handleMoveToWishlist = async (course: Course) => {
    try {
      const wishRes = await wishlistService.addToWishlist(course.id);
      if (wishRes.success) {
        await cartService.removeFromCart(course.id);
        setCartItems((prev) => prev.filter((item) => item.course.id !== course.id));
        setWishlistTransferTarget(course);
        await Promise.all([refreshWishlist(), refreshCart()]);
        showSuccessAlert(
          'Added to Wishlist',
          'Course has been added to your wishlist.'
        );
      } else {
        showErrorAlert('Failed', wishRes.message || 'Unable to update wishlist. Please try again.');
      }
    } catch (e: any) {
      showErrorAlert('Failed', e?.message || 'Unable to update wishlist. Please try again.');
    }
  };

  // Remove Item Handler
  const handleConfirmRemove = async () => {
    if (removeTargetCourse) {
      try {
        const res = await cartService.removeFromCart(removeTargetCourse.id);
        if (res.success) {
          setCartItems((prev) => prev.filter((item) => item.course.id !== removeTargetCourse.id));
          await refreshCart();
          showSuccessAlert(
            'Removed from Cart',
            'Course has been removed from your shopping cart.'
          );
        } else {
          showErrorAlert('Failed', res.message || 'Unable to update cart. Please try again.');
        }
      } catch (e: any) {
        showErrorAlert('Failed', e?.message || 'Unable to update cart. Please try again.');
      } finally {
        setRemoveTargetCourse(null);
      }
    }
  };

  // Add Course to Cart Handler
  const handleAddToCart = async (course: Course) => {
    if (cartCourseIds.has(course.id)) return;
    try {
      const res = await cartService.addToCart(course.id);
      if (res.success && res.data) {
        const item = res.data;
        setCartItems((prev) => [item, ...prev]);
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
  };

  // View Course Handler
  const handleViewCourse = (course: Course) => {
    navigate(`/student/courses/${course.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* 1. Shopping Cart Header */}
      <CartHeader
        totalItems={cartItems.length}
        onContinueShopping={() => navigate('/student/browse-courses')}
        onResetCart={fetchCartAndCatalog}
        onRefresh={fetchCartAndCatalog}
        isLoading={isLoading}
      />

      {/* Cart Content or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonLoader key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
          <SkeletonLoader className="h-80 w-full rounded-2xl" />
        </div>
      ) : cartItems.length === 0 ? (
        /* Empty State View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md">
            <EmptyState
              type="courses"
              title="Your shopping cart is empty."
              description="Explore our course catalog or review your saved wishlist items to add them to your shopping cart."
              actionLabel="Browse Courses"
              onAction={() => navigate('/student/browse-courses')}
            />

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => navigate('/student/wishlist')}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Go to Saved Wishlist Items →
              </button>
            </div>
          </div>

          {/* Recommended Courses Section */}
          {recommendedCourses.length > 0 && (
            <CartRecommendedCourses
              recommendedCourses={recommendedCourses}
              onViewCourse={handleViewCourse}
              onAddToCart={handleAddToCart}
            />
          )}
        </motion.div>
      ) : (
        /* Populated Shopping Cart View */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Cart Items List & Coupon Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Selected Courses ({cartItems.length})
                  </h2>
                  <span className="text-xs text-slate-500">
                    Lifetime access included
                  </span>
                </div>

                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    >
                      <CartItemCard
                        course={item.course}
                        addedAt={item.addedAt}
                        onViewCourse={handleViewCourse}
                        onMoveToWishlist={handleMoveToWishlist}
                        onRemove={(course) => setRemoveTargetCourse(course)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Payment Information Banner */}
              <CartPaymentInfoUI />
            </div>

            {/* Right Column: Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <CartOrderSummary
                totalCoursesCount={cartItems.length}
                originalSubtotal={originalSubtotal}
                coursesDiscount={coursesDiscount}
                onProceedToCheckout={() => navigate('/student/checkout')}
                onContinueShopping={() => navigate('/student/browse-courses')}
              />
            </div>
          </div>

          {/* Recommended Add-on Courses */}
          {recommendedCourses.length > 0 && (
            <CartRecommendedCourses
              recommendedCourses={recommendedCourses}
              onViewCourse={handleViewCourse}
              onAddToCart={handleAddToCart}
            />
          )}
        </div>
      )}

      {/* Interactive Modals */}
      <ConfirmRemoveCartModal
        isOpen={!!removeTargetCourse}
        onClose={() => setRemoveTargetCourse(null)}
        onConfirm={handleConfirmRemove}
        courseTitle={removeTargetCourse?.title}
      />

      <WishlistTransferNoticeModal
        isOpen={!!wishlistTransferTarget}
        onClose={() => setWishlistTransferTarget(null)}
        course={wishlistTransferTarget}
      />

      <CheckoutPreparationModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartCourses={cartItems.map((item) => item.course)}
        grandTotal={grandTotal}
      />
    </motion.div>
  );
};
