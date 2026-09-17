import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiPlusCircle,
  FiAward,
  FiCamera,
  FiDollarSign,
  FiBook,
  FiShield,
  FiChevronDown,
  FiChevronUp,
  FiZap,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { isPlaceholderAvatar } from '../common/Avatar';

interface ProfileCompletionCardProps {
  instructorId?: string;
  onNavigateToProfile?: () => void;
  onCreateCourse?: () => void;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  isComplete: boolean;
  statusText: string;
  actionLabel: string;
  targetTab?: string;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  onNavigateToProfile,
  onCreateCourse,
}) => {
  const navigate = useNavigate();
  const { currentUser, rawProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Compute live verification states based on actual user profile
  const avatarUrl = currentUser?.avatar || rawProfile?.avatarUrl || '';
  const hasPhoto = Boolean(avatarUrl && !isPlaceholderAvatar(avatarUrl));
  const hasPersonalInfo = Boolean(
    (currentUser?.name || rawProfile?.fullName) &&
    (currentUser?.email || rawProfile?.email) &&
    rawProfile?.phone?.trim()
  );
  const hasCredentials = Boolean(
    rawProfile?.specialization?.trim() &&
    rawProfile?.qualification?.trim() &&
    rawProfile?.bio && rawProfile.bio.trim().length > 15
  );
  const hasPayout = Boolean(
    rawProfile?.payoutInfo &&
    (
      (rawProfile.payoutInfo.selectedMethod === 'Bank Account' &&
        !!rawProfile.payoutInfo.bankDetails?.accountNumber &&
        !!rawProfile.payoutInfo.bankDetails?.ifscCode) ||
      (rawProfile.payoutInfo.selectedMethod === 'UPI ID' &&
        !!rawProfile.payoutInfo.upiDetails?.upiId)
    )
  );

  const groups = useMemo<ChecklistGroup[]>(() => {
    return [
      {
        id: 'photo',
        title: 'Profile Photo',
        icon: FiCamera,
        isComplete: hasPhoto,
        statusText: hasPhoto ? 'Headshot uploaded' : 'Upload professional avatar',
        actionLabel: hasPhoto ? 'Change Photo' : 'Upload Photo',
        targetTab: 'personal',
      },
      {
        id: 'personal',
        title: 'Personal & Contact',
        icon: FiShield,
        isComplete: hasPersonalInfo,
        statusText: hasPersonalInfo ? 'Name, Email & Phone verified' : 'Add phone & personal info',
        actionLabel: hasPersonalInfo ? 'Review' : 'Add Phone',
        targetTab: 'personal',
      },
      {
        id: 'credentials',
        title: 'Bio & Qualifications',
        icon: FiBook,
        isComplete: hasCredentials,
        statusText: hasCredentials ? 'Degree, Specialization & Bio added' : 'Add degree & teaching bio',
        actionLabel: hasCredentials ? 'Edit Bio' : 'Add Credentials',
        targetTab: 'professional',
      },
      {
        id: 'payout',
        title: 'Payout Account',
        icon: FiDollarSign,
        isComplete: hasPayout,
        statusText: hasPayout ? 'Bank / UPI connected' : 'Link Bank Account or UPI ID',
        actionLabel: hasPayout ? 'Manage Payout' : 'Connect Bank/UPI',
        targetTab: 'payout',
      },
    ];
  }, [hasPhoto, hasPersonalInfo, hasCredentials, hasPayout]);

  const completedCount = groups.filter((g) => g.isComplete).length;
  const totalCount = groups.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const is100Percent = percentage === 100;

  const handleAction = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      navigate('/instructor/profile');
    }
  };

  const handleCreateCourse = () => {
    if (onCreateCourse) {
      onCreateCourse();
    } else {
      navigate('/instructor/courses?action=create');
    }
  };

  // 100% COMPLETE: Render sleek Verified Instructor Card
  if (is100Percent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-purple-950/30 border border-emerald-500/30 rounded-3xl p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm sm:text-base">
                  Verified Instructor Profile (100% Complete)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <FiAward className="w-3 h-3" /> Publishing Enabled
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                All credentials, teaching background, and payout accounts are active. You are fully authorized to publish courses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCourse}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <FiPlusCircle className="w-4 h-4" /> Create Course
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // INCOMPLETE (< 100%): Render Rich Interactive Stepper Card
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 relative overflow-hidden"
    >
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          {/* Circular Progress Ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-purple-600 dark:stroke-purple-400 transition-all duration-1000 ease-out"
                strokeWidth="4"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * percentage) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-xs font-black text-purple-600 dark:text-purple-400">
              {percentage}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Complete Your Instructor Profile
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {completedCount} of {totalCount} Steps Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Complete your verification checklist to unlock course publishing, live classrooms, and automated payouts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAction}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20"
          >
            <span>Complete Setup</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title={isExpanded ? 'Collapse Checklist' : 'Expand Checklist'}
          >
            {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Checklist Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {groups.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={handleAction}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                      item.isComplete
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200 hover:border-emerald-300'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-2 rounded-xl ${
                          item.isComplete
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {item.isComplete ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                          <FiCheckCircle className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                          <FiAlertCircle className="w-3 h-3" /> Required
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {item.statusText}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      <span>{item.actionLabel}</span>
                      <FiArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Platform Feature Unlock Roadmap */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FiZap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Benefits Unlocked:
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Course Studio • Live Q&A • Automated Razorpay/Bank Settlements
                </span>
              </div>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                Next: Connect Bank/UPI to enable course sales
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
