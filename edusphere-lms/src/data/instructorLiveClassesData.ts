export type MeetingPlatform = 'Google Meet';
export type InstructorLiveClassStatus = 'Draft' | 'Scheduled' | 'Live' | 'Ongoing' | 'Completed' | 'Cancelled';
export type LiveClassAudienceType = 'All Enrolled Students' | 'Selected Students';

export interface EnrolledStudentOption {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface LiveClassQAQuestion {
  id: string;
  classId: string;
  studentName: string;
  studentAvatar: string;
  questionText: string;
  createdAtTime: string;
  likesCount: number;
  isLikedByStudent?: boolean;
  isPinned: boolean;
  isAnswered: boolean;
  instructorReply?: string;
  instructorReplyTime?: string;
}

export interface InstructorLiveClassItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  audienceType?: LiveClassAudienceType;
  selectedStudentIds?: string[];
  selectedStudentNames?: string[];
  description: string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  startTime: string; // HH:MM AM/PM
  endTime: string; // HH:MM AM/PM
  platform: MeetingPlatform;
  meetingUrl: string;
  instructions: string;
  status: InstructorLiveClassStatus;
  createdAt: string;
  enrolledStudentsCount: number;
  qaQuestions?: LiveClassQAQuestion[];
}

export const mockEnrolledStudentsRoster: EnrolledStudentOption[] = [
  {
    id: 'std-101',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@edusphere.in',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  },
  {
    id: 'std-102',
    name: 'Priya Patel',
    email: 'priya.patel@edusphere.in',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    id: 'std-103',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@edusphere.in',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  },
  {
    id: 'std-104',
    name: 'Ananya Verma',
    email: 'ananya.verma@edusphere.in',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  },
  {
    id: 'std-105',
    name: 'Kabir Das',
    email: 'kabir.das@edusphere.in',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: 'std-106',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@edusphere.in',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
];

export const mockInstructorLiveClassesList: InstructorLiveClassItem[] = [
  {
    id: 'live-inst-101',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Live Q&A: Next.js 15 Server Actions & Optimistic State Mutations',
    audienceType: 'All Enrolled Students',
    description: 'Interactive deep-dive into Server Actions, Zod validation, optimistic UI updates, and production deployment patterns.',
    date: '10/08/2026',
    startTime: '04:00 PM',
    endTime: '05:30 PM',
    platform: 'Google Meet',
    meetingUrl: 'https://meet.google.com/edusphere-nextjs-15',
    instructions: 'Please test your audio and ensure your Node.js v20 environment is running before joining.',
    status: 'Scheduled',
    createdAt: '01/08/2026',
    enrolledStudentsCount: 142,
    qaQuestions: [
      {
        id: 'qa-1',
        classId: 'live-inst-101',
        studentName: 'Rohan Sharma',
        studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        questionText: 'Will Server Actions automatically invalidate the Next.js router cache or do we still need revalidatePath()?',
        createdAtTime: '10 mins ago',
        likesCount: 14,
        isLikedByStudent: true,
        isPinned: true,
        isAnswered: true,
        instructorReply: 'Good question! revalidatePath() or revalidateTag() is required to purge specific cached route data.',
        instructorReplyTime: '5 mins ago',
      },
      {
        id: 'qa-2',
        classId: 'live-inst-101',
        studentName: 'Priya Patel',
        studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        questionText: 'Is the starter code repository link working for Windows PowerShell users?',
        createdAtTime: '25 mins ago',
        likesCount: 6,
        isLikedByStudent: false,
        isPinned: false,
        isAnswered: false,
      },
    ],
  },
  {
    id: 'live-inst-102',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'React 19 Server Components & Actions Architecture Review',
    audienceType: 'All Enrolled Students',
    description: 'Hands-on live coding session creating streaming SSR layouts with Suspense boundaries and custom hooks.',
    date: '12/08/2026',
    startTime: '06:00 PM',
    endTime: '07:30 PM',
    platform: 'Google Meet',
    meetingUrl: 'https://meet.google.com/edusphere-react-19',
    instructions: 'Clone the starter repo linked in Course Content prior to joining.',
    status: 'Live',
    createdAt: '02/08/2026',
    enrolledStudentsCount: 128,
  },
  {
    id: 'live-inst-103',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    title: 'Module Federation & Independent Deployment Pipeline Walkthrough',
    audienceType: 'Selected Students',
    selectedStudentIds: ['std-101', 'std-102', 'std-104'],
    selectedStudentNames: ['Rohan Sharma', 'Priya Patel', 'Ananya Verma'],
    description: 'Live lab establishing Webpack 5 Module Federation across dynamic remote micro-frontend applications.',
    date: '04/08/2026',
    startTime: '02:00 PM',
    endTime: '03:30 PM',
    platform: 'Google Meet',
    meetingUrl: 'https://meet.google.com/edusphere-microfrontends',
    instructions: 'Keep microphones muted upon entering. Questions will be taken in the live chat sidebar.',
    status: 'Scheduled',
    createdAt: '28/07/2026',
    enrolledStudentsCount: 95,
  },
  {
    id: 'live-inst-104',
    courseId: 'course-103',
    courseTitle: 'Node.js Enterprise Microservices & Distributed Systems',
    title: 'Kafka Event Streaming & Redis Pub/Sub Architecture Masterclass',
    audienceType: 'All Enrolled Students',
    description: 'Designing fault-tolerant event-driven microservices with Apache Kafka and Redis cluster caching.',
    date: '25/07/2026',
    startTime: '05:00 PM',
    endTime: '06:30 PM',
    platform: 'Google Meet',
    meetingUrl: 'https://meet.google.com/edusphere-kafka-redis',
    instructions: 'Review Docker Compose files provided in Module 3.',
    status: 'Completed',
    createdAt: '20/07/2026',
    enrolledStudentsCount: 110,
  },
  {
    id: 'live-inst-105',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Draft: GraphQL Subscriptions & Real-time WebSockets',
    audienceType: 'All Enrolled Students',
    description: 'Draft outline for upcoming WebSocket live laboratory session.',
    date: '20/08/2026',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    platform: 'Google Meet',
    meetingUrl: 'https://meet.google.com/edusphere-draft-ws',
    instructions: 'Draft session - not visible to students.',
    status: 'Draft',
    createdAt: '03/08/2026',
    enrolledStudentsCount: 0,
  },
  {
    id: 'live-inst-106',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    title: 'Cancelled Workshop: Legacy Webpack to Vite Migration',
    audienceType: 'All Enrolled Students',
    description: 'This class was cancelled due to curriculum restructuring.',
    date: '30/07/2026',
    startTime: '03:00 PM',
    endTime: '04:00 PM',
    platform: 'Google Meet',
    meetingUrl: 'https://meet.google.com/edusphere-cancel-demo',
    instructions: 'Class cancelled. Check recorded announcements for replacement schedule.',
    status: 'Cancelled',
    createdAt: '22/07/2026',
    enrolledStudentsCount: 88,
  },
];
