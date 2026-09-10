import React, { useState } from 'react';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  FiTrash2,
  FiHeart,
  FiLock,
  FiCheckCircle,
  FiCreditCard,
  FiSmartphone,
  FiGlobe,
} from 'react-icons/fi';
import type { Course } from '../../types';

interface ConfirmRemoveCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseTitle?: string;
}

export const ConfirmRemoveCartModal: React.FC<ConfirmRemoveCartModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  courseTitle,
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Remove from Cart">
      <div className="space-y-4 text-center py-2">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <FiTrash2 className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Remove this course?
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Are you sure you want to remove "{courseTitle}" from your shopping bag?
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-3">
          <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Keep in Cart
          </Button>
          <Button
            variant="danger"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Yes, Remove
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

interface WishlistTransferNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

export const WishlistTransferNoticeModal: React.FC<WishlistTransferNoticeModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  if (!course) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Moved to Wishlist">
      <div className="space-y-4 text-center py-2">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <FiHeart className="w-7 h-7 fill-rose-500/20" />
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Saved to Wishlist!
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            "{course.title}" has been moved from your shopping cart to your saved wishlist.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center bg-rose-600 hover:bg-rose-700 text-white"
            onClick={onClose}
          >
            Got it, thanks!
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

interface CheckoutPreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartCourses: Course[];
  grandTotal: number;
}

export const CheckoutPreparationModal: React.FC<CheckoutPreparationModalProps> = ({
  isOpen,
  onClose,
  cartCourses,
  grandTotal,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'card' | 'upi' | 'netbanking'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleFinish = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Checkout & Payment Preparation">
      {isSuccess ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <FiCheckCircle className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <Badge variant="success">Phase 1 Integration Ready</Badge>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
              Payment Flow Simulation Successful!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              When Prompt 15 / Payment Gateway is connected, selecting this will launch the official Razorpay Checkout SDK and trigger course enrollment in "My Courses".
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Simulated Order ID:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">ORD-2026-9814</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Payment Gateway:</span>
              <span className="uppercase">{selectedMethod} Gateway</span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Amount Processed:</span>
              <span className="text-emerald-600 font-black">₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="md" className="w-full justify-center" onClick={handleFinish}>
              Return to Student Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 py-2">
          {/* Items Summary Header */}
          <div className="bg-brand-50/60 dark:bg-brand-950/40 p-4 rounded-2xl border border-brand-100 dark:border-brand-900 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Purchasing {cartCourses.length} {cartCourses.length === 1 ? 'Masterclass' : 'Masterclasses'}
              </span>
              <span className="font-black text-brand-600 dark:text-brand-400 text-base">
                ₹{Math.round(grandTotal).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Select Preferred Payment Method (Informational Preview):
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'razorpay' as const, name: 'Razorpay Gateway', icon: FiLock, badge: 'Recommended' },
                { id: 'card' as const, name: 'Credit / Debit Card', icon: FiCreditCard, badge: 'Instant' },
                { id: 'upi' as const, name: 'UPI / GPay / PhonePe', icon: FiSmartphone, badge: 'Fastest' },
                { id: 'netbanking' as const, name: 'Net Banking', icon: FiGlobe, badge: '50+ Banks' },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/40 ring-2 ring-brand-500/50'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-semibold text-slate-400">{m.badge}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 mt-2 block">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
              onClick={handleSimulatePayment}
              disabled={isProcessing}
            >
              <FiLock className="w-4 h-4 mr-2" />
              {isProcessing ? 'Simulating Razorpay Connection...' : `Pay $${grandTotal.toFixed(2)} & Enroll Now`}
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
};
