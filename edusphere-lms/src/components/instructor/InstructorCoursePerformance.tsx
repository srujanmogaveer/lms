import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiUsers, FiTrendingUp, FiBarChart2, FiBookOpen, FiPlusCircle } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

interface InstructorCoursePerformanceProps {
  popularCourses?: any[];
  monthlyTrendData?: { month: string; enrollments: number; revenueINR: number }[];
  studentsTrendPercent?: number;
  onCreateCourse?: () => void;
}

export const InstructorCoursePerformance: React.FC<InstructorCoursePerformanceProps> = ({
  popularCourses,
  monthlyTrendData: initialMonthlyTrendData,
  studentsTrendPercent = 0,
  onCreateCourse,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'monthly' | 'quarterly'>('monthly');

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const activeCourses = popularCourses && Array.isArray(popularCourses) ? popularCourses : [];

  // Generate fallback monthly list of past 6 months if not provided by stats
  const now = new Date();
  const defaultMonthlyTrend = Array.from({ length: 6 }, (_, idx) => {
    const i = 5 - idx;
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      enrollments: 0,
      revenueINR: 0,
    };
  });

  const trends = initialMonthlyTrendData && initialMonthlyTrendData.length > 0
    ? initialMonthlyTrendData
    : defaultMonthlyTrend;

  const maxEnrollments = Math.max(...trends.map((d) => d.enrollments), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Most Popular Courses Table & Completion Rates (2 Columns) */}
      <Card className="lg:col-span-2 p-6 space-y-6 shadow-md border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-brand-600" />
              <span>Most Popular Courses & Completion Rates</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of student enrollment volume, ratings, and course completion performance.
            </p>
          </div>

          <Badge variant={activeCourses.length > 0 ? 'success' : 'neutral'} className="flex items-center gap-1">
            <FiTrendingUp className="w-3.5 h-3.5" /> {activeCourses.length} Active Courses
          </Badge>
        </div>

        {/* Course Cards / Table List */}
        {activeCourses.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Published Courses Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Publish your first course to track student enrollment numbers, ratings, and completion metrics here.
              </p>
            </div>
            {onCreateCourse && (
              <Button
                size="sm"
                variant="primary"
                onClick={onCreateCourse}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
              >
                <FiPlusCircle className="w-4 h-4 mr-1.5" /> Create New Course
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activeCourses.map((course: any) => {
              const enrolledCount = Number(course.enrolledStudents ?? course.studentsCount ?? 0);
              const revenueVal = Number(course.revenueINR ?? 0);
              const ratingVal = Number(course.rating ?? 5.0);
              const completionRateVal = Number(course.completionRate ?? 0);
              const categoryVal = course.category || 'Development';
              const thumbnailVal = course.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800';

              return (
                <motion.div
                  key={course.id || Math.random().toString()}
                  whileHover={{ scale: 1.01 }}
                  className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={thumbnailVal}
                        alt={course.title || 'Course'}
                        className="w-14 h-12 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {course.title || 'Untitled Course'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
                          <Badge variant="neutral" size="sm">{categoryVal}</Badge>
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <FiStar className="w-3 h-3 fill-amber-400" /> {ratingVal.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono sm:text-right shrink-0">
                      <div>
                        <p className="text-[10px] text-slate-400 font-sans">Students</p>
                        <p className="font-extrabold text-slate-800 dark:text-slate-200">
                          {enrolledCount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-sans">Total Sales</p>
                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatINR(revenueVal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Completion Rate Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Average Course Completion
                      </span>
                      <span className="font-extrabold text-brand-600 dark:text-brand-400">
                        {completionRateVal}%
                      </span>
                    </div>
                    <ProgressBar
                      progress={completionRateVal}
                      size="sm"
                      color={completionRateVal >= 85 ? 'emerald' : 'brand'}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 2. Student Enrollment Trend Chart (1 Column) */}
      <Card className="lg:col-span-1 p-6 space-y-6 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-indigo-600" />
              <span>Enrollment Trend</span>
            </h2>

            <div className="flex gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['monthly', 'quarterly'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2 py-0.5 rounded-lg capitalize font-bold transition-colors ${
                    selectedTimeframe === tf
                      ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monthly student sign-ups across all active courses.
          </p>

          {/* Visual Custom Bar Chart */}
          <div className="pt-4 space-y-3">
            {trends.map((data, idx) => {
              const pct = maxEnrollments > 0 ? Math.round((data.enrollments / maxEnrollments) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span className="font-sans font-medium">{data.month}</span>
                    <span className="font-bold">{data.enrollments.toLocaleString('en-IN')} students</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, data.enrollments > 0 ? 5 : 0)}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="bg-gradient-to-r from-brand-600 to-indigo-600 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight Box */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-xs space-y-1">
          <p className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <FiUsers className="w-4 h-4 text-indigo-600" />
            {studentsTrendPercent !== 0 ? `${studentsTrendPercent > 0 ? '+' : ''}${studentsTrendPercent}% Growth Rate` : 'Enrollment Insights'}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            {trends.reduce((acc, curr) => acc + curr.enrollments, 0)} total student enrollments recorded over the past 6 months.
          </p>
        </div>
      </Card>
    </div>
  );
};
