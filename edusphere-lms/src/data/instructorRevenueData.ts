export interface CoursePerformanceItem {
  id: string;
  courseTitle: string;
  studentsEnrolled: number;
  completionRate: number; // percentage
  averageRating: number;
  revenue: number; // INR
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number; // INR
  enrollments: number;
}

export interface MonthlyEnrollmentData {
  month: string;
  newEnrollments: number;
  activeStudents: number;
}

export interface CourseCompletionData {
  courseName: string;
  completionRate: number;
}

export interface TopPerformingCourseData {
  courseName: string;
  revenue: number;
}

export const mockMonthlyRevenueTrends: MonthlyRevenueData[] = [
  { month: 'Mar 2026', revenue: 95000, enrollments: 110 },
  { month: 'Apr 2026', revenue: 125000, enrollments: 145 },
  { month: 'May 2026', revenue: 180000, enrollments: 210 },
  { month: 'Jun 2026', revenue: 240000, enrollments: 280 },
  { month: 'Jul 2026', revenue: 310000, enrollments: 360 },
  { month: 'Aug 2026', revenue: 425000, enrollments: 475 },
];

export const mockMonthlyEnrollments: MonthlyEnrollmentData[] = [
  { month: 'Mar 2026', newEnrollments: 45, activeStudents: 180 },
  { month: 'Apr 2026', newEnrollments: 62, activeStudents: 230 },
  { month: 'May 2026', newEnrollments: 88, activeStudents: 310 },
  { month: 'Jun 2026', newEnrollments: 115, activeStudents: 410 },
  { month: 'Jul 2026', newEnrollments: 140, activeStudents: 520 },
  { month: 'Aug 2026', newEnrollments: 175, activeStudents: 675 },
];

export const mockCoursePerformanceList: CoursePerformanceItem[] = [
  {
    id: 'course-101',
    courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    studentsEnrolled: 245,
    completionRate: 88,
    averageRating: 4.9,
    revenue: 245000,
  },
  {
    id: 'course-102',
    courseTitle: 'Advanced React Architecture, Micro-frontends & Performance',
    studentsEnrolled: 130,
    completionRate: 74,
    averageRating: 4.8,
    revenue: 130000,
  },
  {
    id: 'course-103',
    courseTitle: 'Node.js Enterprise Microservices & Distributed Systems',
    studentsEnrolled: 100,
    completionRate: 92,
    averageRating: 4.9,
    revenue: 50000,
  },
];

export const mockStudentPerformanceMetrics = {
  averageQuizScore: 86.5,
  assignmentCompletionRate: 91.2,
  overallCourseCompletionRate: 84.7,
};

export const mockRevenueAnalyticsOverview = {
  totalRevenue: 425000, // ₹4,25,000
  monthlyRevenue: 115000, // ₹1,15,000
  weeklyRevenue: 28500, // ₹28,500
  averageRevenuePerCourse: 141666, // ₹1,41,666
  totalCourses: 3,
  totalStudents: 475,
  totalEnrollments: 475,
  newEnrollments: 85,
  activeStudents: 410,
  completedStudents: 65,
};
