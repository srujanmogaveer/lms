export type InstructorQuizType = 'Mandatory' | 'Optional';
export type InstructorQuizStatus = 'Draft' | 'Published' | 'Archived';
export type QuestionType =
  | 'Single Answer'
  | 'Multiple Answer'
  | 'Fill in the Blanks'
  | 'True or False';

export interface QuestionBankItem {
  id: string;
  courseId: string;
  courseTitle: string;
  type: QuestionType;
  questionText: string;
  explanation?: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  fillBlankAnswer?: string;
  marks: number;
}

export interface InstructorQuizQuestion extends QuestionBankItem {}

export interface StudentQuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  courseId: string;
  courseTitle: string;
  quizId: string;
  quizTitle: string;
  attemptNumber: number;
  attemptDateIST: string;
  score: number;
  maxScore: number;
  percentage: number;
  result: 'Pass' | 'Fail';
  timeTakenMinutes: number;
}

export interface InstructorQuizItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  quizType: InstructorQuizType;
  questionsCount: number;
  passingMarks: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  randomizeQuestions: boolean;
  shuffleOptions: boolean;
  status: InstructorQuizStatus;
  createdAt: string; // DD/MM/YYYY
  totalAttemptsCount: number;
  questions: InstructorQuizQuestion[];
}

export interface QuizAnalyticsSummary {
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  averageScorePercentage: number;
  highestScorePercentage: number;
  lowestScorePercentage: number;
}

export const mockQuestionBankList: QuestionBankItem[] = [
  {
    id: 'qb-101',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    type: 'Single Answer',
    questionText: 'What is the primary benefit of the React 19 Compiler?',
    explanation: 'React 19 compiler automatically memoizes component renders without manual useMemo/useCallback.',
    options: [
      { id: 'opt-a', text: 'Converts JSX to WebAssembly', isCorrect: false },
      { id: 'opt-b', text: 'Automatic memoization at build-time', isCorrect: true },
      { id: 'opt-c', text: 'Replaces state managers with Web Workers', isCorrect: false },
      { id: 'opt-d', text: 'Forces synchronous server renders', isCorrect: false },
    ],
    marks: 10,
  },
  {
    id: 'qb-102',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    type: 'Multiple Answer',
    questionText: 'Which features are introduced in Next.js 14 App Router?',
    explanation: 'Server Actions and Parallel Routes are core App Router capabilities.',
    options: [
      { id: 'opt-2a', text: 'Server Actions for form mutations', isCorrect: true },
      { id: 'opt-2b', text: 'Parallel & Intercepting Routes', isCorrect: true },
      { id: 'opt-2c', text: 'Automatic jQuery migration', isCorrect: false },
      { id: 'opt-2d', text: 'Flash Player integration', isCorrect: false },
    ],
    marks: 10,
  },
  {
    id: 'qb-103',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    type: 'True or False',
    questionText: 'Node.js event loop runs single-threaded for JavaScript execution.',
    explanation: 'JavaScript code executes on a single main thread, while libuv manages async I/O worker threads.',
    options: [
      { id: 'opt-3a', text: 'True', isCorrect: true },
      { id: 'opt-3b', text: 'False', isCorrect: false },
    ],
    marks: 5,
  },
  {
    id: 'qb-104',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    type: 'Single Answer',
    questionText: 'What is Webpack Module Federation used for?',
    explanation: 'Module Federation allows dynamic loading of separate micro-frontend builds at runtime.',
    options: [
      { id: 'opt-4a', text: 'CSS minification', isCorrect: false },
      { id: 'opt-4b', text: 'Sharing JavaScript bundles across independent deployments', isCorrect: true },
      { id: 'opt-4c', text: 'Database connection pooling', isCorrect: false },
    ],
    marks: 10,
  },
];

