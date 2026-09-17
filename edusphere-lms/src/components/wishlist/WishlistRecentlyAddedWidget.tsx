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

const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentItems.slice(0, 4).map((item) => {
          const { course } = item;
          const currentPrice = course.discountPrice || course.price;
          const isDiscounted = course.discountPrice && course.discountPrice < course.price;
          const timeLabel = formatRelativeTime(item.addedAt);

          return (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
            >
              <div className="space-y-2.5">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => onViewCourse(course)}
                  />
                  {timeLabel && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-medium bg-black/70 text-white px-2 py-0.5 rounded-md backdrop-blur-sm shadow-xs">
                      {timeLabel}
                    </span>
                  )}
                </div>

                <h4
                  onClick={() => onViewCourse(course)}
                  className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer leading-snug"
                >
                  {course.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {course.rating}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                    {isDiscounted && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{course.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full justify-center text-xs py-1.5 font-semibold hover:border-rose-500 hover:text-rose-600 transition-colors"
                onClick={() => onMoveToCart(course)}
              >
                <FiShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Move to Cart
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
