import React, { useState } from 'react';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiClock, 
  FiHelpCircle, 
  FiUserCheck, 
  FiBookOpen, 
  FiCreditCard, 
  FiAward, 
  FiShield, 
  FiSearch,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { TiltCard } from '../../components/public/TiltCard';

export const FAQ: React.FC = () => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [activeCategory] = useState<string>('All');
  const [faqSearch, setFaqSearch] = useState<string>('');

  const supportCategories = [
    { title: 'Account & Security', icon: FiShield, count: '6 FAQs' },
    { title: 'Courses & Tracks', icon: FiBookOpen, count: '8 FAQs' },
    { title: 'Payments & Invoices', icon: FiCreditCard, count: '5 FAQs' },
    { title: 'Certificates & Web3', icon: FiAward, count: '6 FAQs' },
    { title: 'Instructor Studio', icon: FiUserCheck, count: '5 FAQs' },
  ];

  const faqs = [
    { cat: 'Courses', q: 'How do I enroll in a course on EduSphere?', a: 'Browse our catalog, click on your desired masterclass, and click "Sign In to Enroll". After authenticating into your student account, access is unlocked instantly.' },
    { cat: 'Account', q: 'How do I reset my portal access credentials?', a: 'Click "Sign In" on the top navigation header and select "Forgot Password". A secure, time-bounded reset link will be sent to your registered email address.' },
    { cat: 'Certificates', q: 'How do I download and share my verified completion certificate?', a: 'Once you complete 100% of course lessons and pass the final assessment with at least 80%, your certificate will automatically unlock in your Student Dashboard with PDF export and direct LinkedIn badge integration.' },
    { cat: 'Courses', q: 'Can I access EduSphere live classes and sandbox on mobile devices?', a: 'Yes! EduSphere is engineered responsively for iOS, Android, iPadOS tablets, and all modern desktop web browsers.' },
    { cat: 'Courses', q: 'Are assignments and quizzes mandatory for course progression?', a: 'Quizzes and milestone projects are required to earn verified certificates, but video lessons and coding sandboxes can be explored at your own custom pace.' },
    { cat: 'Payments', q: 'What payment methods and gateways are supported?', a: 'EduSphere supports Credit/Debit Cards (Visa, Mastercard, Amex), UPI, Net Banking, and secure Razorpay gateway integrations.' },
    { cat: 'Instructor', q: 'How do I apply to become an instructor or academic partner?', a: 'Click "Sign In", select Instructor role or reach out through our Contact page. Our curriculum review board will review your credentials within 48 hours.' },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                          faq.a.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesCat = activeCategory === 'All' || faq.cat === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-20 py-12 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* 1. Hero Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-white/[0.06] border border-indigo-200/60 dark:border-white/[0.12] backdrop-blur-md text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          <HiSparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Knowledge &amp; Resource Center</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Quick answers to common questions about admissions, course streaming, assessments, certificates, and student tools.
        </p>
      </section>

      {/* 2. Contact Information Quick Strip */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Email Support', val: 'support@edusphere.edu', icon: FiMail, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-white/[0.06]' },
          { label: 'Hotline', val: '+91 98765 43210', icon: FiPhone, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-white/[0.06]' },
          { label: 'Campus HQ', val: 'Global Digital Center', icon: FiMapPin, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-white/[0.06]' },
          { label: 'Support Window', val: '24/7 Global Desk', icon: FiClock, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-white/[0.06]' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-6 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-md dark:shadow-none flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{item.val}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. Support Categories */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Categories</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Browse by Topic</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {supportCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TiltCard key={cat.title} tiltIntensity={8}>
                <div className="p-6 text-center space-y-3 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-md dark:shadow-none h-full group">
                  <div className="p-3 bg-indigo-50 dark:bg-white/[0.06] text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{cat.title}</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{cat.count}</span>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* 4. Frequently Asked Questions (FAQ) Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* FAQ Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-3.5 w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <input
            type="text"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Search questions by keyword or topic..."
            className="w-full pl-12 pr-4 py-3.5 text-sm rounded-2xl border border-slate-200/90 dark:border-white/[0.12] bg-white/90 dark:bg-white/[0.05] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 backdrop-blur-xl shadow-md dark:shadow-none"
          />
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl cursor-pointer space-y-3 transition-all hover:border-indigo-500/50 dark:hover:border-indigo-400/40 shadow-md dark:shadow-none"
              onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
            >
              <div className="flex justify-between items-center font-semibold text-base text-slate-900 dark:text-white">
                <span className="flex items-center gap-3">
                  <FiHelpCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" /> {faq.q}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xl shrink-0 ml-4">{openFaqIdx === idx ? '−' : '+'}</span>
              </div>
              {openFaqIdx === idx && (
                <p className="text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200/80 dark:border-white/[0.08] leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
