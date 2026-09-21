// =============================================================
// BACKEND TYPES DEFINITIONS
// =============================================================

export type UserRole = 'student' | 'instructor' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'pending' | 'pending_approval' | 'inactive';
export type UserStatus = AccountStatus;
export type InstructorApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export type CourseStatusType = 'Draft' | 'Published' | 'Archived';
export type CourseApprovalStatusType =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Changes Requested';

export type CourseDifficultyType = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CourseLanguageType =
  | 'English'
  | 'Spanish'
  | 'Hindi'
  | 'French'
  | 'German'
  | 'Mandarin'
  | 'Arabic'
  | 'Portuguese';

export type CoursePriceType = 'Free' | 'Paid' | 'Discounted';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  status: AccountStatus;
  phone?: string;
  bio?: string;
  headline?: string;
  studentIdNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
  linkedInUrl?: string;
  personalWebsite?: string;
  learningStreakDays?: number;
  enrolledCoursesCount?: number;
  completedCoursesCount?: number;
  certificatesCount?: number;
  instructorApprovalStatus?: InstructorApprovalStatus;
  qualification?: string;
  experience?: string;
  category?: string;
  specialization?: string;
  coursesCreatedCount?: number;
  coursesCreated?: any[];
  totalStudents?: number;
  instructorRating?: number;
  adminPermissions?: string[];
  themePreference?: string;
  languagePreference?: string;
  payoutInfo?: any;
  notificationPreferences?: any;
  privacySettings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionResponse {
  user: UserProfile;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  } | null;
}

export interface InstructorApprovalReview {
  id?: string;
  instructorId?: string;
  reviewedBy?: string;
  previousStatus?: string;
  newStatus?: string;
  status?: InstructorApprovalStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface UserQueryFilters {
  search?: string;
  role?: UserRole | 'all';
  status?: AccountStatus | 'all';
  approvalStatus?: InstructorApprovalStatus | 'all';
  instructorApprovalStatus?: InstructorApprovalStatus | 'all';
  page?: number;
  limit?: number;
}

export interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coursesCount?: number;
  status?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  status?: string;
  coursesCount?: number;
  totalCourses?: number;
  subcategories?: SubcategoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  instructorId: string;
  instructorName?: string;
  instructorAvatar?: string;
  categoryId?: string;
  category?: string;
  subcategory?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  difficulty?: CourseDifficultyType;
  level?: CourseDifficultyType;
  language?: CourseLanguageType;
  thumbnail?: string;
  promoVideoUrl?: string;
  price: number;
  discountPrice?: number;
  priceType?: CoursePriceType;
  courseStatus: CourseStatusType;
  approvalStatus: CourseApprovalStatusType;
  isPublished?: boolean;
  rejectionReason?: string;
  tags?: string[];
  requirements?: string[];
  learningOutcomes?: string[];
  durationHours?: number;
  lessonsCount?: number;
  assignmentsCount?: number;
  quizzesCount?: number;
  studentsEnrolled?: number;
  rating?: number;
  reviewsCount?: number;
  isFeatured?: boolean;
  instructor?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface CourseQueryFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  difficulty?: CourseDifficultyType | 'All';
  language?: CourseLanguageType | 'All';
  priceType?: 'all' | 'free' | 'paid' | 'featured';
  courseStatus?: CourseStatusType | 'All';
  approvalStatus?: CourseApprovalStatusType | 'All';
  instructorId?: string;
  minRating?: number;
  sortBy?: 'newest' | 'oldest' | 'alphabetical' | 'students' | 'rating' | 'popular';
  page?: number;
  limit?: number;
}

export interface CourseCompletionSummary {
  courseComplete: boolean;
  courseInfoComplete: boolean;
  curriculumComplete: boolean;
  contentComplete: boolean;
  assignmentsComplete: boolean;
  quizzesComplete: boolean;
  modulesCount: number;
  lessonsCount: number;
  assignmentsCount: number;
  quizzesCount: number;
  missingItems: string[];
}

export interface CreateCourseDto {
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryId?: string;
  category?: string;
  subcategory?: string;
  thumbnail?: string;
  promoVideoUrl?: string;
  price?: number;
  discountPrice?: number;
  difficulty?: CourseDifficultyType;
  language?: CourseLanguageType;
  tags?: string[];
  requirements?: string[];
  learningOutcomes?: string[];
  courseStatus?: CourseStatusType;
  isSubmitForApproval?: boolean;
}

