import React from 'react';
import { motion } from 'framer-motion';
import {
  FiBook,
  FiPlayCircle,
  FiCheckCircle,
  FiAward,
  FiHeart,
  FiShoppingCart,
  FiTrendingUp,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface StatsCardsProps {
  enrolledCount: number;
  inProgressCount: number;
  completedCount: number;
  certificatesCount: number;
  wishlistCount: number;
  cartCount: number;
  onCardClick?: (type: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  enrolledCount,
  inProgressCount,
  completedCount,
  certificatesCount,
  wishlistCount,
  cartCount,
  onCardClick,
}) => {
  const stats = [
    {
      id: 'enrolled',
      title: 'Enrolled Courses',
      count: enrolledCount,
      trend: '+1 this month',
      icon: FiBook,
      color: 'text-brand-600 dark:text-brand-400',
      bgColor: 'bg-brand-50 dark:bg-brand-950/60 border-brand-100 dark:border-brand-900',
      badgeColor: 'bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300',
    },
    {
      id: 'in_progress',
      title: 'Courses In Progress',
      count: inProgressCount,
      trend: 'Active learning',
      icon: FiPlayCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'completed',
      title: 'Completed Courses',
      count: completedCount,
      trend: '100% completion rate',
      icon: FiCheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'certificates',
      title: 'Certificates Earned',
      count: certificatesCount,
      trend: 'Verified credentials',
      icon: FiAward,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900',
      badgeColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    },
    {
      id: 'wishlist',
      title: 'Wishlist Items',
      count: wishlistCount,
      trend: '1 course on discount',
      icon: FiHeart,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900',
      badgeColor: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
    },
    {
      id: 'cart',
      title: 'Shopping Cart',
      count: cartCount,
      trend: '2 courses pending',
      icon: FiShoppingCart,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.id} variants={itemVariants}>
            <Card
              hoverEffect
              className={`p-4 border transition-all cursor-pointer ${stat.bgColor}`}
              onClick={() => onCardClick && onCardClick(stat.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.badgeColor}`}>
                  <FiTrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {stat.title}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight">
                  {stat.count}
                </h3>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
