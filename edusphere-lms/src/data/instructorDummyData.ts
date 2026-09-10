export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  assignmentsPendingReview: number;
  quizzesPendingReview: number;
  liveClassesScheduled: number;
  totalRevenueINR: number;
  monthlyRevenueINR: number;
  studentsTrendPercent: number;
  revenueTrendPercent: number;
}

export interface PendingAssignmentReview {
  id: string;
  studentName: string;
  studentAvatar: string;
  courseTitle: string;
  assignmentTitle: string;
  submittedDate: string; // DD/MM/YYYY
  status: string;
  maxScore: number;
  submissionSnippet: string;
}

export interface PendingQuizReview {
  id: string;
  studentName: string;
  studentAvatar: string;
  courseTitle: string;
  quizTitle: string;
  submittedDate: string; // DD/MM/YYYY
  autoScore: string;
  pendingScore: string;
}

export interface UpcomingInstructorLiveClass {
  id: string;
  courseTitle: string;
  topic: string;
  date: string; // DD/MM/YYYY
  timeIST: string;
  duration: string;
  enrolledCount: number;
  roomId: string;
  status: 'scheduled' | 'live' | 'completed';
}

export interface CoursePerformanceItem {
  id: string;
  title: string;
  category: string;
  enrolledStudents: number;
  rating: number;
  reviewsCount: number;
  completionRate: number; // percentage
  revenueINR: number;
  thumbnail: string;
}

export interface StudentActivityFeedItem {
  id: string;
  studentName: string;
  studentAvatar: string;
  actionText: string;
  timestamp: string;
  date: string; // DD/MM/YYYY
  type: 'enrollment' | 'assignment' | 'quiz' | 'certificate' | 'forum';
}

export interface InstructorAnnouncement {
  id: string;
  title: string;
  courseTitle: string;
  date: string; // DD/MM/YYYY
  viewsCount: number;
  pinned: boolean;
}

export interface InstructorTodayTask {
  id: string;
  title: string;
  timeIST: string;
  priority: 'high' | 'medium' | 'low';
  type: 'grading' | 'preparation' | 'live_class' | 'forum';
  completed: boolean;
}

export interface InstructorNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'enrollment' | 'assignment' | 'quiz' | 'review' | 'system';
  isRead: boolean;
}

export const mockInstructorProfile = {
  id: 'ins-101',
  name: 'Dr. Ananya Sharma',
  designation: 'Principal Software Architect & Senior Educator',
  email: 'ananya.sharma@edusphere.edu.in',
  phone: '+91 98765 43210',
  location: 'Bengaluru, Karnataka, India',
  timezone: 'Asia/Kolkata (IST)',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
  currentDateIST: '03/08/2026',
  lastLogin: 'Today at 09:30 AM IST (Bengaluru, India)',
};

export const mockInstructorStats: InstructorStats = {
  totalCourses: 12,
  publishedCourses: 9,
  draftCourses: 3,
  totalStudents: 14250,
  assignmentsPendingReview: 8,
  quizzesPendingReview: 5,
  liveClassesScheduled: 4,
  totalRevenueINR: 148500,
  monthlyRevenueINR: 32400,
  studentsTrendPercent: 14.2,
  revenueTrendPercent: 18.5,
};

export const mockPendingAssignments: PendingAssignmentReview[] = [
  {
    id: 'asg-sub-1',
    studentName: 'Rahul Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    courseTitle: 'Full-Stack React 19 & Node.js Masterclass',
    assignmentTitle: 'Assignment 3: E-Commerce Microservices API',
    submittedDate: '02/08/2026',
    status: 'Pending Review',
    maxScore: 100,
    submissionSnippet: 'Implemented NestJS API routes with Zod validation and PostgreSQL Prisma ORM integration.',
  },
  {
    id: 'asg-sub-2',
    studentName: 'Priya Nair',
    studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    courseTitle: 'Full-Stack React 19 & Node.js Masterclass',
    assignmentTitle: 'Assignment 2: Redux Toolkit State Machine',
    submittedDate: '01/08/2026',
    status: 'Pending Review',
    maxScore: 100,
    submissionSnippet: 'Built normalized entity adapter state slice for shopping cart persistence.',
  },
  {
    id: 'asg-sub-3',
    studentName: 'Vikram Malhotra',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    courseTitle: 'UI/UX Design Systems with Figma',
    assignmentTitle: 'Assignment 4: Responsive Dark Mode Tokens',
    submittedDate: '31/07/2026',
    status: 'Pending Review',
    maxScore: 100,
    submissionSnippet: 'Designed WCAG AA compliant color palette tokens for enterprise dashboard.',
  },
  {
    id: 'asg-sub-4',
    studentName: 'Sophia Chen',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    courseTitle: 'Cloud DevOps & Kubernetes Pipeline',
    assignmentTitle: 'Assignment 1: Helm Chart Deployment & Ingress',
    submittedDate: '30/07/2026',
    status: 'Pending Review',
    maxScore: 100,
    submissionSnippet: 'Created production Helm values schema with NGINX ingress SSL termination.',
  },
];

