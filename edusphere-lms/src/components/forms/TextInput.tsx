import React from 'react';
import { Label } from '../ui/Typography';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative rounded-lg shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
            icon ? 'pl-9' : 'pl-3'
          } pr-3 py-2 ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
};
