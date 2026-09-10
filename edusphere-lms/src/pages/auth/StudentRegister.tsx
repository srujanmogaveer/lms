import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const StudentRegister: React.FC = () => {
  const navigate = useNavigate();
  const { registerStudent, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign up. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.phone && formData.phone.trim().length > 0 && formData.phone.trim().length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    if (!formData.termsAgreed) {
      setError('You must agree to the Terms & Privacy Policy.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await registerStudent({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        termsAgreed: formData.termsAgreed,
      });
      setIsLoading(false);
      navigate('/auth/student-login', {
        state: { message: 'Registration successful! Please login with your credentials.' },
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[20px] p-8 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <FiUser className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Create Account</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Join 25,000+ learners on EduSphere LMS</p>
      </div>

      {/* Google Sign Up */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleGoogleSignUp}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-sm"
      >
        <FcGoogle className="w-4 h-4" /> Sign Up with Google
      </motion.button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 text-[11px] font-semibold text-slate-400 uppercase absolute">
          OR WITH EMAIL
        </span>
      </div>

      {/* Error Message Styling */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Full Name *
          </label>
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Alex Johnson"
              required
              aria-label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Email Address *
          </label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="email"
              placeholder="alex@example.com"
              required
              aria-label="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Mobile Number (+91) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Mobile Number (+91)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
              +91
            </span>
            <input
              type="tel"
              placeholder="98765 43210"
              aria-label="Mobile Number"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: numericOnly });
              }}
              className="w-full pl-12 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Password *
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                aria-label="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Confirm Password *
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                aria-label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
          <input
            type="checkbox"
            checked={formData.termsAgreed}
            onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>I agree to the <Link to="/terms" className="text-emerald-600 hover:underline">Terms</Link> & <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link></span>
        </label>

        {/* Register Button */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Registering Account...</span>
            </>
          ) : (
            <span>Register Account</span>
          )}
        </motion.button>
      </form>

      {/* Buttons / Navigation Links */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center space-y-2 text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/auth/student-login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Back to Login
          </Link>
        </p>
        <Link
          to="/auth/role-selection"
          className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors pt-1"
        >
          <FiArrowLeft className="w-3.5 h-3.5" /> Back to Role Selection
        </Link>
      </div>
    </motion.div>
  );
};
