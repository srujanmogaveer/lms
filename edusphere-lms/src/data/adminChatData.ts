export interface AdminChatParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'instructor';
  status: 'online' | 'offline';
  email: string;
  titleOrCourse?: string;
  joinedDate?: string;
  enrolledCoursesCount?: number;
}

export interface AdminChatMessageAttachment {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'doc';
  url: string;
  previewUrl?: string;
}

export interface AdminChatMessage {
  id: string;
  conversationId: string;
  senderRole: 'admin' | 'instructor';
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  date: string;
  isRead?: boolean;
  attachments?: AdminChatMessageAttachment[];
}

export interface AdminChatConversation {
  id: string;
  participant: AdminChatParticipant;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: AdminChatMessage[];
}

export const initialAdminConversations: AdminChatConversation[] = [
  {
    id: 'conv-1',
    participant: {
      id: 'inst-201',
      name: 'Dr. Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      role: 'instructor',
      status: 'online',
      email: 'marcus.vance@edusphere.edu',
      titleOrCourse: 'Lead Data Science & AI Instructor',
      joinedDate: 'Mar 10, 2023',
      enrolledCoursesCount: 8,
    },
    lastMessage: 'Here is the updated syllabus document for the Python for AI course.',
    lastMessageTime: '10:42 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'msg-101',
        conversationId: 'conv-1',
        senderRole: 'admin',
        senderName: 'Admin Support',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        content: 'Hello Dr. Vance, could you send us the updated module breakdown and course approval documentation for the AI Ethics unit?',
        timestamp: '10:15 AM',
        date: 'Today',
        isRead: true,
      },
      {
        id: 'msg-102',
        conversationId: 'conv-1',
        senderRole: 'instructor',
        senderName: 'Dr. Marcus Vance',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        content: 'Here is the updated syllabus document for the Python for AI course.',
        timestamp: '10:42 AM',
        date: 'Today',
        isRead: false,
        attachments: [
          {
            id: 'att-1',
            name: 'Python_AI_Syllabus_2026.pdf',
            size: '2.8 MB',
            type: 'pdf',
            url: '#',
          },
          {
            id: 'att-2',
            name: 'Course_Thumbnail_Banner.jpg',
            size: '850 KB',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
            previewUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
          },
        ],
      },
    ],
  },
  {
    id: 'conv-2',
    participant: {
      id: 'inst-202',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      role: 'instructor',
      status: 'offline',
      email: 'elena.rostova@edusphere.edu',
      titleOrCourse: 'Senior Frontend Engineering Instructor',
      joinedDate: 'Nov 12, 2022',
      enrolledCoursesCount: 12,
    },
    lastMessage: 'The payout request for July has been submitted.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    messages: [
      {
        id: 'msg-201',
        conversationId: 'conv-2',
        senderRole: 'instructor',
        senderName: 'Elena Rostova',
        senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        content: 'The payout request for July has been submitted. Please check when convenient.',
        timestamp: '02:30 PM',
        date: 'Yesterday',
        isRead: true,
        attachments: [
          {
            id: 'att-3',
            name: 'July_Payout_Invoice.doc',
            size: '420 KB',
            type: 'doc',
            url: '#',
          },
        ],
      },
      {
        id: 'msg-202',
        conversationId: 'conv-2',
        senderRole: 'admin',
        senderName: 'Admin Support',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        content: 'Invoice received and processed! Funds will reflect within 2 business days.',
        timestamp: '04:10 PM',
        date: 'Yesterday',
        isRead: true,
      },
    ],
  },
  {
    id: 'conv-3',
    participant: {
      id: 'inst-203',
      name: 'Professor David Miller',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      role: 'instructor',
      status: 'online',
      email: 'david.miller@edusphere.edu',
      titleOrCourse: 'Cloud Architecture & CyberSecurity Instructor',
      joinedDate: 'Jan 05, 2024',
      enrolledCoursesCount: 6,
    },
    lastMessage: 'Requested additional cloud credits for my AWS lab environment.',
    lastMessageTime: 'Aug 04',
    unreadCount: 0,
    messages: [
      {
        id: 'msg-301',
        conversationId: 'conv-3',
        senderRole: 'instructor',
        senderName: 'Professor David Miller',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        content: 'Requested additional cloud credits for my AWS lab environment for 150 enrolled students.',
        timestamp: '11:15 AM',
        date: 'Aug 04',
        isRead: true,
      },
      {
        id: 'msg-302',
        conversationId: 'conv-3',
        senderRole: 'admin',
        senderName: 'Admin Support',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        content: 'AWS Sandbox vouchers have been generated and sent to your instructor email!',
        timestamp: '01:20 PM',
        date: 'Aug 04',
        isRead: true,
      },
    ],
  },
];
