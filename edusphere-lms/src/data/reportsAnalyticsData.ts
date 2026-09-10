export interface OverviewMetrics {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalRevenueINR: number;
  activeCourses: number;
  certificatesIssued: number;
}

export interface StudentAnalyticsData {
  newRegistrationsMonth: number;
  activeStudentsCount: number;
  courseCompletionRate: number; // percentage
  studentGrowthPercentage: number;
  monthlyRegistrations: { month: string; count: number }[];
  activeVsInactive: { name: string; value: number; color: string }[];
}

export interface InstructorAnalyticsData {
  totalInstructors: number;
  approvedInstructors: number;
  pendingApproval: number;
  activeInstructors: number;
  monthlyRegistrations: { month: string; count: number }[];
}

export interface CourseAnalyticsData {
  totalCourses: number;
  pendingApproval: number;
  publishedCourses: number;
  archivedCourses: number;
  mostPopularCourses: { id: string; title: string; instructor: string; category: string; students: number; rating: number }[];
  categoryDistribution: { name: string; count: number; color: string }[];
  monthlyPublications: { month: string; count: number }[];
}

export interface RevenueAnalyticsData {
  dailyRevenueINR: number;
  weeklyRevenueINR: number;
  monthlyRevenueINR: number;
  yearlyRevenueINR: number;
  platformEarningsINR: number; // 15%
  instructorPayoutsINR: number; // 85%
  monthlyRevenue: { month: string; revenue: number; platformShare: number; instructorShare: number }[];
  revenueByCategory: { category: string; amountINR: number }[];
}

export interface LearningAnalyticsData {
  totalLessonsCompleted: number;
  assignmentCompletionRate: number;
  quizPassRate: number;
  certificatesGenerated: number;
  assignmentCompletion: { month: string; rate: number }[];
  quizPerformance: { month: string; passRate: number }[];
  certificateGrowth: { month: string; count: number }[];
}

export const mockOverviewMetrics: OverviewMetrics = {
  totalStudents: 1280,
  totalInstructors: 48,
  totalCourses: 156,
  totalRevenueINR: 1850000,
  activeCourses: 142,
  certificatesIssued: 890
};

export const mockStudentAnalytics: StudentAnalyticsData = {
  newRegistrationsMonth: 145,
  activeStudentsCount: 1120,
  courseCompletionRate: 78.5,
  studentGrowthPercentage: 14.2,
  monthlyRegistrations: [
    { month: 'Jan', count: 95 },
    { month: 'Feb', count: 120 },
    { month: 'Mar', count: 110 },
    { month: 'Apr', count: 135 },
    { month: 'May', count: 160 },
    { month: 'Jun', count: 185 },
    { month: 'Jul', count: 210 }
  ],
  activeVsInactive: [
    { name: 'Active Students', value: 1120, color: '#10B981' },
    { name: 'Inactive Accounts', value: 160, color: '#64748B' }
  ]
};

export const mockInstructorAnalytics: InstructorAnalyticsData = {
  totalInstructors: 48,
  approvedInstructors: 42,
  pendingApproval: 4,
  activeInstructors: 38,
  monthlyRegistrations: [
    { month: 'Jan', count: 4 },
    { month: 'Feb', count: 6 },
    { month: 'Mar', count: 5 },
    { month: 'Apr', count: 8 },
    { month: 'May', count: 7 },
    { month: 'Jun', count: 10 },
    { month: 'Jul', count: 8 }
  ]
};

