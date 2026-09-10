export type LessonType = 'Video' | 'PDF' | 'Text' | 'Resource';
export type LessonStatus = 'Published' | 'Draft';

export interface CurriculumLesson {
  id: string;
  title: string;
  shortDescription: string;
  durationMinutes: number;
  type: LessonType;
  status: LessonStatus;
  isLocked: boolean;
  prerequisiteId?: string; // ID of required previous lesson
  videoUrl?: string;
  pdfUrl?: string;
  textContent?: string;
  resourceUrl?: string;
  resourcesCount?: number;
}

export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  order: number;
  isExpanded?: boolean;
  lessons: CurriculumLesson[];
}

export interface CourseCurriculumData {
  courseId: string;
  courseTitle: string;
  category: string;
  difficulty: string;
  thumbnail: string;
  modules: CurriculumModule[];
}

export const mockCurriculumData: Record<string, CourseCurriculumData> = {
  'course-101': {
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    category: 'Web Development',
    difficulty: 'All Levels',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Introduction to Full-Stack Architecture & Modern JS',
        description: 'Understand the client-server model, Node.js event loop, ES6+ async/await, and development environment setup.',
        order: 1,
        isExpanded: true,
        lessons: [
          {
            id: 'les-101',
            title: 'Welcome & Course Roadmap Overview',
            shortDescription: 'Get familiar with course structure, Discord community, and GitHub repository setup.',
            durationMinutes: 15,
            type: 'Video',
            status: 'Published',
            isLocked: false,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          },
          {
            id: 'les-102',
            title: 'Client-Server Communication & HTTP/2 Fundamentals',
            shortDescription: 'Deep dive into headers, status codes, REST conventions, and CORS policies.',
            durationMinutes: 28,
            type: 'Video',
            status: 'Published',
            isLocked: false,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          },
          {
            id: 'les-103',
            title: 'Modern JavaScript Cheatsheet & ES2024 Features',
            shortDescription: 'Comprehensive PDF resource covering optional chaining, nullish coalescing, and structured clone.',
            durationMinutes: 20,
            type: 'PDF',
            status: 'Published',
            isLocked: false,
            pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          },
          {
            id: 'les-104',
            title: 'Environment Setup Guide: VS Code, Node 20 & Git',
            shortDescription: 'Step-by-step instructions for installing essential extensions and configuring SSH keys.',
            durationMinutes: 25,
            type: 'Text',
            status: 'Draft',
            isLocked: true,
            prerequisiteId: 'les-103',
            textContent: 'Detailed setup commands and configuration files.',
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Module 2: React 18 Core Concepts & Hooks Deep Dive',
        description: 'Master JSX compilation, Reconciliation algorithm, useEffect lifecycles, and custom hooks design.',
        order: 2,
        isExpanded: true,
        lessons: [
          {
            id: 'les-201',
            title: 'Virtual DOM, Fiber Reconciler & Batching Explained',
            shortDescription: 'Learn how React renders elements efficiently and how batching updates work in React 18.',
            durationMinutes: 42,
            type: 'Video',
            status: 'Published',
            isLocked: true,
            prerequisiteId: 'les-104',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          },
          {
            id: 'les-202',
            title: 'Building Custom Reusable Hooks Pattern',
            shortDescription: 'Construct useDebounce, useLocalStorage, and useFetch hooks from ground up.',
            durationMinutes: 35,
            type: 'Video',
            status: 'Published',
            isLocked: true,
            prerequisiteId: 'les-201',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          },
          {
            id: 'les-203',
            title: 'React 18 Starter Code Pack & Starter Templates',
            shortDescription: 'Downloadable zip containing starter boilerplate for module exercises.',
            durationMinutes: 10,
            type: 'Resource',
            status: 'Draft',
            isLocked: true,
            prerequisiteId: 'les-202',
            resourcesCount: 4,
          },
        ],
      },
      {
        id: 'mod-3',
        title: 'Module 3: Next.js 14 App Router, Server Components & Actions',
        description: 'Explore file-based routing, React Server Components (RSC), Streaming SSR, and Server Actions for form mutation.',
        order: 3,
        isExpanded: false,
        lessons: [
          {
            id: 'les-301',
            title: 'App Router Layouts, Pages, and Loading UI Patterns',
            shortDescription: 'Understand page hierarchy, nested layouts, template.tsx, and Suspense fallback boundaries.',
            durationMinutes: 50,
            type: 'Video',
            status: 'Published',
            isLocked: true,
            prerequisiteId: 'les-203',
          },
          {
            id: 'les-302',
            title: 'Server Actions vs REST APIs in Next.js',
            shortDescription: 'Comparing mutation strategies, revalidatePath, and optimistic UI updates.',
            durationMinutes: 45,
            type: 'Video',
            status: 'Draft',
            isLocked: true,
            prerequisiteId: 'les-301',
          },
        ],
      },
    ],
  },
};
