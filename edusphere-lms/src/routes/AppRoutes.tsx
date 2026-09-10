import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { InstructorLayout } from '../layouts/InstructorLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Public Pages
import { Home } from '../pages/public/Home';
import { Courses } from '../pages/public/Courses';
import { CourseDetails } from '../pages/public/CourseDetails';
import { Login } from '../pages/public/Login';
import { About } from '../pages/public/About';
import { Contact } from '../pages/public/Contact';
import { MaintenanceModePage } from '../pages/public/MaintenanceModePage';

// Auth Pages
import { RoleSelection } from '../pages/auth/RoleSelection';
import { ValidatedStudentLogin } from '../pages/auth/ValidatedStudentLogin';
import { ValidatedStudentRegister } from '../pages/auth/ValidatedStudentRegister';
import { InstructorLogin } from '../pages/auth/InstructorLogin';
import { InstructorRegister } from '../pages/auth/InstructorRegister';
import { AdminLogin } from '../pages/auth/AdminLogin';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { EmailVerification } from '../pages/auth/EmailVerification';
import { PendingApproval } from '../pages/auth/PendingApproval';
import { AuthCallback } from '../pages/auth/AuthCallback';

// Role Dashboards & Student Modules
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentBrowseCourses } from '../pages/student/StudentBrowseCourses';
import { StudentWishlist } from '../pages/student/StudentWishlist';
import { StudentCart } from '../pages/student/StudentCart';
import { StudentMyCourses } from '../pages/student/StudentMyCourses';
import { StudentCourseDetails } from '../pages/student/StudentCourseDetails';
import { StudentLearningPlayer } from '../pages/student/StudentLearningPlayer';
import { StudentAssignments } from '../pages/student/StudentAssignments';
import { StudentQuizzes } from '../pages/student/StudentQuizzes';
import { StudentForum } from '../pages/student/StudentForum';
import { StudentChat } from '../pages/student/StudentChat';
import { StudentAnnouncements } from '../pages/student/StudentAnnouncements';
import { StudentLiveClasses } from '../pages/student/StudentLiveClasses';
import { StudentCertificates } from '../pages/student/StudentCertificates';
import { StudentNotifications } from '../pages/student/StudentNotifications';
import { StudentProfile } from '../pages/student/StudentProfile';
import { StudentCheckout } from '../pages/student/StudentCheckout';
import { StudentPaymentHistory } from '../pages/student/StudentPaymentHistory';
import { InstructorDashboard } from '../pages/instructor/InstructorDashboard';
import { InstructorCourseManagement } from '../pages/instructor/InstructorCourseManagement';
import { InstructorCurriculumBuilder } from '../pages/instructor/InstructorCurriculumBuilder';
import { InstructorContentManagement } from '../pages/instructor/InstructorContentManagement';
import { InstructorAssignmentManagement } from '../pages/instructor/InstructorAssignmentManagement';
import { InstructorQuizManagement } from '../pages/instructor/InstructorQuizManagement';
import { InstructorLiveClasses } from '../pages/instructor/InstructorLiveClasses';
import { InstructorDiscussionForum } from '../pages/instructor/InstructorDiscussionForum';
import { InstructorChat } from '../pages/instructor/InstructorChat';
import { InstructorAnnouncements } from '../pages/instructor/InstructorAnnouncements';
import { InstructorStudentManagement } from '../pages/instructor/InstructorStudentManagement';
import { InstructorRevenueAnalytics } from '../pages/instructor/InstructorRevenueAnalytics';
import { InstructorProfileSettings } from '../pages/instructor/InstructorProfileSettings';
import { InstructorNotifications } from '../pages/instructor/InstructorNotifications';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminStudentManagement } from '../pages/admin/AdminStudentManagement';
import { AdminInstructorManagement } from '../pages/admin/AdminInstructorManagement';
import { AdminInstructorPayouts } from '../pages/admin/AdminInstructorPayouts';
import { AdminCourseApproval } from '../pages/admin/AdminCourseApproval';
import { AdminCategoryManagement } from '../pages/admin/AdminCategoryManagement';
import { AdminReportsAnalytics } from '../pages/admin/AdminReportsAnalytics';
import { AdminCertificateManagement } from '../pages/admin/AdminCertificateManagement';
import { AdminAnnouncementManagement } from '../pages/admin/AdminAnnouncementManagement';
import { AdminNotificationManagement } from '../pages/admin/AdminNotificationManagement';
import { AdminSettings } from '../pages/admin/AdminSettings';
import { AdminProfile } from '../pages/admin/AdminProfile';
import { AdminChat } from '../pages/admin/AdminChat';
import { AdminLiveClassManagement } from '../pages/admin/AdminLiveClassManagement';
import { AdminDiscussionForum } from '../pages/admin/AdminDiscussionForum';
import { AdminInquiriesManagement } from '../pages/admin/AdminInquiriesManagement';
import { InAppLiveClassRoom } from '../pages/live/InAppLiveClassRoom';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Standalone In-App Live Classroom Routes */}
      <Route
        path="/student/live/room/:id"
        element={
          <ProtectedRoute allowedRole="student">
            <InAppLiveClassRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/live/room/:id"
        element={
          <ProtectedRoute allowedRole="instructor">
            <InAppLiveClassRoom />
          </ProtectedRoute>
        }
      />

      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:slug" element={<CourseDetails />} />
        <Route path="about" element={<About />} />
        <Route path="faq" element={<Navigate to="/contact" replace />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="privacy" element={<div className="p-8 text-center text-slate-500">Privacy Policy View</div>} />
        <Route path="terms" element={<div className="p-8 text-center text-slate-500">Terms & Conditions View</div>} />
        <Route path="maintenance" element={<MaintenanceModePage />} />
      </Route>

      {/* Auth Module Routes - Reusing AuthLayout */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/role-selection" replace />} />
        <Route path="role-selection" element={<RoleSelection />} />
        <Route path="student-login" element={<ValidatedStudentLogin />} />
        <Route path="student-register" element={<ValidatedStudentRegister />} />
        <Route path="instructor-login" element={<InstructorLogin />} />
        <Route path="instructor-register" element={<InstructorRegister />} />
        <Route path="admin-login" element={<AdminLogin />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="email-verification" element={<EmailVerification />} />
        <Route path="pending-approval" element={<PendingApproval />} />
        <Route path="callback" element={<AuthCallback />} />
      </Route>

      {/* Student Routes - require authentication as student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="browse" element={<StudentBrowseCourses />} />
        <Route path="wishlist" element={<StudentWishlist />} />
        <Route path="cart" element={<StudentCart />} />
        <Route path="checkout" element={<StudentCheckout />} />
        <Route path="payments" element={<StudentPaymentHistory />} />
        <Route path="courses" element={<StudentMyCourses />} />
        <Route path="courses/:slug" element={<StudentCourseDetails />} />
        <Route path="player" element={<StudentLearningPlayer />} />
        <Route path="player/:courseId" element={<StudentLearningPlayer />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="assignments/:courseId" element={<StudentAssignments />} />

        <Route path="quizzes" element={<StudentQuizzes />} />
        <Route path="forum" element={<StudentForum />} />
        <Route path="chat" element={<StudentChat />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
        <Route path="live" element={<StudentLiveClasses />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="settings" element={<StudentProfile />} />
      </Route>

      {/* Instructor Routes - require authentication as instructor */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute allowedRole="instructor">
            <InstructorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="courses" element={<InstructorCourseManagement />} />
        <Route path="courses/new" element={<Navigate to="/instructor/courses?action=create" replace />} />
        <Route path="courses/create" element={<Navigate to="/instructor/courses?action=create" replace />} />
        <Route path="curriculum" element={<InstructorCurriculumBuilder />} />
        <Route path="content" element={<InstructorContentManagement />} />
        <Route path="assignments" element={<InstructorAssignmentManagement />} />
        <Route path="quizzes" element={<InstructorQuizManagement />} />
        <Route path="live" element={<InstructorLiveClasses />} />
        <Route path="live-classes" element={<Navigate to="/instructor/live" replace />} />
        <Route path="forum" element={<InstructorDiscussionForum />} />
        <Route path="chat" element={<InstructorChat />} />
        <Route path="announcements" element={<InstructorAnnouncements />} />
        <Route path="students" element={<InstructorStudentManagement />} />
        <Route path="revenue" element={<InstructorRevenueAnalytics />} />
        <Route path="notifications" element={<InstructorNotifications />} />
        <Route path="profile" element={<InstructorProfileSettings />} />
        <Route path="settings" element={<InstructorProfileSettings />} />
      </Route>

      {/* Admin Routes - require authentication as admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminStudentManagement />} />
        <Route path="instructors" element={<AdminInstructorManagement />} />
        <Route path="courses" element={<AdminCourseApproval />} />
        <Route path="categories" element={<AdminCategoryManagement />} />
        <Route path="live-classes" element={<AdminLiveClassManagement />} />
        <Route path="certificates" element={<AdminCertificateManagement />} />
        <Route path="payments" element={<AdminInstructorPayouts />} />
        <Route path="announcements" element={<AdminAnnouncementManagement />} />
        <Route path="forum" element={<AdminDiscussionForum />} />
        <Route path="inquiries" element={<AdminInquiriesManagement />} />
        <Route path="notifications" element={<AdminNotificationManagement />} />
        <Route path="communications" element={<Navigate to="/admin/chat" replace />} />
        <Route path="chat" element={<AdminChat />} />
        <Route path="analytics" element={<AdminReportsAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="security" element={<AdminProfile />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
