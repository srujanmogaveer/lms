import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiRefreshCw, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { TextInput } from '../../components/forms/TextInput';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  // Handle countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  const handleSendResetEmail = async (targetEmail: string) => {
    if (!targetEmail.trim()) return;
    setIsLoading(true);
    setErrorStatus(null);

    try {
      await authService.forgotPassword(targetEmail.trim().toLowerCase());
    } catch (err: any) {
      // Catch error internally to prevent email enumeration, but log in dev
      if (err?.message && !err.message.includes('network')) {
        // Silent
      }
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
      setCooldown(60); // 60-second anti-spam cooldown
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    await handleSendResetEmail(email);
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    await handleSendResetEmail(email);
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="text-center space-y-1">
        <div className="p-3 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-full w-fit mx-auto mb-2">
          <FiMail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Reset Your Password</h2>
        <p className="text-xs text-slate-500">
          Enter your registered email address to receive a secure password recovery link.
        </p>
      </div>

      {errorStatus && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      {isSubmitted ? (
        <div className="space-y-4">
          <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Recovery Link Dispatched</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              If an account is associated with <strong className="text-slate-900 dark:text-slate-100">{email}</strong>, you will receive an email shortly with instructions to reset your password.
            </p>
            <p className="text-[11px] text-slate-400">
              Please check your inbox and spam/junk folder.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className="w-full flex items-center justify-center gap-2 text-xs"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{cooldown > 0 ? `Resend Link in ${cooldown}s` : 'Resend Recovery Email'}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="w-full text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Use a different email address
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Registered Email Address"
            type="email"
            placeholder="example@gmail.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
            isLoading={isLoading}
            disabled={!email.trim() || isLoading}
          >
            Send Recovery Link
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
