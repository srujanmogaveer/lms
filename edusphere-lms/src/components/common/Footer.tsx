import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400">
            <FiBookOpen className="w-6 h-6" />
            <span>EduSphere LMS</span>
          </Link>
          <p className="text-sm">
            Empowering institutions, instructors, and learners globally with next-generation digital education tools.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">All Courses</Link></li>
            <li><Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-400">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400">Enterprise Pricing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/docs" className="hover:text-brand-600 dark:hover:text-brand-400">Documentation</Link></li>
            <li><Link to="/help" className="hover:text-brand-600 dark:hover:text-brand-400">Help Center</Link></li>
            <li><Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">Connect</h4>
          <div className="flex gap-4">
            <a href="#" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-brand-600"><FiGithub className="w-5 h-5" /></a>
            <a href="#" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-brand-600"><FiTwitter className="w-5 h-5" /></a>
            <a href="#" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-brand-600"><FiLinkedin className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-xs text-center">
        © {new Date().getFullYear()} EduSphere LMS Inc. All rights reserved. Built for production scalable architecture.
      </div>
    </footer>
  );
};
