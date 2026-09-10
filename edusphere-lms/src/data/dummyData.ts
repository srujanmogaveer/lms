import type {
  Student,
  Instructor,
  Admin,
  Course,
  Assignment,
  Quiz,
  Certificate,
  Announcement,
  Notification,
  Payment,
  WeeklyActivity,
  LiveClass,
  ActivityTimelineItem,
  EnrolledCourseProgress,
  WishlistItem,
  CartItem,
  Coupon,
  EnrolledCourseDetail
} from '../types';

export const mockUsers: {
  students: Student[];
  instructors: Instructor[];
  admins: Admin[];
} = {
  students: [
    {
      id: 'std-1',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Enthusiastic web developer learning React & AI engineering from Bengaluru, Karnataka.',
      joinedDate: '15/09/2025',
      status: 'active',
      enrolledCoursesCount: 4,
      completedCoursesCount: 2,
      certificatesCount: 2,
    },
    {
      id: 'std-2',
      name: 'Sophia Chen',
      email: 'sophia.c@example.com',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      bio: 'Data Analyst branching out into Machine Learning.',
      joinedDate: '10/01/2026',
      status: 'active',
      enrolledCoursesCount: 3,
      completedCoursesCount: 1,
      certificatesCount: 1,
    }
  ],
  instructors: [
    {
      id: 'ins-1',
      name: 'Priya Nair',
      email: 'priya.nair@example.com',
      role: 'instructor',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      bio: 'Senior Software Architect from Mangaluru, Karnataka with 12+ years of experience.',
      joinedDate: '01/04/2023',
      status: 'active',
      title: 'Principal Software Architect',
      coursesCreatedCount: 6,
      totalStudents: 14200,
      rating: 4.9,
    },
    {
      id: 'ins-2',
      name: 'Dr. Marcus Vance',
      email: 'marcus.vance@example.com',
      role: 'instructor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Head of Web Systems Architecture.',
      joinedDate: '14/02/2024',
      status: 'active',
      title: 'Head of Systems Architecture',
      coursesCreatedCount: 4,
      totalStudents: 9800,
      rating: 4.85,
    }
  ],
  admins: [
    {
      id: 'adm-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      bio: 'EduSphere System Administrator & Operations Lead.',
      joinedDate: '01/01/2022',
      status: 'active',
      permissions: ['all'],
    }
  ]
};

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Full-Stack React & Node.js Masterclass 2026',
    slug: 'fullstack-react-nodejs-masterclass',
    description: 'Master modern full-stack development with TypeScript, React 19, Tailwind CSS, Express, and PostgreSQL.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
    category: 'Development',
    level: 'Intermediate',
    instructorId: 'ins-1',
    instructorName: 'Priya Nair',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    price: 2999,
    discountPrice: 999,
    rating: 4.9,
    reviewsCount: 1240,
    studentsEnrolled: 8520,
    durationHours: 32,
    lessonsCount: 145,
    updatedAt: '20/07/2026',
    isPublished: true,
    isFeatured: true,
  },
  {
    id: 'course-2',
    title: 'UI/UX Design Systems with Figma & Tailwind',
    slug: 'ui-ux-design-systems-figma',
    description: 'Learn how to build scalable design tokens, component libraries, and interactive high-fidelity prototypes.',
    thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
    category: 'Design',
    level: 'All Levels',
    instructorId: 'ins-2',
    instructorName: 'Dr. Marcus Vance',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    price: 1499,
    discountPrice: 499,
    rating: 4.8,
    reviewsCount: 890,
    studentsEnrolled: 5410,
    durationHours: 24,
    lessonsCount: 98,
    updatedAt: '15/06/2026',
    isPublished: true,
    isFeatured: true,
  },
  {
    id: 'course-3',
    title: 'Practical Machine Learning & AI Engineering',
    slug: 'practical-machine-learning-ai',
    description: 'Build LLM applications, retrieval-augmented generation (RAG) pipelines, and deploy models to production.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600',
    category: 'Data Science',
    level: 'Advanced',
    instructorId: 'ins-1',
    instructorName: 'Priya Nair',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    price: 4999,
    discountPrice: 2999,
    rating: 4.95,
    reviewsCount: 620,
    studentsEnrolled: 3100,
    durationHours: 40,
    lessonsCount: 160,
    updatedAt: '2026-07-28',
    isPublished: true,
    isFeatured: false,
  },
  {
    id: 'course-4',
    title: 'Cloud DevOps & Kubernetes Infrastructure',
    slug: 'cloud-devops-kubernetes-infrastructure',
    description: 'Deploy auto-scaling containers, Helm charts, CI/CD pipelines, and Prometheus monitoring on AWS.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
    category: 'Cloud Computing',
    level: 'Intermediate',
    instructorId: 'ins-1',
    instructorName: 'Dr. Marcus Vance',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    price: 84.99,
    discountPrice: 54.99,
    rating: 4.87,
    reviewsCount: 450,
    studentsEnrolled: 2400,
    durationHours: 28,
    lessonsCount: 110,
    updatedAt: '2026-07-12',
    isPublished: true,
    isFeatured: true,
  },
  {
    id: 'course-5',
    title: 'Cybersecurity Essentials & Ethical Hacking 2026',
    slug: 'cybersecurity-essentials-ethical-hacking',
    description: 'Learn modern network security, vulnerability analysis, pen-testing tools, and zero-trust principles.',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600',
    category: 'Security',
    level: 'Beginner',
    instructorId: 'ins-1',
    instructorName: 'Dr. Marcus Vance',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    price: 69.99,
    discountPrice: 34.99,
    rating: 4.75,
    reviewsCount: 310,
    studentsEnrolled: 1850,
    durationHours: 20,
    lessonsCount: 85,
    updatedAt: '2026-07-05',
    isPublished: true,
    isFeatured: false,
  },
  {
    id: 'course-6',
    title: 'Advanced Next.js 15 & App Router Masterclass',
    slug: 'advanced-nextjs-app-router-masterclass',
    description: 'Master Server Components, Server Actions, Parallel Routes, Optimistic UI, and Edge Caching.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
    category: 'Development',
    level: 'Advanced',
    instructorId: 'ins-2',
    instructorName: 'Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    price: 94.99,
    discountPrice: 59.99,
    rating: 4.92,
    reviewsCount: 780,
    studentsEnrolled: 4200,
    durationHours: 36,
    lessonsCount: 130,
    updatedAt: '2026-08-01',
    isPublished: true,
    isFeatured: true,
  },
  {
    id: 'course-7',
    title: 'UX Research, Wireframing & Prototyping Workshop',
    slug: 'ux-research-wireframing-prototyping',
    description: 'Conduct user interviews, design user journeys, test interactive prototypes, and iterate based on qualitative analytics.',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600',
    category: 'Design',
    level: 'Intermediate',
    instructorId: 'ins-2',
    instructorName: 'Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    price: 59.99,
    discountPrice: 29.99,
    rating: 4.82,
    reviewsCount: 520,
    studentsEnrolled: 2900,
    durationHours: 18,
    lessonsCount: 70,
    updatedAt: '2026-06-28',
    isPublished: true,
    isFeatured: false,
  }
];

