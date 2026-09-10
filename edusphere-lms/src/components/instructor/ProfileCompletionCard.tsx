import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiPlusCircle,
  FiUserCheck,
  FiAward,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { payoutStore } from '../../data/payoutStore';
import { mockInstructorProfileData } from '../../data/instructorProfileData';
import { useAuth } from '../../contexts/AuthContext';
import { isPlaceholderAvatar } from '../common/Avatar';

interface ProfileCompletionCardProps {
  instructorId?: string;
  onNavigateToProfile?: () => void;
  onCreateCourse?: () => void;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
  hint: string;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  instructorId = 'INS-2026-8492',
  onNavigateToProfile,
  onCreateCourse,
}) => {
  const navigate = useNavigate();
  const { currentUser, rawProfile } = useAuth();

  // Load Payout Summary from Store
  const [payoutSummary, setPayoutSummary] = useState(payoutStore.getSummary(instructorId));

  // Toggle override state for demo interactive testing
  const [forceIncompletePayout, setForceIncompletePayout] = useState(false);

  useEffect(() => {
    const unsubscribe = payoutStore.subscribe(() => {
      setPayoutSummary(payoutStore.getSummary(instructorId));
    });
    return unsubscribe;
  }, [instructorId]);

  // Compute items state
  const checklist = useMemo<ChecklistItem[]>(() => {
    const profile = {
      ...mockInstructorProfileData,
      fullName: currentUser?.name || rawProfile?.fullName || mockInstructorProfileData.fullName,
      email: currentUser?.email || rawProfile?.email || mockInstructorProfileData.email,
      photoUrl: currentUser?.avatar || rawProfile?.avatarUrl || '',
      specialization: rawProfile?.specialization || mockInstructorProfileData.specialization,
      qualification: rawProfile?.qualification || mockInstructorProfileData.qualification,
    };
    const isPayoutConfigured =
      !forceIncompletePayout &&
      payoutSummary &&
      ((payoutSummary.payoutInfo.selectedMethod === 'Bank Account' &&
        !!payoutSummary.payoutInfo.bankDetails.accountNumber &&
        !!payoutSummary.payoutInfo.bankDetails.ifscCode) ||
        (payoutSummary.payoutInfo.selectedMethod === 'UPI ID' &&
          !!payoutSummary.payoutInfo.upiDetails.upiId));

    return [
      {
        id: 'photo',
        label: 'Profile Photo',
        isComplete: !!profile.photoUrl && !isPlaceholderAvatar(profile.photoUrl),
        hint: 'Professional headshot uploaded',
      },
      {
        id: 'personal',
        label: 'Personal Information',
        isComplete: !!(profile.fullName && profile.email && profile.mobileNumber),
        hint: 'Full name, email, and phone verified',
      },
      {
        id: 'professional',
        label: 'Professional Information',
        isComplete: !!(profile.specialization && profile.linkedInUrl),
        hint: 'Specialization and LinkedIn added',
      },
      {
        id: 'qualification',
        label: 'Qualification',
        isComplete: !!profile.qualification,
        hint: 'Highest degree & academic credentials',
      },
      {
        id: 'experience',
        label: 'Experience',
        isComplete: profile.experienceYears > 0,
        hint: `${profile.experienceYears} years of teaching/industry experience`,
      },
      {
        id: 'bio',
        label: 'Bio',
        isComplete: !!profile.bio && profile.bio.length > 20,
        hint: 'Instructor biography & teaching philosophy',
      },
      {
        id: 'payout',
        label: 'Payout Information (Bank Account or UPI)',
        isComplete: Boolean(isPayoutConfigured),
        hint: isPayoutConfigured
          ? `Active (${payoutSummary?.payoutInfo.selectedMethod})`
          : 'Bank Account or UPI ID required for payouts',
      },
      {
        id: 'notifications',
        label: 'Notification Preferences',
        isComplete: !!profile.notificationPreferences,
        hint: 'Email & student enrollment alerts enabled',
      },
    ];
  }, [payoutSummary, forceIncompletePayout]);

  const completedCount = checklist.filter((item) => item.isComplete).length;
  const totalCount = checklist.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const is100Percent = percentage === 100;

  const handleCompleteProfileClick = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      navigate('/instructor/profile');
    }
  };

  const handleCreateCourseClick = () => {
    if (onCreateCourse) {
      onCreateCourse();
    } else {
      navigate('/instructor/courses');
    }
  };

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all duration-300">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* 100% COMPLETE STATE BANNER */}
      {is100Percent ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex-shrink-0">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <FiAward className="w-3 h-3 text-emerald-600" /> 100% Completed
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-1.5">
                ✅ Your profile is complete. You're ready to create and publish courses!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                All personal, professional, and payout details (Bank / UPI) are verified. Start publishing content to student learners worldwide.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Quick Demo Toggle for Testing Incomplete State */}
            <button
              type="button"
              onClick={() => setForceIncompletePayout(true)}
              className="text-[10px] text-slate-400 hover:text-slate-600 underline font-medium mr-2"
              title="Click to test incomplete payout state"
            >
              Simulate Incomplete State
            </button>

            <Button
              variant="primary"
              onClick={handleCreateCourseClick}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md shadow-purple-500/20"
            >
              <FiPlusCircle className="w-4 h-4" /> Create New Course
            </Button>
          </div>
        </div>
      ) : (
        /* INCOMPLETE (< 100%) CARD */
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                <FiUserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Complete Your Profile
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Welcome to <strong className="text-purple-600 dark:text-purple-400">EduSphere</strong>! Before you start creating and publishing courses, please complete your instructor profile.
                </p>
              </div>
            </div>

            {/* Complete Profile Button */}
            <Button
              variant="primary"
              onClick={handleCompleteProfileClick}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm self-start sm:self-center"
            >
              Complete Profile <FiArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar & Percentage Display */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                Profile Completion: <span className="text-purple-600 dark:text-purple-400 font-black text-sm">{percentage}%</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {completedCount} of {totalCount} sections completed
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 rounded-full"
              />
            </div>
          </div>

          {/* Checklist Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={handleCompleteProfileClick}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  item.isComplete
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200'
                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-slate-900 dark:text-slate-100 hover:border-amber-300'
                }`}
              >
                {item.isComplete ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <FiAlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                )}

                <div className="space-y-0.5 min-w-0">
                  <div className="font-extrabold truncate text-xs flex items-center gap-1">
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {item.hint}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Demo Button to reset simulate complete state */}
          {forceIncompletePayout && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setForceIncompletePayout(false)}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 underline font-bold"
              >
                Restore 100% Verified Profile State
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
