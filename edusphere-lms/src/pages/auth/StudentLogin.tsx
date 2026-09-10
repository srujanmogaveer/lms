import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate Google sign in. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login({ email, password, role: 'student' });
      setIsLoading(false);
      navigate('/student');
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid email or password')) {
        setErrorMessage('Invalid email or password. Please verify your credentials or sign in with Google.');
      } else {
        setErrorMessage(err.message || 'Sign-in failed. Please check your credentials and try again.');
      }
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
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Welcome Back</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Access your enrolled courses, quizzes, and learning dashboard</p>
      </div>

      {/* Google Sign-In Option for Students */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-sm"
      >
        <FcGoogle className="w-4 h-4" /> Continue with Google
      </motion.button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 text-[11px] font-semibold text-slate-400 uppercase absolute">
          OR WITH EMAIL
        </span>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Email Address
          </label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="email"
              placeholder="alex.johnson@example.com"
              required
              aria-label="Student Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          </div>
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
            Remember Me
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
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
          className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In to Portal</span>
          )}
        </motion.button>
      </form>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center space-y-2 text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          Don't have a student account?{' '}
          <Link to="/auth/student-register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Create Account
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
