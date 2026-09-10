import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCheckCircle } from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const PendingApproval: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card className="p-8 text-center space-y-6">
      <div className="p-4 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-full w-fit mx-auto">
        <FiClock className="w-10 h-10 animate-spin-slow" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Application Under Review</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your Instructor account application has been received and is awaiting administrator verification.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-left space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <p className="font-semibold text-slate-800 dark:text-slate-200">What happens next?</p>
        <div className="flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Admin reviews credentials & background</span>
        </div>
        <div className="flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Approval notification sent via email within 24 hours</span>
        </div>
      </div>

      <Button variant="primary" className="w-full py-2.5" onClick={() => navigate('/auth/instructor-login')}>
        Return to Instructor Sign In
      </Button>
    </Card>
  );
};
