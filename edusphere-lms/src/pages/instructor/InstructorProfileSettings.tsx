import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiLock,
  FiCamera,
  FiTrash2,
  FiSave,
  FiCheckCircle,
  FiExternalLink,
  FiLogOut,
  FiBriefcase,
  FiKey,
  FiAlertCircle,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { type InstructorProfileDetails } from '../../data/instructorProfileData';
import { PayoutInformationSection } from '../../components/instructor/PayoutInformationSection';
import { useAuth } from '../../contexts/AuthContext';
import { uploadAvatar } from '../../services/storageService';
import { Avatar, isPlaceholderAvatar } from '../../components/common/Avatar';

export const InstructorProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, rawProfile, updateProfile, updatePassword } = useAuth();

  // Profile Form State
  const [profile, setProfile] = useState<InstructorProfileDetails>(() => {
    return {
      id: rawProfile?.id || '',
      instructorId: rawProfile?.id ? `INS-${rawProfile.id.slice(0, 4).toUpperCase()}` : 'INS-INSTRUCTOR',
      fullName: currentUser?.name || rawProfile?.fullName || '',
      email: currentUser?.email || rawProfile?.email || '',
      mobileNumber: rawProfile?.phone || '',
      dateOfBirth: rawProfile?.dateOfBirth || '',
      gender: rawProfile?.gender || 'Male',
      country: rawProfile?.country || 'India',
      state: rawProfile?.state || '',
      city: rawProfile?.city || '',
      photoUrl: currentUser?.avatar || rawProfile?.avatarUrl || '',
      qualification: rawProfile?.qualification || '',
      experienceYears: rawProfile?.experience ? parseInt(rawProfile.experience, 10) || 0 : 0,
      specialization: rawProfile?.specialization || '',
      bio: rawProfile?.bio || '',
      linkedInUrl: rawProfile?.linkedInUrl || '',
      personalWebsite: rawProfile?.personalWebsite || '',
      memberSince: rawProfile?.createdAt ? new Date(rawProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'August 2026',
      lastLogin: rawProfile?.updatedAt ? new Date(rawProfile.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Active',
      profileLastUpdated: rawProfile?.updatedAt ? new Date(rawProfile.updatedAt).toLocaleDateString() : 'Today',
      passwordLastChanged: 'Secured via Supabase Auth',
      lastCoursePublished: 'N/A',
      theme: (rawProfile?.themePreference as any) || 'System',
      language: rawProfile?.languagePreference || 'English',
      timezone: rawProfile?.timezone || 'Asia/Kolkata (IST)',
      notificationPreferences: rawProfile?.notificationPreferences || {
        newStudentEnrollment: true,
        assignmentSubmission: true,
        quizSubmission: true,
        liveClassReminder: true,
        courseReview: true,
        emailNotifications: false,
      },
      privacySettings: rawProfile?.privacySettings || {
        showPublicProfile: true,
        showProfessionalInfo: true,
      },
    };
  });

  useEffect(() => {
    if (currentUser || rawProfile) {
      setProfile((prev) => ({
        ...prev,
        id: rawProfile?.id || prev.id,
        instructorId: rawProfile?.id ? `INS-${rawProfile.id.slice(0, 4).toUpperCase()}` : prev.instructorId,
        fullName: currentUser?.name || rawProfile?.fullName || prev.fullName,
        email: currentUser?.email || rawProfile?.email || prev.email,
        mobileNumber: rawProfile?.phone || prev.mobileNumber,
        dateOfBirth: rawProfile?.dateOfBirth || prev.dateOfBirth,
        gender: rawProfile?.gender || prev.gender,
        country: rawProfile?.country || prev.country,
        state: rawProfile?.state || prev.state,
        city: rawProfile?.city || prev.city,
        photoUrl: currentUser?.avatar || rawProfile?.avatarUrl || '',
        specialization: rawProfile?.specialization || prev.specialization,
        qualification: rawProfile?.qualification || prev.qualification,
        experienceYears: rawProfile?.experience ? parseInt(rawProfile.experience, 10) || prev.experienceYears : prev.experienceYears,
        bio: rawProfile?.bio || prev.bio,
        linkedInUrl: rawProfile?.linkedInUrl || prev.linkedInUrl,
        personalWebsite: rawProfile?.personalWebsite || prev.personalWebsite,
        theme: (rawProfile?.themePreference as any) || prev.theme,
        language: rawProfile?.languagePreference || prev.language,
        notificationPreferences: rawProfile?.notificationPreferences || prev.notificationPreferences,
        privacySettings: rawProfile?.privacySettings || prev.privacySettings,
      }));
    }
  }, [currentUser, rawProfile]);

  // Security Form State
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Password Strength Evaluator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pwd.length < 6) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (pwd.length < 10) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(passwordState.newPassword);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (rawProfile?.id || currentUser?.id)) {
      const userId = rawProfile?.id || currentUser?.id || '';
      try {
        showToast('Uploading profile photo to storage...', 'info');
        const publicUrl = await uploadAvatar(userId, file);
        setProfile((prev) => ({ ...prev, photoUrl: publicUrl }));
        await updateProfile({ avatarUrl: publicUrl });
        showToast('Profile photo uploaded and saved successfully!');
      } catch (err: any) {
        showToast(err.message || 'Failed to update avatar photo', 'error');
      }
    }
  };

  // Handle Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: profile.fullName,
        phone: profile.mobileNumber,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        qualification: profile.qualification,
        experience: String(profile.experienceYears),
        specialization: profile.specialization,
        bio: profile.bio,
        linkedInUrl: profile.linkedInUrl,
        personalWebsite: profile.personalWebsite,
        themePreference: profile.theme,
        languagePreference: profile.language,
        notificationPreferences: profile.notificationPreferences,
        privacySettings: profile.privacySettings,
      });
      localStorage.setItem('edusphere_instructor_profile_completed', 'true');
      showToast('Instructor profile and personal details updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save instructor profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Password Update with Supabase Auth
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordState.newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(passwordState.newPassword);
      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Account password updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const hasUploadedPhoto = Boolean(profile.photoUrl && !isPlaceholderAvatar(profile.photoUrl));

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white rounded-2xl border-slate-700'
            }`}
          >
            {toast.type === 'error' ? (
              <FiAlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <FiCheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
            <FiUser className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Instructor Profile & Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage personal details, professional qualifications, account security, theme preferences, and notification controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast('Opening public instructor profile view...')}
            className="flex items-center gap-1 text-xs"
          >
            <FiExternalLink className="w-3.5 h-3.5" /> View Public Profile
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/login')}
            className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 flex items-center gap-1 text-xs font-bold"
          >
            <FiLogOut className="w-3.5 h-3.5" /> Logout
          </Button>
        </div>
      </div>

      {/* PROFILE HEADER CARD */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                src={profile.photoUrl}
                name={profile.fullName}
                email={profile.email}
                role="instructor"
                size="2xl"
                className="border-4 border-purple-500 shadow-md"
              />
              <label
                className="absolute bottom-0 right-0 p-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow cursor-pointer"
                title="Change Photo"
              >
                <FiCamera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {profile.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                  Instructor
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{profile.instructorId}</span> • Member Since {profile.memberSince}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <FiCamera className="w-3.5 h-3.5 text-purple-600" /> Change Photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            {hasUploadedPhoto && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setProfile((prev) => ({ ...prev, photoUrl: '' }));
                  try {
                    await updateProfile({ avatarUrl: '' });
                    showToast('Profile photo removed. First-letter avatar restored!', 'info');
                  } catch {
                    showToast('Profile photo removed.');
                  }
                }}
                className="text-rose-600 border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1"
              >
                <FiTrash2 className="w-3.5 h-3.5" /> Remove Photo
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 1: PERSONAL INFORMATION */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FiUser className="w-4 h-4 text-purple-600" />
            Personal Information
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (+91) *
              </label>
              <input
                type="text"
                value={profile.mobileNumber}
                onChange={(e) => setProfile({ ...profile, mobileNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth *
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gender *
              </label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Country *
              </label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                State *
              </label>
              <input
                type="text"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                City *
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-1.5"
            >
              <FiSave className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Personal Info'}
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION 2: PROFESSIONAL INFORMATION */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FiBriefcase className="w-4 h-4 text-purple-600" />
            Professional Information
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Academic Qualification *
              </label>
              <input
                type="text"
                value={profile.qualification}
                onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Experience (Years) *
              </label>
              <input
                type="number"
                value={profile.experienceYears}
                onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Specialization *
            </label>
            <input
              type="text"
              value={profile.specialization}
              onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instructor Bio *
            </label>
            <textarea
              rows={4}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL (Optional)
              </label>
              <input
                type="url"
                value={profile.linkedInUrl || ''}
                onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Personal Website (Optional)
              </label>
              <input
                type="url"
                value={profile.personalWebsite || ''}
                onChange={(e) => setProfile({ ...profile, personalWebsite: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-1.5 font-bold"
            >
              <FiSave className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Professional Info'}
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION: PAYOUT INFORMATION */}
      <PayoutInformationSection onShowToast={showToast} />

      {/* SECTION 3: ACCOUNT SECURITY */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FiLock className="w-4 h-4 text-purple-600" />
            Account Security
          </h3>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordState.currentPassword}
                onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordState.newPassword}
                onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              {/* Password Strength Indicator */}
              {passwordState.newPassword && (
                <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${pwdStrength.color} w-${pwdStrength.score === 1 ? '1/3' : pwdStrength.score === 2 ? '2/3' : 'full'}`} />
                  </div>
                  <span className="font-bold text-slate-500">{pwdStrength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordState.confirmPassword}
                onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isUpdatingPassword}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-1 font-bold text-xs"
            >
              <FiKey className="w-4 h-4" /> {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
