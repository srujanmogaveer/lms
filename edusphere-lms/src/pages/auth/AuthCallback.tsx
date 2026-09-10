import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processOAuthCallback = async () => {
      try {
        // 1. Retrieve session from Supabase OAuth redirect URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error(sessionError?.message || 'Authentication session could not be established.');
        }

        // 2. Persist access tokens for apiClient
        localStorage.setItem('supabase_access_token', session.access_token);
        if (session.refresh_token) {
          localStorage.setItem('supabase_refresh_token', session.refresh_token);
        }

        // 3. Verify authenticated profile via backend API /auth/me
        const profileRes = await authService.getCurrentUser();

        if (!profileRes.success || !profileRes.data) {
          throw new Error('User profile could not be loaded or verified.');
        }

        const profile = profileRes.data;

        // 4. Update AuthContext state
        await refreshProfile();

        // 5. Navigate strictly to Student Dashboard for student Google Sign-In
        if (isMounted) {
          if (profile.role === 'admin') {
            navigate('/admin', { replace: true });
          } else if (profile.role === 'instructor' && profile.instructorApprovalStatus !== 'approved') {
            navigate('/auth/pending-approval', { replace: true });
          } else if (profile.role === 'instructor') {
            navigate('/instructor', { replace: true });
          } else {
            // Default and verified student role -> Student Dashboard
            navigate('/student', { replace: true });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorStatus(err.message || 'Google sign-in verification failed.');
          setTimeout(() => {
            navigate('/auth/student-login', {
              state: { errorMessage: err.message || 'Google sign-in verification failed. Please try again.' },
              replace: true,
            });
          }, 2000);
        }
      }
    };

    processOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshProfile]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center space-y-4">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        {errorStatus ? 'Authentication Failed' : 'Verifying Google Account...'}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm">
        {errorStatus || 'Please wait while we verify your session and securely load your student dashboard.'}
      </p>
    </div>
  );
};
