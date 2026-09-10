import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Breadcrumb } from '../components/navigation/Breadcrumb';
import { CallToAction } from '../components/layout/CallToAction';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  // Hide CTA on auth or policy pages if necessary
  const hideCTA = ['/login', '/privacy', '/terms'].includes(location.pathname);
  const showBreadcrumbs = location.pathname !== '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#ebf0f7] dark:bg-slate-950 transition-colors">
      <Header />

      {showBreadcrumbs && <Breadcrumb />}

      <main className="flex-1">
        <Outlet />
      </main>

      {!hideCTA && <CallToAction />}

      <Footer />
    </div>
  );
};
