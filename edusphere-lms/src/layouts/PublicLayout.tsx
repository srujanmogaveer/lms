import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CallToAction } from '../components/layout/CallToAction';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  // Hide CTA on auth or policy pages if necessary
  const hideCTA = ['/login', '/privacy', '/terms', '/contact'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#070913] text-slate-900 dark:text-slate-100 selection:bg-brand-500/30 selection:text-brand-900 dark:selection:text-brand-200 relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Edge-to-edge atmospheric ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent dark:from-indigo-600/10 dark:via-purple-600/5 dark:to-transparent blur-[120px]" />
        <div className="absolute top-[35%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-blue-500/10 via-cyan-400/5 to-transparent dark:from-blue-600/8 dark:via-cyan-500/5 dark:to-transparent blur-[140px]" />
        <div className="absolute bottom-[-5%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-violet-500/10 via-fuchsia-400/5 to-transparent dark:from-violet-600/8 dark:via-fuchsia-600/5 dark:to-transparent blur-[130px]" />
        {/* Subtle dot matrix pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]" 
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <Header />

      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {!hideCTA && <CallToAction />}

      <Footer />
    </div>
  );
};
