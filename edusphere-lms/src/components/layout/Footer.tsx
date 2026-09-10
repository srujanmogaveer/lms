import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-12 transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Brand Overview */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400">
            <FiBookOpen className="w-6 h-6" />
            <span>EduSphere LMS</span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Empowering students, instructors, and educational institutions worldwide with an enterprise-grade digital learning ecosystem.
          </p>
          
          {/* Newsletter Form */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Subscribe to EduSphere Dispatch
            </p>
            {subscribed ? (
              <p className="text-xs text-emerald-600 font-medium">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  required
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button type="submit" size="sm" variant="primary">
                  <FiMail className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-sm">Quick Links</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">All Courses</Link></li>
            <li><Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-400">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-brand-600 dark:hover:text-brand-400">Contact & Support</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-sm">Top Categories</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/courses?cat=dev" className="hover:text-brand-600 dark:hover:text-brand-400">Software Development</Link></li>
            <li><Link to="/courses?cat=design" className="hover:text-brand-600 dark:hover:text-brand-400">UI/UX Design Systems</Link></li>
            <li><Link to="/courses?cat=ai" className="hover:text-brand-600 dark:hover:text-brand-400">Machine Learning & AI</Link></li>
            <li><Link to="/courses?cat=business" className="hover:text-brand-600 dark:hover:text-brand-400">Business & Analytics</Link></li>
          </ul>
        </div>

        {/* Legal & Social */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-sm">Legal & Connect</h4>
          <ul className="space-y-2 text-xs mb-4">
            <li><Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-brand-600 dark:hover:text-brand-400">Terms & Conditions</Link></li>
          </ul>
          <div className="flex gap-3">
            <a href="#" aria-label="Github" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-brand-600"><FiGithub className="w-4 h-4" /></a>
            <a href="#" aria-label="Twitter" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-brand-600"><FiTwitter className="w-4 h-4" /></a>
            <a href="#" aria-label="LinkedIn" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-brand-600"><FiLinkedin className="w-4 h-4" /></a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-xs text-center text-slate-400">
        © {new Date().getFullYear()} EduSphere LMS Inc. All rights reserved. Enterprise modular UI architecture.
      </div>
    </footer>
  );
};
