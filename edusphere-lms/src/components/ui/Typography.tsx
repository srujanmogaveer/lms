import React from 'react';

// Typography Components
export const Display: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </h1>
);

export const Heading1: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </h1>
);

export const Heading2: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </h2>
);

export const Heading3: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </h3>
);

export const Heading4: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h4 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </h4>
);

export const Subtitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400 ${className}`}>
    {children}
  </p>
);

export const Body: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed ${className}`}>
    {children}
  </p>
);

export const Caption: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}>
    {children}
  </span>
);

export const Label: React.FC<{ children: React.ReactNode; className?: string; htmlFor?: string }> = ({ children, className = '', htmlFor }) => (
  <label htmlFor={htmlFor} className={`block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 ${className}`}>
    {children}
  </label>
);
