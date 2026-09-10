import React from 'react';

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
);

export const ChatLoadingSkeleton: React.FC = () => (
  <div className="flex h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
    {/* Left panel skeleton */}
    <div className="hidden lg:flex flex-col w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 p-4 gap-3">
      <Sk className="h-8 w-28 mb-1 rounded-lg" />
      <Sk className="h-9 w-full rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1">
          <Sk className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Sk className="h-3.5 w-3/4 rounded" />
            <Sk className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
    {/* Right panel skeleton */}
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <Sk className="w-14 h-14 rounded-full" />
      <Sk className="h-4 w-48 rounded-lg" />
      <Sk className="h-3 w-72 rounded-lg" />
    </div>
  </div>
);
