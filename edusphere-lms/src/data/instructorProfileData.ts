export interface InstructorProfileDetails {
  id: string;
  instructorId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  state: string;
  city: string;
  photoUrl: string;

  // Professional Information
  qualification: string;
  experienceYears: number;
  specialization: string;
  bio: string;
  linkedInUrl?: string;
  personalWebsite?: string;

  // Account Security & Activity
  memberSince: string;
  lastLogin: string;
  profileLastUpdated: string;
  passwordLastChanged: string;
  lastCoursePublished: string;

  // Application Settings
  theme: 'Light' | 'Dark' | 'System';
  language: string;
  timezone: string;

  // Notification Preferences
  notificationPreferences: {
    newStudentEnrollment: boolean;
    assignmentSubmission: boolean;
    quizSubmission: boolean;
    liveClassReminder: boolean;
    courseReview: boolean;
    emailNotifications: boolean;
  };

  // Privacy Settings
  privacySettings: {
    showPublicProfile: boolean;
    showProfessionalInfo: boolean;
  };
}

export const mockInstructorProfileData: InstructorProfileDetails = {
  id: 'inst-prof-1',
  instructorId: 'INS-2026-8492',
  fullName: 'Dr. Marcus Vance',
  email: 'marcus.vance@edusphere.edu',
  mobileNumber: '+91 98765 43210',
  dateOfBirth: '1986-04-12',
  gender: 'Male',
  country: 'India',
  state: 'Karnataka',
  city: 'Bengaluru',
  photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250',

  qualification: 'Ph.D. in Computer Science & Distributed Systems',
  experienceYears: 12,
  specialization: 'Full-Stack Web Engineering, React 19 & Next.js Architectures',
  bio: 'Senior Software Architect & Full-Stack Educator at EduSphere. 12+ years building enterprise web applications, teaching cloud-native microservices, and mentoring engineering teams across India.',
  linkedInUrl: 'https://linkedin.com/in/dr-marcus-vance',
  personalWebsite: 'https://marcusvance.dev',

  memberSince: '15/01/2024',
  lastLogin: 'Today at 10:15 AM IST',
  profileLastUpdated: '01/08/2026',
  passwordLastChanged: '15/05/2026',
  lastCoursePublished: 'Full-Stack Web Development Masterclass 2026',

  theme: 'Light',
  language: 'English',
  timezone: 'Asia/Kolkata (IST)',

  notificationPreferences: {
    newStudentEnrollment: true,
    assignmentSubmission: true,
    quizSubmission: true,
    liveClassReminder: true,
    courseReview: true,
    emailNotifications: true,
  },

  privacySettings: {
    showPublicProfile: true,
    showProfessionalInfo: true,
  },
};
