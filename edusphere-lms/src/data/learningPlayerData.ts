import type {
  PlayerModule,
  PlayerPersonalNote,
  PlayerUpcomingLearning,
  Course,
} from '../types';

export const mockPlayerCourse: Course = {
  id: 'crs-1',
  title: 'Full-Stack Web Development Masterclass 2026',
  slug: 'full-stack-web-development-masterclass-2026',
  description:
    'Master modern frontend architectures, backend node services, GraphQL, Docker, and enterprise cloud deployments with hands-on real-world projects.',
  thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
  category: 'Development',
  level: 'Intermediate',
  instructorId: 'ins-1',
  instructorName: 'Dr. Marcus Vance',
  instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  price: 89.99,
  discountPrice: 49.99,
  rating: 4.9,
  reviewsCount: 1240,
  studentsEnrolled: 8450,
  durationHours: 48,
  lessonsCount: 16,
  updatedAt: 'August 2026',
  isPublished: true,
  isFeatured: true,
};

export const mockModules: PlayerModule[] = [
  {
    id: 'mod-1',
    title: 'Module 1: Modern React & TypeScript Foundations',
    description: 'Deep dive into React 19 concurrent features, TypeScript generics, and custom hooks architecture.',
    lessons: [
      {
        id: 'les-1',
        moduleId: 'mod-1',
        moduleTitle: 'Module 1: Modern React & TypeScript Foundations',
        title: '1. Introduction to React 19 & Component Architecture',
        duration: '18:45',
        type: 'video',
        isCompleted: true,
        isBookmarked: true,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoPoster: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
        resources: [
          {
            id: 'res-101',
            title: 'React 19 Architecture Guide Sheet (PDF)',
            fileType: 'pdf',
            fileSize: '2.4 MB',
            downloadUrl: '#',
          },
          {
            id: 'res-102',
            title: 'Lesson Starter Codebase (ZIP)',
            fileType: 'zip',
            fileSize: '14.8 MB',
            downloadUrl: '#',
          },
        ],
      },
      {
        id: 'les-2',
        moduleId: 'mod-1',
        moduleTitle: 'Module 1: Modern React & TypeScript Foundations',
        title: '2. Advanced TypeScript Generics & Type Narrowing',
        duration: '24:10',
        type: 'video',
        isCompleted: true,
        isBookmarked: false,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        videoPoster: 'https://images.unsplash.com/photo-1516116211223-4c7141326c65?w=1200',
        resources: [
          {
            id: 'res-103',
            title: 'TypeScript Cheat Sheet 2026 Edition',
            fileType: 'pdf',
            fileSize: '1.8 MB',
            downloadUrl: '#',
          },
        ],
      },
      {
        id: 'les-3',
        moduleId: 'mod-1',
        moduleTitle: 'Module 1: Modern React & TypeScript Foundations',
        title: '3. State Management & Custom Hooks Best Practices',
        duration: '15:20',
        type: 'pdf',
        isCompleted: true,
        isBookmarked: true,
        pdfTitle: 'Comprehensive Guide to State Management & Custom Hooks Patterns',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        pdfPageCount: 14,
        resources: [
          {
            id: 'res-104',
            title: 'Custom Hooks Design Patterns Slides (PPT)',
            fileType: 'ppt',
            fileSize: '5.2 MB',
            downloadUrl: '#',
          },
        ],
      },
      {
        id: 'les-4',
        moduleId: 'mod-1',
        moduleTitle: 'Module 1: Modern React & TypeScript Foundations',
        title: '4. Performance Optimization & React Compiler Deep Dive',
        duration: '22:00',
        type: 'text',
        isCompleted: false,
        isBookmarked: false,
        textContent: {
          subtitle: 'Understanding Automatic Memoization, Fiber Reconciler, and React Compiler Rules',
          introduction:
            'React 19 introduces automatic memoization through the new React Compiler (Auto-memo). In this text lesson, we explore how React optimizes render trees without manual useMemo or useCallback calls.',
          sections: [
            {
              title: '1. Why Traditional Memoization Failed at Scale',
              content:
                'Historically, developers relied heavily on useMemo, useCallback, and React.memo to prevent unnecessary component re-renders. However, missing dependency arrays, broken object references, and over-memoization often led to subtle stale closure bugs and bloated codebases.',
            },
            {
              title: '2. The React Compiler Model',
              content:
                'The React Compiler parses JavaScript at build-time, inserting structural equality checks automatically. It guarantees that values and JSX trees are only recalculated when underlying reactive values change.',
            },
          ],
          codeSnippet: {
            language: 'typescript',
            filename: 'useOptimizedState.ts',
            code: `import { useState, useTransition } from 'react';

export function useOptimizedSearch<T>(items: T[], searchKey: keyof T) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (newQuery: string) => {
    startTransition(() => {
      setQuery(newQuery);
    });
  };

  return { query, handleSearch, isPending };
}`,
          },
          keyTakeaways: [
            'React Compiler handles memoization automatically without manual useMemo wrappers.',
            'Ensure pure component logic with strict immutable state updates.',
            'Use useTransition for non-blocking UI state updates during heavy search filtering.',
          ],
          comparisonTable: {
            headers: ['Feature', 'React 18 (Manual)', 'React 19 (Compiler)'],
            rows: [
              ['Memoization Strategy', 'Manual useMemo / useCallback', 'Automatic Build-time Memoization'],
              ['Dependency Management', 'Developer-managed arrays', 'Compiler inferred dependencies'],
              ['Code Cleanliness', 'Verbose wrapper boilerplate', 'Clean declarative React code'],
            ],
          },
        },
        resources: [
          {
            id: 'res-105',
            title: 'React 19 Optimization Source Code',
            fileType: 'code',
            fileSize: '8.4 MB',
            downloadUrl: '#',
          },
        ],
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Module 2: Tailwind CSS & Design System Engineering',
    description: 'Build enterprise-grade, accessible UI component libraries with Tailwind CSS v4 and CSS variables.',
    lessons: [
      {
        id: 'les-5',
        moduleId: 'mod-2',
        moduleTitle: 'Module 2: Tailwind CSS & Design System Engineering',
        title: '1. Designing Token-Based Color Systems & Dark Mode',
        duration: '16:30',
        type: 'video',
        isCompleted: false,
        isBookmarked: true,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoPoster: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
        resources: [
          {
            id: 'res-201',
            title: 'Tailwind Design Tokens Schema (JSON)',
            fileType: 'code',
            fileSize: '450 KB',
            downloadUrl: '#',
          },
        ],
      },
      {
        id: 'les-6',
        moduleId: 'mod-2',
        moduleTitle: 'Module 2: Tailwind CSS & Design System Engineering',
        title: '2. Responsive Grid Systems & Micro-Interactions',
        duration: '20:15',
        type: 'video',
        isCompleted: false,
        isBookmarked: false,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        videoPoster: 'https://images.unsplash.com/photo-1542744094-3a31727223ec?w=1200',
      },
      {
        id: 'les-7',
        moduleId: 'mod-2',
        moduleTitle: 'Module 2: Tailwind CSS & Design System Engineering',
        title: '3. Accessibility & WAI-ARIA Screen Reader Compliance',
        duration: '12:40',
        type: 'pdf',
        isCompleted: false,
        isBookmarked: false,
        pdfTitle: 'WAI-ARIA Checklist for Web Component Engineers',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        pdfPageCount: 8,
      },
    ],
  },
  {
    id: 'mod-3',
    title: 'Module 3: Full-Stack Node.js & REST API Architecture',
    description: 'Construct secure REST API endpoints, JWT authentication tokens, rate limiting, and PostgreSQL integration.',
    lessons: [
      {
        id: 'les-8',
        moduleId: 'mod-3',
        moduleTitle: 'Module 3: Full-Stack Node.js & REST API Architecture',
        title: '1. Node.js & Express Route Handlers Setup',
        duration: '25:00',
        type: 'video',
        isCompleted: false,
        isBookmarked: false,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        videoPoster: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=1200',
      },
      {
        id: 'les-9',
        moduleId: 'mod-3',
        moduleTitle: 'Module 3: Full-Stack Node.js & REST API Architecture',
        title: '2. JWT Security Middleware & Role-Based Access Control',
        duration: '28:15',
        type: 'video',
        isCompleted: false,
        isBookmarked: false,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyflights.mp4',
        videoPoster: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200',
      },
      {
        id: 'les-10',
        moduleId: 'mod-3',
        moduleTitle: 'Module 3: Full-Stack Node.js & REST API Architecture',
        title: '3. API Documentation & Postman Collection Export',
        duration: '14:00',
        type: 'resource',
        isCompleted: false,
        isBookmarked: false,
        resources: [
          {
            id: 'res-301',
            title: 'EduSphere Complete Postman Collection v2 (JSON)',
            fileType: 'code',
            fileSize: '1.2 MB',
            downloadUrl: '#',
          },
          {
            id: 'res-302',
            title: 'OpenAPI 3.0 API Specification (YAML)',
            fileType: 'doc',
            fileSize: '890 KB',
            downloadUrl: '#',
          },
        ],
      },
    ],
  },
];

export const initialPersonalNotes: PlayerPersonalNote[] = [
  {
    id: 'note-1',
    lessonId: 'les-1',
    lessonTitle: '1. Introduction to React 19 & Component Architecture',
    timestamp: '04:12',
    content: 'React 19 Action hooks allow handling async transitions cleanly without custom boolean spinners!',
    createdAt: 'Yesterday at 4:30 PM',
  },
  {
    id: 'note-2',
    lessonId: 'les-2',
    lessonTitle: '2. Advanced TypeScript Generics & Type Narrowing',
    timestamp: '11:45',
    content: 'Remember to use discriminating unions with `type` discriminator key for clean type guards.',
    createdAt: 'Today at 10:15 AM',
  },
];

export const mockUpcomingLearning: PlayerUpcomingLearning = {
  nextLesson: {
    id: 'les-5',
    title: '1. Designing Token-Based Color Systems & Dark Mode',
    duration: '16:30',
    moduleTitle: 'Module 2: Tailwind CSS & Design System Engineering',
  },
  upcomingAssignment: {
    id: 'asg-101',
    title: 'Build a Custom Hooks Reusable Library',
    points: 100,
  },
  upcomingQuiz: {
    id: 'qz-201',
    title: 'React 19 & TypeScript Foundations Quiz',
    timeLimit: '20 Minutes',
    questionsCount: 15,
  },
};
