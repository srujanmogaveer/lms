import React from 'react';
import { FiLock, FiArrowRight, FiShoppingBag, FiCheckCircle } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface CartOrderSummaryProps {
  totalCoursesCount: number;
  originalSubtotal: number;
  coursesDiscount: number;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({
  totalCoursesCount,
  originalSubtotal,
  coursesDiscount,
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const finalPayableTotal = Math.max(0, originalSubtotal - coursesDiscount);

  return (
    <Card className="p-6 space-y-5 border-2 border-brand-100 dark:border-brand-900/50 shadow-lg relative sticky top-20">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
          <FiShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          Order Summary
        </h3>
        <p className="text-xs text-slate-500">All prices are inclusive of applicable taxes</p>
      </div>

      {/* Financial Line Items */}
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>Subtotal ({totalCoursesCount} {totalCoursesCount === 1 ? 'item' : 'items'})</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">₹{originalSubtotal.toLocaleString('en-IN')}</span>
        </div>

        {coursesDiscount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
            <span>Course Discount Savings</span>
            <span className="font-bold">-₹{coursesDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
          <span>Taxes & GST</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[11px]">
            Included
          </span>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">Total Payable</span>
            {coursesDiscount > 0 && (
              <span className="text-[11px] text-emerald-600 font-semibold">Total Savings: ₹{Math.round(coursesDiscount).toLocaleString('en-IN')}</span>
            )}
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            ₹{Math.round(finalPayableTotal).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Checkout Action */}
      <div className="space-y-2 pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold group"
          onClick={onProceedToCheckout}
          disabled={totalCoursesCount === 0}
        >
          <FiLock className="w-4 h-4 mr-2" />
          <span>Proceed to Checkout</span>
          <FiArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center text-xs"
          onClick={onContinueShopping}
        >
          Continue Browsing Courses
        </Button>
      </div>

      {/* Guarantee Badges */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <FiCheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Instant lifetime access to course material</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <FiCheckCircle className="w-3.5 h-3.5 shrink-0 text-brand-500" />
          <span>Verified Certificate of Completion upon finishing</span>
        </div>
      </div>
    </Card>
  );
};