export const mockPendingQuizzes: PendingQuizReview[] = [
  {
    id: 'quiz-sub-1',
    studentName: 'Aarav Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    courseTitle: 'Full-Stack React 19 & Node.js Masterclass',
    quizTitle: 'Quiz 2: React Server Components & SSR',
    submittedDate: '03/08/2026',
    autoScore: '24 / 30',
    pendingScore: '6 pts (Manual Essay Review Required)',
  },
  {
    id: 'quiz-sub-2',
    studentName: 'Neha Gupta',
    studentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    courseTitle: 'Cloud DevOps & Kubernetes Pipeline',
    quizTitle: 'Quiz 4: Kubernetes Helm & Ingress Security',
    submittedDate: '02/08/2026',
    autoScore: '18 / 25',
    pendingScore: '7 pts (Architecture Diagram Evaluation)',
  },
  {
    id: 'quiz-sub-3',
    studentName: 'Rohan Mehta',
    studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    courseTitle: 'Python AI & Machine Learning Specialization',
    quizTitle: 'Quiz 1: Vector Embeddings & PyTorch Tensors',
    submittedDate: '01/08/2026',
    autoScore: '28 / 35',
    pendingScore: '7 pts (Code Explanation Verification)',
  },
];

export const mockUpcomingLiveClasses: UpcomingInstructorLiveClass[] = [
  {
    id: 'live-class-1',
    courseTitle: 'Full-Stack React 19 & Node.js Masterclass',
    topic: 'Next.js 15 App Router & Server Actions Masterclass',
    date: '04/08/2026',
    timeIST: '04:00 PM IST',
    duration: '60 mins',
    enrolledCount: 340,
    roomId: 'live-react-101',
    status: 'scheduled',
  },
  {
    id: 'live-class-2',
    courseTitle: 'UI/UX Design Systems & Micro-Interactions',
    topic: 'Mastering Design Tokens & Component Libraries in Figma',
    date: '05/08/2026',
    timeIST: '06:30 PM IST',
    duration: '90 mins',
    enrolledCount: 215,
    roomId: 'live-uiux-202',
    status: 'scheduled',
  },
  {
    id: 'live-class-3',
    courseTitle: 'Cloud DevOps & Kubernetes Pipeline',
    topic: 'Zero-Downtime Deployment on AWS EKS Cluster',
    date: '07/08/2026',
    timeIST: '05:00 PM IST',
    duration: '75 mins',
    enrolledCount: 180,
    roomId: 'live-devops-303',
    status: 'scheduled',
  },
  {
    id: 'live-class-4',
    courseTitle: 'Full-Stack React 19 & Node.js Masterclass',
    topic: 'Building Resilient GraphQL APIs with NestJS & Prisma',
    date: '10/08/2026',
    timeIST: '07:00 PM IST',
    duration: '60 mins',
    enrolledCount: 290,
    roomId: 'live-react-102',
    status: 'scheduled',
  },
];

export const mockCoursePerformance: CoursePerformanceItem[] = [
  {
    id: 'course-perf-1',
    title: 'Full-Stack React 19 & Node.js Masterclass',
    category: 'Development',
    enrolledStudents: 5420,
    rating: 4.9,
    reviewsCount: 420,
    completionRate: 84,
    revenueINR: 68500,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
  },
  {
    id: 'course-perf-2',
    title: 'UI/UX Design Systems & Micro-Interactions',
    category: 'Design',
    enrolledStudents: 3890,
    rating: 4.8,
    reviewsCount: 310,
    completionRate: 78,
    revenueINR: 42000,
    thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400',
  },
  {
    id: 'course-perf-3',
    title: 'Cloud DevOps & Kubernetes Pipeline',
    category: 'DevOps',
    enrolledStudents: 2940,
    rating: 4.9,
    reviewsCount: 280,
    completionRate: 91,
    revenueINR: 26000,
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400',
  },
  {
    id: 'course-perf-4',
    title: 'Python AI & Machine Learning Specialization',
    category: 'Artificial Intelligence',
    enrolledStudents: 2000,
    rating: 4.7,
    reviewsCount: 190,
    completionRate: 72,
    revenueINR: 12000,
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
  },
];

