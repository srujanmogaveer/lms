export type AnnouncementStatus = 'Draft' | 'Published';
export type AnnouncementAudienceType = 'All Enrolled Students' | 'Selected Students';

export interface AnnouncementAttachmentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface InstructorAnnouncementItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  audienceType: AnnouncementAudienceType;
  selectedStudentIds?: string[];
  selectedStudentNames?: string[];
  message: string;
  publishDate: string;
  status: AnnouncementStatus;
  isPinned: boolean;
  attachments?: AnnouncementAttachmentItem[];
}

export const mockInstructorAnnouncementsList: InstructorAnnouncementItem[] = [
  {
    id: 'anc-inst-101',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Midterm Practical Assessment & Next.js 15 Server Actions Submission Rules',
    audienceType: 'All Enrolled Students',
    message:
      'Dear Students,\n\nOur Midterm Practical Assessment will open on Monday, August 10, 2026. Please make sure to review Module 1 through 3 before attempting.\n\nSubmission Guidelines:\n1. Repository must be pushed to GitHub with a public README.md.\n2. Loom/YouTube walkthrough link must be attached.\n3. Late submissions incur a 10% penalty per 24 hours.',
    publishDate: '01/08/2026',
    status: 'Published',
    isPinned: true,
    attachments: [
      {
        id: 'att-1',
        name: 'Midterm_Evaluation_Rubric_2026.pdf',
        size: '2.4 MB',
        type: 'pdf',
        url: '#',
      },
    ],
  },
  {
    id: 'anc-inst-102',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    title: 'Special Live Mentoring Call for Project Lead Group A',
    audienceType: 'Selected Students',
    selectedStudentIds: ['std-101', 'std-102', 'std-104'],
    selectedStudentNames: ['Rohan Sharma', 'Priya Patel', 'Ananya Verma'],
    message:
      'Hello Group A Leads,\n\nThis is a private notification for your project mentoring review scheduled for Friday at 04:00 PM IST. Please prepare your architecture diagrams in advance.',
    publishDate: '03/08/2026',
    status: 'Published',
    isPinned: true,
    attachments: [
      {
        id: 'att-2',
        name: 'Mentoring_Review_Template.docx',
        size: '640 KB',
        type: 'doc',
        url: '#',
      },
    ],
  },
  {
    id: 'anc-inst-103',
    courseId: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    title: 'Draft: Webpack 5 Module Federation Lab Environment Setup',
    audienceType: 'All Enrolled Students',
    message:
      'Draft announcement outline regarding upcoming Module Federation container deployment lab.',
    publishDate: '04/08/2026',
    status: 'Draft',
    isPinned: false,
  },
  {
    id: 'anc-inst-104',
    courseId: 'course-103',
    courseTitle: 'Node.js Enterprise Microservices & Distributed Systems',
    title: 'Kafka Event Streaming & Redis Cluster Cache Setup Guide',
    audienceType: 'All Enrolled Students',
    message:
      'Hi DevOps Engineers,\n\nPlease review the attached Docker Compose configuration file for setting up local multi-node Kafka brokers.',
    publishDate: '28/07/2026',
    status: 'Published',
    isPinned: false,
    attachments: [
      {
        id: 'att-3',
        name: 'Kafka_Cluster_Docker_Compose.zip',
        size: '1.2 MB',
        type: 'zip',
        url: '#',
      },
    ],
  },
];
