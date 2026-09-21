export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar: string;
  bio?: string;
  joinedDate: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Student extends User {
  role: 'student';
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  certificatesCount: number;
}

export interface Instructor extends User {
  role: 'instructor';
  title: string;
  coursesCreatedCount: number;
  totalStudents: number;
  rating: number;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface StudentAchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  category: 'streak' | 'graduation' | 'assignment' | 'quiz' | 'milestone';
}

export interface AccountActivityLog {
  id: string;
  action: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  type: 'login' | 'profile_update' | 'password_change' | 'certificate_earned' | 'course_completed';
}

export interface StudentPrivacySettings {
  publicProfile: boolean;
  showLearningProgress: boolean;
  shareCertificates: boolean;
  marketingEmails: boolean;
}

export interface FullStudentProfile {
  id: string;
  studentIdNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  country: string;
  state: string;
  city: string;
  timezone: string;
  bio: string;
  avatarUrl: string;
  joinedDate: string;
  learningStreakDays: number;
  isGoogleConnected: boolean;
  googleEmail?: string;
  themePreference: 'light' | 'dark' | 'system';
  languagePreference: string;
  privacy: StudentPrivacySettings;
}

export interface ProgressionLockInfo {
  isLessonsComplete: boolean;
  lessonsProgressPercent: number;
  isAssignmentsUnlocked: boolean;
  isAssignmentsComplete: boolean;
  assignmentsProgressPercent: number;
  isQuizzesUnlocked: boolean;
  isQuizzesComplete: boolean;
  quizzesProgressPercent: number;
  isCertificateUnlocked: boolean;
  overallProgressPercent: number;
  assignmentsLockReason?: string;
  quizzesLockReason?: string;
  certificateLockReason?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  instructorBio?: string;
  instructorSpecialization?: string;
  instructorQualification?: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewsCount: number;
  studentsEnrolled: number;
  durationHours: number;
  lessonsCount: number;
  updatedAt: string;
  isPublished: boolean;
  isFeatured?: boolean;
  priceType?: 'Free' | 'Paid' | 'Discounted';
  courseStatus?: string;
  approvalStatus?: string;
  promoVideoUrl?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  totalPoints: number;
  passingMarks?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  status: 'pending' | 'submitted' | 'under_review' | 'graded';
  grade?: number;
  isLocked?: boolean;
  lockReason?: string;
  unlockRequirement?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  submittedAt: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  attemptNumber: number;
  status: 'submitted' | 'graded' | 'late';
  grade?: number;
  feedback?: {
    instructorName: string;
    instructorAvatar: string;
    gradedAt: string;
    comment: string;
    marksObtained: number;
    maxMarks: number;
    rubricBreakdown?: Array<{
      criterion: string;
      score: number;
      maxScore: number;
      feedback: string;
    }>;
  };
}

export interface StudentAssignmentDetail extends Assignment {
  instructorName: string;
  instructorAvatar: string;
  category: string;
  instructions: string[];
  allowedFileTypes: string[];
  maxFileSize: string;
  maxAttempts: number;
  baseMaxAttempts?: number;
  attemptsUsed: number;
  attemptRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  attemptRequestFeedback?: string;
  attemptRequestId?: string;
  assignmentPassed?: boolean;
  canResubmit?: boolean;
  latestAttempt?: any;
  dueDate?: string;
  createdAt?: string;
  isLateSubmissionAllowed: boolean;
  submissionHistory: AssignmentSubmission[];
  completedLessons?: number;
  totalLessons?: number;
}

export interface AssignmentReattemptRequest {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentAvatar?: string;
  courseId?: string;
  courseTitle?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rawStatus?: string;
  reviewedBy?: string;
  instructorFeedback?: string;
  attemptsUsed?: number;
  maxAttempts?: number;
  requestedAt: string;
  reviewedAt?: string;
  requestDate?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  timeLimitMinutes: number;
  questionsCount: number;
  passingScore: number;
  totalAttempts: number;
  status: 'not_started' | 'passed' | 'failed' | 'available' | 'in_progress' | 'completed';
  score?: number;
  isLocked?: boolean;
  lockReason?: string;
  unlockRequirement?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId?: string;
  questionText: string;
  questionType?: 'Single Answer' | 'Multiple Answer' | 'True or False' | 'Fill in the Blanks' | string;
  explanation?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  options: QuizOption[];
  points?: number;
  correctOptionId: string | string[];
  correctAnswer?: any;
  userSelectedOptionId?: string | string[];
  isMarkedForReview?: boolean;
  isAnswerCorrect?: boolean;
}


