import type { PaymentMethodType, PaymentStatusType } from './paymentsData';
import { mockMyEnrolledCourses } from './dummyData';
import type { Course } from '../types';

export interface StudentTransactionRecord {
  id: string;
  invoiceNumber: string;
  transactionId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  courseThumbnail: string;
  amountINR: number;
  paymentMethod: PaymentMethodType;
  purchaseDate: string;
  status: PaymentStatusType;
}

const initialTransactions: StudentTransactionRecord[] = [
  {
    id: 'tx-101',
    invoiceNumber: 'INV-2026-0041',
    transactionId: 'TXN-98421054',
    studentName: 'Rahul Sharma',
    courseId: 'crs-1',
    courseName: 'Full-Stack Web Development Masterclass 2026',
    instructorName: 'Dr. Marcus Vance',
    courseThumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
    amountINR: 4999,
    paymentMethod: 'UPI (GPay / PhonePe)',
    purchaseDate: '15/01/2026',
    status: 'Paid',
  },
  {
    id: 'tx-102',
    invoiceNumber: 'INV-2026-0042',
    transactionId: 'TXN-98421055',
    studentName: 'Rahul Sharma',
    courseId: 'crs-2',
    courseName: 'UI/UX Design Systems & Figma Masterclass',
    instructorName: 'Elena Rostova',
    courseThumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600',
    amountINR: 3499,
    paymentMethod: 'Credit Card',
    purchaseDate: '28/01/2026',
    status: 'Paid',
  },
  {
    id: 'tx-103',
    invoiceNumber: 'INV-2026-0043',
    transactionId: 'TXN-98421056',
    studentName: 'Rahul Sharma',
    courseId: 'crs-3',
    courseName: 'Cloud Native DevOps & Kubernetes Essentials',
    instructorName: 'David K. Miller',
    courseThumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600',
    amountINR: 2999,
    paymentMethod: 'NetBanking',
    purchaseDate: '05/02/2026',
    status: 'Failed',
  },
];

// Initial set of enrolled course IDs
const enrolledCourseIdsSet = new Set<string>([
  'crs-1',
  'crs-2',
  ...mockMyEnrolledCourses.map((item) => item.course.id),
]);

let currentTransactions: StudentTransactionRecord[] = [...initialTransactions];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const studentPaymentStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  isCourseEnrolled(courseId: string): boolean {
    return enrolledCourseIdsSet.has(courseId);
  },

  getEnrolledCourseIds(): string[] {
    return Array.from(enrolledCourseIdsSet);
  },

  getTransactions(): StudentTransactionRecord[] {
    return currentTransactions;
  },

  recordSuccessfulPayment(
    course: Course,
    paymentMethod: PaymentMethodType,
    studentName = 'Rahul Sharma'
  ): StudentTransactionRecord {
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const txnId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const invId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: StudentTransactionRecord = {
      id: `tx-${Date.now()}`,
      invoiceNumber: invId,
      transactionId: txnId,
      studentName,
      courseId: course.id,
      courseName: course.title,
      instructorName: course.instructorName || 'Lead Instructor',
      courseThumbnail: course.thumbnail,
      amountINR: course.discountPrice || course.price,
      paymentMethod,
      purchaseDate: dateFormatted,
      status: 'Paid',
    };

    // Auto enroll student
    enrolledCourseIdsSet.add(course.id);

    // Add transaction record
    currentTransactions = [newRecord, ...currentTransactions];

    notifyListeners();
    return newRecord;
  },

  recordFailedPayment(
    course: Course,
    paymentMethod: PaymentMethodType,
    studentName = 'Rahul Sharma'
  ): StudentTransactionRecord {
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const txnId = `TXN-FAIL-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const invId = `INV-FAIL-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: StudentTransactionRecord = {
      id: `tx-${Date.now()}`,
      invoiceNumber: invId,
      transactionId: txnId,
      studentName,
      courseId: course.id,
      courseName: course.title,
      instructorName: course.instructorName || 'Lead Instructor',
      courseThumbnail: course.thumbnail,
      amountINR: course.discountPrice || course.price,
      paymentMethod,
      purchaseDate: dateFormatted,
      status: 'Failed',
    };

    currentTransactions = [newRecord, ...currentTransactions];
    notifyListeners();
    return newRecord;
  },

  recordPendingPayment(
    course: Course,
    paymentMethod: PaymentMethodType,
    studentName = 'Rahul Sharma'
  ): StudentTransactionRecord {
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const txnId = `TXN-PEND-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const invId = `INV-PEND-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: StudentTransactionRecord = {
      id: `tx-${Date.now()}`,
      invoiceNumber: invId,
      transactionId: txnId,
      studentName,
      courseId: course.id,
      courseName: course.title,
      instructorName: course.instructorName || 'Lead Instructor',
      courseThumbnail: course.thumbnail,
      amountINR: course.discountPrice || course.price,
      paymentMethod,
      purchaseDate: dateFormatted,
      status: 'Cancelled', // Used to signify Pending / In-Process status in payment record
    };

    currentTransactions = [newRecord, ...currentTransactions];
    notifyListeners();
    return newRecord;
  },
};
