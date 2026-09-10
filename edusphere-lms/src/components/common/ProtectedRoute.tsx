import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiRefreshCw,
  FiLogOut,
  FiMail,
  FiShieldOff,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { MaintenanceModePage } from '../../pages/public/MaintenanceModePage';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface ProtectedRouteProps {
  /** The role required to access this section */
  allowedRole: 'student' | 'instructor' | 'admin';
  children: React.ReactNode;
}

/** Destination dashboard per role */
const ROLE_DASHBOARD: Record<'student' | 'instructor' | 'admin', string> = {
  student: '/student',
  instructor: '/instructor',
  admin: '/admin',
};

/**
 * Account Deactivated / Inactive Barrier Screen
 */
const AccountInactiveView: React.FC = () => {
  const { currentUser, rawProfile, refreshProfile, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    setStatusNotice(null);
    try {
      await refreshProfile();
      setStatusNotice('Account status refreshed.');
    } catch {
      setStatusNotice('Unable to refresh account status at this moment.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const isPending =
    rawProfile?.instructorApprovalStatus === 'pending' ||
    rawProfile?.status === 'pending_approval';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 rounded-[28px] border border-slate-700/80 bg-slate-800/90 shadow-2xl space-y-6 text-center backdrop-blur-xl">
          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            {isPending ? (
              <FiClock className="w-8 h-8" />
            ) : (
              <FiShieldOff className="w-8 h-8" />
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <Badge variant={isPending ? 'warning' : 'danger'} className="text-xs px-3 py-1">
              {isPending ? '⏳ Application Under Review' : '✕ Account Inactive / Deactivated'}
            </Badge>
            <h2 className="text-xl font-black text-white tracking-tight">
              {isPending
                ? 'Instructor Application Pending'
                : 'Instructor Account Deactivated'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              {isPending
                ? 'Your instructor application has been submitted and is awaiting administrative approval. You will receive full studio access once verified.'
                : 'Your instructor account has been temporarily set to inactive by a platform administrator. While deactivated, access to the Instructor Studio, Course Builder, and Live Classes is restricted.'}
            </p>
          </div>

          {/* Profile Snapshot */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/60 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Account Name:</span>
              <span className="font-bold text-slate-200">{currentUser?.name || 'Instructor'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Email:</span>
              <span className="font-bold text-slate-200">{currentUser?.email}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Current Status:</span>
              <span className="font-bold text-amber-400">
                {isPending ? 'Pending Approval' : 'Inactive / Deactivated'}
              </span>
            </div>
          </div>

          {/* Feedback Notice */}
          {statusNotice && (
            <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
              <FiCheckCircle className="w-3.5 h-3.5" /> {statusNotice}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking Status...' : 'Check Status / Refresh'}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="mailto:support@edusphere.com?subject=Instructor%20Account%20Activation%20Request"
                className="w-full py-2 px-3 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-600 transition-colors"
              >
                <FiMail className="w-3.5 h-3.5 text-indigo-400" /> Contact Support
              </a>

              <Button
                variant="outline"
                onClick={() => logout()}
                className="w-full py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <FiLogOut className="w-3.5 h-3.5 text-rose-400" /> Log Out
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

/**
 * ProtectedRoute
 *
 * Renders children only when:
 *  1. The user is authenticated (has a currentUser).
 *  2. The user's role matches `allowedRole`.
 *  3. The user's account is active (for instructors).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const { currentUser, rawProfile, isAuthenticated, isAuthInitializing, isProfileLoading } = useAuth();
  const { settings } = usePlatformSettings();
  const location = useLocation();

  // Show spinner while authentication or initial profile is being restored
  if (isAuthInitializing || (isProfileLoading && !currentUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your session…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — send to role selection, preserving intended destination
  if (!isAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/auth/role-selection"
        replace
        state={{ from: location }}
      />
    );
  }

  // If maintenance mode is active, block non-admin users from accessing protected portal routes
  if (settings?.enableMaintenanceMode && currentUser.role !== 'admin') {
    return <MaintenanceModePage />;
  }

  // Authenticated but wrong role — redirect to own dashboard
  if (currentUser.role !== allowedRole) {
    const ownDashboard = ROLE_DASHBOARD[currentUser.role as 'student' | 'instructor' | 'admin'] ?? '/';
    return <Navigate to={ownDashboard} replace />;
  }

  // If user is an instructor and their account is deactivated/inactive or pending approval
  if (currentUser.role === 'instructor' && allowedRole === 'instructor') {
    const isInactive =
      currentUser.status === 'inactive' ||
      currentUser.status === 'suspended' ||
      rawProfile?.status === 'inactive' ||
      rawProfile?.status === 'suspended' ||
      rawProfile?.instructorApprovalStatus === 'pending' ||
      rawProfile?.instructorApprovalStatus === 'rejected';

    if (isInactive) {
      return <AccountInactiveView />;
    }
  }

  return <>{children}</>;
};
