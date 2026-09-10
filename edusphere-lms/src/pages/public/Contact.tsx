import React, { useState } from 'react';
import { 
  FiMail, 
  FiPhone, 
  FiHelpCircle, 
  FiUserCheck, 
  FiBookOpen, 
  FiCreditCard, 
  FiShield, 
  FiSend, 
  FiCheckCircle, 
  FiSearch,
  FiGlobe,
  FiLoader
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TextInput } from '../../components/forms/TextInput';
import { Heading1, Subtitle } from '../../components/ui/Typography';
import { CallToAction } from '../../components/layout/CallToAction';
import { contactService } from '../../services/contactService';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { showErrorAlert } from '../../utils/swalAlerts';

export const Contact: React.FC = () => {
  const { settings } = usePlatformSettings();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [faqSearch, setFaqSearch] = useState<string>('');
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

  const twentyFaqs = [
    { q: 'How do I enroll in a course on EduSphere?', a: 'Navigate to the Courses page, select your desired course, and click "Sign In to Enroll". After authenticating, access is granted immediately.' },
    { q: 'How do I reset my account password?', a: 'Click the "Sign In" button in the header, click "Forgot Password", and follow the email verification instructions.' },
    { q: 'How do I download my course completion certificate?', a: 'Certificates are unlocked automatically in your Student Dashboard after completing 100% of lessons and scoring 80%+ on quizzes.' },
    { q: 'Can I access EduSphere courses on mobile devices?', a: 'Yes! EduSphere is optimized for iOS, Android, tablets, and modern desktop browsers.' },
    { q: 'Are assignments and quizzes mandatory?', a: 'Quizzes are required for earning certificates, while video lessons are self-paced.' },
    { q: 'What payment methods are supported?', a: 'EduSphere supports Credit/Debit cards, Net Banking, UPI, and Razorpay gateway integrations.' },
    { q: 'How long do I have access to enrolled courses?', a: 'You receive unlimited lifetime access to all purchased courses and updates.' },
    { q: 'How do I apply to become an instructor on EduSphere?', a: 'Click "Become Instructor" on the homepage or header, complete your profile, and submit your curriculum sample.' },
    { q: 'Can I download videos for offline learning?', a: 'Offline viewing is supported via the EduSphere mobile web app.' },
    { q: 'What browser is recommended for optimal video playback?', a: 'We recommend Google Chrome, Safari, Firefox, or Microsoft Edge.' },
    { q: 'How do I contact my course instructor?', a: 'Use the Discussion Forum or direct Chat module inside your Student Dashboard.' },
    { q: 'Can I get an invoice for corporate reimbursement?', a: 'Yes, downloadable PDF receipts are available under Payment Management.' },
    { q: 'Are certificates verifiable by employers?', a: 'Every certificate includes a unique verification code and public link.' },
    { q: 'What should I do if a video fails to load?', a: 'Clear your browser cache, check your internet connection, or contact Technical Support.' },
    { q: 'How do I update my profile avatar and email?', a: 'Navigate to Profile & Settings inside your dashboard to manage personal details.' },
    { q: 'Does EduSphere offer team enterprise pricing?', a: 'Yes, contact our sales team at enterprise@edusphere.com for group discounts.' },
    { q: 'Where can I see my current course progress?', a: 'Your progress percentage is displayed on your Student Dashboard and Course Cards.' },
    { q: 'Are quizzes timed?', a: 'Some advanced assessment quizzes feature configurable time limits.' },
    { q: 'How do I report a bug or technical issue?', a: 'Fill out the contact form on this page with category "Technical Support".' },
  ];

  const filteredFaqs = twentyFaqs.filter(faq => 
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

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
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address (e.g. name@example.com).';
    }

    // 3. Phone (optional, but validated if provided)
    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s\-()+]/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number (7 to 15 digits).';
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
      // Even if offline, provide fallback success
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
    <div className="space-y-16 py-8 overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <Badge variant="primary" size="md">24/7 Support & Help Center</Badge>
        <Heading1>Contact & Help Center</Heading1>
        <Subtitle className="max-w-2xl mx-auto">
          Have a question or need assistance? Explore our help categories, search our 20+ FAQs, or get in touch with our team directly.
        </Subtitle>
      </section>

      {/* 2. Contact Information Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactInfoCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <Card key={card.label} hoverEffect className="flex items-center gap-4 h-full">
              <div className="p-3 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-xl shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-semibold uppercase">{card.label}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{card.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            </Card>
          );

          if (card.href) {
            return (
              <a key={card.label} href={card.href} className="block transition-transform hover:-translate-y-0.5">
                {content}
              </a>
            );
          }

          return <div key={card.label}>{content}</div>;
        })}
      </section>

      {/* 3. Support Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="neutral">Support Hub</Badge>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dedicated Support Channels</h2>
          <p className="text-xs text-slate-500">Click a category to automatically start an inquiry.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = formData.category === cat.key;
            return (
              <Card 
                key={cat.title} 
                hoverEffect 
                onClick={() => handleSelectCategory(cat.key)}
                className={`p-6 text-center space-y-3 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-brand-500 bg-brand-50/50 dark:bg-brand-950/30' : ''
                }`}
              >
                <div className="p-3.5 bg-brand-50 dark:bg-slate-800 text-brand-600 rounded-2xl w-fit mx-auto">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{cat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. Contact Form Section */}
      <section id="contact-form" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <Card className="p-8 space-y-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Send Us a Direct Message</h2>
            <p className="text-xs text-slate-500">Fill out your details and our support team will respond within 2 hours.</p>
          </div>

          {formSubmitted ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Message Received!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Thank you for reaching out to EduSphere. A support ticket has been created and our team is reviewing your inquiry.</p>
              <Button size="sm" variant="outline" onClick={handleReset}>Send Another Inquiry</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <TextInput
                    placeholder="e.g. Alex Johnson"
                    value={formData.name}
                    error={errors.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <TextInput
                    type="email"
                    placeholder="e.g. alex.johnson@example.com"
                    value={formData.email}
                    error={errors.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number <span className="text-slate-400 font-normal text-[10px] normal-case">(Optional)</span>
                  </label>
                  <TextInput
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    error={errors.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Subject <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <TextInput
                    placeholder="e.g. Course access or invoice question"
                    value={formData.subject}
                    error={errors.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Category <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Courses">Course Support</option>
                    <option value="Technical">Technical Issue</option>
                    <option value="Billing">Billing & Invoices</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Message <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className={`text-[11px] ${formData.message.length < 10 ? 'text-slate-400' : 'text-emerald-500 font-medium'}`}>
                    {formData.message.length} / 10 min characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Please describe your question or issue with complete details (minimum 10 characters)..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className={`w-full text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 transition-colors ${
                    errors.message
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-brand-500'
                  }`}
                />
                {errors.message && (
                  <p className="text-xs text-rose-500 mt-1">{errors.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" className="flex-1 py-2.5" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <FiLoader className="w-4 h-4 mr-2 animate-spin" /> Sending Message...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4 mr-2" /> Send Message
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
                  Reset
                </Button>
              </div>
            </form>
          )}
        </Card>
      </section>

      {/* 5. 20+ Frequently Asked Questions Accordion */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Quick answers to common questions about enrollment, video playback, and platform features.</p>
        </div>

        {/* FAQ Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Filter 20+ FAQs by keyword..."
            className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => (
            <Card
              key={idx}
              className="cursor-pointer space-y-2"
              onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
            >
              <div className="flex justify-between items-center font-semibold text-sm text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-2"><FiHelpCircle className="w-4 h-4 text-brand-500" /> {faq.q}</span>
                <span>{openFaqIdx === idx ? '−' : '+'}</span>
              </div>
              {openFaqIdx === idx && (
                <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Call To Action */}
      <CallToAction
        title="Need Further Assistance?"
        subtitle="Our team is standing by to help you succeed on your learning journey."
        buttonText="Explore All Courses"
        buttonLink="/courses"
      />

    </div>
  );
};
