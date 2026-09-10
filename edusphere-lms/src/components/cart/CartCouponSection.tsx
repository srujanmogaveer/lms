import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTag, FiCheckCircle, FiX, FiAlertCircle, FiGift } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Coupon } from '../../types';

interface CartCouponSectionProps {
  availableCoupons: Coupon[];
  appliedCoupon: Coupon | null;
  onApplyCoupon: (code: string) => { success: boolean; message: string };
  onRemoveCoupon: () => void;
}

export const CartCouponSection: React.FC<CartCouponSectionProps> = ({
  availableCoupons,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleApply = (codeToApply?: string) => {
    const targetCode = codeToApply || couponCodeInput;
    if (!targetCode.trim()) {
      setFeedback({ success: false, message: 'Please enter a valid coupon promo code.' });
      return;
    }

    const result = onApplyCoupon(targetCode.trim().toUpperCase());
    setFeedback(result);
    if (result.success) {
      setCouponCodeInput('');
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setFeedback(null);
  };

  return (
    <Card className="p-5 space-y-4 border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
          <FiTag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Have a Promo Coupon Code?
        </h3>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
          Instant Savings
        </span>
      </div>

      {appliedCoupon ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                    {appliedCoupon.discountType === 'percentage'
                      ? `${appliedCoupon.discountValue}% OFF`
                      : `$${appliedCoupon.discountValue} OFF`}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {appliedCoupon.description}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
              onClick={handleRemove}
            >
              <FiX className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter coupon code (e.g. EDUSPHERE20)"
              value={couponCodeInput}
              onChange={(e) => {
                setCouponCodeInput(e.target.value);
                if (feedback) setFeedback(null);
              }}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm uppercase font-bold text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:font-normal placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              variant="primary"
              size="md"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              onClick={() => handleApply()}
            >
              Apply Code
            </Button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {feedback.success ? (
                <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <FiAlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Sample Coupons Suggestions */}
          <div className="pt-1 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Available Test Coupons:</span>
            <div className="flex flex-wrap gap-2">
              {availableCoupons.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleApply(c.code)}
                  className="px-2.5 py-1 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                  <FiGift className="w-3 h-3 text-indigo-500" />
                  <span>{c.code}</span>
                  <span className="text-[10px] opacity-75">
                    ({c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
