import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiLogOut,
  FiTrash2,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { showSuccessAlert, showErrorAlert } from '../../utils/swalAlerts';

export const DangerZoneModal: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/role-selection');
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await authService.deleteAccount();
      if (res.success) {
        setIsDeleteModalOpen(false);
        await logout();
        await showSuccessAlert(
          'Account Deleted',
          'Your account and all associated learner data have been permanently removed.'
        );
        navigate('/auth/student/login');
      } else {
        throw new Error(res.message || 'Failed to delete account');
      }
    } catch (err: any) {
      console.error('Account deletion error:', err);
      showErrorAlert(
        'Deletion Failed',
        err.message || 'Unable to delete account at this moment. Please try again later.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-6 border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
        <div className="border-b border-rose-200 dark:border-rose-900/40 pb-3">
          <h3 className="text-base font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5" />
            <span>Danger Zone & Account Termination</span>
          </h3>
          <p className="text-xs text-slate-500">
            Irreversible actions regarding account session termination or permanent account deletion.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="space-y-0.5 text-xs text-center sm:text-left">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              Sign Out of EduSphere LMS Session
            </span>
            <span className="text-slate-500">
              End your active student portal session on this browser device.
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs flex items-center gap-1.5 border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-rose-200/60 dark:border-rose-900/40">
          <div className="space-y-0.5 text-xs text-center sm:text-left">
            <span className="font-bold text-rose-700 dark:text-rose-400 block">
              Permanently Delete Student Account
            </span>
            <span className="text-slate-500">
              Once deleted, all enrolled course progress, certificates, and submitted assignments will be permanently destroyed.
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-xs flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 shadow-md shadow-rose-600/20"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </Button>
        </div>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <BaseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-2xl text-rose-900 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <FiAlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Warning: This Action Cannot Be Undone</span>
            </div>
            <p className="leading-relaxed">
              Deleting your EduSphere account will purge all course enrollments, grade transcripts, certificate credentials, and submitted laboratory assignments permanently.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Type "DELETE" to confirm destruction:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-rose-500 outline-none uppercase"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}</span>
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};
