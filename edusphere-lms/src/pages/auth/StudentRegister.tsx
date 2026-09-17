import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

export const StudentRegister: React.FC = () => {
  const navigate = useNavigate();
  const { registerStudent, signInWithGoogle } = useAuth();
  const { settings } = usePlatformSettings();

  const isRegistrationOpen = settings?.enableStudentRegistration !== false;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength indicator logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 65, label: 'Medium', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const validateField = (name: string, value: any, currentFormData = formData): string => {
    switch (name) {
      case 'fullName':
        if (!value || !value.trim()) return 'Full Name is required.';
        if (value.trim().length < 2) return 'Full Name must be at least 2 characters long.';
        return '';
      case 'email':
        if (!value || !value.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@gmail.com).';
        }
        return '';
      case 'phone':
        if (!value || !value.trim()) return 'Mobile number is required.';
        if (value.trim().length !== 10) {
          return 'Mobile number must be exactly 10 digits.';
        }
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters long.';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== currentFormData.password) return 'Passwords do not match.';
        return '';
      default:
        return '';
    }
  };

  const validateAll = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const fieldsToValidate = ['fullName', 'email', 'phone', 'password', 'confirmPassword'];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, (formData as any)[field], formData);
      if (err) {
        errors[field] = err;
      }
    });

    return errors;
  };

  const handleInputChange = (field: string, value: any) => {
    const processedValue = field === 'email' && typeof value === 'string' ? value.toLowerCase() : value;
    const updatedForm = { ...formData, [field]: processedValue };
    setFormData(updatedForm);

    if (touched[field] || fieldErrors[field]) {
      const err = validateField(field, processedValue, updatedForm);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }

    if (field === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', formData.confirmPassword, updatedForm);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, (formData as any)[field], formData);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleGoogleSignUp = async () => {
    if (!isRegistrationOpen) {
      setError('Student registration is currently closed by platform administrators.');
      return;
    }
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign up. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isRegistrationOpen) {
      setError('Student registration is currently closed by platform administrators.');
      return;
    }

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const validationErrors = validateAll();
    setFieldErrors(validationErrors);

    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      setError('Please fill in all required fields marked with * correctly.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await registerStudent({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        termsAgreed: true,
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
      className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[24px] p-6 sm:p-8 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <FiUser className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Create Student Account</h2>
      </div>

      {!isRegistrationOpen && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs">
          <FiAlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Student Registration Currently Closed</span>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed block">
              New student sign-ups are temporarily paused by platform administrators. Existing students can sign in normally.
            </span>
          </div>
        </div>
      )}

      {/* Google Sign Up */}
      <motion.button
        whileHover={{ scale: isRegistrationOpen ? 1.01 : 1 }}
        whileTap={{ scale: isRegistrationOpen ? 0.98 : 1 }}
        type="button"
        disabled={!isRegistrationOpen}
        onClick={handleGoogleSignUp}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FcGoogle className="w-4 h-4" /> Sign Up with Google
      </motion.button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase absolute">
          OR WITH EMAIL
        </span>
      </div>

      {/* Error Message Styling */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="flex-1 leading-relaxed">{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="studentFullName" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Full Name <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <FiUser className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${fieldErrors.fullName && touched.fullName ? 'text-rose-500' : 'text-slate-400'}`} />
            <input
              id="studentFullName"
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="Enter your name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.fullName && touched.fullName)}
              className={`w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.fullName && touched.fullName
                  ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
              }`}
            />
          </div>
          <AnimatePresence>
            {fieldErrors.fullName && touched.fullName && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
              >
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                {fieldErrors.fullName}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="studentEmail" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Email Address <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <FiMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.email && touched.email ? 'text-rose-500' : 'text-slate-400'}`} />
            <input
              id="studentEmail"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.email && touched.email)}
              className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.email && touched.email
                  ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
              }`}
            />
          </div>
          <AnimatePresence>
            {fieldErrors.email && touched.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
              >
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                {fieldErrors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Number (+91) */}
        <div className="space-y-1.5">
          <label htmlFor="studentPhone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Mobile Number (+91) <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
              +91
            </span>
            <input
              id="studentPhone"
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="9876543210"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleInputChange('phone', numericOnly);
              }}
              onBlur={() => handleBlur('phone')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.phone && touched.phone)}
              className={`w-full pl-11 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.phone && touched.phone
                  ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
              }`}
            />
          </div>
          <AnimatePresence>
            {fieldErrors.phone && touched.phone && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
              >
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                {fieldErrors.phone}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="studentPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Password <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.password && touched.password ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="studentPassword"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.password && touched.password)}
                className={`w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.password && touched.password
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <AnimatePresence>
              {fieldErrors.password && touched.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="studentConfirmPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Confirm Password <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.confirmPassword && touched.confirmPassword ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="studentConfirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.confirmPassword && touched.confirmPassword)}
                className={`w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.confirmPassword && touched.confirmPassword
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <AnimatePresence>
              {fieldErrors.confirmPassword && touched.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.confirmPassword}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-1 pt-0.5"
          >
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Password Strength:</span>
              <span className={`font-bold ${strength.score >= 100 ? 'text-emerald-500' : strength.score >= 65 ? 'text-amber-500' : 'text-rose-500'}`}>
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400">
              Use at least 8 characters with a mix of uppercase letters, numbers, and symbols.
            </p>
          </motion.div>
        )}

        {/* Register Button */}
        <motion.button
          whileHover={{ scale: isLoading || !isRegistrationOpen ? 1 : 1.01 }}
          whileTap={{ scale: isLoading || !isRegistrationOpen ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading || !isRegistrationOpen}
          className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Student Account...</span>
            </>
          ) : (
            <span>{isRegistrationOpen ? 'Register Account' : 'Registration Closed'}</span>
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
