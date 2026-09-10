export type EnrollmentStatus = 'Active' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';
export type PaymentMethod = 'UPI (GPay / PhonePe)' | 'Razorpay' | 'NetBanking' | 'Credit Card' | 'Debit Card';
export type CertificateStatus = 'Issued' | 'In Progress' | 'Not Eligible';

export interface StudentInfo {
  studentId: string;
  name: string;
  email: string;
  mobile: string;
  avatarUrl: string;
  city: string;
  state: string;
}

export interface CourseInfo {
  courseId: string;
  title: string;
  slug: string;
  category: string;
  thumbnail: string;
  instructorName: string;
  instructorId: string;
  instructorAvatar: string;
}

export interface LearningProgress {
  lessonsCompleted: number;
  totalLessons: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  quizzesPassed: number;
  totalQuizzes: number;
  overallPercentage: number;
  certificateStatus: CertificateStatus;
  certificateId?: string;
  certificateIssuedDate?: string;
}

export interface PaymentDetails {
  transactionId: string;
  amountINR: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string; // DD/MM/YYYY
  gatewayRef?: string;
}

export interface EnrollmentRecord {
  enrollmentId: string; // e.g. ENR-2026-8941
  student: StudentInfo;
  course: CourseInfo;
  enrollmentDate: string; // DD/MM/YYYY
  enrollmentStatus: EnrollmentStatus;
  payment: PaymentDetails;
  progress: LearningProgress;
}

