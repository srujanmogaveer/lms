import React from 'react';
import { FiInbox, FiSearch, FiBook, FiFileText, FiBell } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  type?: 'data' | 'search' | 'courses' | 'assignments' | 'notifications';
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  type = 'data',
  actionLabel,
  onAction,
}) => {
  const icons: Record<string, any> = {
    data: FiInbox,
    search: FiSearch,
    courses: FiBook,
    assignments: FiFileText,
    notifications: FiBell,
    general: FiInbox,
  };

  const Icon = icons[type] || FiInbox;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