export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  attemptDate: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'passed' | 'failed';
  timeTakenMinutes: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  totalQuestions: number;
  questionsReview?: QuizQuestion[];
}

export interface QuizAttemptRequest {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  courseId: string;
  courseTitle: string;
  attemptsUsed: number;
  maxAttempts: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface StudentQuizDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  instructorAvatar: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
  description: string;
  timeLimitMinutes: number;
  questionsCount: number;
  passingScore: number;
  totalPoints: number;
  maxAttempts: number;
  attemptsUsed: number;
  attemptCycle?: number;
  attemptRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  attemptRequestFeedback?: string;
  status: 'available' | 'in_progress' | 'completed' | 'passed' | 'failed';
  lastScore?: number;
  instructions: string[];
  questions: QuizQuestion[];
  attemptHistory: QuizAttemptRecord[];
  isLocked?: boolean;
  lockReason?: string;
  unlockRequirement?: string;
}

export interface CertificateRequirement {
  lessonsCompletionPercent: number;
  assignmentsCompletionPercent: number;
  quizzesPassPercent: number;
  overallProgressPercent: number;
  remainingLessonsCount?: number;
  remainingAssignmentsCount?: number;
  remainingQuizzesCount?: number;
}

export interface StudentCertificateDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  courseDescription?: string;
  courseCategory: string;
  courseThumbnail: string;
  studentName: string;
  instructorName: string;
  instructorTitle: string;
  instructorAvatar: string;
  issueDate?: string;
  completionDate?: string;
  certificateCode: string;
  verificationUrl: string;
  downloadUrl?: string;
  status: 'earned' | 'eligible' | 'pending' | 'locked';
  requirements: CertificateRequirement;
  learningHours: number;
}

export type Certificate = StudentCertificateDetail;

export interface AnnouncementAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'ppt' | 'zip' | 'image';
  url: string;
}

export type AnnouncementAudience = 
  | 'Students' 
  | 'Instructors' 
  | 'Both Students & Instructors' 
  | 'Specific Course Students';

export type AnnouncementStatus = 'Draft' | 'Published';

export interface AnnouncementItem {
  id: string;
  title: string;
  message?: string;
  content?: string;
  summary?: string;
  createdBy?: string;
  creatorRole?: 'admin' | 'instructor';
  creatorName?: string;
  creatorAvatar?: string;
  authorName?: string;
  authorRole?: string;
  authorAvatar?: string;
  audience?: AnnouncementAudience;
  targetAudience?: string;
  courseId?: string;
  courseTitle?: string;
  status?: AnnouncementStatus;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  isNew?: boolean;
  isRead?: boolean;
  type?: 'course_update' | 'system_maintenance' | 'exam_schedule' | 'general';
  attachments?: AnnouncementAttachment[];
  link?: string;
}

export type StudentAnnouncement = AnnouncementItem;
export type Announcement = AnnouncementItem;

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  audience?: AnnouncementAudience;
  courseId?: string;
  status?: AnnouncementStatus;
}

export interface UpdateAnnouncementDto {
  title?: string;
  message?: string;
  audience?: AnnouncementAudience;
  courseId?: string;
  status?: AnnouncementStatus;
}

export type NotificationCategory = 
  | 'announcement' 
  | 'course' 
  | 'assignment' 
  | 'quiz' 
  | 'live_class' 
  | 'chat' 
  | 'payment' 
  | 'certificate'
  | 'enrollment'
  | 'instructor_message'
  | 'forum'
  | 'system';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead?: boolean;
  read?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  link?: string;
  sourceId?: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
  date?: string;
  time?: string;
  role?: 'student' | 'instructor' | 'admin';
  courseId?: string;
  courseTitle?: string;
  isImportant?: boolean;
}

export type AppNotification = NotificationItem;
export type Notification = NotificationItem;
export type StudentNotificationItem = NotificationItem;

export interface LiveClassResource {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'ppt' | 'zip' | 'link' | string;
  url: string;
}

