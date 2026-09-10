import React from 'react';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { FiTrash2, FiShoppingCart, FiCheckCircle } from 'react-icons/fi';
import type { Course } from '../../types';

interface ConfirmRemoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseTitle?: string;
  count?: number;
}

export const ConfirmRemoveModal: React.FC<ConfirmRemoveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  courseTitle,
  count = 1,
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Remove from Wishlist">
      <div className="space-y-4 text-center py-2">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <FiTrash2 className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Are you sure?
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {count > 1
              ? `You are about to remove ${count} selected courses from your wishlist.`
              : `You are about to remove "${courseTitle}" from your saved wishlist.`}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-3">
          <Button variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Cancel
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

interface CartTransferNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  movedCourses: Course[];
}

export const CartTransferNoticeModal: React.FC<CartTransferNoticeModalProps> = ({
  isOpen,
  onClose,
  movedCourses,
}) => {
  if (!isOpen) return null;

  const totalTransferPrice = movedCourses.reduce(
    (acc, curr) => acc + (curr.discountPrice || curr.price),
    0
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Transferred to Shopping Cart">
      <div className="space-y-4 py-2">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <FiCheckCircle className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            {movedCourses.length === 1 ? 'Course Moved to Cart!' : `${movedCourses.length} Courses Moved to Cart!`}
          </h4>
          <p className="text-xs text-slate-500">
            Item(s) have been transferred to your bag and removed from your saved wishlist.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
          {movedCourses.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                {c.title}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                ₹{(c.discountPrice || c.price).toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">Total Transfer Subtotal</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black font-mono">
              ₹{totalTransferPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" className="w-full justify-center bg-indigo-600 hover:bg-indigo-700" onClick={onClose}>
            <FiShoppingCart className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
