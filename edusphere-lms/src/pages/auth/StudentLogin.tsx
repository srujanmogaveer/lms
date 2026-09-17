import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FiCheckCircle, FiAlertCircle, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(
    (location.state as { errorMessage?: string })?.errorMessage || null
  );
  const [successMessage] = useState<string | null>(
    (location.state as { message?: string })?.message || null
  );

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value || !value.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@gmail.com).';
        }
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        return '';
      default:
        return '';
    }
  };

  const handleEmailChange = (val: string) => {
    const lower = val.toLowerCase();
    setEmail(lower);
    if (touched.email || fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: validateField('email', lower) }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (touched.password || fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: validateField('password', val) }));
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate Google sign in. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ email: true, password: true });
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    const errors: Record<string, string> = {};
    if (emailErr) errors.email = emailErr;
    if (passErr) errors.password = passErr;
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login({
        email: email.trim(),
        password,
        role: 'student',
      });
      setIsLoading(false);
      navigate('/student');
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid email or password')) {
        setErrorMessage('Invalid email or password. Please verify your credentials or use Google sign-in.');
      } else {
        setErrorMessage(err.message || 'Sign-in failed. Please check your credentials and try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[24px] p-6 sm:p-8 shadow-2xl space-y-6"
    >
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <FiUser className="w-6 h-6 stroke-[1.8]" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Student Sign In
        </h2>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </motion.div>
      )}

      {/* Google Sign In */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-sm"
      >
        <FcGoogle className="w-4 h-4" />
        <span>Continue with Google</span>
      </motion.button>

      {/* Divider */}
      <div className="relative flex items-center justify-center py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Or with email
        </span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="studentLoginEmail2" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Email Address <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <FiMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.email && touched.email ? 'text-rose-500' : 'text-slate-400'}`} />
            <input
              id="studentLoginEmail2"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.email && touched.email)}
              className={`w-full pl-9 pr-3.5 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="studentLoginPassword2" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Password <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.password && touched.password ? 'text-rose-500' : 'text-slate-400'}`} />
            <input
              id="studentLoginPassword2"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.password && touched.password)}
              className={`w-full pl-9 pr-9 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Remember Me</span>
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In to Student Portal</span>
          )}
        </motion.button>
      </form>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center space-y-2 text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          Don't have a student account?{' '}
          <Link
            to="/auth/student-register"
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Create Account
          </Link>
        </p>
        <Link
          to="/auth/role-selection"
          className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors pt-1"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Role Selection</span>
        </Link>
      </div>
    </motion.div>
  );
};
