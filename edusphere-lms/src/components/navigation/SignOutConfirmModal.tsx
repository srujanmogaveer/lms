import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-2xl space-y-5 text-center"
          >
            {/* Header Icon */}
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50 dark:ring-rose-950/30">
              <FiLogOut className="w-7 h-7 ml-0.5" />
            </div>

            {/* Title & Message */}
            <div className="space-y-1.5">
              <h3 id="signout-dialog-title" className="text-xl font-black text-slate-900 dark:text-slate-100">
                Sign Out
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to sign out?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="text-xs font-bold rounded-xl py-2.5"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={onConfirm}
                className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm py-2.5"
              >
                Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
