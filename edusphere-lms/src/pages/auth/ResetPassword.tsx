import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiLock,
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiShield,
} from 'react-icons/fi';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

type RecoveryState = 'checking' | 'valid' | 'invalid' | 'expired';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  // Recovery Session State
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Detect and Validate Supabase Password Recovery Session
  useEffect(() => {
    let isMounted = true;

    // Check if error parameters are present in URL hash/query
    const hash = window.location.hash;
    const search = window.location.search;
    const urlParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : search);
    const errorDesc = urlParams.get('error_description');
    const errorCode = urlParams.get('error_code');

    if (errorDesc || errorCode) {
      if (isMounted) {
        setRecoveryState(errorCode === 'otp_expired' ? 'expired' : 'invalid');
        setSessionErrorMessage(
          errorDesc?.replace(/\+/g, ' ') || 'The password reset link is invalid or has expired.'
        );
      }
      return;
    }

    // Check existing active session
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted) {
          if (session) {
            setRecoveryState('valid');
          } else {
            // Set checking timeout in case onAuthStateChange fires with PASSWORD_RECOVERY
            setTimeout(() => {
              if (isMounted && recoveryState === 'checking') {
                // If still no session detected after delay, mark as expired/invalid
                setRecoveryState((prev) => (prev === 'checking' ? 'invalid' : prev));
              }
            }, 1200);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setRecoveryState('invalid');
          setSessionErrorMessage(err.message || 'Failed to verify recovery session.');
        }
      }
    };

    checkInitialSession();

    // 2. Listen to Supabase Auth State Change for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryState('valid');
          setSessionErrorMessage(null);
        } else if (event === 'SIGNED_IN' && session) {
          setRecoveryState('valid');
        } else if (event === 'SIGNED_OUT') {
          if (recoveryState !== 'checking') {
            setRecoveryState('invalid');
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [recoveryState]);

  // 3. Password Strength Evaluation
  const strengthMetrics = useMemo(() => {
    const checks = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    let label = 'Weak';
    let color = 'bg-rose-500 text-rose-600';

    if (score >= 4 && checks.minLength) {
      label = 'Strong';
      color = 'bg-emerald-500 text-emerald-600';
    } else if (score >= 3 && checks.minLength) {
      label = 'Good';
      color = 'bg-blue-500 text-blue-600';
    } else if (score >= 2) {
      label = 'Fair';
      color = 'bg-amber-500 text-amber-600';
    }

    return { checks, score, label, color };
  }, [password]);

  // 4. Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (recoveryState !== 'valid') {
      setFormError('No active recovery session. Please request a new password reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // Update password directly using Supabase authenticated recovery session
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      // Safely terminate the recovery session to prevent session leaks
      await supabase.auth.signOut().catch(() => null);

      setIsSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="text-center space-y-1">
        <div className="p-3 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-full w-fit mx-auto mb-2">
          <FiLock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Set New Password</h2>
        <p className="text-xs text-slate-500">
          Create a strong, unique password to secure your EduSphere account.
        </p>
      </div>

      {/* Success State */}
      {isSuccess ? (
        <div className="p-6 text-center space-y-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Password Updated!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your account password has been changed successfully. The recovery session has been terminated. You can now sign in with your new credentials.
            </p>
          </div>

          <Button
            size="md"
            variant="primary"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
            onClick={() => navigate('/auth/role-selection', { replace: true })}
          >
            Proceed to Sign In
          </Button>
        </div>
      ) : recoveryState === 'checking' ? (
        /* Checking Session State */
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Verifying secure recovery link...</p>
        </div>
      ) : recoveryState === 'invalid' || recoveryState === 'expired' ? (
        /* Invalid or Expired Recovery Link */
        <div className="p-6 text-center space-y-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl">
          <FiAlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {recoveryState === 'expired' ? 'Recovery Link Expired' : 'Invalid Reset Link'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {sessionErrorMessage ||
                'This password recovery link has already been used or has expired. For your security, password reset links are valid for a single use.'}
            </p>
          </div>

          <Link to="/auth/forgot-password" className="block">
            <Button size="sm" variant="primary" className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      ) : (
        /* Valid Recovery Session Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Active Recovery Session Notice */}
          <div className="p-3 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/80 rounded-xl flex items-center gap-2 text-xs text-brand-700 dark:text-brand-300">
            <FiShield className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Authenticated recovery session verified.</span>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold text-center">
              {formError}
            </div>
          )}

          <div className="space-y-3">
            <PasswordInput
              label="New Password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            {/* Dynamic Password Strength Meter */}
            {password.length > 0 && (
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Password Strength</span>
                  <span className={`font-extrabold text-[11px] ${strengthMetrics.color.split(' ')[1]}`}>
                    {strengthMetrics.label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthMetrics.color.split(' ')[0]}`}
                    style={{ width: `${(strengthMetrics.score / 5) * 100}%` }}
                  />
                </div>

                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div className={`flex items-center gap-1 ${strengthMetrics.checks.minLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {strengthMetrics.checks.minLength ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${strengthMetrics.checks.hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {strengthMetrics.checks.hasUpper ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1 ${strengthMetrics.checks.hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {strengthMetrics.checks.hasNumber ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${strengthMetrics.checks.hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {strengthMetrics.checks.hasSpecial ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}

            <PasswordInput
              label="Confirm New Password"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
            isLoading={isLoading}
            disabled={!password || !confirmPassword || isLoading}
          >
            Update Password
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
        <Link
          to="/auth/role-selection"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Role Selection</span>
        </Link>
      </div>
    </Card>
  );
};
