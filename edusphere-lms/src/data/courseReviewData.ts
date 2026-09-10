export interface ReviewLessonResource {
  id: string;
  name: string;
  size: string;
  fileType: 'PDF' | 'ZIP' | 'CODE' | 'DOC';
  downloadUrl: string;
}

export interface ReviewLessonItem {
  id: string;
  sectionId: string;
  sectionTitle: string;
  title: string;
  type: 'Video' | 'PDF' | 'Text' | 'Resource';
  durationMinutes: number;
  status: 'Published' | 'Draft';
  videoUrl?: string;
  pdfUrl?: string;
  pdfPageCount?: number;
  textContent?: string;
  resources: ReviewLessonResource[];
}

export interface ReviewCurriculumSection {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: ReviewLessonItem[];
}

export interface ReviewAssignmentItem {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  maxMarks: number;
  passingMarks: number;
  isMandatory: boolean;
  attachmentFileName?: string;
  attachmentSize?: string;
  attachmentUrl?: string;
}

export type ReviewQuestionType =
  | 'Multiple Choice (Single Answer)'
  | 'Multiple Choice (Multiple Answers)'
  | 'True / False'
  | 'Fill in the Blanks';

export interface ReviewQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ReviewQuizQuestion {
  id: string;
  questionType: ReviewQuestionType;
  questionText: string;
  options?: ReviewQuizOption[];
  fillBlankAnswer?: string;
  explanation?: string;
}

export interface ReviewQuizItem {
  id: string;
  title: string;
  description: string;
  passingMarks: number; // e.g. 70% or 75 marks
  timeLimitMinutes: number;
  maxAttempts: number;
  questions: ReviewQuizQuestion[];
}

export interface ReviewInstructorInfo {
  name: string;
  photoUrl: string;
  qualification: string;
  experienceYears: number;
  email: string;
  totalPublishedCourses: number;
  bio: string;
}

export interface CourseReviewDetailsData {
  courseId: string;
  thumbnail: string;
  promoVideoUrl?: string;
  title: string;
  instructorName: string;
  category: string;
  language: string;
  difficulty: string;
  price: number;
  discountPrice?: number;
  priceType?: string;
  fullDescription: string;
  learningOutcomes: string[];
  requirements: string[];
  submissionDate: string;
  
  // Curriculum
  sections: ReviewCurriculumSection[];

  // Assignments
  assignments: ReviewAssignmentItem[];

  // Quizzes
  quizzes: ReviewQuizItem[];

  // Instructor
  instructor: ReviewInstructorInfo;

  // Course Completion Audit
  completion?: {
    courseComplete: boolean;
    courseInfoComplete: boolean;
    curriculumComplete: boolean;
    contentComplete: boolean;
    assignmentsComplete: boolean;
    quizzesComplete: boolean;
    modulesCount?: number;
    lessonsCount?: number;
    assignmentsCount?: number;
    quizzesCount?: number;
    missingItems?: string[];
  };
}

