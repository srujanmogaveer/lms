import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('success');

  return (
    <Card className="p-8 text-center space-y-6">
      {status === 'success' && (
        <div className="space-y-3">
          <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Email Verified!</h2>
          <p className="text-xs text-slate-500">Your account has been registered and verified. Please sign in to access your portal.</p>
          <Button variant="primary" className="w-full py-2.5 mt-4" onClick={() => navigate('/auth/student-login')}>
            Proceed to Sign In
          </Button>
        </div>
      )}

      {status === 'pending' && (
        <div className="space-y-3">
          <FiClock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Verification Pending</h2>
          <p className="text-xs text-slate-500">We sent a verification link to your inbox. Please check your email to activate your account.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="w-full" onClick={() => setStatus('success')}>Simulate Success</Button>
            <Button variant="ghost" className="w-full" onClick={() => setStatus('failed')}>Simulate Failure</Button>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-3">
          <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Verification Failed</h2>
          <p className="text-xs text-slate-500">The verification link is invalid or has expired. Please request a new link.</p>
          <Button variant="primary" className="w-full py-2.5 mt-4" onClick={() => setStatus('pending')}>
            Resend Email Link
          </Button>
        </div>
      )}
    </Card>
  );
};
