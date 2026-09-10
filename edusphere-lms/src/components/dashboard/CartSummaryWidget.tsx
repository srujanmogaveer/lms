import React from 'react';
import { FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Course } from '../../types';

interface CartSummaryWidgetProps {
  cartItems: { course: Course; price: number }[];
  onViewCart: () => void;
  onOpenCourse: (course: Course) => void;
}

export const CartSummaryWidget: React.FC<CartSummaryWidgetProps> = ({
  cartItems,
  onViewCart,
  onOpenCourse,
}) => {
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <Card className="p-6 space-y-4 flex flex-col justify-between h-full border-indigo-100 dark:border-indigo-900/40">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
              <FiShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Shopping Cart</h3>
              <p className="text-xs text-slate-500">{cartItems.length} items in bag</p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 font-mono">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">Your cart is empty.</div>
        ) : (
          <div className="space-y-3">
            {cartItems.map(({ course, price }) => (
              <div
                key={course.id}
                onClick={() => onOpenCourse(course)}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <img src={course.thumbnail} alt={course.title} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{course.instructorName}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                      Special Discount
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
          <span>Subtotal</span>
          <span className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <Button variant="primary" size="sm" className="w-full justify-center group bg-indigo-600 hover:bg-indigo-700" onClick={onViewCart}>
          <span>View Shopping Cart</span>
          <FiArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};
