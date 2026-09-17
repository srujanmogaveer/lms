import { Request, Response, NextFunction } from 'express';
import { assignmentService } from '../services/assignment.service';
import { courseService } from '../services/course.service';
import { StorageService } from '../services/storage.service';
import { supabaseAdmin } from '../config/supabase';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class AssignmentController {
  /**
   * Instructor: List all assignments across all courses owned by instructor
   */
  public async getAllInstructorAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const assignments = await assignmentService.getAllInstructorAssignments(instructorProfileId);
      sendResponse(res, 200, 'All instructor assignments retrieved successfully', assignments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: List assignments for a course
   */
  public async getInstructorCourseAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const courseId = req.params.courseId as string;
      const assignments = await assignmentService.getInstructorCourseAssignments(instructorProfileId, courseId);
      sendResponse(res, 200, 'Instructor assignments retrieved successfully', assignments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Upload assignment reference attachment or sample template
   */
  public async uploadAssignmentAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const file = req.file;
      if (!file) throw ApiError.badRequest('No attachment file provided');

      const courseId = (req.body?.courseId || req.query?.courseId) as string | undefined;
      const uploaded = await StorageService.uploadAssignmentAttachment(file, instructorProfileId, courseId);
      sendResponse(res, 200, 'Attachment uploaded successfully', uploaded);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Create an assignment for a course
   */
  public async createAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const courseId = req.params.courseId as string;
      const newAssignment = await assignmentService.createAssignment(instructorProfileId, courseId, req.body);
      sendResponse(res, 201, 'Assignment created successfully', newAssignment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor / Student: Get assignment by ID
   */
  public async getAssignmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.assignmentId as string;
      const assignment = await assignmentService.getAssignmentById(id);
      sendResponse(res, 200, 'Assignment retrieved successfully', assignment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Update assignment
   */
  public async updateAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.assignmentId as string;
      const updated = await assignmentService.updateAssignment(instructorProfileId, id, req.body);
      sendResponse(res, 200, 'Assignment updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Delete assignment
   */
  public async deleteAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.assignmentId as string;
      await assignmentService.deleteAssignment(instructorProfileId, id);
      sendResponse(res, 200, 'Assignment deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Reorder assignments
   */
  public async reorderAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const courseId = req.params.courseId as string;
      await assignmentService.reorderAssignments(instructorProfileId, courseId, req.body.items);
      sendResponse(res, 200, 'Assignments reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get assignment submissions
   */
  public async getAssignmentSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.assignmentId as string;
      const submissions = await assignmentService.getAssignmentSubmissions(instructorProfileId, id);
      sendResponse(res, 200, 'Assignment submissions retrieved successfully', submissions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get all pending submissions across owned courses
   */
  public async getInstructorPendingSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const courseId = req.query.courseId as string | undefined;
      const submissions = await assignmentService.getInstructorPendingSubmissions(instructorProfileId, courseId);
      sendResponse(res, 200, 'Pending submissions retrieved successfully', submissions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get single submission details by submissionId
   */
  public async getSubmissionByIdForInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const submissionId = req.params.submissionId as string;
      const submission = await assignmentService.getSubmissionByIdForInstructor(instructorProfileId, submissionId);
      sendResponse(res, 200, 'Submission details retrieved successfully', submission);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get signed URL for submission file (for inline PDF preview)
   */
  public async getSubmissionFileUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const submissionId = req.params.submissionId as string;
      const result = await assignmentService.getSubmissionSignedFileUrl(instructorProfileId, submissionId);
      sendResponse(res, 200, 'Submission file URL generated', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Grade submission
   */
  public async gradeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const instructorProfileId = await courseService.resolveInstructorProfileId(authUserId);
      const id = req.params.submissionId as string;
      const graded = await assignmentService.gradeSubmission(instructorProfileId, id, req.body);
      sendResponse(res, 200, 'Submission graded successfully', graded);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public / Student: Get course assignments
   */
  public async getPublicCourseAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.courseId as string;
      const assignments = await assignmentService.getPublicCourseAssignments(courseId);
      sendResponse(res, 200, 'Course assignments retrieved successfully', assignments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Submit assignment
   */
  public async submitStudentAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const assignmentId = req.params.assignmentId as string;
      const submission = await assignmentService.submitStudentAssignment(studentId, assignmentId, req.body);
      sendResponse(res, 201, 'Assignment submitted successfully', submission);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Upload submission file securely (authenticated student upload)
   */
  public async uploadStudentSubmissionFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const assignmentId = req.params.assignmentId as string;
      const file = req.file;
      if (!file) throw ApiError.badRequest('No file provided for upload');

      // 1. Verify student enrollment & assignment
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('course_id', assignment.courseId)
        .maybeSingle();

      if (!enrollment || enrollment.status === 'Cancelled') {
        throw ApiError.forbidden('You are not enrolled in the course for this assignment.');
      }

      // 2. Fetch existing submissions to determine attempt number
      const { data: existingAttempts } = await supabaseAdmin
        .from('assignment_submissions')
        .select('attempt_number')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .order('attempt_number', { ascending: false });

      const nextAttemptNumber = ((existingAttempts?.[0]?.attempt_number as number) || 0) + 1;

      // 3. Upload file via StorageService using secure service context
      const uploaded = await StorageService.uploadStudentSubmissionFile(
        file,
        studentId,
        assignmentId,
        nextAttemptNumber
      );

      sendResponse(res, 200, 'Submission file uploaded successfully', uploaded);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Get signed URL for their own submission file
   */
  public async getStudentSubmissionFileUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const submissionId = req.params.submissionId as string;
      const result = await assignmentService.getStudentSubmissionSignedFileUrl(studentId, submissionId);
      sendResponse(res, 200, 'Submission file URL generated', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Get single submission
   */
  public async getStudentSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const submissionId = req.params.submissionId as string;
      const submission = await assignmentService.getStudentSubmission(studentId, submissionId);
      sendResponse(res, 200, 'Student submission retrieved successfully', submission);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Get enrolled assignments with submissions
   */
  public async getStudentEnrolledAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const courseId = req.query.courseId as string | undefined;
      const assignments = await assignmentService.getStudentEnrolledAssignments(studentId, courseId);
      sendResponse(res, 200, 'Enrolled assignments retrieved successfully', assignments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Create Reattempt Request
   */
  public async createReattemptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const assignmentId = req.params.assignmentId as string;
      const { reason } = req.body;
      const result = await assignmentService.createReattemptRequest(studentId, assignmentId, reason);
      sendResponse(res, 201, 'Reattempt request submitted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Get Student's Reattempt Requests
   */
  public async getStudentReattemptRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const requests = await assignmentService.getStudentReattemptRequests(studentId);
      sendResponse(res, 200, 'Reattempt requests retrieved successfully', requests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Get Reattempt Requests
   */
  public async getInstructorReattemptRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const courseId = req.query.courseId as string | undefined;
      const requests = await assignmentService.getInstructorReattemptRequests(authUserId, courseId);
      sendResponse(res, 200, 'Instructor assignment reattempt requests retrieved', requests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Approve Reattempt Request
   */
  public async approveReattemptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const requestId = req.params.requestId as string;
      const result = await assignmentService.approveReattemptRequest(authUserId, requestId);
      sendResponse(res, 200, 'Assignment reattempt request approved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Instructor: Reject Reattempt Request
   */
  public async rejectReattemptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) throw ApiError.unauthorized('Authentication required');

      const requestId = req.params.requestId as string;
      const { feedback } = req.body || {};
      const result = await assignmentService.rejectReattemptRequest(authUserId, requestId, feedback);
      sendResponse(res, 200, 'Assignment reattempt request rejected', result);
    } catch (error) {
      next(error);
    }
  }
}

export const assignmentController = new AssignmentController();


