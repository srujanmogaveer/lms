import React, { useState } from 'react';
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiShield,
  FiLink,
  FiXCircle,
  FiKey,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import type { FullStudentProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface AccountSecuritySectionProps {
  profile: FullStudentProfile;
  onUpdateGoogleConnection: (connected: boolean) => void;
}

export const AccountSecuritySection: React.FC<AccountSecuritySectionProps> = ({
  profile,
  onUpdateGoogleConnection,
}) => {
  const { updatePassword } = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute Password Strength
  const getPasswordStrength = () => {
    if (!newPass) return { percent: 0, label: 'None', color: 'brand' as const };
    let score = 0;
    if (newPass.length >= 8) score += 25;
    if (/[A-Z]/.test(newPass)) score += 25;
    if (/[0-9]/.test(newPass)) score += 25;
    if (/[^A-Za-z0-9]/.test(newPass)) score += 25;

    if (score <= 25) return { percent: 25, label: 'Weak Password', color: 'amber' as const };
    if (score <= 50) return { percent: 50, label: 'Medium Security', color: 'amber' as const };
    if (score <= 75) return { percent: 75, label: 'Strong Security', color: 'emerald' as const };
    return { percent: 100, label: 'Unstoppable Security', color: 'emerald' as const };
  };

  const strength = getPasswordStrength();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMessage('New password and confirmation password do not match!');
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(newPass);
      setIsSaved(true);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Change Password Form */}
      <Card className="p-6 space-y-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiLock className="w-5 h-5 text-brand-600" />
              <span>Account Password & Credential Security</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ensure your account is protected with a unique, high-entropy password.
            </p>
          </div>

          {isSaved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
              <FiCheck className="w-3.5 h-3.5" /> Password Updated!
            </span>
          )}

          {errorMessage && (
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-xl border border-rose-200 flex items-center gap-1">
              <FiXCircle className="w-3.5 h-3.5" /> {errorMessage}
            </span>
          )}
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl text-xs">
          {/* Current Password */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500/50 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500/50 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPass && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-semibold">
                  <span className="text-slate-500">Password Strength:</span>
                  <span className={strength.percent >= 75 ? 'text-emerald-600' : 'text-amber-600'}>
                    {strength.label}
                  </span>
                </div>
                <ProgressBar progress={strength.percent} color={strength.color} size="sm" />
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500/50 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <FiKey className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Updating Password...' : 'Update Password'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Connected Accounts */}
      <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-brand-600" />
            <span>Connected Authentication Providers</span>
          </h3>
          <p className="text-xs text-slate-500">
            Manage SSO identity providers linked to your EduSphere LMS account for single sign-on.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {/* Primary Email */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">
                @
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  Primary Email Authentication
                </span>
                <span className="text-slate-500 font-mono">{profile.email}</span>
              </div>
            </div>

            <Badge variant="success">Primary Login</Badge>
          </div>

          {/* Google SSO Account */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-300 font-black text-rose-500 flex items-center justify-center text-sm shadow-xs">
                G
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  Google Workspace SSO
                </span>
                <span className="text-slate-500 font-mono">
                  {profile.isGoogleConnected ? profile.googleEmail : 'Not connected'}
                </span>
              </div>
            </div>

            {profile.isGoogleConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateGoogleConnection(false)}
                className="text-xs flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <FiXCircle className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onUpdateGoogleConnection(true)}
                className="text-xs flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                <FiLink className="w-3.5 h-3.5" />
                <span>Connect Google Account</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