export interface UpdateCourseDto {
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryId?: string;
  category?: string;
  subcategory?: string;
  thumbnail?: string;
  promoVideoUrl?: string;
  price?: number;
  discountPrice?: number;
  difficulty?: CourseDifficultyType;
  language?: CourseLanguageType;
  tags?: string[];
  requirements?: string[];
  learningOutcomes?: string[];
  courseStatus?: CourseStatusType;
  isSubmitForApproval?: boolean;
}

export interface ReorderItem {
  id: string;
  position: number;
}

export interface AuthUserContext {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  profile?: UserProfile;
  rawSupabaseUser?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// -------------------------------------------------------------
// Curriculum & Lesson Types
// -------------------------------------------------------------

export type LessonType = 'Video' | 'PDF' | 'Text' | 'Resource';

export interface Lesson {
  id: string;
  moduleId: string;
  courseId?: string;
  title: string;
  shortDescription?: string;
  lessonType: LessonType;
  content?: string;
  videoUrl?: string;
  documentUrl?: string;
  resourceUrl?: string;
  durationMinutes: number;
  position: number;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  position: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseCurriculum {
  courseId: string;
  courseTitle: string;
  category?: string;
  difficulty?: string;
  thumbnail?: string;
  modules: CourseModule[];
}

export interface CreateModuleDto {
  title: string;
  description?: string;
  position?: number;
}

export interface UpdateModuleDto {
  title?: string;
  description?: string;
  position?: number;
}

export interface CreateLessonDto {
  moduleId: string;
  title: string;
  shortDescription?: string;
  lessonType: LessonType;
  content?: string;
  videoUrl?: string;
  documentUrl?: string;
  resourceUrl?: string;
  durationMinutes?: number;
  position?: number;
  isPreview?: boolean;
}

export interface UpdateLessonDto {
  title?: string;
  shortDescription?: string;
  lessonType?: LessonType;
  content?: string;
  videoUrl?: string;
  documentUrl?: string;
  resourceUrl?: string;
  durationMinutes?: number;
  position?: number;
  isPreview?: boolean;
}

// -------------------------------------------------------------
// Assignment Types
// -------------------------------------------------------------

export type AssignmentStatus = 'Draft' | 'Published' | 'Archived';
export type SubmissionStatus = 'Submitted' | 'Graded' | 'Returned' | 'Resubmitted' | 'Under Review' | 'Resubmission Requested';

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDays: number;
  maxScore: number;
  passingScore: number;
  maxAttempts: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  status: AssignmentStatus;
  position: number;
  submissionsCount?: number;
  gradedCount?: number;
  pendingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  courseId?: string;
  courseTitle?: string;
  maxScore?: number;
  passingScore?: number;
  dueDate?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentAvatar?: string;
  submissionText?: string;
  fileUrl?: string;
  attemptNumber: number;
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  gradedAt?: string;
  gradedBy?: string;
  gradedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  dueDays?: number;
  maxScore?: number;
  passingScore?: number;
  maxAttempts?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  status?: AssignmentStatus;
  position?: number;
}

export interface UpdateAssignmentDto {
  title?: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  dueDays?: number;
  maxScore?: number;
  passingScore?: number;
  maxAttempts?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  status?: AssignmentStatus;
  position?: number;
}

export interface CreateSubmissionDto {
  submissionText?: string;
  fileUrl?: string;
}

export interface GradeSubmissionDto {
  score: number;
  feedback?: string;
  status?: SubmissionStatus;
}

export type AssignmentReattemptStatus = 'Pending' | 'Approved' | 'Rejected';

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
  status: AssignmentReattemptStatus;
  reviewedBy?: string;
  instructorFeedback?: string;
  attemptsUsed?: number;
  maxAttempts?: number;
  requestedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentReattemptRequestDto {
  reason: string;
}

export interface ReviewAssignmentReattemptRequestDto {
  status: 'Approved' | 'Rejected';
  feedback?: string;
}


// -------------------------------------------------------------
// Quiz Types (Multi-Quiz, Question Bank, Attempts)
// -------------------------------------------------------------

export type QuizType = 'Mandatory' | 'Optional';
export type QuizStatus = 'Draft' | 'Published' | 'Archived';
export type QuestionType =
  | 'Single Answer'
  | 'Multiple Answer'
  | 'Fill in the Blanks'
  | 'True or False';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  correctAnswer?: any;
  points: number;
  explanation?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimitMinutes: number;
  passingScore: number;
  quizType: QuizType;
  maxAttempts: number;
  randomizeQuestions: boolean;
  shuffleOptions: boolean;
  status: QuizStatus;
  position: number;
  questionsCount?: number;
  totalAttemptsCount?: number;
  questions?: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle?: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'timed_out' | 'cancelled';
  answers?: QuizAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answer: any;
  isCorrect: boolean;
  pointsAwarded: number;
  correctOptionId?: string;
  correctAnswer?: any;
  createdAt: string;
}


