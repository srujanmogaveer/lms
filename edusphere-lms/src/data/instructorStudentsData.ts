export type CertificateEligibilityStatus = 'Eligible' | 'Locked';
export type QuizPerformanceStatus = 'Passed' | 'Failed' | 'Not Attempted';
export type AssignmentSubmissionStatus = 'Completed' | 'Pending';

export interface DetailedStudentProgressItem {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  email: string;
  phone: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate: string;
  isActive: boolean;

  // Learning Progress
  lessonProgressPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;

  assignmentProgressPercentage: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  assignmentStatus: AssignmentSubmissionStatus;

  quizProgressPercentage: number;
  quizzesPassed: number;
  totalQuizzes: number;
  quizStatus: QuizPerformanceStatus;

  overallProgressPercentage: number;

  // Certificate Eligibility
  certificateStatus: CertificateEligibilityStatus;
  certificateLockReason?: string;

  // Student Activity Log
  lastLogin: string;
  lastLessonCompleted: string;
  lastAssignmentSubmitted: string;
  lastQuizAttempt: string;
}

export const mockInstructorStudentsList: DetailedStudentProgressItem[] = [
  {
    id: 'inst-std-101',
    studentId: 'std-101',
    studentName: 'Rohan Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    email: 'rohan.sharma@edusphere.in',
    phone: '+91 98765 43210',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    enrollmentDate: '15/05/2026',
    isActive: true,

    lessonProgressPercentage: 100,
    lessonsCompleted: 24,
    totalLessons: 24,

    assignmentProgressPercentage: 100,
    assignmentsCompleted: 4,
    totalAssignments: 4,
    assignmentStatus: 'Completed',

    quizProgressPercentage: 100,
    quizzesPassed: 3,
    totalQuizzes: 3,
    quizStatus: 'Passed',

    overallProgressPercentage: 100,
    certificateStatus: 'Eligible',

    lastLogin: 'Today at 10:15 AM',
    lastLessonCompleted: 'Lesson 24: Production Next.js Deployment',
    lastAssignmentSubmitted: 'Assignment 4: Capstone MERN App',
    lastQuizAttempt: 'Quiz 3: Server Actions & SSR (Score: 95%)',
  },
  {
    id: 'inst-std-102',
    studentId: 'std-102',
    studentName: 'Priya Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    email: 'priya.patel@edusphere.in',
    phone: '+91 98123 45678',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    enrollmentDate: '20/05/2026',
    isActive: true,

    lessonProgressPercentage: 85,
    lessonsCompleted: 20,
    totalLessons: 24,

    assignmentProgressPercentage: 75,
    assignmentsCompleted: 3,
    totalAssignments: 4,
    assignmentStatus: 'Pending',

    quizProgressPercentage: 66,
    quizzesPassed: 2,
    totalQuizzes: 3,
    quizStatus: 'Passed',

    overallProgressPercentage: 78,
    certificateStatus: 'Locked',
    certificateLockReason: 'Lessons Incomplete (20/24) & Assignments Pending (3/4)',

    lastLogin: 'Yesterday at 04:30 PM',
    lastLessonCompleted: 'Lesson 20: Zod Form Validation',
    lastAssignmentSubmitted: 'Assignment 3: E-commerce Cart Architecture',
    lastQuizAttempt: 'Quiz 2: React 19 Hooks (Score: 88%)',
  },
  {
    id: 'inst-std-103',
    studentId: 'std-103',
    studentName: 'Aarav Mehta',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    email: 'aarav.mehta@edusphere.in',
    phone: '+91 97654 32109',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    enrollmentDate: '01/06/2026',
    isActive: false,

    lessonProgressPercentage: 40,
    lessonsCompleted: 8,
    totalLessons: 20,

    assignmentProgressPercentage: 33,
    assignmentsCompleted: 1,
    totalAssignments: 3,
    assignmentStatus: 'Pending',

    quizProgressPercentage: 0,
    quizzesPassed: 0,
    totalQuizzes: 2,
    quizStatus: 'Not Attempted',

    overallProgressPercentage: 35,
    certificateStatus: 'Locked',
    certificateLockReason: 'Lessons Incomplete & Quiz Not Attempted',

    lastLogin: '3 days ago',
    lastLessonCompleted: 'Lesson 8: Webpack 5 Module Federation',
    lastAssignmentSubmitted: 'Assignment 1: Micro-frontend Container',
    lastQuizAttempt: 'No Quiz Attempts',
  },
  {
    id: 'inst-std-104',
    studentId: 'std-104',
    studentName: 'Ananya Verma',
    studentAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    email: 'ananya.verma@edusphere.in',
    phone: '+91 96543 21098',
    courseId: 'course-103',
    courseTitle: 'Node.js Enterprise Microservices & Distributed Systems',
    enrollmentDate: '10/06/2026',
    isActive: true,

    lessonProgressPercentage: 100,
    lessonsCompleted: 18,
    totalLessons: 18,

    assignmentProgressPercentage: 100,
    assignmentsCompleted: 3,
    totalAssignments: 3,
    assignmentStatus: 'Completed',

    quizProgressPercentage: 100,
    quizzesPassed: 2,
    totalQuizzes: 2,
    quizStatus: 'Passed',

    overallProgressPercentage: 100,
    certificateStatus: 'Eligible',

    lastLogin: 'Today at 09:00 AM',
    lastLessonCompleted: 'Lesson 18: Kafka Consumer Rebalancing',
    lastAssignmentSubmitted: 'Assignment 3: Distributed Redis Caching',
    lastQuizAttempt: 'Quiz 2: Event-Driven Microservices (Score: 92%)',
  },
  {
    id: 'inst-std-105',
    studentId: 'std-105',
    studentName: 'Kabir Das',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    email: 'kabir.das@edusphere.in',
    phone: '+91 95432 10987',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    enrollmentDate: '18/06/2026',
    isActive: true,

    lessonProgressPercentage: 60,
    lessonsCompleted: 14,
    totalLessons: 24,

    assignmentProgressPercentage: 50,
    assignmentsCompleted: 2,
    totalAssignments: 4,
    assignmentStatus: 'Pending',

    quizProgressPercentage: 33,
    quizzesPassed: 1,
    totalQuizzes: 3,
    quizStatus: 'Failed',

    overallProgressPercentage: 52,
    certificateStatus: 'Locked',
    certificateLockReason: 'Quiz Not Passed (Quiz 2 Score: 45%)',

    lastLogin: 'Yesterday at 08:20 PM',
    lastLessonCompleted: 'Lesson 14: MongoDB Aggregation Pipelines',
    lastAssignmentSubmitted: 'Assignment 2: RESTful API Auth',
    lastQuizAttempt: 'Quiz 2: Database Schema Design (Score: 45% - Failed)',
  },
];
