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
  FiSend, 
  FiCheckCircle, 
  FiSearch
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TextInput } from '../../components/forms/TextInput';
import { Heading1, Subtitle } from '../../components/ui/Typography';

export const FAQ: React.FC = () => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [activeCategory] = useState<string>('All');
  const [faqSearch, setFaqSearch] = useState<string>('');
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: 'General',
    message: '',
  });

  const supportCategories = [
    { title: 'Account & Security', icon: FiShield, count: '6 FAQs' },
    { title: 'Courses & Enrollment', icon: FiBookOpen, count: '8 FAQs' },
    { title: 'Payments & Billing', icon: FiCreditCard, count: '5 FAQs' },
    { title: 'Certificates & Quizzes', icon: FiAward, count: '6 FAQs' },
    { title: 'Instructor Studio', icon: FiUserCheck, count: '5 FAQs' },
  ];

  const faqs = [
    { cat: 'Courses', q: 'How do I enroll in a course?', a: 'Browse our catalog, click on your desired masterclass, and click "Sign In to Enroll". After logging in, enrollment is instant.' },
    { cat: 'Account', q: 'How do I reset my password?', a: 'Click "Sign In" on the top navigation header and select "Forgot Password". A reset link will be sent to your registered email.' },
    { cat: 'Certificates', q: 'How do I download my course completion certificate?', a: 'Once you complete 100% of course lessons and pass the final quiz with at least 80%, your certificate will unlock in your Student Dashboard.' },
    { cat: 'Courses', q: 'Can I access courses on mobile devices?', a: 'Yes! EduSphere is built responsive for mobile, tablet, laptop, and desktop browsers.' },
    { cat: 'Courses', q: 'Are assignments and quizzes mandatory?', a: 'Quizzes are required to earn certificates, but video lessons can be learned at your own pace.' },
    { cat: 'Payments', q: 'What payment methods are supported?', a: 'EduSphere supports Credit/Debit Cards, UPI, Net Banking, and Razorpay.' },
    { cat: 'Payments', q: 'How are payments processed?', a: 'All payments are processed securely via UPI, Net Banking, Credit/Debit cards, or Razorpay.' },
    { cat: 'Instructor', q: 'How do I apply to become an instructor?', a: 'Click "Become Instructor" on the homepage or navigation menu and submit your credentials.' },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                          faq.a.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesCat = activeCategory === 'All' || faq.cat === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormSubmitted(true);
    }
  };

  return (
    <div className="space-y-16 py-8 overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <Badge variant="primary" size="md">24/7 Support Center</Badge>
        <Heading1>How Can We Help You Today?</Heading1>
        <Subtitle className="max-w-2xl mx-auto">
          Explore our comprehensive Knowledge Base, reach out to our dedicated support team, or get answers to frequently asked questions.
        </Subtitle>
      </section>

      {/* 2. Contact Information Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverEffect className="flex items-center gap-4">
          <div className="p-3 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-xl">
            <FiMail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Email Us</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">support@edusphere.com</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <FiPhone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Call Us</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">+1 (800) 555-EDUS</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
            <FiMapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Headquarters</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Tech Park, SF, CA</p>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Working Hours</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Mon - Fri: 9am - 6pm</p>
          </div>
        </Card>
      </section>

      {/* 3. Support Categories & Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="neutral">Knowledge Base</Badge>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Help Categories</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {supportCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.title} hoverEffect className="p-5 text-center space-y-2">
                <div className="p-3 bg-brand-50 dark:bg-slate-800 text-brand-600 rounded-xl w-fit mx-auto">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{cat.title}</h3>
                <span className="text-[10px] text-slate-400 block">{cat.count}</span>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. Frequently Asked Questions (FAQ) Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Quick answers to common questions about enrollment, certificates, and billing.</p>
        </div>

        {/* FAQ Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Search FAQs by keyword..."
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

      {/* 5. Contact Form Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Send Us a Message</h2>
            <p className="text-xs text-slate-500">Have a specific question? Fill out the form below and our team will get back to you within 24 hours.</p>
          </div>

          {formSubmitted ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Thank you for reaching out to EduSphere Support. We will respond shortly.</p>
              <Button size="sm" variant="outline" onClick={() => setFormSubmitted(false)}>Send Another Message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Full Name"
                  placeholder="Alex Johnson"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <TextInput
                  label="Email Address"
                  type="email"
                  placeholder="alex@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Courses">Course & Enrollment</option>
                    <option value="Technical">Technical Support</option>
                    <option value="Billing">Billing & Invoices</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Your Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5">
                <FiSend className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </form>
          )}
        </Card>
      </section>

    </div>
  );
};