export const mockWishlistItems: WishlistItem[] = [
  {
    id: 'witem-1',
    course: mockCourses[2], // Machine Learning & AI
    addedAt: '2 hours ago',
  },
  {
    id: 'witem-2',
    course: mockCourses[3], // Cloud DevOps
    addedAt: 'Yesterday',
  },
  {
    id: 'witem-3',
    course: mockCourses[4], // Cybersecurity
    addedAt: '3 days ago',
  },
  {
    id: 'witem-4',
    course: mockCourses[5], // Next.js 15
    addedAt: '4 days ago',
  },
  {
    id: 'witem-5',
    course: mockCourses[6], // UX Research
    addedAt: '1 week ago',
  },
  {
    id: 'witem-6',
    course: mockCourses[0], // Full-Stack React
    addedAt: '2 weeks ago',
  },
];


export const mockEnrolledProgress: EnrolledCourseProgress[] = [
  {
    course: mockCourses[0],
    progress: 74,
    lastAccessedLesson: 'Lesson 18: Advanced Custom Hooks & Performance Memoization',
    completedLessons: 107,
    totalLessons: 145,
    lastAccessedTime: 'Today at 09:30 AM',
  },
  {
    course: mockCourses[1],
    progress: 42,
    lastAccessedLesson: 'Module 4: Designing WCAG Compliant Dark Mode Tokens',
    completedLessons: 41,
    totalLessons: 98,
    lastAccessedTime: 'Yesterday at 04:15 PM',
  },
  {
    course: mockCourses[2],
    progress: 18,
    lastAccessedLesson: 'Section 2: Vector Embeddings & Similarity Search with Pinecone',
    completedLessons: 29,
    totalLessons: 160,
    lastAccessedTime: '3 days ago',
  }
];