export const mockEnrollmentList: EnrollmentRecord[] = [
  {
    enrollmentId: 'ENR-2026-9011',
    student: {
      studentId: 'STD-2026-1048',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@gmail.com',
      mobile: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    course: {
      courseId: 'course-101',
      title: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
      slug: 'full-stack-web-development-bootcamp-mern-nextjs',
      category: 'Web Development',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Dr. Marcus Vance',
      instructorId: 'INS-2026-8492',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    enrollmentDate: '15/01/2026',
    enrollmentStatus: 'Active',
    payment: {
      transactionId: 'TXN-98421054',
      amountINR: 4999,
      paymentMethod: 'UPI (GPay / PhonePe)',
      paymentStatus: 'Paid',
      paidAt: '15/01/2026',
      gatewayRef: 'PAY_UPI_98421054_RZP'
    },
    progress: {
      lessonsCompleted: 18,
      totalLessons: 24,
      assignmentsCompleted: 3,
      totalAssignments: 4,
      quizzesPassed: 2,
      totalQuizzes: 2,
      overallPercentage: 75,
      certificateStatus: 'In Progress'
    }
  },
  {
    enrollmentId: 'ENR-2026-9012',
    student: {
      studentId: 'STD-2026-1049',
      name: 'Priya Patel',
      email: 'priya.patel@gmail.com',
      mobile: '+91 98123 45678',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      city: 'Mumbai',
      state: 'Maharashtra'
    },
    course: {
      courseId: 'course-101',
      title: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
      slug: 'full-stack-web-development-bootcamp-mern-nextjs',
      category: 'Web Development',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Dr. Marcus Vance',
      instructorId: 'INS-2026-8492',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    enrollmentDate: '10/01/2026',
    enrollmentStatus: 'Completed',
    payment: {
      transactionId: 'TXN-98421055',
      amountINR: 4999,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      paidAt: '10/01/2026',
      gatewayRef: 'RZP_ORDER_98421055'
    },
    progress: {
      lessonsCompleted: 24,
      totalLessons: 24,
      assignmentsCompleted: 4,
      totalAssignments: 4,
      quizzesPassed: 2,
      totalQuizzes: 2,
      overallPercentage: 100,
      certificateStatus: 'Issued',
      certificateId: 'CERT-EDU-2026-8812',
      certificateIssuedDate: '01/02/2026'
    }
  },
  {
    enrollmentId: 'ENR-2026-9013',
    student: {
      studentId: 'STD-2026-1050',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@gmail.com',
      mobile: '+91 94444 12345',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      city: 'Chennai',
      state: 'Tamil Nadu'
    },
    course: {
      courseId: 'course-103',
      title: 'Generative AI & LLM Engineering with Python & LangChain',
      slug: 'generative-ai-llm-engineering-python-langchain',
      category: 'Data Science & AI',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Prof. Vikram Seth',
      instructorId: 'INS-2026-8495',
      instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    enrollmentDate: '20/01/2026',
    enrollmentStatus: 'Active',
    payment: {
      transactionId: 'TXN-98421056',
      amountINR: 8999,
      paymentMethod: 'NetBanking',
      paymentStatus: 'Paid',
      paidAt: '20/01/2026',
      gatewayRef: 'HDFC_NB_98421056'
    },
    progress: {
      lessonsCompleted: 11,
      totalLessons: 24,
      assignmentsCompleted: 2,
      totalAssignments: 4,
      quizzesPassed: 1,
      totalQuizzes: 2,
      overallPercentage: 45,
      certificateStatus: 'In Progress'
    }
  },
  {
    enrollmentId: 'ENR-2026-9014',
    student: {
      studentId: 'STD-2026-1051',
      name: 'Rohan Gupta',
      email: 'rohan.gupta@yahoo.in',
      mobile: '+91 98111 22334',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      city: 'Delhi',
      state: 'NCR'
    },
    course: {
      courseId: 'course-105',
      title: 'AWS Certified Solutions Architect Associate (SAA-C03) Mastery',
      slug: 'aws-certified-solutions-architect-associate-mastery',
      category: 'Cloud & DevOps',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Rajesh Kumar',
      instructorId: 'INS-2026-8499',
      instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    enrollmentDate: '28/01/2026',
    enrollmentStatus: 'Active',
    payment: {
      transactionId: 'TXN-98421057',
      amountINR: 5999,
      paymentMethod: 'Credit Card',
      paymentStatus: 'Pending',
      paidAt: '28/01/2026',
      gatewayRef: 'PENDING_BANK_AUTH_98421057'
    },
    progress: {
      lessonsCompleted: 2,
      totalLessons: 20,
      assignmentsCompleted: 0,
      totalAssignments: 3,
      quizzesPassed: 0,
      totalQuizzes: 2,
      overallPercentage: 10,
      certificateStatus: 'In Progress'
    }
  },
  {
    enrollmentId: 'ENR-2026-9015',
    student: {
      studentId: 'STD-2026-1052',
      name: 'Meera Kulkarni',
      email: 'meera.k@gmail.com',
      mobile: '+91 98222 33445',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      city: 'Pune',
      state: 'Maharashtra'
    },
    course: {
      courseId: 'course-107',
      title: 'UI/UX Design Systems in Figma & UX Research Methodology',
      slug: 'ui-ux-design-systems-figma-ux-research-methodology',
      category: 'UI/UX & Product Design',
      thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Sneha Verma',
      instructorId: 'INS-2026-8501',
      instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    enrollmentDate: '01/02/2026',
    enrollmentStatus: 'Cancelled',
    payment: {
      transactionId: 'TXN-98421058',
      amountINR: 3999,
      paymentMethod: 'UPI (GPay / PhonePe)',
      paymentStatus: 'Refunded',
      paidAt: '01/02/2026',
      gatewayRef: 'RFD_REFUND_COMPLETED_98421058'
    },
    progress: {
      lessonsCompleted: 0,
      totalLessons: 18,
      assignmentsCompleted: 0,
      totalAssignments: 2,
      quizzesPassed: 0,
      totalQuizzes: 2,
      overallPercentage: 0,
      certificateStatus: 'Not Eligible'
    }
  },
  {
    enrollmentId: 'ENR-2026-9016',
    student: {
      studentId: 'STD-2026-1053',
      name: 'Arjun Reddy',
      email: 'arjun.reddy@gmail.com',
      mobile: '+91 99888 77665',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      city: 'Hyderabad',
      state: 'Telangana'
    },
    course: {
      courseId: 'course-104',
      title: 'Flutter 3.x & Dart Multi-platform Mobile Development (Hindi)',
      slug: 'flutter-3-dart-mobile-development-hindi',
      category: 'Mobile App Development',
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Amit Sharma',
      instructorId: 'INS-2026-8498',
      instructorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'
    },
    enrollmentDate: '05/01/2026',
    enrollmentStatus: 'Completed',
    payment: {
      transactionId: 'TXN-98421059',
      amountINR: 3499,
      paymentMethod: 'Debit Card',
      paymentStatus: 'Paid',
      paidAt: '05/01/2026',
      gatewayRef: 'SBI_DC_98421059'
    },
    progress: {
      lessonsCompleted: 22,
      totalLessons: 22,
      assignmentsCompleted: 3,
      totalAssignments: 3,
      quizzesPassed: 2,
      totalQuizzes: 2,
      overallPercentage: 100,
      certificateStatus: 'Issued',
      certificateId: 'CERT-EDU-2026-8815',
      certificateIssuedDate: '25/01/2026'
    }
  },
  {
    enrollmentId: 'ENR-2026-9017',
    student: {
      studentId: 'STD-2026-1054',
      name: 'Kavita Singh',
      email: 'kavita.singh@gmail.com',
      mobile: '+91 97777 88899',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      city: 'Jaipur',
      state: 'Rajasthan'
    },
    course: {
      courseId: 'course-106',
      title: 'Ethical Hacking & Penetration Testing Masterclass (2026 Edition)',
      slug: 'ethical-hacking-penetration-testing-masterclass',
      category: 'Cybersecurity',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Dr. Marcus Vance',
      instructorId: 'INS-2026-8492',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    enrollmentDate: '02/02/2026',
    enrollmentStatus: 'Active',
    payment: {
      transactionId: 'TXN-98421060',
      amountINR: 4499,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      paidAt: '02/02/2026',
      gatewayRef: 'RZP_ORDER_98421060'
    },
    progress: {
      lessonsCompleted: 6,
      totalLessons: 20,
      assignmentsCompleted: 1,
      totalAssignments: 3,
      quizzesPassed: 0,
      totalQuizzes: 2,
      overallPercentage: 30,
      certificateStatus: 'In Progress'
    }
  }
];