// Complete mock dataset per course ID with fallbacks
export const getCourseReviewData = (courseId: string, baseCourse?: any): CourseReviewDetailsData => {
  const defaultInstructor: ReviewInstructorInfo = {
    name: baseCourse?.instructorName || 'Dr. Marcus Vance',
    photoUrl: baseCourse?.instructorPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250',
    qualification: 'Ph.D. in Computer Science & Distributed Systems',
    experienceYears: 12,
    email: 'marcus.vance@edusphere.edu',
    totalPublishedCourses: 8,
    bio: 'Senior Software Architect & Lead Educator with 12+ years of experience building enterprise web & AI systems and mentoring over 50,000 students across India.',
  };

  if (courseId === 'course-101') {
    return {
      courseId: 'course-101',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      promoVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      title: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
      instructorName: defaultInstructor.name,
      category: 'Web Development',
      language: 'English',
      difficulty: 'All Levels',
      price: 4999,
      submissionDate: baseCourse?.createdAt || '12/01/2025',
      fullDescription:
        'Become a job-ready full-stack developer with hands-on real-world projects tailored for the tech industry in India and globally. Learn REST APIs, GraphQL, Authentication, State Management with Redux Toolkit, Deployment on Vercel and AWS, and Performance Optimization.',
      learningOutcomes: [
        'Build full-stack production ready web applications with React 18 and Next.js 14.',
        'Design robust RESTful APIs & GraphQL backend endpoints with Node.js & Express.',
        'Implement Secure JWT Authentication, OAuth2 login, and role-based permissions.',
        'Deploy applications to Vercel, AWS S3, and Cloudflare with CI/CD integration.'
      ],
      requirements: [
        'Basic HTML, CSS, and fundamental JavaScript concepts.',
        'A working laptop or desktop running Windows, macOS, or Linux.',
        'Curiosity and commitment to learn coding through building real projects.'
      ],
      instructor: defaultInstructor,
      sections: [
        {
          id: 'sec-1',
          title: 'Section 1: Modern JavaScript & Full-Stack Fundamentals',
          description: 'Master client-server architecture, ES6+ JavaScript primitives, async/await, and environment setup.',
          order: 1,
          lessons: [
            {
              id: 'les-1',
              sectionId: 'sec-1',
              sectionTitle: 'Section 1: Modern JavaScript & Full-Stack Fundamentals',
              title: 'Lesson 1: Welcome & Course Architecture Overview',
              type: 'Video',
              durationMinutes: 18,
              status: 'Published',
              videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
              textContent: 'Welcome to the Full-Stack Web Development Bootcamp! In this opening video, we cover the full roadmap, software prerequisites, and community channels.',
              resources: [
                { id: 'r-1', name: 'Bootcamp_Syllabus_2026.pdf', size: '2.4 MB', fileType: 'PDF', downloadUrl: '#' },
                { id: 'r-2', name: 'VSCode_Settings_Config.json', size: '14 KB', fileType: 'CODE', downloadUrl: '#' }
              ]
            },
            {
              id: 'les-2',
              sectionId: 'sec-1',
              sectionTitle: 'Section 1: Modern JavaScript & Full-Stack Fundamentals',
              title: 'Lesson 2: Client-Server HTTP/2 & REST Conventions',
              type: 'Video',
              durationMinutes: 28,
              status: 'Published',
              videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
              textContent: 'Deep dive into HTTP methods, request headers, status codes, CORS headers, and standard RESTful endpoint naming conventions.',
              resources: [
                { id: 'r-3', name: 'HTTP_Status_Codes_CheatSheet.pdf', size: '1.1 MB', fileType: 'PDF', downloadUrl: '#' }
              ]
            },
            {
              id: 'les-3',
              sectionId: 'sec-1',
              sectionTitle: 'Section 1: Modern JavaScript & Full-Stack Fundamentals',
              title: 'Lesson 3: ES2024 JavaScript Cheatsheet & Async Patterns',
              type: 'PDF',
              durationMinutes: 20,
              status: 'Published',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              pdfPageCount: 12,
              textContent: 'Comprehensive reference notes on optional chaining, nullish coalescing, Promises, Promise.allSettled, and async generators.',
              resources: [
                { id: 'r-4', name: 'Async_JavaScript_Guide.pdf', size: '3.8 MB', fileType: 'PDF', downloadUrl: '#' }
              ]
            },
            {
              id: 'les-4',
              sectionId: 'sec-1',
              sectionTitle: 'Section 1: Modern JavaScript & Full-Stack Fundamentals',
              title: 'Lesson 4: Development Setup & Git Workflow Guide',
              type: 'Text',
              durationMinutes: 25,
              status: 'Draft',
              textContent: `### Environment Setup Guide
1. Install Node.js v20.x LTS from the official website.
2. Verify installation: run \`node -v\` and \`npm -v\` in your terminal.
3. Configure Git credentials:
\`\`\`bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
\`\`\`
4. Install recommended VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense.`,
              resources: [
                { id: 'r-5', name: 'Git_Branching_Strategy.pdf', size: '850 KB', fileType: 'PDF', downloadUrl: '#' }
              ]
            }
          ]
        },
        {
          id: 'sec-2',
          title: 'Section 2: React 18 Core Concepts, Hooks & State Management',
          description: 'Learn JSX compilation, virtual DOM reconciliation, state hooks, context API, and custom hooks design.',
          order: 2,
          lessons: [
            {
              id: 'les-5',
              sectionId: 'sec-2',
              sectionTitle: 'Section 2: React 18 Core Concepts, Hooks & State Management',
              title: 'Lesson 5: Virtual DOM Reconciliation & React 18 Fiber Engine',
              type: 'Video',
              durationMinutes: 32,
              status: 'Published',
              videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
              textContent: 'Detailed breakdown of how React virtual DOM diffing works under the hood and how React 18 handles concurrent rendering & automatic batching.',
              resources: [
                { id: 'r-6', name: 'React_18_Fiber_Diagram.pdf', size: '1.9 MB', fileType: 'PDF', downloadUrl: '#' }
              ]
            },
            {
              id: 'les-6',
              sectionId: 'sec-2',
              sectionTitle: 'Section 2: React 18 Core Concepts, Hooks & State Management',
              title: 'Lesson 6: Mastering useEffect, useMemo & useCallback',
              type: 'Video',
              durationMinutes: 35,
              status: 'Published',
              videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
              textContent: 'Learn when and how to properly clean up side effects in useEffect, avoid memory leaks, and optimize expensive recalculations with useMemo.',
              resources: [
                { id: 'r-7', name: 'Hooks_Optimization_Snippets.zip', size: '4.2 MB', fileType: 'ZIP', downloadUrl: '#' }
              ]
            }
          ]
        }
      ],
      assignments: [
        {
          id: 'asg-1',
          title: 'Full-Stack Environment Setup & Git Workflow Exercise',
          description: 'Configure local Node.js v20 runtime, VS Code extensions, SSH keys, and create a public GitHub repository with branch protection rules.',
          instructions: [
            'Install Node.js v20 LTS and configure npm workspaces.',
            'Initialize a git repository and commit initial project structure with a clean README.md.',
            'Create a feature branch, make a pull request, and merge using squashed commits.',
            'Submit screenshot proof and repository link in a single PDF or ZIP archive.'
          ],
          maxMarks: 100,
          passingMarks: 70,
          isMandatory: true,
          attachmentFileName: 'Assignment_1_Instructions_Sheet.pdf',
          attachmentSize: '1.4 MB',
          attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        },
        {
          id: 'asg-2',
          title: 'Build a Dynamic E-Commerce Product Catalog in React',
          description: 'Develop a responsive frontend product catalog component featuring live category filtering, price slider, debounced search, and shopping cart persistence in localStorage.',
          instructions: [
            'Use React 18 with TypeScript and Tailwind CSS.',
            'Implement custom hooks for cart management (useCart).',
            'Handle loading, error, and empty result UI states gracefully.',
            'Ensure full keyboard accessibility (A11y).'
          ],
          maxMarks: 100,
          passingMarks: 75,
          isMandatory: true,
          attachmentFileName: 'ECommerce_Design_Assets.zip',
          attachmentSize: '6.8 MB',
          attachmentUrl: '#'
        }
      ],
      quizzes: [
        {
          id: 'quiz-1',
          title: 'JavaScript ES6+ & Async Programming Diagnostic Quiz',
          description: 'Test your understanding of modern JavaScript features, Event Loop microtasks vs macrotasks, and async/await exception handling.',
          passingMarks: 70,
          timeLimitMinutes: 20,
          maxAttempts: 3,
          questions: [
            {
              id: 'q-101',
              questionType: 'Multiple Choice (Single Answer)',
              questionText: 'What is the output of `typeof null` in JavaScript?',
              options: [
                { id: 'o-1', text: '"undefined"', isCorrect: false },
                { id: 'o-2', text: '"null"', isCorrect: false },
                { id: 'o-3', text: '"object"', isCorrect: true },
                { id: 'o-4', text: '"boolean"', isCorrect: false }
              ],
              explanation: 'Due to legacy implementation in original JavaScript specifications, `typeof null` returns `"object"`.'
            },
            {
              id: 'q-102',
              questionType: 'Multiple Choice (Multiple Answers)',
              questionText: 'Which of the following statement(s) about JavaScript Promises are TRUE?',
              options: [
                { id: 'o-5', text: 'A Promise can switch between Pending, Fulfilled, and Rejected multiple times.', isCorrect: false },
                { id: 'o-6', text: '`Promise.all` rejects immediately if any input promise rejects.', isCorrect: true },
                { id: 'o-7', text: '`Promise.allSettled` waits for all promises to settle regardless of outcome.', isCorrect: true },
                { id: 'o-8', text: '`async` functions always return a Promise.', isCorrect: true }
              ],
              explanation: '`Promise.all` fail-fast behavior and `Promise.allSettled` complete array settlement are core ES2020 mechanics.'
            },
            {
              id: 'q-103',
              questionType: 'True / False',
              questionText: 'The React virtual DOM directly mutates the browser native DOM during state updates.',
              options: [
                { id: 'o-9', text: 'True', isCorrect: false },
                { id: 'o-10', text: 'False', isCorrect: true }
              ],
              explanation: 'False. React compares the new virtual DOM tree against the previous tree (reconciliation) and batches minimal changes to the real DOM.'
            },
            {
              id: 'q-104',
              questionType: 'Fill in the Blanks',
              questionText: 'The hook used in React to preserve values across renders without causing re-renders is called ________.',
              fillBlankAnswer: 'useRef',
              explanation: '`useRef` returns a mutable ref object whose `.current` property persists without triggering component re-renders.'
            }
          ]
        }
      ]
    };
  }

  // Fallback / Generator for any other course in the database
  const title = baseCourse?.title || 'Comprehensive Course Module & Curriculum Review';
  const category = baseCourse?.category || 'Software Engineering';
  const price = baseCourse?.price ?? 3499;
  const language = baseCourse?.language || 'English';
  const difficulty = baseCourse?.difficulty || 'Intermediate';
  const description = baseCourse?.fullDescription || baseCourse?.shortDescription || 'This course offers an in-depth curriculum designed for comprehensive skill mastery with hands-on projects, quizzes, and downloadable resources.';

  return {
    courseId,
    thumbnail: baseCourse?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: baseCourse?.promoVideoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4',
    title,
    instructorName: defaultInstructor.name,
    category,
    language,
    difficulty,
    price,
    discountPrice: baseCourse?.discountPrice ?? baseCourse?.discount_price,
    priceType: baseCourse?.priceType ?? baseCourse?.price_type,
    submissionDate: baseCourse?.createdAt || '15/07/2026',
    fullDescription: description,
    learningOutcomes: baseCourse?.learningOutcomes || [
      'Master fundamental principles and advanced domain concepts.',
      'Build real-world hands-on projects with industry-standard practices.',
      'Deploy, evaluate, and maintain solutions efficiently.',
      'Gain practical problem-solving expertise and portfolio ready artifacts.'
    ],
    requirements: baseCourse?.requirements || [
      'Basic background knowledge in the domain.',
      'Computer with stable internet connection.',
      'Enthusiasm to complete practical exercises and quizzes.'
    ],
    instructor: defaultInstructor,
    sections: [
      {
        id: `sec-${courseId}-1`,
        title: 'Section 1: Foundations & Architecture Overview',
        description: 'Core introductory concepts, setup instructions, and framework fundamentals.',
        order: 1,
        lessons: [
          {
            id: `les-${courseId}-1`,
            sectionId: `sec-${courseId}-1`,
            sectionTitle: 'Section 1: Foundations & Architecture Overview',
            title: 'Lesson 1: Course Orientation & Module Roadmap',
            type: 'Video',
            durationMinutes: 15,
            status: 'Published',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            textContent: 'Welcome to this course! This video provides a high-level overview of key topics, structure, and prerequisites.',
            resources: [
              { id: 'res-gen-1', name: 'Course_Overview_Syllabus.pdf', size: '1.8 MB', fileType: 'PDF', downloadUrl: '#' }
            ]
          },
          {
            id: `les-${courseId}-2`,
            sectionId: `sec-${courseId}-1`,
            sectionTitle: 'Section 1: Foundations & Architecture Overview',
            title: 'Lesson 2: Core Fundamentals & Theory Breakdown',
            type: 'Video',
            durationMinutes: 25,
            status: 'Published',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            textContent: 'Explores core theoretical underpinnings and domain mechanics with visual diagrams and architectural flowcharts.',
            resources: [
              { id: 'res-gen-2', name: 'Architecture_Diagrams.pdf', size: '3.1 MB', fileType: 'PDF', downloadUrl: '#' }
            ]
          },
          {
            id: `les-${courseId}-3`,
            sectionId: `sec-${courseId}-1`,
            sectionTitle: 'Section 1: Foundations & Architecture Overview',
            title: 'Lesson 3: Official Reference Notes & Specs',
            type: 'PDF',
            durationMinutes: 20,
            status: 'Published',
            pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            pdfPageCount: 8,
            textContent: 'Comprehensive PDF documentation containing formulas, conventions, and reference cheat sheets.',
            resources: []
          },
          {
            id: `les-${courseId}-4`,
            sectionId: `sec-${courseId}-1`,
            sectionTitle: 'Section 1: Foundations & Architecture Overview',
            title: 'Lesson 4: Step-by-Step Hands-on Setup Guide',
            type: 'Text',
            durationMinutes: 30,
            status: 'Draft',
            textContent: 'Detailed written instructions and step-by-step guidance for completing local installation and tool configuration.',
            resources: [
              { id: 'res-gen-3', name: 'Starter_Template_Code.zip', size: '2.5 MB', fileType: 'ZIP', downloadUrl: '#' }
            ]
          }
        ]
      },
      {
        id: `sec-${courseId}-2`,
        title: 'Section 2: Practical Implementation & Deep Dive',
        description: 'Advanced concepts, real-world case studies, and hands-on exercises.',
        order: 2,
        lessons: [
          {
            id: `les-${courseId}-5`,
            sectionId: `sec-${courseId}-2`,
            sectionTitle: 'Section 2: Practical Implementation & Deep Dive',
            title: 'Lesson 5: Deep Dive Implementation Video Tutorial',
            type: 'Video',
            durationMinutes: 40,
            status: 'Published',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            textContent: 'Hands-on coding session demonstrating best practices, debugging strategies, and error resolution.',
            resources: [
              { id: 'res-gen-4', name: 'Source_Code_Module_2.zip', size: '5.4 MB', fileType: 'ZIP', downloadUrl: '#' }
            ]
          }
        ]
      }
    ],
    assignments: [
      {
        id: `asg-${courseId}-1`,
        title: 'Hands-On Practical Lab Assignment',
        description: 'Apply concepts learned in Section 1 & 2 to build a complete project solution according to specifications.',
        instructions: [
          'Review the provided instructions sheet and requirements checklist.',
          'Implement the required functionality in your project environment.',
          'Verify edge cases and run provided validation tests.',
          'Package final output into a single ZIP file and submit before the deadline.'
        ],
        maxMarks: 100,
        passingMarks: 70,
        isMandatory: true,
        attachmentFileName: 'Assignment_Requirements_Doc.pdf',
        attachmentSize: '1.2 MB',
        attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ],
    quizzes: [
      {
        id: `quiz-${courseId}-1`,
        title: 'Comprehensive Knowledge Check Quiz',
        description: 'Assess your retention of core principles, key terms, and practical problem-solving logic.',
        passingMarks: 70,
        timeLimitMinutes: 25,
        maxAttempts: 3,
        questions: [
          {
            id: `q-${courseId}-1`,
            questionType: 'Multiple Choice (Single Answer)',
            questionText: 'What is the primary goal of this course module?',
            options: [
              { id: 'opt-1', text: 'To build scalable and maintainable solutions.', isCorrect: true },
              { id: 'opt-2', text: 'To memorize syntax without understanding fundamentals.', isCorrect: false },
              { id: 'opt-3', text: 'To skip security best practices.', isCorrect: false }
            ],
            explanation: 'Building scalable and maintainable solutions is the core focus of the module.'
          },
          {
            id: `q-${courseId}-2`,
            questionType: 'Multiple Choice (Multiple Answers)',
            questionText: 'Which of the following are recommended best practices?',
            options: [
              { id: 'opt-4', text: 'Maintain modular code structure.', isCorrect: true },
              { id: 'opt-5', text: 'Write comprehensive documentation.', isCorrect: true },
              { id: 'opt-6', text: 'Ignore error handling.', isCorrect: false }
            ],
            explanation: 'Modular code structure and clear documentation are essential best practices.'
          },
          {
            id: `q-${courseId}-3`,
            questionType: 'True / False',
            questionText: 'Admin can review every lesson, video, PDF note, assignment, and quiz prior to approving the course.',
            options: [
              { id: 'opt-7', text: 'True', isCorrect: true },
              { id: 'opt-8', text: 'False', isCorrect: false }
            ],
            explanation: 'True. The governance workflow mandates thorough review of all content.'
          },
          {
            id: `q-${courseId}-4`,
            questionType: 'Fill in the Blanks',
            questionText: 'The process of inspecting course material before catalog publication is called course ________.',
            fillBlankAnswer: 'approval',
            explanation: 'Course approval ensures content quality, accuracy, and compliance.'
          }
        ]
      }
    ]
  };
};