export const mockCourseAnalytics: CourseAnalyticsData = {
  totalCourses: 156,
  pendingApproval: 8,
  publishedCourses: 142,
  archivedCourses: 6,
  mostPopularCourses: [
    { id: 'c-1', title: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)', instructor: 'Dr. Marcus Vance', category: 'Web Development', students: 340, rating: 4.9 },
    { id: 'c-2', title: 'Generative AI & LLM Engineering with Python & LangChain', instructor: 'Prof. Vikram Seth', category: 'Data Science & AI', students: 285, rating: 4.9 },
    { id: 'c-3', title: 'AWS Certified Solutions Architect Associate (SAA-C03) Mastery', instructor: 'Rajesh Kumar', category: 'Cloud & DevOps', students: 220, rating: 4.8 },
    { id: 'c-4', title: 'UI/UX Design Systems in Figma & UX Research Methodology', instructor: 'Sneha Verma', category: 'UI/UX Design', students: 195, rating: 4.7 },
    { id: 'c-5', title: 'Flutter 3.x & Dart Multi-platform Mobile Development', instructor: 'Amit Sharma', category: 'Mobile App', students: 160, rating: 4.8 }
  ],
  categoryDistribution: [
    { name: 'Web Development', count: 45, color: '#6366F1' },
    { name: 'Data Science & AI', count: 32, color: '#10B981' },
    { name: 'Cloud & DevOps', count: 28, color: '#F59E0B' },
    { name: 'UI/UX Design', count: 24, color: '#EC4899' },
    { name: 'Mobile App', count: 17, color: '#8B5CF6' },
    { name: 'Cybersecurity', count: 10, color: '#06B6D4' }
  ],
  monthlyPublications: [
    { month: 'Jan', count: 12 },
    { month: 'Feb', count: 15 },
    { month: 'Mar', count: 18 },
    { month: 'Apr', count: 22 },
    { month: 'May', count: 25 },
    { month: 'Jun', count: 28 },
    { month: 'Jul', count: 32 }
  ]
};

export const mockRevenueAnalytics: RevenueAnalyticsData = {
  dailyRevenueINR: 18500,
  weeklyRevenueINR: 125000,
  monthlyRevenueINR: 480000,
  yearlyRevenueINR: 1850000,
  platformEarningsINR: 277500, // 15%
  instructorPayoutsINR: 1572500, // 85%
  monthlyRevenue: [
    { month: 'Jan', revenue: 150000, platformShare: 22500, instructorShare: 127500 },
    { month: 'Feb', revenue: 210000, platformShare: 31500, instructorShare: 178500 },
    { month: 'Mar', revenue: 280000, platformShare: 42000, instructorShare: 238000 },
    { month: 'Apr', revenue: 320000, platformShare: 48000, instructorShare: 272000 },
    { month: 'May', revenue: 390000, platformShare: 58500, instructorShare: 331500 },
    { month: 'Jun', revenue: 450000, platformShare: 67500, instructorShare: 382500 },
    { month: 'Jul', revenue: 480000, platformShare: 72000, instructorShare: 408000 }
  ],
  revenueByCategory: [
    { category: 'Web Development', amountINR: 620000 },
    { category: 'Data Science & AI', amountINR: 480000 },
    { category: 'Cloud & DevOps', amountINR: 350000 },
    { category: 'UI/UX Design', amountINR: 240000 },
    { category: 'Mobile App', amountINR: 160000 }
  ]
};

export const mockLearningAnalytics: LearningAnalyticsData = {
  totalLessonsCompleted: 42500,
  assignmentCompletionRate: 84.2,
  quizPassRate: 88.6,
  certificatesGenerated: 890,
  assignmentCompletion: [
    { month: 'Jan', rate: 72 },
    { month: 'Feb', rate: 76 },
    { month: 'Mar', rate: 79 },
    { month: 'Apr', rate: 82 },
    { month: 'May', rate: 84 },
    { month: 'Jun', rate: 87 },
    { month: 'Jul', rate: 89 }
  ],
  quizPerformance: [
    { month: 'Jan', passRate: 80 },
    { month: 'Feb', passRate: 83 },
    { month: 'Mar', passRate: 85 },
    { month: 'Apr', passRate: 86 },
    { month: 'May', passRate: 88 },
    { month: 'Jun', passRate: 90 },
    { month: 'Jul', passRate: 92 }
  ],
  certificateGrowth: [
    { month: 'Jan', count: 45 },
    { month: 'Feb', count: 85 },
    { month: 'Mar', count: 140 },
    { month: 'Apr', count: 210 },
    { month: 'May', count: 310 },
    { month: 'Jun', count: 460 },
    { month: 'Jul', count: 890 }
  ]
};
