export type AnnouncementAudience = 
  | 'All Users'
  | 'Students'
  | 'Instructors'
  | 'Admins'
  | 'Selected Students'
  | 'Selected Instructors';

export type AnnouncementPriority = 'Normal' | 'Important' | 'Urgent';

export type AnnouncementStatus = 'Draft' | 'Published';

export interface AnnouncementAttachment {
  name: string;
  size: string;
  type: 'pdf' | 'image';
  url?: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  selectedUserIds?: string[];
  selectedUserNames?: string[];
  priority: AnnouncementPriority;
  isPinned: boolean;
  status: AnnouncementStatus;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  attachment?: AnnouncementAttachment;
}

export interface TargetStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  studentIdNumber: string;
  department: string;
}

export interface TargetInstructor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  department: string;
}

export const mockTargetStudents: TargetStudent[] = [
  {
    id: 'std-101',
    name: 'Alex Johnson',
    email: 'alex.johnson@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    studentIdNumber: 'EDU-STD-8841',
    department: 'Computer Science & AI',
  },
  {
    id: 'std-102',
    name: 'Sophia Martinez',
    email: 'sophia.m@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    studentIdNumber: 'EDU-STD-9214',
    department: 'UI/UX & Design Systems',
  },
  {
    id: 'std-103',
    name: 'Marcus Chen',
    email: 'marcus.chen@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    studentIdNumber: 'EDU-STD-7739',
    department: 'Cloud Computing & DevOps',
  },
  {
    id: 'std-104',
    name: 'Emily Davis',
    email: 'emily.d@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    studentIdNumber: 'EDU-STD-6102',
    department: 'Cybersecurity & Governance',
  },
  {
    id: 'std-105',
    name: 'David Kim',
    email: 'david.kim@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    studentIdNumber: 'EDU-STD-5542',
    department: 'Data Science & Machine Learning',
  },
  {
    id: 'std-106',
    name: 'Jessica Watson',
    email: 'jessica.w@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    studentIdNumber: 'EDU-STD-4418',
    department: 'Product Management',
  },
];

export const mockTargetInstructors: TargetInstructor[] = [
  {
    id: 'ins-201',
    name: 'Dr. Robert Vance',
    email: 'robert.vance@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    title: 'Senior Fellow in Artificial Intelligence',
    department: 'School of Computer Science',
  },
  {
    id: 'ins-202',
    name: 'Prof. Elena Rostova',
    email: 'elena.r@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    title: 'Lead Instructor, Full-Stack Architecture',
    department: 'Software Engineering',
  },
  {
    id: 'ins-203',
    name: 'Michael Sterling',
    email: 'm.sterling@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    title: 'Director of Design Systems',
    department: 'Digital Arts & UX',
  },
  {
    id: 'ins-204',
    name: 'Dr. Sarah Al-Mansoor',
    email: 'sarah.al@edusphere.edu',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    title: 'Head of Data Science & Big Analytics',
    department: 'Information Systems',
  },
];

