import React from 'react';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiArrowLeft, FiRefreshCw, FiRotateCcw, FiShield } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface CartHeaderProps {
  totalItems: number;
  onContinueShopping: () => void;
  onResetCart: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const CartHeader: React.FC<CartHeaderProps> = ({
  totalItems,
  onContinueShopping,
  onResetCart,
  onRefresh,
  isLoading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-brand-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl"
    >
      {/* Decorative Blur Circles */}
      <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-16 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Title & Info */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm flex items-center gap-1.5">
              <FiShoppingCart className="w-3.5 h-3.5" />
              Student Shopping Cart
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300/40 text-emerald-100 flex items-center gap-1">
              <FiShield className="w-3.5 h-3.5 text-emerald-300" />
              30-Day Money-Back Guarantee
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Shopping Cart ({totalItems} {totalItems === 1 ? 'Course' : 'Courses'})
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm font-medium max-w-xl">
            Review your selected courses and proceed to checkout for instant lifetime access.
          </p>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 border-white/15 pt-4 lg:pt-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={onContinueShopping}
            className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-md"
          >
            <FiArrowLeft className="w-4 h-4 mr-1.5" />
            Continue Shopping
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-md"
              aria-label="Refresh cart data"
            >
              <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <button
              onClick={onResetCart}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-black/20 hover:bg-black/30 text-white transition-all shadow-sm border border-white/20"
              title="Reset default cart items for demo testing"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Cart</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
