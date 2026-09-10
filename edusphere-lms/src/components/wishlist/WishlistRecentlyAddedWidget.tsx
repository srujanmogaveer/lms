import React from 'react';
import { FiClock, FiStar, FiShoppingCart } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { WishlistItem, Course } from '../../types';

interface WishlistRecentlyAddedWidgetProps {
  recentItems: WishlistItem[];
  onViewCourse: (course: Course) => void;
  onMoveToCart: (course: Course) => void;
}

export const WishlistRecentlyAddedWidget: React.FC<WishlistRecentlyAddedWidgetProps> = ({
  recentItems,
  onViewCourse,
  onMoveToCart,
}) => {
  if (recentItems.length === 0) return null;

  return (
    <Card className="p-5 space-y-4 bg-gradient-to-br from-rose-50/40 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 border-rose-100 dark:border-rose-950">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
          <FiClock className="w-4 h-4 text-rose-500" />
          Recently Added Items
        </h3>
        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full">
          Quick Access
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recentItems.slice(0, 3).map((item) => {
          const { course } = item;
          const currentPrice = course.discountPrice || course.price;

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="relative h-20 w-full overflow-hidden rounded-lg">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => onViewCourse(course)}
                  />
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {item.addedAt}
                  </span>
                </div>

                <h4
                  onClick={() => onViewCourse(course)}
                  className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  {course.title}
                </h4>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <FiStar className="w-3 h-3 fill-amber-400" /> {course.rating}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    ${currentPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full justify-center text-[11px] py-1"
                onClick={() => onMoveToCart(course)}
              >
                <FiShoppingCart className="w-3 h-3 mr-1" />
                Move to Cart
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