export const mockWeeklyActivity: WeeklyActivity[] = [
  { day: 'Mon', fullDay: 'Monday', hours: 2.5, targetHours: 2.0 },
  { day: 'Tue', fullDay: 'Tuesday', hours: 3.8, targetHours: 2.0 },
  { day: 'Wed', fullDay: 'Wednesday', hours: 1.5, targetHours: 2.0 },
  { day: 'Thu', fullDay: 'Thursday', hours: 4.2, targetHours: 2.0 },
  { day: 'Fri', fullDay: 'Friday', hours: 2.0, targetHours: 2.0 },
  { day: 'Sat', fullDay: 'Saturday', hours: 5.0, targetHours: 3.0 },
  { day: 'Sun', fullDay: 'Sunday', hours: 3.5, targetHours: 3.0 },
];

export const mockUpcomingLiveClasses: LiveClass[] = [
  {
    id: 'lc-1',
    courseId: 'course-1',
    courseTitle: 'Full-Stack React & Node.js Masterclass 2026',
    instructorName: 'Dr. Marcus Vance',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    topic: 'Live Q&A: React Server Components & Suspense Architecture',
    scheduledAt: '2026-08-04T15:00:00Z',
    durationMinutes: 60,
    status: 'upcoming',
    meetingUrl: 'https://meet.edusphere.com/live-rsc-workshop',
  },
  {
    id: 'lc-2',
    courseId: 'course-2',
    courseTitle: 'UI/UX Design Systems with Figma & Tailwind',
    instructorName: 'Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    topic: 'Figma Auto-Layout & Design System Review Session',
    scheduledAt: '2026-08-06T18:30:00Z',
    durationMinutes: 90,
    status: 'upcoming',
    meetingUrl: 'https://meet.edusphere.com/uiux-figma-live',
  }
];

