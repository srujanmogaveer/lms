import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckSquare, FiSquare, FiShoppingCart, FiTrash2, FiX } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface WishlistBulkActionsBarProps {
  selectedCount: number;
  totalItems: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onBulkMoveToCart: () => void;
  onBulkRemove: () => void;
  onClearSelection: () => void;
}

export const WishlistBulkActionsBar: React.FC<WishlistBulkActionsBarProps> = ({
  selectedCount,
  totalItems,
  isAllSelected,
  onToggleSelectAll,
  onBulkMoveToCart,
  onBulkRemove,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        className="sticky top-20 z-20 w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4"
      >
        {/* Left Side: Selection Checkbox & Counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            {isAllSelected ? (
              <FiCheckSquare className="w-5 h-5 text-rose-500" />
            ) : (
              <FiSquare className="w-5 h-5 text-slate-400" />
            )}
            <span>
              {isAllSelected ? 'Deselect All' : `Select All (${totalItems})`}
            </span>
          </button>

          <span className="h-4 w-px bg-slate-700" />

          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {selectedCount} {selectedCount === 1 ? 'course' : 'courses'} selected
          </span>
        </div>

        {/* Right Side: Bulk Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={onBulkMoveToCart}
          >
            <FiShoppingCart className="w-4 h-4 mr-1.5" />
            Move {selectedCount} to Shopping Cart
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={onBulkRemove}
          >
            <FiTrash2 className="w-4 h-4 mr-1.5" />
            Remove Selected
          </Button>

          <button
            onClick={onClearSelection}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            aria-label="Clear selection"
            title="Clear selection"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
