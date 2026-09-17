import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiRefreshCw, FiClock, FiRotateCcw } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface WishlistHeaderProps {
  totalItems: number;
  totalOriginalPrice: number;
  totalDiscountPrice: number;
  recentlyAddedTime?: string;
  onResetWishlist: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const WishlistHeader: React.FC<WishlistHeaderProps> = ({
  totalItems,
  totalOriginalPrice,
  totalDiscountPrice,
  recentlyAddedTime = '2 hours ago',
  onResetWishlist,
  onRefresh,
  isLoading,
}) => {
  const totalSavings = totalOriginalPrice - totalDiscountPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-700 via-pink-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl"
    >
      {/* Background Decorative Circles */}
      <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-16 w-64 h-64 rounded-full bg-rose-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Header Details */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm flex items-center gap-1.5">
              <FiHeart className="w-3.5 h-3.5 fill-white" />
              Student Wishlist
            </span>
            {totalItems > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/30 border border-amber-300/40 text-amber-100 flex items-center gap-1">
                <FiClock className="w-3 h-3 text-amber-300" />
                Latest item added {recentlyAddedTime}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            My Saved Wishlist
          </h1>
          <p className="text-rose-100 text-xs sm:text-sm font-medium max-w-xl">
            Save your target masterclasses, compare prices, and seamlessly transfer items to your shopping cart when ready to enroll.
          </p>
        </div>

        {/* Right Side: Metrics & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-t lg:border-t-0 border-white/15 pt-4 lg:pt-0">
          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-xs">
            <div className="px-2 border-r border-white/20">
              <span className="text-white/70 block text-[10px] uppercase font-bold">Total Items</span>
              <span className="text-base font-black text-white">{totalItems} Courses</span>
            </div>
            <div className="px-2 border-r border-white/20">
              <span className="text-white/70 block text-[10px] uppercase font-bold">Total Value</span>
              <span className="text-base font-black text-amber-300">₹{totalDiscountPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="px-2">
              <span className="text-white/70 block text-[10px] uppercase font-bold">Total Savings</span>
              <span className="text-base font-black text-emerald-300">₹{totalSavings.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-md"
              aria-label="Refresh wishlist data"
            >
              <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <button
              onClick={onResetWishlist}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all shadow-sm border border-white/20"
              title="Reset default wishlist items for demo testing"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
