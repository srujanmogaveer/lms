import React from 'react';

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`} />
  );
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className={`animate-spin rounded-full border-brand-600 border-t-transparent ${sizeStyles[size]}`} />
  );
};