export const initialAdminAnnouncements: AdminAnnouncement[] = [
  {
    id: 'ANC-2026-001',
    title: 'Scheduled System Maintenance & Infrastructure Window Alert',
    message: 'EduSphere core servers will undergo scheduled infrastructure maintenance on Saturday, August 12, from 02:00 UTC to 05:00 UTC. During this 3-hour window, live class streaming, certificate verification, and quiz submissions will be temporarily suspended.',
    audience: 'All Users',
    priority: 'Urgent',
    isPinned: true,
    status: 'Published',
    publishDate: '2026-08-05 09:00 AM',
    createdAt: '2026-08-04 14:30',
    updatedAt: '2026-08-05 09:00',
    author: 'System Operations & Security Admin',
    attachment: {
      name: 'System_Maintenance_Schedule_Aug2026.pdf',
      size: '1.4 MB',
      type: 'pdf',
    },
  },
  {
    id: 'ANC-2026-002',
    title: 'Fall 2026 Midterm Examination & Milestone Schedule Released',
    message: 'The official timetable for all Fall 2026 midterms has been published. All enrolled students should review their individual course portals for specific submission deadlines, live proctored quiz slots, and retake windows.',
    audience: 'Students',
    priority: 'Important',
    isPinned: true,
    status: 'Published',
    publishDate: '2026-08-04 11:30 AM',
    createdAt: '2026-08-04 10:15',
    updatedAt: '2026-08-04 11:30',
    author: 'Academic Registrar Admin',
    attachment: {
      name: 'Midterm_Exam_Guidelines_2026.pdf',
      size: '2.8 MB',
      type: 'pdf',
    },
  },
  {
    id: 'ANC-2026-003',
    title: 'Updated AI-Powered Quiz Grading Rubrics & Instructor Workshop',
    message: 'We are introducing automated rubric suggestions in the Instructor Quiz Management Studio. Join our live training session this Thursday at 14:00 EST to learn how to integrate auto-grading with manual feedback workflows.',
    audience: 'Instructors',
    priority: 'Normal',
    isPinned: false,
    status: 'Published',
    publishDate: '2026-08-03 15:45 PM',
    createdAt: '2026-08-03 12:00',
    updatedAt: '2026-08-03 15:45',
    author: 'Curriculum & Faculty Development Admin',
    attachment: {
      name: 'Instructor_AIGrading_Guide.png',
      size: '890 KB',
      type: 'image',
    },
  },
  {
    id: 'ANC-2026-004',
    title: 'Exclusive Access: Advanced Generative AI & Deep Learning Virtual Sandbox',
    message: 'You have been selected for beta testing our high-performance GPU Cloud Sandbox for deep learning experiments. Please log in to your student dashboard to claim your 50 free compute hours.',
    audience: 'Selected Students',
    selectedUserIds: ['std-101', 'std-103', 'std-105'],
    selectedUserNames: ['Alex Johnson', 'Marcus Chen', 'David Kim'],
    priority: 'Urgent',
    isPinned: false,
    status: 'Published',
    publishDate: '2026-08-02 08:15 AM',
    createdAt: '2026-08-02 07:30',
    updatedAt: '2026-08-02 08:15',
    author: 'Innovation & Research Lab Admin',
  },
  {
    id: 'ANC-2026-005',
    title: 'Draft: Q3 Faculty Honorarium & Revenue Share Restructuring Proposal',
    message: 'Internal review draft outlining proposed adjustments to course sales revenue distribution, tier bonuses for top-rated courses, and quarterly payout timelines for verified instructors.',
    audience: 'Selected Instructors',
    selectedUserIds: ['ins-201', 'ins-202'],
    selectedUserNames: ['Dr. Robert Vance', 'Prof. Elena Rostova'],
    priority: 'Important',
    isPinned: false,
    status: 'Draft',
    publishDate: '2026-08-06 (Pending)',
    createdAt: '2026-08-05 16:20',
    updatedAt: '2026-08-05 17:00',
    author: 'Finance & Payouts Operations',
    attachment: {
      name: 'Q3_Honorarium_Proposal_Draft.pdf',
      size: '3.1 MB',
      type: 'pdf',
    },
  },
  {
    id: 'ANC-2026-006',
    title: 'Draft: EduSphere Mobile App v2.4 Feature Preview & Dark Mode Enhancements',
    message: 'Sneak peek into upcoming iOS and Android app update featuring offline lesson caching, real-time push notification customization, and biometric login authentication.',
    audience: 'All Users',
    priority: 'Normal',
    isPinned: false,
    status: 'Draft',
    publishDate: '2026-08-10 (Scheduled)',
    createdAt: '2026-08-06 09:10',
    updatedAt: '2026-08-06 09:10',
    author: 'Product Experience Team',
  },
  {
    id: 'ANC-2026-007',
    title: 'Monthly Security Audit & Admin Permission Compliance Check',
    message: 'Reminder for all platform administrators: Review system activity logs, verify zero-trust role elevations, and confirm multi-factor authentication setup before month end.',
    audience: 'Admins',
    priority: 'Normal',
    isPinned: false,
    status: 'Published',
    publishDate: '2026-08-01 10:00 AM',
    createdAt: '2026-08-01 09:00',
    updatedAt: '2026-08-01 10:00',
    author: 'Chief Information Security Officer',
  },
];
