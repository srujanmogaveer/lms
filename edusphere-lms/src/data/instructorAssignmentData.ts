export type InstructorAssignmentType = 'Mandatory';
export type InstructorAssignmentStatus = 'Draft' | 'Published' | 'Archived';
export type StudentSubmissionStatus = 'Not Submitted' | 'Submitted' | 'Under Review' | 'Graded';

export interface InstructorStudentSubmission {
  id: string;
  assignmentId: string;
  attemptNumber?: number;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  submittedDate: string; // DD/MM/YYYY
  submittedTimeIST: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  submissionNotes?: string;
  status: StudentSubmissionStatus;
  marksAwarded?: number;
  maxMarks: number;
  instructorFeedback?: string;
  gradedAt?: string;
}

export interface InstructorAssignmentItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  instructions: string[];
  maxMarks: number;
  passingMarks: number;
  allowedFileTypes: string[];
  maxFileSizeMB: number;
  maxSubmissionAttempts: number;
  assignmentType: InstructorAssignmentType;
  status: InstructorAssignmentStatus;
  attachmentUrl?: string;
  attachmentFileName?: string;
  createdAt: string; // DD/MM/YYYY
  submissions: InstructorStudentSubmission[];
}

export const mockInstructorAssignmentsList: InstructorAssignmentItem[] = [
  {
    id: 'asg-301',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Full-Stack Environment Setup & Git Workflow Exercise',
    description: 'Configure local Node.js v20 runtime, VS Code extensions, SSH keys, and create a public GitHub repository with branch protection rules.',
    instructions: [
      'Install Node.js v20 LTS and configure npm workspaces.',
      'Initialize a git repository and commit initial project structure.',
      'Submit screenshot proof and repository link in a single PDF or ZIP archive.'
    ],
    maxMarks: 100,
    passingMarks: 70,
    allowedFileTypes: ['.pdf', '.zip'],
    maxFileSizeMB: 25,
    maxSubmissionAttempts: 3,
    assignmentType: 'Mandatory',
    status: 'Published',
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    attachmentFileName: 'Assignment_1_Instructions_Sheet.pdf',
    createdAt: '01/08/2026',
    submissions: [
      {
        id: 'sub-401',
        assignmentId: 'asg-301',
        studentId: 'std-101',
        studentName: 'Rahul Sharma',
        studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        submittedDate: '03/08/2026',
        submittedTimeIST: '14:30 IST',
        fileName: 'Rahul_Sharma_Environment_Setup.pdf',
        fileSize: '3.4 MB',
        submissionNotes: 'All Node.js and Git configurations verified.',
        status: 'Under Review',
        maxMarks: 100,
      },
      {
        id: 'sub-402',
        assignmentId: 'asg-301',
        studentId: 'std-102',
        studentName: 'Priya Patel',
        studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        submittedDate: '02/08/2026',
        submittedTimeIST: '18:15 IST',
        fileName: 'Priya_Patel_Assignment1.zip',
        fileSize: '8.2 MB',
        submissionNotes: 'Uploaded repo zip with test screenshots.',
        status: 'Graded',
        marksAwarded: 95,
        maxMarks: 100,
        instructorFeedback: 'Excellent work! Clean git commit history and proper branch setup.',
        gradedAt: '03/08/2026',
      },
      {
        id: 'sub-403',
        assignmentId: 'asg-301',
        studentId: 'std-103',
        studentName: 'Amit Kumar',
        studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        submittedDate: '04/08/2026',
        submittedTimeIST: '09:10 IST',
        fileName: 'Amit_Kumar_Git_Proof.pdf',
        fileSize: '2.1 MB',
        status: 'Under Review',
        maxMarks: 100,
      },
      {
        id: 'sub-404',
        assignmentId: 'asg-301',
        studentId: 'std-104',
        studentName: 'Sneha Reddy',
        studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        submittedDate: '',
        submittedTimeIST: '',
        fileName: '',
        fileSize: '',
        status: 'Not Submitted',
        maxMarks: 100,
      }
    ],
  },
  {
    id: 'asg-302',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Custom React Hooks Library & Vitest Suite',
    description: 'Construct a reusable custom hook suite (useFetch, useLocalStorage, useDebounce) with TypeScript generic constraints and unit tests.',
    instructions: [
      'Write useLocalStorage hook with JSON serialization support.',
      'Implement useDebounce hook with configurable delay parameter.',
      'Ensure 100% test coverage using Vitest.'
    ],
    maxMarks: 100,
    passingMarks: 75,
    allowedFileTypes: ['.zip'],
    maxFileSizeMB: 30,
    maxSubmissionAttempts: 3,
    assignmentType: 'Mandatory',
    status: 'Published',
    createdAt: '02/08/2026',
    submissions: [
      {
        id: 'sub-405',
        assignmentId: 'asg-302',
        studentId: 'std-101',
        studentName: 'Rahul Sharma',
        studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        submittedDate: '04/08/2026',
        submittedTimeIST: '11:20 IST',
        fileName: 'Rahul_Hooks_Lib.zip',
        fileSize: '12.4 MB',
        status: 'Submitted',
        maxMarks: 100,
      }
    ],
  },
  {
    id: 'asg-303',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    title: 'Module Federation Micro-frontend Architecture Blueprint',
    description: 'Design zero-bundle-size micro-frontends using Webpack 5 Module Federation with shared dependencies optimization.',
    instructions: [
      'Configure host container and remote app applications.',
      'Demonstrate dynamic remote loading with React.lazy and Suspense.'
    ],
    maxMarks: 50,
    passingMarks: 35,
    allowedFileTypes: ['.pdf', '.zip'],
    maxFileSizeMB: 50,
    maxSubmissionAttempts: 3,
    assignmentType: 'Mandatory',
    status: 'Draft',
    createdAt: '03/08/2026',
    submissions: [],
  }
];
