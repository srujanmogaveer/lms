import React from 'react';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'emerald' | 'amber';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  size = 'md',
  color = 'brand',
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    brand: 'bg-brand-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span>Progress</span>
          <span>{normalizedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorStyles[color]}`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};
