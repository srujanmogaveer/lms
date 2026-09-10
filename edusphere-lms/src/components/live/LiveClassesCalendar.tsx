import React, { useState } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiVideo,
  FiCalendar,
} from 'react-icons/fi';
import type { StudentLiveClass } from '../../types';

interface LiveClassesCalendarProps {
  liveClasses: StudentLiveClass[];
  onOpenDetails: (liveClass: StudentLiveClass) => void;
}

export const LiveClassesCalendar: React.FC<LiveClassesCalendarProps> = ({
  liveClasses,
  onOpenDetails,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthLabel = `${monthNames[month]} ${year}`;

  // Days of week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const blankCells = Array.from({ length: firstDayIndex });
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDayNum = isCurrentMonth ? today.getDate() : -1;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getClassesForDay = (dayNum: number) => {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = dayNum.toString().padStart(2, '0');
    const targetDateStr = `${year}-${monthStr}-${dayStr}`;

    return liveClasses.filter((lc) => {
      if (lc.date === targetDateStr) return true;
      if (lc.startTime) {
        const d = new Date(lc.startTime);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum;
      }
      return false;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 rounded-xl">
            <FiCalendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
              {currentMonthLabel} Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Interactive Live Class & Masterclass Event Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Previous Month"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono px-2">
            {currentMonthLabel}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Next Month"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header Bar */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Blank cells for padding */}
        {blankCells.map((_, i) => (
          <div key={`blank-${i}`} className="min-h-24 bg-slate-50/40 dark:bg-slate-950/20 rounded-xl p-2 opacity-30" />
        ))}

        {/* Days of the month */}
        {monthDays.map((dayNum) => {
          const dayClasses = getClassesForDay(dayNum);
          const isToday = dayNum === currentDayNum;

          return (
            <div
              key={dayNum}
              className={`min-h-28 p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                isToday
                  ? 'bg-brand-50/40 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/20'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
                    isToday
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dayNum}
                </span>

                {isToday && (
                  <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded uppercase">
                    Today
                  </span>
                )}
              </div>

              {/* Day Classes Event Markers */}
              <div className="space-y-1 mt-1">
                {dayClasses.map((lc) => {
                  let badgeStyle = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-200';
                  if (lc.status === 'live_now' || lc.status === 'Live') {
                    badgeStyle = 'bg-emerald-500 text-white font-extrabold animate-pulse';
                  } else if (lc.status === 'completed' || lc.status === 'Completed') {
                    badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  }

                  return (
                    <div
                      key={lc.id}
                      onClick={() => onOpenDetails(lc)}
                      className={`p-1.5 rounded-lg text-[10px] cursor-pointer transition-transform hover:scale-102 border ${badgeStyle} space-y-0.5`}
                      title={`${lc.title} (${lc.time})`}
                    >
                      <div className="font-bold line-clamp-1 flex items-center gap-1">
                        <FiVideo className="w-3 h-3 shrink-0" />
                        <span>{lc.title}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] opacity-85">
                        <span className="truncate">{lc.platform}</span>
                        <span className="font-mono">{lc.durationMinutes}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