export const mockStudentQuizAttemptsList: StudentQuizAttempt[] = [
  {
    id: 'att-501',
    studentId: 'std-101',
    studentName: 'Rahul Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    quizId: 'quiz-301',
    quizTitle: 'React 18 & TypeScript Core Knowledge Assessment',
    attemptNumber: 1,
    attemptDateIST: '03/08/2026 14:20 IST',
    score: 85,
    maxScore: 100,
    percentage: 85,
    result: 'Pass',
    timeTakenMinutes: 18,
  },
  {
    id: 'att-502',
    studentId: 'std-102',
    studentName: 'Priya Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    quizId: 'quiz-301',
    quizTitle: 'React 18 & TypeScript Core Knowledge Assessment',
    attemptNumber: 1,
    attemptDateIST: '02/08/2026 19:45 IST',
    score: 92,
    maxScore: 100,
    percentage: 92,
    result: 'Pass',
    timeTakenMinutes: 15,
  },
  {
    id: 'att-503',
    studentId: 'std-103',
    studentName: 'Amit Kumar',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    quizId: 'quiz-301',
    quizTitle: 'React 18 & TypeScript Core Knowledge Assessment',
    attemptNumber: 1,
    attemptDateIST: '04/08/2026 08:30 IST',
    score: 60,
    maxScore: 100,
    percentage: 60,
    result: 'Fail',
    timeTakenMinutes: 20,
  },
  {
    id: 'att-504',
    studentId: 'std-104',
    studentName: 'Sneha Reddy',
    studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    quizId: 'quiz-302',
    quizTitle: 'Node.js Event Loop & Express Middleware Assessment',
    attemptNumber: 1,
    attemptDateIST: '04/08/2026 10:15 IST',
    score: 78,
    maxScore: 100,
    percentage: 78,
    result: 'Pass',
    timeTakenMinutes: 22,
  },
];

export const mockInstructorQuizzesList: InstructorQuizItem[] = [
  {
    id: 'quiz-301',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'React 18 & TypeScript Core Knowledge Assessment',
    description: 'Comprehensive evaluation of React 18 hooks, Server Components, automatic memoization, and strict generic constraints.',
    quizType: 'Mandatory',
    questionsCount: 15,
    passingMarks: 75,
    timeLimitMinutes: 25,
    maxAttempts: 3,
    randomizeQuestions: true,
    shuffleOptions: true,
    status: 'Published',
    createdAt: '01/08/2026',
    totalAttemptsCount: 42,
    questions: [
      mockQuestionBankList[0],
      mockQuestionBankList[1],
      mockQuestionBankList[2],
    ],
  },
  {
    id: 'quiz-302',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Node.js Event Loop & Express Middleware Assessment',
    description: 'Assess understanding of Node.js non-blocking I/O, libuv thread pool, custom Express error handler middlewares, and CORS.',
    quizType: 'Mandatory',
    questionsCount: 20,
    passingMarks: 70,
    timeLimitMinutes: 30,
    maxAttempts: 2,
    randomizeQuestions: true,
    shuffleOptions: true,
    status: 'Published',
    createdAt: '03/08/2026',
    totalAttemptsCount: 38,
    questions: [
      mockQuestionBankList[2],
    ],
  },
  {
    id: 'quiz-303',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    title: 'Webpack 5 Module Federation Architecture Quiz',
    description: 'Test architectural concepts of host/remote containers and shared singletons.',
    quizType: 'Optional',
    questionsCount: 10,
    passingMarks: 60,
    timeLimitMinutes: 15,
    maxAttempts: 5,
    randomizeQuestions: false,
    shuffleOptions: true,
    status: 'Draft',
    createdAt: '04/08/2026',
    totalAttemptsCount: 0,
    questions: [
      mockQuestionBankList[3],
    ],
  },
  {
    id: 'quiz-304',
    courseId: 'course-103',
    courseTitle: 'UI/UX Design Systems & Figma Enterprise Masterclass',
    title: 'Design Systems Tokens & WCAG Accessibility Quiz',
    description: 'Test atomic design principles, contrast ratios, and screen reader ARIA landmarks.',
    quizType: 'Optional',
    questionsCount: 12,
    passingMarks: 80,
    timeLimitMinutes: 20,
    maxAttempts: 3,
    randomizeQuestions: true,
    shuffleOptions: true,
    status: 'Archived',
    createdAt: '25/07/2026',
    totalAttemptsCount: 19,
    questions: [],
  },
];
