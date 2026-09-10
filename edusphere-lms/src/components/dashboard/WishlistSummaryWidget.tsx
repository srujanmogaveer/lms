import React from 'react';
import { FiHeart, FiStar, FiArrowRight } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Course } from '../../types';

interface WishlistSummaryWidgetProps {
  wishlistCourses: Course[];
  onViewWishlist: () => void;
  onOpenCourse: (course: Course) => void;
}

export const WishlistSummaryWidget: React.FC<WishlistSummaryWidgetProps> = ({
  wishlistCourses,
  onViewWishlist,
  onOpenCourse,
}) => {
  return (
    <Card className="p-6 space-y-4 flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
              <FiHeart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Wishlist Summary</h3>
              <p className="text-xs text-slate-500">{wishlistCourses.length} saved courses</p>
            </div>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            {wishlistCourses.length} Items
          </span>
        </div>

        {wishlistCourses.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">Your wishlist is empty.</div>
        ) : (
          <div className="space-y-3">
            {wishlistCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => onOpenCourse(course)}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <img src={course.thumbnail} alt={course.title} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-600 transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{course.instructorName}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                      <FiStar className="w-3 h-3 fill-amber-400" /> {course.rating}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                      ₹{(course.discountPrice || course.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button variant="outline" size="sm" className="w-full justify-center group" onClick={onViewWishlist}>
          <span>View Wishlist</span>
          <FiArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};
