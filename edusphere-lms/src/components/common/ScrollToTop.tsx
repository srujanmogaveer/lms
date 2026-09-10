import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets window and container scroll positions to the top (0, 0).
 */
export const resetScrollToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const scrollContainers = document.querySelectorAll('main, .overflow-y-auto, [data-scroll-container]');
  scrollContainers.forEach((container) => {
    container.scrollTop = 0;
  });
};

/**
 * ScrollToTop component to be rendered inside BrowserRouter.
 * Listens to location (pathname + search) changes and resets scroll position to the top.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    resetScrollToTop();
  }, [pathname, search]);

  return null;
};
