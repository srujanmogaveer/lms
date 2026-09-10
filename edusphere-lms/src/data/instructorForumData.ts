export type InstructorDiscussionStatus = 'Open' | 'Answered' | 'Solved';

export interface ForumReplyItem {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'instructor' | 'student' | 'ta';
  content: string;
  createdAt: string;
  likesCount: number;
  isPinnedReply?: boolean;
  isAcceptedAnswer?: boolean;
}

export interface InstructorDiscussionItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  studentQuestionText: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  createdAt: string;
  repliesCount: number;
  status: InstructorDiscussionStatus;
  isPinned: boolean;
  isAnswered: boolean;
  replies: ForumReplyItem[];
}

export const mockInstructorDiscussionsList: InstructorDiscussionItem[] = [
  {
    id: 'disc-inst-101',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Understanding React 19 useTransition vs. useActionState in heavy list rendering',
    studentQuestionText:
      'In Module 1, Lesson 4, Dr. Vance mentions using useTransition for non-blocking UI state updates. When handling async form mutations, when should we prefer useActionState over custom useState booleans?',
    studentId: 'std-101',
    studentName: 'Rohan Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    createdAt: '04/08/2026 10:15 AM',
    repliesCount: 2,
    status: 'Solved',
    isPinned: true,
    isAnswered: true,
    replies: [
      {
        id: 'rep-101',
        discussionId: 'disc-inst-101',
        authorId: 'inst-1',
        authorName: 'Dr. Marcus Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorRole: 'instructor',
        content:
          'Great question Rohan! `useTransition` is designed for non-urgent UI transitions (like typing in a search filter). `useActionState` is optimized specifically for async server form actions where React manages pending state, return data, and optimistic updates automatically.',
        createdAt: '04/08/2026 11:30 AM',
        likesCount: 14,
        isPinnedReply: true,
        isAcceptedAnswer: true,
      },
      {
        id: 'rep-102',
        discussionId: 'disc-inst-101',
        authorId: 'std-102',
        authorName: 'Priya Patel',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        authorRole: 'student',
        content: 'Thank you Dr. Vance! That explanation cleared up my confusion on server action hooks.',
        createdAt: '04/08/2026 11:45 AM',
        likesCount: 5,
      },
    ],
  },
  {
    id: 'disc-inst-102',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Assignment 2: Next.js 15 Server Actions Zod Validation Error',
    studentQuestionText:
      'I am getting a TypeScript error when passing Zod parse results directly into safeParse() in Server Actions. Does Next.js 15 require FormData parsing helpers before Zod execution?',
    studentId: 'std-102',
    studentName: 'Priya Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: '03/08/2026 04:20 PM',
    repliesCount: 1,
    status: 'Answered',
    isPinned: false,
    isAnswered: true,
    replies: [
      {
        id: 'rep-201',
        discussionId: 'disc-inst-102',
        authorId: 'inst-1',
        authorName: 'Dr. Marcus Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorRole: 'instructor',
        content:
          'Hi Priya, convert FormData to a plain object first using `Object.fromEntries(formData)` before calling `schema.safeParse()`. Check Lesson 3 starter repository for reference.',
        createdAt: '03/08/2026 05:00 PM',
        likesCount: 8,
        isPinnedReply: false,
      },
    ],
  },
  {
    id: 'disc-inst-103',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    title: 'Module Federation shared singleton dependencies version mismatch',
    studentQuestionText:
      'When configuring Webpack 5 Module Federation, if Remote App uses React 19 and Host App uses React 18, how do we enforce singleton dependency fallback without crashing runtime context?',
    studentId: 'std-103',
    studentName: 'Aarav Mehta',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    createdAt: '02/08/2026 09:10 AM',
    repliesCount: 0,
    status: 'Open',
    isPinned: true,
    isAnswered: false,
    replies: [],
  },
  {
    id: 'disc-inst-104',
    courseId: 'course-103',
    courseTitle: 'Node.js Enterprise Microservices & Distributed Systems',
    title: 'Kafka Consumer Group rebalancing delays under high throughput',
    studentQuestionText:
      'We noticed consumer rebalance timeouts during peak throughput spikes. Should we tune sessionTimeoutMs or heartBeatIntervalMs in KafkaJS config?',
    studentId: 'std-104',
    studentName: 'Ananya Verma',
    studentAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    createdAt: '01/08/2026 02:45 PM',
    repliesCount: 1,
    status: 'Answered',
    isPinned: false,
    isAnswered: true,
    replies: [
      {
        id: 'rep-401',
        discussionId: 'disc-inst-104',
        authorId: 'inst-1',
        authorName: 'Dr. Marcus Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorRole: 'instructor',
        content:
          'Increase `maxPollIntervalMs` to give your worker batch handlers sufficient execution window, while keeping `heartbeatInterval` around 3000ms.',
        createdAt: '01/08/2026 03:30 PM',
        likesCount: 11,
      },
    ],
  },
  {
    id: 'disc-inst-105',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'How to deploy Next.js 15 Standalone Docker builds to AWS ECS Fargate',
    studentQuestionText:
      'Does the standalone output directory require copying public/ and .next/static manually into the Docker container?',
    studentId: 'std-105',
    studentName: 'Kabir Das',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '31/07/2026 11:00 AM',
    repliesCount: 0,
    status: 'Open',
    isPinned: false,
    isAnswered: false,
    replies: [],
  },
];