export const mockAssignments: Assignment[] = [
  {
    id: 'asg-1',
    courseId: 'course-1',
    courseTitle: 'Full-Stack React & Node.js Masterclass 2026',
    title: 'Build a REST API with Express & Zod Validation',
    description: 'Implement secure endpoints with JWT authentication and Request input schemas.',
    totalPoints: 100,
    status: 'pending',
  },
  {
    id: 'asg-2',
    courseId: 'course-2',
    courseTitle: 'UI/UX Design Systems with Figma & Tailwind',
    title: 'Create Accessible Color & Typography Tokens',
    description: 'Design dark/light palette tokens adhering to WCAG AA standards.',
    totalPoints: 100,
    status: 'graded',
    grade: 95,
  },
  {
    id: 'asg-3',
    courseId: 'course-3',
    courseTitle: 'Practical Machine Learning & AI Engineering',
    title: 'RAG Pipeline Implementation with LangChain',
    description: 'Build a document vector store retrieval interface.',
    totalPoints: 100,
    status: 'pending',
  }
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    courseId: 'course-1',
    courseTitle: 'Full-Stack React & Node.js Masterclass 2026',
    title: 'React 19 Hooks & State Optimization',
    timeLimitMinutes: 20,
    questionsCount: 15,
    passingScore: 80,
    totalAttempts: 1,
    status: 'passed',
    score: 92,
  },
  {
    id: 'quiz-2',
    courseId: 'course-3',
    courseTitle: 'Practical Machine Learning & AI Engineering',
    title: 'Transformer Architectures & Embeddings',
    timeLimitMinutes: 30,
    questionsCount: 20,
    passingScore: 75,
    totalAttempts: 0,
    status: 'not_started',
  }
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert-101',
    courseId: 'course-2',
    courseTitle: 'UI/UX Design Systems with Figma & Tailwind',
    courseCategory: 'UI/UX Design',
    courseThumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600',
    studentName: 'Alex Johnson',
    instructorName: 'Elena Rostova',
    instructorTitle: 'Principal UX Designer',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    issueDate: '2026-06-20',
    completionDate: '2026-06-19',
    certificateCode: 'EDU-2026-8849-UX',
    verificationUrl: 'https://edusphere.edu/verify/EDU-2026-8849-UX',
    downloadUrl: '#',
    status: 'earned',
    learningHours: 32,
    requirements: {
      lessonsCompletionPercent: 100,
      assignmentsCompletionPercent: 100,
      quizzesPassPercent: 100,
      overallProgressPercent: 100,
      remainingLessonsCount: 0,
      remainingAssignmentsCount: 0,
      remainingQuizzesCount: 0,
    },
  },
  {
    id: 'cert-102',
    courseId: 'course-4',
    courseTitle: 'Cloud DevOps & Kubernetes Infrastructure',
    courseCategory: 'Cloud & DevOps',
    courseThumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600',
    studentName: 'Alex Johnson',
    instructorName: 'David Miller (TA)',
    instructorTitle: 'Senior SRE & DevOps Specialist',
    instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    issueDate: '2026-05-14',
    completionDate: '2026-05-13',
    certificateCode: 'EDU-2026-9932-K8S',
    verificationUrl: 'https://edusphere.edu/verify/EDU-2026-9932-K8S',
    downloadUrl: '#',
    status: 'earned',
    learningHours: 45,
    requirements: {
      lessonsCompletionPercent: 100,
      assignmentsCompletionPercent: 100,
      quizzesPassPercent: 100,
      overallProgressPercent: 100,
      remainingLessonsCount: 0,
      remainingAssignmentsCount: 0,
      remainingQuizzesCount: 0,
    },
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'EduSphere 2.0 Live Q&A Workshop this Friday!',
    content: 'Join our lead instructors for a live interactive workshop on building production AI applications with RAG architectures.',
    authorName: 'Sarah Connor',
    authorRole: 'Administrator',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    date: '2026-08-01',
    targetAudience: 'all',
    isImportant: true,
  },
  {
    id: 'ann-2',
    title: 'New React 19 Compiler Deep Dive Module Added',
    content: 'We have updated the Full-Stack Masterclass with 5 brand-new video lessons covering automatic memoization.',
    authorName: 'Dr. Marcus Vance',
    authorRole: 'Senior Instructor',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    date: '2026-07-29',
    targetAudience: 'students',
    isImportant: false,
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Assignment Reminder',
    message: 'Your assignment "Build a REST API with Express & Zod Validation" is due in 3 days.',
    category: 'assignment',
    type: 'warning',
    timestamp: '15 mins ago',
    date: '2026-08-03',
    read: false,
    link: '#',
  },
  {
    id: 'notif-2',
    title: 'Quiz Reminder',
    message: 'Upcoming Quiz: "Transformer Architectures & Embeddings" is open for attempts.',
    category: 'quiz',
    type: 'info',
    timestamp: '1 hour ago',
    date: '2026-08-03',
    read: false,
    link: '#',
  },
  {
    id: 'notif-3',
    title: 'New Announcement',
    message: 'Sarah Connor posted: "EduSphere 2.0 Live Q&A Workshop this Friday!".',
    category: 'announcement',
    type: 'info',
    timestamp: '3 hours ago',
    date: '2026-08-03',
    read: true,
    link: '#',
  },
  {
    id: 'notif-4',
    title: 'Certificate Ready',
    message: 'Congratulations! Your certificate for "Cloud DevOps & Kubernetes" is ready for download.',
    category: 'certificate',
    type: 'success',
    timestamp: '1 day ago',
    date: '2026-08-02',
    read: true,
    link: '#',
  },
  {
    id: 'notif-5',
    title: 'Payment Success',
    message: 'Payment of $49.99 for Full-Stack React & Node.js Masterclass was processed successfully.',
    category: 'payment',
    type: 'success',
    timestamp: '2 days ago',
    date: '2026-08-01',
    read: true,
    link: '#',
  }
];

export const mockActivityTimeline: ActivityTimelineItem[] = [
  {
    id: 'act-1',
    type: 'lesson_completed',
    title: 'Lesson Completed',
    courseTitle: 'Full-Stack React & Node.js Masterclass 2026',
    timestamp: 'Today, 10:45 AM',
    detail: 'Completed "Lesson 18: Advanced Custom Hooks & Performance Memoization"',
    iconType: 'lesson'
  },
  {
    id: 'act-2',
    type: 'assignment_submitted',
    title: 'Assignment Submitted',
    courseTitle: 'UI/UX Design Systems with Figma & Tailwind',
    timestamp: 'Yesterday, 04:30 PM',
    detail: 'Submitted "Create Accessible Color & Typography Tokens" (Grade: 95%)',
    iconType: 'assignment'
  },
  {
    id: 'act-3',
    type: 'quiz_completed',
    title: 'Quiz Passed',
    courseTitle: 'Full-Stack React & Node.js Masterclass 2026',
    timestamp: '3 days ago',
    detail: 'Scored 92% on "React 19 Hooks & State Optimization Quiz"',
    iconType: 'quiz'
  },
  {
    id: 'act-4',
    type: 'certificate_earned',
    title: 'Certificate Earned',
    courseTitle: 'Cloud DevOps & Kubernetes Infrastructure',
    timestamp: '1 week ago',
    detail: 'Verified Certificate #EDU-2026-3192-K8S issued',
    iconType: 'certificate'
  }
];

