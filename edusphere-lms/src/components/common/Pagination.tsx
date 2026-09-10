import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Showing <span className="font-bold text-slate-900 dark:text-slate-100">{startItem}</span> to{' '}
        <span className="font-bold text-slate-900 dark:text-slate-100">{endItem}</span> of{' '}
        <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems}</span> saved courses
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <FiChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => (
            <React.Fragment key={idx}>
              {typeof page === 'number' ? (
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span className="px-1 text-slate-400 text-xs font-semibold">...</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
