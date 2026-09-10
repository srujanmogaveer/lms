import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