export interface StudentLiveClass {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  instructorName: string;
  instructorAvatar: string;
  instructorRole: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  platform: 'Zoom' | 'Google Meet' | 'Microsoft Teams' | string;
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  status: 'live_now' | 'upcoming' | 'completed' | 'Live' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Draft';
  instructions?: string;
  resources?: LiveClassResource[];
  recordingUrl?: string;
  isRecordingAvailable?: boolean;
}

export interface NotificationPreferencesSettings {
  assignmentReminders: boolean;
  quizDueDates: boolean;
  liveClassAlerts: boolean;
  courseAnnouncements: boolean;
  certificateUnlocks: boolean;
  paymentReceipts: boolean;
  emailDigest: boolean;
  pushNotifications: boolean;
}

export interface ForumAttachment {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'code' | 'pdf' | 'zip' | 'doc' | 'other';
  url: string;
}

export interface ForumReply {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'student' | 'instructor' | 'admin' | 'ta';
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  isAcceptedAnswer?: boolean;
  isPinnedReply?: boolean;
  attachments?: ForumAttachment[];
}

export interface StudentForumDiscussion {
  id: string;
  courseId: string;
  courseTitle: string;
  category: 'General Discussion' | 'Assignments' | 'Quizzes' | 'Course Content' | 'Technical Issues' | 'Announcements';
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'student' | 'instructor' | 'admin' | 'ta';
  createdAt: string;
  repliesCount: number;
  viewsCount: number;
  likesCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  isSolved?: boolean;
  isLocked?: boolean;
  attachments?: ForumAttachment[];
  replies: ForumReply[];
}

export interface ForumModerationReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  targetType: 'discussion' | 'reply';
  targetId: string;
  targetContent?: string;
  targetTitle?: string;
  courseId?: string;
  courseTitle?: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Dismissed' | 'Actioned';
  reviewedBy?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ChatContactItem {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'instructor' | 'admin';
  email?: string;
  courseId?: string;
  courseTitle?: string;
  existingConversationId?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'doc' | 'archive' | 'file' | 'other';
  url: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'student' | 'instructor' | 'system';
  content: string;
  timestamp: string;
  date: string;
  isRead?: boolean;
  type?: 'text' | 'image' | 'file' | 'link';
  attachments?: ChatAttachment[];
  linkPreview?: {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
  };
}

