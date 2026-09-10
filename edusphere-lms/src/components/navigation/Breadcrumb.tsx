import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  // Generate breadcrumb items automatically if not provided explicitly
  const defaultItems: BreadcrumbItem[] = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => {
      const path = `/${array.slice(0, index + 1).join('/')}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      return { label, path };
    });

  const activeItems = items || [{ label: 'Home', path: '/' }, ...defaultItems];

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <ol className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <li>
          <Link to="/" className="flex items-center hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <FiHome className="w-4 h-4 mr-1" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {activeItems.map((item, idx) => {
          const isLast = idx === activeItems.length - 1;
          return (
            <li key={idx} className="flex items-center space-x-2">
              <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {isLast || !item.path ? (
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
              ) : (
                <Link to={item.path} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
