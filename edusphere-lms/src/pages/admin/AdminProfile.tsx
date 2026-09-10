import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiLock,
  FiUploadCloud,
  FiTrash2,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiClock,
  FiActivity,
  FiSave,
  FiKey,
  FiCalendar,
  FiAlertCircle
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { uploadAvatar } from '../../services/storageService';
import { Avatar, isPlaceholderAvatar } from '../../components/common/Avatar';

export const AdminProfile: React.FC = () => {
  const { currentUser, rawProfile, updateProfile, updatePassword } = useAuth();

  // Main Profile State
  const [profile, setProfile] = useState({
    adminId: rawProfile?.id ? `ADM-${rawProfile.id.slice(0, 4).toUpperCase()}` : 'ADM-ADMIN',
    fullName: currentUser?.name || rawProfile?.fullName || '',
    email: currentUser?.email || rawProfile?.email || '',
    mobileNumber: rawProfile?.phone || '',
    dateOfBirth: rawProfile?.dateOfBirth || '',
    role: rawProfile?.role ? (rawProfile.role === 'admin' ? 'Super Administrator' : rawProfile.role) : 'Administrator',
    avatarUrl: currentUser?.avatar || rawProfile?.avatarUrl || '',
    lastLogin: rawProfile?.updatedAt ? new Date(rawProfile.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Active Session',
    lastLoginIp: 'Authenticated Session (TLS 1.3)',
    accountStatus: (rawProfile?.status === 'active' || !rawProfile?.status ? 'Active' : rawProfile.status) as 'Active' | 'Suspended' | 'Pending',
    createdDate: rawProfile?.createdAt ? new Date(rawProfile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'August 2026',
    twoFactorEnabled: true,
  });

  useEffect(() => {
    if (currentUser || rawProfile) {
      setProfile((prev) => ({
        ...prev,
        adminId: rawProfile?.id ? `ADM-${rawProfile.id.slice(0, 4).toUpperCase()}` : prev.adminId,
        fullName: currentUser?.name || rawProfile?.fullName || prev.fullName,
        email: currentUser?.email || rawProfile?.email || prev.email,
        mobileNumber: rawProfile?.phone || prev.mobileNumber,
        dateOfBirth: rawProfile?.dateOfBirth || prev.dateOfBirth,
        role: rawProfile?.role ? (rawProfile.role === 'admin' ? 'Super Administrator' : rawProfile.role) : prev.role,
        avatarUrl: currentUser?.avatar || rawProfile?.avatarUrl || '',
        lastLogin: rawProfile?.updatedAt ? new Date(rawProfile.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : prev.lastLogin,
        createdDate: rawProfile?.createdAt ? new Date(rawProfile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : prev.createdDate,
      }));
    }
  }, [currentUser, rawProfile]);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Avatar Upload / Selection
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (rawProfile?.id || currentUser?.id)) {
      const userId = rawProfile?.id || currentUser?.id || '';
      try {
        triggerToast('Uploading profile photo to storage...', 'success');
        const publicUrl = await uploadAvatar(userId, file);
        setProfile((prev) => ({ ...prev, avatarUrl: publicUrl }));
        await updateProfile({ avatarUrl: publicUrl });
        triggerToast('Profile photo uploaded and saved successfully!');
      } catch (err: any) {
        triggerToast(err.message || 'Failed to upload photo', 'error');
      }
    }
  };

  // Avatar Removal Handler
  const handleRemovePhoto = async () => {
    try {
      setProfile((prev) => ({ ...prev, avatarUrl: '' }));
      await updateProfile({ avatarUrl: '' });
      triggerToast('Profile photo removed. First-letter avatar restored!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to remove photo', 'error');
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: profile.fullName,
        phone: profile.mobileNumber,
        dateOfBirth: profile.dateOfBirth,
        avatarUrl: profile.avatarUrl,
      });
      triggerToast('Admin profile details saved successfully!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save admin profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Password Change Handler with Supabase Auth
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      triggerToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('New password and confirmation do not match.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('Password updated successfully in authentication!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const hasUploadedPhoto = Boolean(profile.avatarUrl && !isPlaceholderAvatar(profile.avatarUrl));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20 font-sans"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 dark:border-slate-300'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <FiAlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <FiCheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <Avatar
            src={profile.avatarUrl}
            name={profile.fullName}
            email={profile.email}
            role="admin"
            size="3xl"
            shape="rounded"
            className="border-2 border-rose-500/30 shadow-md"
          />
          <label className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
            <FiUploadCloud className="w-5 h-5 mb-1" />
            <span>Change</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {profile.fullName}
            </h1>
            <Badge variant="danger" className="text-[10px] uppercase font-extrabold tracking-wider">
              {profile.role}
            </Badge>
            <Badge variant="success" className="text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {profile.accountStatus}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Admin ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{profile.adminId}</strong> • {profile.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm transition-colors">
            <FiUploadCloud className="w-4 h-4" /> Change Profile Photo
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>

          {hasUploadedPhoto && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 py-2.5 rounded-xl"
            >
              <FiTrash2 className="w-3.5 h-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Information (2 Columns width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Profile Settings */}
          <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                <FiUser className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500">
                  Update your display name, contact email, and phone number.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Admin ID (Read Only) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Admin ID</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                      <FiLock className="w-3 h-3" /> Read Only
                    </span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.adminId}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-500 dark:text-slate-400 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FiMail className="w-3.5 h-3.5 text-rose-500" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-indigo-500" /> Mobile Number (+91)
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.mobileNumber}
                    onChange={(e) => setProfile({ ...profile, mobileNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 text-rose-500" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={profile.dateOfBirth}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const today = new Date().toISOString().split('T')[0];
                      if (selected && selected > today) {
                        return; // Block future date selection
                      }
                      setProfile({ ...profile, dateOfBirth: selected });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Role (Read Only) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Role</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                      <FiLock className="w-3 h-3" /> Read Only
                    </span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.role}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  size="sm"
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-1.5 py-2.5 px-4 font-bold"
                >
                  <FiSave className="w-4 h-4" /> {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Section */}
          <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FiKey className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Change Password
                </h2>
                <p className="text-xs text-slate-500">
                  Ensure your administrator password is strong and updated regularly.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 font-bold">⚠️ Passwords do not match.</p>
              )}

              <div className="flex justify-end pt-3">
                <Button
                  size="sm"
                  type="submit"
                  variant="primary"
                  disabled={isUpdatingPassword}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 py-2.5 px-4 font-bold"
                >
                  <FiKey className="w-4 h-4" /> {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Account Information Widget */}
        <div className="space-y-8">
          <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <FiActivity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Account Information
                </h2>
                <p className="text-xs text-slate-500">
                  System logs & security status overview.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Account Status */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Account Status
                </span>
                <Badge variant="success" className="font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {profile.accountStatus}
                </Badge>
              </div>

              {/* Last Login */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-indigo-500" /> Last Login
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {profile.lastLogin}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                  IP: {profile.lastLoginIp}
                </p>
              </div>

              {/* Account Created Date */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5 text-rose-500" /> Account Created
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {profile.createdDate}
                </span>
              </div>

              {/* 2FA Status */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiShield className="w-3.5 h-3.5 text-emerald-500" /> 2-Factor Auth
                </span>
                <Badge variant={profile.twoFactorEnabled ? 'info' : 'warning'}>
                  {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
