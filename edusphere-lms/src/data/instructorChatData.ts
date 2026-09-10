export type OnlineStatus = 'online' | 'offline' | 'away';
export type MessageAttachmentType = 'image' | 'pdf' | 'document' | 'other';

export interface InstructorChatAttachment {
  id: string;
  name: string;
  size: string;
  type: MessageAttachmentType;
  url: string;
  previewUrl?: string;
}

export interface InstructorChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'instructor' | 'student' | 'admin';
  content: string;
  timestamp: string;
  date?: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file' | 'document';
  attachments?: InstructorChatAttachment[];
}

export interface InstructorStudentConversation {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate?: string;
  courseProgressPercentage?: number;
  onlineStatus: OnlineStatus;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: InstructorChatMessage[];
}

export interface InstructorAdminConversation {
  id: string;
  adminId: string;
  adminName: string;
  adminAvatar: string;
  adminEmail: string;
  roleTitle: string;
  onlineStatus: OnlineStatus;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: InstructorChatMessage[];
}

export const mockEnrolledStudentsConversations: InstructorStudentConversation[] = [
  {
    id: 'inst-student-1',
    studentId: 'std-101',
    studentName: 'Rohan Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    studentEmail: 'rohan.sharma@edusphere.in',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Architecture (MERN & Next.js 14)',
    enrollmentDate: '15/06/2026',
    courseProgressPercentage: 78,
    onlineStatus: 'online',
    lastMessage: 'Thank you Dr. Vance! I submitted Assignment 2 with the updated Server Action validation logic.',
    lastMessageTime: '10:45 AM',
    unreadCount: 2,
    messages: [
      {
        id: 'm-1',
        conversationId: 'inst-student-1',
        senderId: 'std-101',
        senderName: 'Rohan Sharma',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        senderRole: 'student',
        content: 'Good morning Dr. Vance! I had a quick question about Module 3 Next.js Server Actions error handling.',
        timestamp: '10:15 AM',
        date: 'Today',
        isRead: true,
        type: 'text',
      },
      {
        id: 'm-2',
        conversationId: 'inst-student-1',
        senderId: 'inst-1',
        senderName: 'Dr. Marcus Vance',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        senderRole: 'instructor',
        content: 'Hi Rohan! Remember to convert FormData using Object.fromEntries(formData) before safeParse().',
        timestamp: '10:30 AM',
        date: 'Today',
        isRead: true,
        type: 'text',
      },
      {
        id: 'm-3',
        conversationId: 'inst-student-1',
        senderId: 'std-101',
        senderName: 'Rohan Sharma',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        senderRole: 'student',
        content: 'Here is a PDF of my architecture diagram for verification.',
        timestamp: '10:40 AM',
        date: 'Today',
        isRead: false,
        type: 'file',
        attachments: [
          {
            id: 'att-1',
            name: 'Server_Actions_Architecture_Diagram.pdf',
            size: '1.8 MB',
            type: 'pdf',
            url: '#',
          },
        ],
      },
      {
        id: 'm-4',
        conversationId: 'inst-student-1',
        senderId: 'std-101',
        senderName: 'Rohan Sharma',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        senderRole: 'student',
        content: 'Thank you Dr. Vance! I submitted Assignment 2 with the updated Server Action validation logic.',
        timestamp: '10:45 AM',
        date: 'Today',
        isRead: false,
        type: 'text',
      },
    ],
  },
  {
    id: 'inst-student-2',
    studentId: 'std-102',
    studentName: 'Aanya Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    studentEmail: 'aanya.p@example.com',
    courseId: 'course-102',
    courseTitle: 'Python Data Science & Machine Learning Core',
    enrollmentDate: '01/07/2026',
    courseProgressPercentage: 45,
    onlineStatus: 'online',
    lastMessage: 'Could you review my Pandas dataframe data cleaning notebook?',
    lastMessageTime: '09:20 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'm-201',
        conversationId: 'inst-student-2',
        senderId: 'std-102',
        senderName: 'Aanya Patel',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        senderRole: 'student',
        content: 'Could you review my Pandas dataframe data cleaning notebook?',
        timestamp: '09:20 AM',
        date: 'Today',
        isRead: false,
        type: 'text',
        attachments: [
          {
            id: 'att-201',
            name: 'Pandas_Data_Cleaning.ipynb',
            size: '520 KB',
            type: 'document',
            url: '#',
          },
        ],
      },
    ],
  },
  {
    id: 'inst-student-3',
    studentId: 'std-103',
    studentName: 'Karan Verma',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    studentEmail: 'karan.v@example.com',
    courseId: 'course-101',
    courseTitle: 'Full-Stack Web Architecture (MERN & Next.js 14)',
    enrollmentDate: '20/05/2026',
    courseProgressPercentage: 90,
    onlineStatus: 'offline',
    lastMessage: 'Got it, thanks for explaining the OAuth refreshToken flow.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    messages: [
      {
        id: 'm-301',
        conversationId: 'inst-student-3',
        senderId: 'inst-1',
        senderName: 'Dr. Marcus Vance',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        senderRole: 'instructor',
        content: 'Hi Karan, refresh tokens should be stored in HTTP-Only secure cookies to prevent XSS attacks.',
        timestamp: '04:10 PM',
        date: 'Yesterday',
        isRead: true,
        type: 'text',
      },
      {
        id: 'm-302',
        conversationId: 'inst-student-3',
        senderId: 'std-103',
        senderName: 'Karan Verma',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        senderRole: 'student',
        content: 'Got it, thanks for explaining the OAuth refreshToken flow.',
        timestamp: '04:15 PM',
        date: 'Yesterday',
        isRead: true,
        type: 'text',
      },
    ],
  },
];

export const mockAdminConversation: InstructorAdminConversation = {
  id: 'inst-admin-conv',
  adminId: 'admin-001',
  adminName: 'EduSphere Admin Support',
  adminAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  adminEmail: 'admin@edusphere.edu',
  roleTitle: 'LMS Platform Administrator',
  onlineStatus: 'online',
  lastMessage: 'Your July payout of $4,250 has been approved and processed.',
  lastMessageTime: '02:30 PM',
  unreadCount: 0,
  messages: [
    {
      id: 'adm-101',
      conversationId: 'inst-admin-conv',
      senderId: 'inst-1',
      senderName: 'Dr. Marcus Vance',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      senderRole: 'instructor',
      content: 'Hello Admin, I have submitted the updated course curriculum for Python AI Masterclass.',
      timestamp: '11:00 AM',
      date: 'Yesterday',
      isRead: true,
      type: 'text',
    },
    {
      id: 'adm-102',
      conversationId: 'inst-admin-conv',
      senderId: 'admin-001',
      senderName: 'EduSphere Admin Support',
      senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      senderRole: 'admin',
      content: 'Hello Dr. Vance! Course curriculum has been reviewed and published to the catalog. Also, your July payout of $4,250 has been approved and processed.',
      timestamp: '02:30 PM',
      date: 'Yesterday',
      isRead: true,
      type: 'text',
      attachments: [
        {
          id: 'att-adm-1',
          name: 'July_Instructor_Payout_Receipt.pdf',
          size: '1.2 MB',
          type: 'pdf',
          url: '#',
        },
      ],
    },
  ],
};