export interface CreateQuizDto {
  title: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  quizType?: QuizType;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  shuffleOptions?: boolean;
  status?: QuizStatus;
  position?: number;
}

export interface UpdateQuizDto {
  title?: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  quizType?: QuizType;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  shuffleOptions?: boolean;
  status?: QuizStatus;
  position?: number;
}

export interface CreateQuestionDto {
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  correctAnswer?: any;
  points?: number;
  explanation?: string;
  position?: number;
}

export interface UpdateQuestionDto {
  questionText?: string;
  questionType?: QuestionType;
  options?: QuestionOption[];
  correctAnswer?: any;
  points?: number;
  explanation?: string;
  position?: number;
}

export interface SubmitQuizAttemptDto {
  answers: {
    questionId: string;
    answer: any;
  }[];
}

// =============================================================
// ENROLLMENT TYPES
// =============================================================

export type EnrollmentStatus = 'Active' | 'Completed' | 'Cancelled';
export type CertificateEligibilityStatus = 'Eligible' | 'Locked';
export type QuizPerformanceStatus = 'Passed' | 'Failed' | 'Not Attempted';
export type AssignmentSubmissionStatus = 'Completed' | 'Pending';

export interface DetailedStudentProgressItem {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  email: string;
  phone: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate: string;
  isActive: boolean;

  // Learning Progress
  lessonProgressPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;

  assignmentProgressPercentage: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  assignmentStatus: AssignmentSubmissionStatus;

  quizProgressPercentage: number;
  quizzesPassed: number;
  totalQuizzes: number;
  quizStatus: QuizPerformanceStatus;

  overallProgressPercentage: number;

  // Certificate Eligibility
  certificateStatus: CertificateEligibilityStatus;
  certificateLockReason?: string;