export interface ChatConversation {
  id: string;
  type?: 'student_instructor' | 'admin_instructor';
  courseId: string;
  courseTitle: string;
  studentId?: string;
  instructorId: string;
  adminId?: string;
  instructorName: string;
  instructorAvatar: string;
  instructorRole: string;
  instructorStatus: 'online' | 'away' | 'offline';
  instructorBio?: string;
  instructorEmail?: string;
  officeHours?: string;
  participant?: AdminChatParticipant;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface AdminChatParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'instructor' | 'admin';
  status?: 'online' | 'offline';
  onlineStatus?: 'online' | 'offline' | 'away';
  email: string;
  titleOrCourse?: string;
  joinedDate?: string;
  enrolledCoursesCount?: number;
  headline?: string;
  unreadCount?: number;
  lastReadAt?: string;
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
  senderRole: 'admin' | 'student' | 'instructor';
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

export interface Payment {
  id: string;
  transactionId: string;
  studentName: string;
  courseTitle: string;
  amount: number;
  status: 'Paid' | 'Failed' | 'Cancelled';
  date: string;
  paymentMethod: string;
}

export interface WeeklyActivity {
  day: string; // e.g. 'Mon', 'Tue'
  fullDay: string;
  hours: number;
  targetHours: number;
}

export interface LiveClass {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  instructorAvatar: string;
  topic: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'upcoming' | 'live' | 'ended';
  meetingUrl?: string;
}

export interface ActivityTimelineItem {
  id: string;
  type: 'lesson_completed' | 'assignment_submitted' | 'quiz_completed' | 'certificate_earned' | 'course_enrolled';
  title: string;
  courseTitle: string;
  timestamp: string;
  detail?: string;
  iconType?: string;
}

export interface EnrolledCourseProgress {
  course: Course;
  progress: number;
  lastAccessedLesson: string;
  completedLessons: number;
  totalLessons: number;
  lastAccessedTime: string;
}

export interface WishlistItem {
  id: string;
  courseId?: string;
  studentId?: string;
  course: Course;
  addedAt: string;
}

export interface CartItem {
  id: string;
  courseId?: string;
  studentId?: string;
  course: Course;
  addedAt: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description: string;
  minSpend?: number;
}

export interface CreatePaymentOrderResponse {
  orderId: string;
  orderNumber: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isFreeOrder: boolean;
  courses: {
    id: string;
    title: string;
    price: number;
  }[];
}

export interface VerifyPaymentDto {
  orderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  paymentMethod?: string;
}

export interface PaymentHistoryItem {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentGateway: string;
  status: 'Pending' | 'Success' | 'Failed';
  gatewayPaymentId?: string;
  paidAt: string;
  courses: {
    id: string;
    title: string;
    thumbnail?: string;
    instructorName?: string;
    unitPrice: number;
  }[];
}

export interface EnrolledCourseDetail {
  id: string;
  course: Course;
  enrollmentStatus: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedLesson: string;
  lastAccessedTime: string;
  enrolledDate: string;
  certificateCode?: string;
}

export interface PlayerResource {
  id: string;
  title: string;
  fileType: 'pdf' | 'zip' | 'ppt' | 'code' | 'doc';
  fileSize: string;
  downloadUrl: string;
}

export interface PlayerLessonText {
  subtitle: string;
  introduction: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  codeSnippet?: {
    language: string;
    filename: string;
    code: string;
  };
  keyTakeaways: string[];
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
}

export interface PlayerLesson {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  duration: string;
  type: 'video' | 'pdf' | 'text' | 'resource';
  isCompleted: boolean;
  isBookmarked: boolean;
  videoUrl?: string;
  videoSourceType?: 'upload' | 'link';
  videoPoster?: string;
  pdfUrl?: string;
  pdfTitle?: string;
  pdfPageCount?: number;
  textContent?: PlayerLessonText;
  resources?: PlayerResource[];
  isLocked?: boolean;
  isPreview?: boolean;
}

export interface PlayerModule {
  id: string;
  title: string;
  description?: string;
  lessons: PlayerLesson[];
}

export interface PlayerPersonalNote {
  id: string;
  lessonId: string;
  lessonTitle: string;
  timestamp: string;
  content: string;
  createdAt: string;
}

export interface PlayerUpcomingLearning {
  nextLesson?: {
    id: string;
    title: string;
    duration: string;
    moduleTitle: string;
  };
  upcomingAssignment?: {
    id: string;
    title: string;
    points: number;
  };
  upcomingQuiz?: {
    id: string;
    title: string;
    timeLimit: string;
    questionsCount: number;
  };
}

export type LessonType = 'Video' | 'PDF' | 'Text' | 'Resource';
export type LessonStatus = 'Published' | 'Draft';

export interface CurriculumLesson {
  id: string;
  moduleId?: string;
  title: string;
  shortDescription: string;
  durationMinutes: number;
  type: LessonType;
  status: LessonStatus;
  isLocked: boolean;
  prerequisiteId?: string;
  videoUrl?: string;
  pdfUrl?: string;
  textContent?: string;
  resourceUrl?: string;
  resourcesCount?: number;
  position?: number;
  isPreview?: boolean;
}

export interface CurriculumModule {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  order: number;
  position?: number;
  isExpanded?: boolean;
  lessons: CurriculumLesson[];
}

export interface CourseCurriculumData {
  courseId: string;
  courseTitle: string;
  category: string;
  difficulty: string;
  thumbnail: string;
  modules: CurriculumModule[];
}

export interface AiChatMessage {
  id: string;
  conversationId: string;
  sender: 'student' | 'ai';
  text: string;
  timestamp: string;
  tokensUsed?: number;
}

export interface AiConversation {
  id: string;
  title: string;
  contextType: 'general' | 'course' | 'lesson' | 'assignment' | 'quiz';
  courseId?: string | null;
  lessonId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseReviewItem {
  id: string;
  courseId: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  rating: number;
  reviewTitle?: string;
  reviewText: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRatingBreakdown {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: { count: number; percentage: number };
    4: { count: number; percentage: number };
    3: { count: number; percentage: number };
    2: { count: number; percentage: number };
    1: { count: number; percentage: number };
  };
}

export interface CourseReviewsResponse {
  reviews: CourseReviewItem[];
  summary: CourseRatingBreakdown;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmitReviewDto {
  rating: number;
  reviewTitle?: string;
  reviewText: string;
}







