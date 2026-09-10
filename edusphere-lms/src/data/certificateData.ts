export type CertificateStatusType = 'Issued';

export interface CertificateRecord {
  id: string;
  certificateNumber: string; // e.g. EDU-2026-BD1F-0A8F2F8A
  certificateCode?: string;
  serialCode?: string;
  studentId: string;
  studentProfileId?: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  courseId: string;
  courseName: string;
  category: string;
  instructorName: string;
  instructorTitle?: string;
  instructorAvatar?: string;
  issueDate: string;
  completionDate: string;
  status: CertificateStatusType;
  verificationHash: string;
  lessonsCompleted: number;
  totalLessons: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  quizScore: number; // percentage
  learningHours?: number;
}

export interface CertificateDashboardMetrics {
  totalCertificates: number;
  certificatesIssued: number;
  eligibleStudentsCount: number;
}