export const mockRecentStudentActivity: StudentActivityFeedItem[] = [
  {
    id: 'act-1',
    studentName: 'Aarav Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    actionText: 'Enrolled in Full-Stack React 19 & Node.js Masterclass',
    timestamp: '10 mins ago',
    date: '03/08/2026',
    type: 'enrollment',
  },
  {
    id: 'act-2',
    studentName: 'Rahul Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    actionText: 'Submitted Assignment 3: E-Commerce Microservices API',
    timestamp: '45 mins ago',
    date: '03/08/2026',
    type: 'assignment',
  },
  {
    id: 'act-3',
    studentName: 'Neha Gupta',
    studentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    actionText: 'Completed Quiz 4: Kubernetes Ingress Security',
    timestamp: '2 hours ago',
    date: '03/08/2026',
    type: 'quiz',
  },
  {
    id: 'act-4',
    studentName: 'Priya Nair',
    studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    actionText: 'Earned Certificate of Completion in UI/UX Design Systems',
    timestamp: '4 hours ago',
    date: '03/08/2026',
    type: 'certificate',
  },
  {
    id: 'act-5',
    studentName: 'Vikram Malhotra',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    actionText: 'Posted a question in Discussion Forum: "Handling React 19 Hydration Errors"',
    timestamp: '6 hours ago',
    date: '03/08/2026',
    type: 'forum',
  },
];

export const mockInstructorAnnouncements: InstructorAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Live Q&A Session Rescheduled to Tuesday 4 PM IST',
    courseTitle: 'Full-Stack React 19 & Node.js Masterclass',
    date: '02/08/2026',
    viewsCount: 412,
    pinned: true,
  },
  {
    id: 'ann-2',
    title: 'New Module 5: Tailwind v4 & Container Queries Added!',
    courseTitle: 'UI/UX Design Systems & Micro-Interactions',
    date: '30/07/2026',
    viewsCount: 328,
    pinned: false,
  },
  {
    id: 'ann-3',
    title: 'Submission Deadline Extended for Assignment 3',
    courseTitle: 'Cloud DevOps & Kubernetes Pipeline',
    date: '28/07/2026',
    viewsCount: 290,
    pinned: false,
  },
];

export const mockInstructorTodaySchedule: InstructorTodayTask[] = [
  {
    id: 'task-1',
    title: 'Grade 3 pending assignment submissions for React Masterclass',
    timeIST: '11:00 AM IST',
    priority: 'high',
    type: 'grading',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Prepare slides for Live Workshop on Next.js 15 App Router',
    timeIST: '02:30 PM IST',
    priority: 'medium',
    type: 'preparation',
    completed: true,
  },
  {
    id: 'task-3',
    title: 'Live Class: Next.js 15 App Router & Server Actions',
    timeIST: '04:00 PM IST',
    priority: 'high',
    type: 'live_class',
    completed: false,
  },
  {
    id: 'task-4',
    title: 'Review discussion forum queries regarding NestJS GraphQL',
    timeIST: '06:00 PM IST',
    priority: 'low',
    type: 'forum',
    completed: false,
  },
];

export const mockInstructorNotifications: InstructorNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Assignment Submitted',
    message: 'Rahul Sharma submitted Assignment 3: E-Commerce Microservices API.',
    timestamp: '45 mins ago',
    type: 'assignment',
    isRead: false,
  },
  {
    id: 'notif-2',
    title: 'New Student Enrollment',
    message: 'Aarav Patel enrolled in Full-Stack React 19 & Node.js Masterclass.',
    timestamp: '10 mins ago',
    type: 'enrollment',
    isRead: false,
  },
  {
    id: 'notif-3',
    title: '5-Star Course Review Received',
    message: 'Vikram Malhotra gave 5 stars: "Best full-stack curriculum on the web!"',
    timestamp: '3 hours ago',
    type: 'review',
    isRead: true,
  },
  {
    id: 'notif-4',
    title: 'Quiz Submitted for Review',
    message: 'Aarav Patel submitted Quiz 2 for manual short-answer evaluation.',
    timestamp: '4 hours ago',
    type: 'quiz',
    isRead: true,
  },
];