export const mockWishlist: Course[] = [
  mockCourses[2], // Practical Machine Learning & AI
  mockCourses[3], // Cloud DevOps & Kubernetes
];

export const mockCart: { course: Course; price: number }[] = [
  { course: mockCourses[2], price: 69.99 },
  { course: mockCourses[3], price: 54.99 },
];

export const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    transactionId: 'PAY-89210-RZP',
    studentName: 'Alex Johnson',
    courseTitle: 'Full-Stack React & Node.js Masterclass 2026',
    amount: 4999,
    status: 'Paid',
    date: '2026-07-01',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'pay-2',
    transactionId: 'PAY-74129-RZP',
    studentName: 'Sophia Chen',
    courseTitle: 'UI/UX Design Systems with Figma & Tailwind',
    amount: 3999,
    status: 'Paid',
    date: '2026-07-05',
    paymentMethod: 'UPI / Razorpay',
  }
];

export const mockCartItems: CartItem[] = [
  {
    id: 'citem-1',
    course: mockCourses[2], // Practical Machine Learning & AI Engineering (Price: $99.99, Discount: $69.99)
    addedAt: '10 mins ago',
  },
  {
    id: 'citem-2',
    course: mockCourses[3], // Cloud DevOps & Kubernetes (Price: $84.99, Discount: $54.99)
    addedAt: '1 hour ago',
  },
  {
    id: 'citem-3',
    course: mockCourses[5], // Advanced Next.js 15 (Price: $94.99, Discount: $59.99)
    addedAt: '3 hours ago',
  }
];

export const mockCoupons: Coupon[] = [
  {
    code: 'EDUSPHERE20',
    discountType: 'percentage',
    discountValue: 20,
    description: '20% extra discount on all cart masterclasses!',
    minSpend: 50,
  },
  {
    code: 'WELCOME10',
    discountType: 'fixed',
    discountValue: 10,
    description: 'Flat $10 instant discount for new learners.',
    minSpend: 30,
  },
  {
    code: 'AI50',
    discountType: 'percentage',
    discountValue: 50,
    description: 'Special 50% discount coupon for AI & Dev tracks!',
    minSpend: 100,
  }
];

export const mockMyEnrolledCourses: EnrolledCourseDetail[] = [
  {
    id: 'my-course-1',
    course: mockCourses[0], // Full-Stack React & Node.js
    enrollmentStatus: 'in_progress',
    progress: 74,
    completedLessons: 107,
    totalLessons: 145,
    lastAccessedLesson: 'Lesson 18: Advanced Custom Hooks & Performance Memoization',
    lastAccessedTime: '2 hours ago',
    enrolledDate: 'Sep 15, 2025',
  },
  {
    id: 'my-course-2',
    course: mockCourses[1], // UI/UX Design Systems
    enrollmentStatus: 'in_progress',
    progress: 42,
    completedLessons: 41,
    totalLessons: 98,
    lastAccessedLesson: 'Module 4: Designing WCAG Compliant Dark Mode Tokens',
    lastAccessedTime: 'Yesterday at 04:15 PM',
    enrolledDate: 'Nov 01, 2025',
  },
  {
    id: 'my-course-3',
    course: mockCourses[2], // Machine Learning & AI
    enrollmentStatus: 'not_started',
    progress: 0,
    completedLessons: 0,
    totalLessons: 160,
    lastAccessedLesson: 'Orientation: Welcome to AI Engineering & Vector DBs',
    lastAccessedTime: '5 days ago',
    enrolledDate: 'Jan 10, 2026',
  },
  {
    id: 'my-course-4',
    course: mockCourses[3], // Cloud DevOps & Kubernetes
    enrollmentStatus: 'completed',
    progress: 100,
    completedLessons: 110,
    totalLessons: 110,
    lastAccessedLesson: 'Final Capstone: Auto-scaling K8s Helm Deployment',
    lastAccessedTime: '1 week ago',
    enrolledDate: 'May 14, 2025',
    certificateCode: 'EDU-2026-3192-K8S',
  }
];