  // Student Activity Log
  lastLogin: string;
  lastLessonCompleted: string;
  lastAssignmentSubmitted: string;
  lastQuizAttempt: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle?: string;
  courseThumbnail?: string;
  durationHours?: number;
  lessonsCount?: number;
  instructorId?: string;
  instructorName?: string;
  instructorAvatar?: string;
  instructorBio?: string;
  instructorSpecialization?: string;
  instructorQualification?: string;
  category?: string;
  rating?: number;
  studentsEnrolled?: number;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  studentEmail?: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentQueryFilters {
  status?: EnrollmentStatus | 'All';
  search?: string;
  courseId?: string;
}

// =============================================================
// LESSON PROGRESS & COURSE PROGRESS TYPES
// =============================================================

export type LessonProgressStatus = 'In_Progress' | 'Completed';

export interface LessonProgress {
  id: string;
  studentId: string;
  courseId: string;
  lessonId: string;
  status: LessonProgressStatus;
  progressPercentage: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCourseProgressSummary {
  courseId: string;
  studentId: string;
  totalLessons: number;
  completedLessons: number;
  lessonProgressPercentage: number;
  completedLessonIds: string[];
  totalAssignments: number;
  completedAssignments: number;
  mandatoryAssignmentsCount: number;
  completedAssignmentsCount: number;
  assignmentsSubmitted?: boolean;
  assignmentsGraded?: boolean;
  assignmentsComplete: boolean;
  quizExists: boolean;
  hasMandatoryQuiz: boolean;
  quizPassed: boolean;
  courseComplete: boolean;
  isCourseCompleted: boolean;
  certificateAvailable?: boolean;
  enrolledAt: string;
  overallProgressPercentage: number;
}

// =============================================================
// WISHLIST & CART TYPES
// =============================================================

export interface WishlistItem {
  id: string;
  studentId: string;
  courseId: string;
  course: Course;
  addedAt: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  studentId: string;
  courseId: string;
  course: Course;
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================
// ORDER & PAYMENT TYPES (Migration 010)
// =============================================================

export type OrderStatus = 'Pending' | 'Completed' | 'Failed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Success' | 'Failed';

export interface OrderItem {
  id: string;
  orderId: string;
  courseId: string;
  course?: Course;
  unitPrice: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  studentId: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  studentId: string;
  paymentGateway: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
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
  status: PaymentStatus;
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

// ============================================================
// STUDENT AI & LLM PROVIDER TYPES (MIGRATION 012)
// ============================================================

export type AiContextType = 'general' | 'course' | 'lesson' | 'assignment' | 'quiz';

export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiConversationRecord {
  id: string;
  studentId: string;
  courseId?: string | null;
  lessonId?: string | null;
  title: string;
  contextType: AiContextType;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessageRecord {
  id: string;
  conversationId: string;
  studentId: string;
  role: AiMessageRole;
  content: string;
  tokensUsed: number;
  createdAt: string;
}

export interface AiUsageRecord {
  id: string;
  studentId: string;
  tokensConsumed: number;
  requestCount: number;
  usageDate: string;
  createdAt: string;
}

export interface LlmMessage {
  role: AiMessageRole;
  content: string;
}

export interface LlmRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LlmResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  provider: 'gemini' | 'openai';
}

// ============================================================
// LIVE CLASSES TYPES (MIGRATION 015)
// ============================================================

export type LiveClassStatus = 'Draft' | 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
export type LiveClassAudienceType = 'All Enrolled Students' | 'Selected Students';

export interface LiveClassResource {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface LiveClassItem {
  id: string;
  courseId: string;
  courseTitle?: string;
  instructorId: string;
  instructorName?: string;
  instructorAvatar?: string;
  instructorRole?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  platform: string;
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  status: LiveClassStatus;
  audienceType: LiveClassAudienceType;
  selectedStudentIds?: string[];
  selectedStudentNames?: string[];
  instructions?: string;
  resources?: LiveClassResource[];
  recordingUrl?: string;
  isRecordingAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  enrolledStudentsCount?: number;
  questionsCount?: number;
}

export interface LiveClassQAItem {
  id: string;
  classId: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  questionText: string;
  likesCount: number;
  isPinned: boolean;
  isAnswered: boolean;
  instructorReply?: string;
  instructorReplyAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLiveClassDto {
  title: string;
  courseId: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  platform?: string;
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  status?: LiveClassStatus;
  audienceType?: LiveClassAudienceType;
  selectedStudentIds?: string[];
  instructions?: string;
  resources?: LiveClassResource[];
  recordingUrl?: string;
}

export interface UpdateLiveClassDto {
  title?: string;
  courseId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  platform?: string;
  meetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  status?: LiveClassStatus;
  audienceType?: LiveClassAudienceType;
  selectedStudentIds?: string[];
  instructions?: string;
  resources?: LiveClassResource[];
  recordingUrl?: string;
  isRecordingAvailable?: boolean;
}

export interface RescheduleLiveClassDto {
  startTime: string;
  endTime: string;
  durationMinutes?: number;
}

export interface LiveClassFilterParams {
  courseId?: string;
  instructorId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type LiveClassParticipantRole = 'student' | 'instructor' | 'admin';

export interface LiveClassParticipantItem {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: LiveClassParticipantRole;
  joinedAt: string;
  leftAt?: string | null;
  isActive: boolean; // leftAt is null
}

export interface LiveClassPaginatedResult {
  liveClasses: LiveClassItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LiveClassJoinResult {
  id: string;
  title: string;
  status: LiveClassStatus;
  platform: string;
  meetingUrl: string;
  meetingId: string;
  roomName: string;
  isHost: boolean;
  token: string;
  serverUrl: string;
}

// =============================================================
// CHAT & MESSAGING TYPES
// =============================================================

export type ConversationType = 'student_instructor' | 'admin_instructor';
export type ChatMessageType = 'text' | 'image' | 'file' | 'link';
export type ChatAttachmentType = 'image' | 'pdf' | 'doc' | 'archive' | 'other';

export interface ChatAttachmentDto {
  id?: string;
  name: string;
  size: string;
  type: ChatAttachmentType;
  url: string;
  previewUrl?: string;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  content: string;
  type: ChatMessageType;
  isRead: boolean;
  timestamp: string;
  date: string;
  attachments?: ChatAttachmentDto[];
  linkPreview?: {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
  };
  createdAt: string;
}

export interface ChatParticipantItem {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  role: UserRole;
  email: string;
  headline?: string;
  unreadCount: number;
  lastReadAt: string;
  onlineStatus?: 'online' | 'away' | 'offline';
}

export interface ConversationItem {
  id: string;
  type: ConversationType;
  courseId?: string;
  courseTitle?: string;
  studentId?: string;
  instructorId: string;
  adminId?: string;
  participant: ChatParticipantItem;
  instructor?: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    email: string;
    bio?: string;
    officeHours?: string;
    status: 'online' | 'away' | 'offline';
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatContactItem {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  email?: string;
  courseId?: string;
  courseTitle?: string;
  existingConversationId?: string;
}

export interface CreateConversationDto {
  recipientId: string;
  courseId?: string;
  type?: ConversationType;
}

export interface SendMessageDto {
  content: string;
  type?: ChatMessageType;
  attachments?: ChatAttachmentDto[];
}

// =============================================================
// ANNOUNCEMENTS & NOTIFICATIONS
// =============================================================

export type AnnouncementAudience = 
  | 'Students' 
  | 'Instructors' 
  | 'Both Students & Instructors' 
  | 'Specific Course Students';

export type AnnouncementStatus = 'Draft' | 'Published';

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  creatorRole: 'admin' | 'instructor';
  creatorName?: string;
  creatorAvatar?: string;
  audience: AnnouncementAudience;
  courseId?: string;
  courseTitle?: string;
  status: AnnouncementStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
}

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
  | 'forum'
  | 'system';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  actionUrl?: string;
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DISCUSSION FORUM TYPES & DTOS
// ============================================================================

export type DiscussionCategory =
  | 'General Discussion'
  | 'Assignments'
  | 'Quizzes'
  | 'Course Content'
  | 'Technical Issues'
  | 'Announcements';

export interface DiscussionAttachmentDto {
  name: string;
  size: string;
  type: 'image' | 'code' | 'pdf' | 'zip' | 'doc' | 'other';
  url: string;
}

export interface ForumAttachmentItem {
  id: string;
  discussionId?: string;
  replyId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  fileType: 'image' | 'code' | 'pdf' | 'zip' | 'doc' | 'other';
  uploadedBy: string;
  createdAt: string;
}

export interface DiscussionReplyItem {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'student' | 'instructor' | 'admin' | 'ta';
  content: string;
  isAcceptedAnswer: boolean;
  isPinned: boolean;
  likesCount: number;
  isLiked?: boolean;
  attachments?: ForumAttachmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionItem {
  id: string;
  courseId: string;
  courseTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'student' | 'instructor' | 'admin' | 'ta';
  category: DiscussionCategory;
  title: string;
  content: string;
  isPinned: boolean;
  isSolved: boolean;
  isLocked: boolean;
  viewsCount: number;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  attachments?: ForumAttachmentItem[];
  replies?: DiscussionReplyItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionDto {
  courseId: string;
  category: DiscussionCategory;
  title: string;
  content: string;
  attachments?: DiscussionAttachmentDto[];
}

export interface UpdateDiscussionDto {
  title?: string;
  content?: string;
  category?: DiscussionCategory;
}

export interface CreateReplyDto {
  content: string;
  attachments?: DiscussionAttachmentDto[];
}

export interface UpdateReplyDto {
  content: string;
}

export interface ModerateDiscussionDto {
  isPinned?: boolean;
  isSolved?: boolean;
  isLocked?: boolean;
}

export interface ModerateReplyDto {
  isPinned?: boolean;
  isAcceptedAnswer?: boolean;
}

export interface CreateModerationReportDto {
  targetType: 'discussion' | 'reply';
  targetId: string;
  reason: string;
}

export interface ResolveModerationReportDto {
  status: 'Reviewed' | 'Dismissed' | 'Actioned';
  resolutionNotes?: string;
}

export interface DiscussionModerationReportItem {
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

// ============================================================================
// COURSE REVIEWS & RATINGS TYPES
// ============================================================================

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

export interface CreateReviewDto {
  rating: number;
  reviewTitle?: string;
  reviewText: string;
}

export interface UpdateReviewDto {
  rating?: number;
  reviewTitle?: string;
  reviewText?: string;
}






