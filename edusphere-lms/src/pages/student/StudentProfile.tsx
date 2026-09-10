import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileEditForm } from '../../components/profile/ProfileEditForm';
import { AccountSecuritySection } from '../../components/profile/AccountSecuritySection';
import {
  LearningStatsAndBadges,
  type StudentLearningStatsData,
  type StudentAchievementBadgeExtended,
} from '../../components/profile/LearningStatsAndBadges';
import { DangerZoneModal } from '../../components/profile/DangerZoneModal';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentService } from '../../services/enrollmentService';
import { progressService } from '../../services/progressService';
import type { FullStudentProfile } from '../../types';

export const StudentProfile: React.FC = () => {
  const { currentUser, rawProfile, updateProfile } = useAuth();

  const [profile, setProfile] = useState<FullStudentProfile>(() => {
    return {
      id: rawProfile?.id || '',
      studentIdNumber: rawProfile?.studentIdNumber || (rawProfile?.id ? `EDU-STD-${rawProfile.id.slice(0, 4).toUpperCase()}` : 'EDU-STD-STUDENT'),
      fullName: currentUser?.name || rawProfile?.fullName || '',
      email: currentUser?.email || rawProfile?.email || '',
      phoneNumber: rawProfile?.phone || '',
      dateOfBirth: rawProfile?.dateOfBirth || '',
      gender: (rawProfile?.gender as any) || 'male',
      country: rawProfile?.country || 'India',
      state: rawProfile?.state || '',
      city: rawProfile?.city || '',
      timezone: rawProfile?.timezone || 'Asia/Kolkata (IST)',
      bio: rawProfile?.bio || '',
      avatarUrl: currentUser?.avatar || rawProfile?.avatarUrl || '',
      joinedDate: rawProfile?.createdAt ? new Date(rawProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'August 2026',
      learningStreakDays: rawProfile?.learningStreakDays || 1,
      isGoogleConnected: false,
      themePreference: (rawProfile?.themePreference as any) || 'system',
      languagePreference: rawProfile?.languagePreference || 'English',
      privacy: rawProfile?.privacySettings || {
        publicProfile: true,
        showLearningProgress: true,
        shareCertificates: true,
        marketingEmails: false,
      },
    };
  });

  const [activeTab, setActiveTab] = useState<string>('personal');

  useEffect(() => {
    if (currentUser || rawProfile) {
      setProfile((prev) => ({
        ...prev,
        id: rawProfile?.id || prev.id,
        studentIdNumber: rawProfile?.studentIdNumber || (rawProfile?.id ? `EDU-STD-${rawProfile.id.slice(0, 4).toUpperCase()}` : prev.studentIdNumber),
        fullName: currentUser?.name || rawProfile?.fullName || prev.fullName,
        email: currentUser?.email || rawProfile?.email || prev.email,
        phoneNumber: rawProfile?.phone || prev.phoneNumber,
        dateOfBirth: rawProfile?.dateOfBirth || prev.dateOfBirth,
        gender: (rawProfile?.gender as any) || prev.gender,
        country: rawProfile?.country || prev.country,
        state: rawProfile?.state || prev.state,
        city: rawProfile?.city || prev.city,
        timezone: rawProfile?.timezone || prev.timezone,
        bio: rawProfile?.bio || prev.bio,
        avatarUrl: currentUser?.avatar || rawProfile?.avatarUrl || '',
        joinedDate: rawProfile?.createdAt ? new Date(rawProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : prev.joinedDate,
        learningStreakDays: rawProfile?.learningStreakDays || 1,
        themePreference: (rawProfile?.themePreference as any) || prev.themePreference,
        languagePreference: rawProfile?.languagePreference || prev.languagePreference,
        privacy: rawProfile?.privacySettings || prev.privacy,
      }));
    }
  }, [currentUser, rawProfile]);

  // Real Dynamic Learning Statistics from active progress & enrollments
  const [learningStats, setLearningStats] = useState<StudentLearningStatsData>({
    enrolledCourses: rawProfile?.enrolledCoursesCount || 0,
    completedCourses: rawProfile?.completedCoursesCount || 0,
    earnedCertificates: rawProfile?.certificatesCount || 0,
    assignmentsSubmitted: 0,
    quizzesPassed: 0,
    totalStudyHours: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRealStats = async () => {
      try {
        const [enrollmentsRes, allProgressRes] = await Promise.all([
          enrollmentService.getStudentEnrollments().catch(() => ({ success: false, data: [] })),
          progressService.getAllCoursesProgress().catch(() => ({ success: false, data: {} })),
        ]);

        if (!isMounted) return;

        const enrollments = enrollmentsRes.success && Array.isArray(enrollmentsRes.data)
          ? enrollmentsRes.data
          : [];
        const progressMap = allProgressRes.success && allProgressRes.data
          ? allProgressRes.data
          : {};

        let totalAssignments = 0;
        let totalQuizzes = 0;
        let totalLessonsCompleted = 0;
        let completedCoursesCount = 0;
        let certificatesCount = 0;

        Object.values(progressMap).forEach((summary: any) => {
          if (summary.completedAssignmentsCount) {
            totalAssignments += summary.completedAssignmentsCount;
          }
          if (summary.quizPassed) {
            totalQuizzes += 1;
          }
          if (summary.completedLessons) {
            totalLessonsCompleted += summary.completedLessons;
          }
          if (summary.isCourseCompleted) {
            completedCoursesCount += 1;
          }
          if (summary.certificateAvailable) {
            certificatesCount += 1;
          }
        });

        const finalEnrolled = Math.max(enrollments.length, rawProfile?.enrolledCoursesCount || 0);
        const finalCompleted = Math.max(completedCoursesCount, rawProfile?.completedCoursesCount || 0);
        const finalCerts = Math.max(certificatesCount, rawProfile?.certificatesCount || 0);
        const finalStudyHours = Math.max(finalCompleted > 0 ? 4 : 1, Math.round((totalLessonsCompleted * 25) / 60));

        setLearningStats({
          enrolledCourses: finalEnrolled,
          completedCourses: finalCompleted,
          earnedCertificates: finalCerts,
          assignmentsSubmitted: totalAssignments,
          quizzesPassed: totalQuizzes,
          totalStudyHours: finalStudyHours,
        });
      } catch (err) {
        console.warn('Failed to compute live learning stats:', err);
      }
    };

    loadRealStats();
    return () => {
      isMounted = false;
    };
  }, [rawProfile]);

  // Dynamically compute real achievement badges based on real student accomplishments
  const achievements: StudentAchievementBadgeExtended[] = useMemo(() => {
    const enrolled = learningStats.enrolledCourses;
    const completed = learningStats.completedCourses;
    const certs = learningStats.earnedCertificates;
    const assignments = learningStats.assignmentsSubmitted;
    const quizzes = learningStats.quizzesPassed;
    const streak = profile.learningStreakDays || 1;

    return [
      {
        id: 'ach-pioneer',
        title: 'Curriculum Pioneer',
        description: 'Enrolled in accredited EduSphere LMS courses.',
        icon: '📚',
        isUnlocked: enrolled >= 1,
        earnedDate: rawProfile?.createdAt ? new Date(rawProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Active',
        requirement: 'Enroll in at least 1 course',
        category: 'milestone',
      },
      {
        id: 'ach-active-learner',
        title: 'Active Study Habit',
        description: 'Maintained a consistent daily study routine on the platform.',
        icon: '🔥',
        isUnlocked: streak >= 1,
        earnedDate: `${streak}-Day Streak`,
        requirement: 'Maintain an active daily study streak',
        category: 'streak',
      },
      {
        id: 'ach-assignment',
        title: 'Practical Project Achiever',
        description: 'Completed and submitted course laboratory assignments for grading.',
        icon: '🚀',
        isUnlocked: assignments >= 1,
        earnedDate: assignments > 0 ? `${assignments} Submitted` : '',
        requirement: 'Submit at least 1 course assignment',
        category: 'assignment',
      },
      {
        id: 'ach-quiz',
        title: 'Assessment Mastery',
        description: 'Passed official course knowledge verification examination.',
        icon: '⚡',
        isUnlocked: quizzes >= 1,
        earnedDate: quizzes > 0 ? `${quizzes} Passed` : '',
        requirement: 'Pass at least 1 course quiz',
        category: 'quiz',
      },
      {
        id: 'ach-grad',
        title: 'Masterclass Graduate',
        description: 'Completed 100% of lessons and requirements for a masterclass.',
        icon: '🎓',
        isUnlocked: completed >= 1,
        earnedDate: completed > 0 ? `${completed} Completed` : '',
        requirement: 'Complete 100% of a course curriculum',
        category: 'graduation',
      },
      {
        id: 'ach-cert',
        title: 'Verified Credential Holder',
        description: 'Earned an official tamper-proof verified graduation certificate.',
        icon: '🏆',
        isUnlocked: certs >= 1,
        earnedDate: certs > 0 ? `${certs} Verified` : '',
        requirement: 'Earn an official verified certificate',
        category: 'quiz',
      },
    ];
  }, [learningStats, profile.learningStreakDays, rawProfile?.createdAt]);

  const [isLoading] = useState(false);

  const handleSaveProfile = async (updated: FullStudentProfile) => {
    setProfile(updated);
    await updateProfile({
      fullName: updated.fullName,
      phone: updated.phoneNumber,
      dateOfBirth: updated.dateOfBirth,
      gender: updated.gender,
      country: updated.country,
      state: updated.state,
      city: updated.city,
      timezone: updated.timezone,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      themePreference: updated.themePreference,
      languagePreference: updated.languagePreference,
      privacySettings: updated.privacy,
    });
  };

  const handleUpdateGoogleConnection = (connected: boolean) => {
    setProfile((prev) => ({
      ...prev,
      isGoogleConnected: connected,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Profile Header & Tabs Navigation */}
      <ProfileHeader
        profile={profile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Skeleton Loader */}
      {isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader className="h-64 rounded-2xl" />
          <SkeletonLoader className="h-48 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ProfileEditForm
                profile={profile}
                onSaveProfile={handleSaveProfile}
              />
            </motion.div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <AccountSecuritySection
                profile={profile}
                onUpdateGoogleConnection={handleUpdateGoogleConnection}
              />
            </motion.div>
          )}

          {/* Achievements & Learning Stats Tab */}
          {activeTab === 'achievements' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <LearningStatsAndBadges
                achievements={achievements}
                learningStreakDays={profile.learningStreakDays}
                stats={learningStats}
              />
            </motion.div>
          )}

          {/* Always Display Danger Zone at Bottom */}
          <DangerZoneModal />
        </div>
      )}
    </motion.div>
  );
};
