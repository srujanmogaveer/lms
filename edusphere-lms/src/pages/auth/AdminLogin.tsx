import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState('');

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value || !value.trim()) return 'Admin email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address.';
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

    setErrorMessage('');
    setIsLoading(true);
    try {
      await login({
        email: email.trim(),
        password,
        role: 'admin',
      });
      setIsLoading(false);
      navigate('/admin');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid administrator credentials. Access restricted to authorized Administrator.');
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
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <FiShield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Admin Sign In</h2>
      </div>

      {/* Error Banner */}
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="adminEmail" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Admin Email Address <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <FiMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${fieldErrors.email && touched.email ? 'text-rose-500' : 'text-slate-400'}`} />
            <input
              id="adminEmail"
              type="email"
              placeholder="admin@edusphere.com"
              aria-label="Admin Email Address"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.email && touched.email)}
              className={`w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.email && touched.email
                  ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent'
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
          <label htmlFor="adminPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Password <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <FiLock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${fieldErrors.password && touched.password ? 'text-rose-500' : 'text-slate-400'}`} />
            <input
              id="adminPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              aria-label="Security Password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.password && touched.password)}
              className={`w-full pl-10 pr-10 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.password && touched.password
                  ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
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
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>Remember Me</span>
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In to Control Panel</span>
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center space-y-2 text-xs">
        <p className="text-slate-400 text-[11px] italic">
          Note: Administrator accounts are strictly provisioned by internal system ops. Registration is disabled.
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
