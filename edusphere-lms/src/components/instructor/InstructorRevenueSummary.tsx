import React from 'react';
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiPieChart } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface InstructorRevenueSummaryProps {
  stats?: any;
}

export const InstructorRevenueSummary: React.FC<InstructorRevenueSummaryProps> = ({ stats }) => {
  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const activeStats = stats || {};

  const totalRev = activeStats.totalRevenueINR ?? 0;
  const monthlyRev = activeStats.monthlyRevenueINR ?? 0;
  const trendPct = activeStats.revenueTrendPercent ?? 0;
  const courses = activeStats.popularCourses && Array.isArray(activeStats.popularCourses)
    ? activeStats.popularCourses
    : [];

  return (
    <Card className="p-6 space-y-6 shadow-md border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <FiDollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Revenue Summary & Course Sales (₹)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Financial performance localized in Indian Rupees (₹ INR).
            </p>
          </div>
        </div>

        <Badge variant={trendPct > 0 ? 'success' : 'neutral'} className="flex items-center gap-1 font-bold">
          <FiTrendingUp className="w-3.5 h-3.5" /> {trendPct !== 0 ? `${trendPct > 0 ? '+' : ''}${trendPct}% Growth` : 'Current Month'}
        </Badge>
      </div>

      {/* Top Revenue Stat Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between opacity-90 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Cumulative Revenue</span>
            <FiCreditCard className="w-4 h-4" />
          </div>
          <h3 className="text-3xl font-black font-mono tracking-tight">
            {formatINR(totalRev)}
          </h3>
          <p className="text-[11px] opacity-80 pt-1">
            Across {activeStats.publishedCourses ?? 0} published courses & {(activeStats.totalStudents ?? 0).toLocaleString('en-IN')} enrolled students.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Current Month Revenue</span>
            <FiPieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-black font-mono tracking-tight text-emerald-400">
            {formatINR(monthlyRev)}
          </h3>
          <p className="text-[11px] text-slate-400 pt-1">
            Calculated from student course enrollments in the current calendar month.
          </p>
        </div>
      </div>

      {/* Course Sales Breakdown Table */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Course Sales Breakdown:
        </h3>

        {courses.length === 0 ? (
          <div className="py-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No course sales or enrollments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/60 uppercase text-[10px] font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3 text-center">Students</th>
                  <th className="px-4 py-3 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {courses.map((course: any) => {
                  const enrolledVal = Number(course.enrolledStudents ?? course.studentsCount ?? 0);
                  const revVal = Number(course.revenueINR ?? 0);
                  const titleVal = course.title || 'Untitled Course';

                  return (
                    <tr key={course.id || Math.random().toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-slate-100">
                        {titleVal}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {enrolledVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatINR(revVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};
