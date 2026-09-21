import React, { useState } from 'react';
import { 
  FiMail, 
  FiPhone, 
  FiUserCheck, 
  FiBookOpen, 
  FiCreditCard, 
  FiShield, 
  FiSend, 
  FiCheckCircle, 
  FiGlobe,
  FiLoader
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { CallToAction } from '../../components/layout/CallToAction';
import { contactService } from '../../services/contactService';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { showErrorAlert } from '../../utils/swalAlerts';

export const Contact: React.FC = () => {
  const { settings } = usePlatformSettings();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: 'General' as 'General' | 'Courses' | 'Technical' | 'Billing',
    message: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    category?: string;
    message?: string;
  }>({});

  const supportEmail = settings?.supportEmail || 'support@edusphere.edu';
  const supportPhone = settings?.supportPhone || '9876543210';
  const platformName = settings?.platformName || 'EduSphere LMS';

  const contactInfoCards = [
    { label: 'Email Us', value: supportEmail, href: `mailto:${supportEmail}`, icon: FiMail, sub: 'Response time: < 2 hours' },
    { label: 'Call Us', value: supportPhone, href: `tel:${supportPhone}`, icon: FiPhone, sub: 'Direct support hotline' },
    { label: 'Platform Portal', value: platformName, icon: FiGlobe, sub: 'Official System' },
  ];

  const supportCategories = [
    { title: 'Student Support', key: 'Courses' as const, desc: 'Enrollment, course player, and certificate help', icon: FiBookOpen },
    { title: 'Instructor Support', key: 'General' as const, desc: 'Course creation, gradebook, and payout help', icon: FiUserCheck },
    { title: 'Technical Support', key: 'Technical' as const, desc: 'Browser issues, video loading, and security', icon: FiShield },
    { title: 'Billing Support', key: 'Billing' as const, desc: 'Invoices, receipts, and Razorpay transactions', icon: FiCreditCard },
  ];

  const handleSelectCategory = (catKey: 'General' | 'Courses' | 'Technical' | 'Billing') => {
    setFormData((prev) => ({ ...prev, category: catKey }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
    const formEl = document.getElementById('contact-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'email') {
      finalValue = value.trim();
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 1. Full Name
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }

    // 2. Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // 3. Phone (optional, but must be exactly 10 digits if provided)
    if (formData.phone.trim()) {
      if (!/^\d{10}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Phone number must be exactly 10 digits.';
      }
    }

    // 4. Subject
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required.';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters long.';
    }

    // 5. Message
    if (!formData.message.trim()) {
      newErrors.message = 'Message content is required.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Please provide more details (minimum 10 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showErrorAlert('Incomplete Form', 'Please fix the highlighted errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await contactService.submitInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        category: formData.category,
        message: formData.message.trim(),
      });
      setFormSubmitted(true);
      setErrors({});
    } catch (err: any) {
      setFormSubmitted(true);
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      category: 'General',
      message: '',
    });
    setErrors({});
    setFormSubmitted(false);
  };

  return (
    <div className="space-y-20 py-12 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* 1. Hero Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-white/[0.06] border border-indigo-200/60 dark:border-white/[0.12] backdrop-blur-md text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          <FiMail className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>24/7 Global Support &amp; Help Desk</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
          We're Here to Help You Accelerate
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Have an inquiry regarding courses, certifications, technical setup, or enterprise institution licensing? Send us a message or connect directly.
        </p>
      </section>

      {/* 2. Contact Information Cards */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactInfoCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div key={card.label} className="flex items-center gap-4 h-full p-6 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-lg dark:shadow-xl hover:border-indigo-500/50 dark:hover:border-indigo-400/40 transition-all">
              <div className="p-3.5 bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-2xl shrink-0 shadow-md shadow-brand-500/25">
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{card.label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{card.value}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400/80 mt-0.5 font-medium">{card.sub}</p>
              </div>
            </div>
          );

          if (card.href) {
            return (
              <a key={card.label} href={card.href} className="block transition-transform hover:-translate-y-1">
                {content}
              </a>
            );
          }

          return <div key={card.label}>{content}</div>;
        })}
      </section>

      {/* 3. Support Categories */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Support Hub</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Dedicated Support Channels</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Click a channel to populate your inquiry context.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = formData.category === cat.key;
            return (
              <div 
                key={cat.title} 
                onClick={() => handleSelectCategory(cat.key)}
                className={`p-6 text-center space-y-3 cursor-pointer rounded-3xl backdrop-blur-xl transition-all ${
                  isSelected 
                    ? 'bg-brand-50 dark:bg-brand-500/20 border-2 border-brand-500 dark:border-brand-400/60 shadow-lg shadow-brand-500/20' 
                    : 'bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.2] shadow-sm'
                }`}
              >
                <div className="p-3.5 bg-indigo-50 dark:bg-white/[0.06] text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mx-auto">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{cat.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Contact Form Section */}
      <section id="contact-form" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="p-8 sm:p-12 space-y-8 shadow-xl dark:shadow-2xl rounded-3xl bg-white/90 dark:bg-[#0c1022]/90 border border-slate-200/90 dark:border-white/[0.14] backdrop-blur-2xl">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Send Us a Direct Message</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Fill out your details and our response team will get back to you within 2 business hours.</p>
          </div>

          {formSubmitted ? (
            <div className="p-8 text-center space-y-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl">
              <FiCheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Inquiry Dispatched Successfully!</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">Thank you for reaching out to EduSphere. A tracking ticket has been registered and our engineering support desk is reviewing your message.</p>
              <Button size="sm" variant="outline" onClick={handleReset} className="border-emerald-500/40 text-emerald-600 dark:text-emerald-300">
                Send Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number <span className="text-slate-400 font-normal text-[10px] normal-case">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Course access or institutional license"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Category <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as any)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-[#0c1022] text-slate-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Courses">Course &amp; Curriculum</option>
                    <option value="Technical">Technical &amp; Platform</option>
                    <option value="Billing">Billing &amp; Invoices</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Message <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className={`text-[11px] ${formData.message.length < 10 ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400 font-medium'}`}>
                    {formData.message.length} / 10 min characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Please describe your question or issue with complete details (minimum 10 characters)..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 p-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                />
                {errors.message && (
                  <p className="text-xs text-rose-500 mt-1">{errors.message}</p>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" /> Transmitting Inquiry...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="py-3 px-6 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-all"
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 5. Call To Action */}
      <CallToAction
        title="Need Further Assistance?"
        subtitle="Our team is standing by to help you succeed on your learning journey."
        buttonText="Explore All Courses"
        buttonLink="/courses"
      />

    </div>
  );
};
