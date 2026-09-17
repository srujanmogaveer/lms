import { Request, Response, NextFunction } from 'express';
import { quizService } from '../services/quiz.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class QuizController {
  // =============================================================
  // INSTRUCTOR / QUIZ
  // =============================================================

  public getInstructorCourseQuizzes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.params.courseId as string;
      const quizzes = await quizService.getInstructorCourseQuizzes(req.user.id, courseId);
      sendResponse(res, 200, 'Instructor course quizzes retrieved successfully', quizzes);
    } catch (error) {
      next(error);
    }
  };

  public getQuizById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const quiz = await quizService.getQuizById(req.user.id, quizId, req.user.role);
      sendResponse(res, 200, 'Quiz retrieved successfully', quiz);
    } catch (error) {
      next(error);
    }
  };

  public createQuiz = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.params.courseId as string;
      const quiz = await quizService.createQuiz(req.user.id, courseId, req.body);
      sendResponse(res, 201, 'Quiz created successfully', quiz);
    } catch (error) {
      next(error);
    }
  };

  public updateQuiz = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const quiz = await quizService.updateQuiz(req.user.id, quizId, req.body);
      sendResponse(res, 200, 'Quiz updated successfully', quiz);
    } catch (error) {
      next(error);
    }
  };

  public deleteQuiz = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      await quizService.deleteQuiz(req.user.id, quizId);
      sendResponse(res, 200, 'Quiz deleted successfully', null);
    } catch (error) {
      next(error);
    }
  };

  public publishQuiz = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const quiz = await quizService.publishQuiz(req.user.id, quizId);
      sendResponse(res, 200, 'Quiz published successfully', quiz);
    } catch (error) {
      next(error);
    }
  };

  public archiveQuiz = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const quiz = await quizService.archiveQuiz(req.user.id, quizId);
      sendResponse(res, 200, 'Quiz archived successfully', quiz);
    } catch (error) {
      next(error);
    }
  };

  public reorderQuizzes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.params.courseId as string;
      await quizService.reorderQuizzes(req.user.id, courseId, req.body.items);
      sendResponse(res, 200, 'Quizzes reordered successfully', null);
    } catch (error) {
      next(error);
    }
  };

  // =============================================================
  // INSTRUCTOR / QUESTIONS
  // =============================================================

  public getQuizQuestions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const questions = await quizService.getQuizQuestions(req.user.id, quizId);
      sendResponse(res, 200, 'Quiz questions retrieved successfully', questions);
    } catch (error) {
      next(error);
    }
  };

  public createQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const question = await quizService.createQuestion(req.user.id, quizId, req.body);
      sendResponse(res, 201, 'Quiz question created successfully', question);
    } catch (error) {
      next(error);
    }
  };

  public createQuestionsBatch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const questionsList = req.body.questions || req.body;
      const created = await quizService.createQuestionsBatch(req.user.id, quizId, questionsList);
      sendResponse(res, 201, 'Quiz questions created in batch successfully', created);
    } catch (error) {
      next(error);
    }
  };

  public updateQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const questionId = req.params.questionId as string;
      const question = await quizService.updateQuestion(req.user.id, questionId, req.body);
      sendResponse(res, 200, 'Quiz question updated successfully', question);
    } catch (error) {
      next(error);
    }
  };

  public deleteQuestion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const questionId = req.params.questionId as string;
      await quizService.deleteQuestion(req.user.id, questionId);
      sendResponse(res, 200, 'Quiz question deleted successfully', null);
    } catch (error) {
      next(error);
    }
  };

  public reorderQuestions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      await quizService.reorderQuestions(req.user.id, quizId, req.body.items);
      sendResponse(res, 200, 'Quiz questions reordered successfully', null);
    } catch (error) {
      next(error);
    }
  };

  // =============================================================
  // STUDENT / PUBLIC
  // =============================================================

  public getStudentCourseQuiz = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.params.courseId as string;
      const quizzes = await quizService.getStudentCourseQuiz(req.user.id, courseId);
      sendResponse(res, 200, 'Student course quizzes retrieved successfully', quizzes);
    } catch (error) {
      next(error);
    }
  };

  public getStudentEnrolledQuizzes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.query.courseId as string | undefined;
      const quizzes = await quizService.getStudentEnrolledQuizzes(req.user.id, courseId);
      sendResponse(res, 200, 'Student enrolled quizzes retrieved successfully', quizzes);
    } catch (error) {
      next(error);
    }
  };

  public getPublicCourseQuizzes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;
      const quizzes = await quizService.getPublicCourseQuizzes(courseId);
      sendResponse(res, 200, 'Course quizzes retrieved successfully', quizzes);
    } catch (error) {
      next(error);
    }
  };

  public startAttempt = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const attempt = await quizService.startQuizAttempt(req.user.id, quizId);
      sendResponse(res, 201, 'Quiz attempt started successfully', attempt);
    } catch (error) {
      next(error);
    }
  };

  public submitAttempt = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const attemptId = req.params.attemptId as string;
      const result = await quizService.submitQuizAttempt(req.user.id, attemptId, req.body);
      sendResponse(res, 200, 'Quiz attempt submitted and evaluated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getAttemptResult = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const attemptId = req.params.attemptId as string;
      const result = await quizService.getAttemptResult(req.user.id, attemptId);
      sendResponse(res, 200, 'Quiz attempt result retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  // =============================================================
  // REATTEMPT REQUESTS
  // =============================================================

  public requestReattempt = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const quizId = req.params.quizId as string;
      const request = await quizService.requestReattempt(req.user.id, quizId, req.body.reason);
      sendResponse(res, 201, 'Reattempt request submitted successfully', request);
    } catch (error) {
      next(error);
    }
  };

  public getStudentReattemptRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const requests = await quizService.getStudentReattemptRequests(req.user.id);
      sendResponse(res, 200, 'Student reattempt requests retrieved successfully', requests);
    } catch (error) {
      next(error);
    }
  };

  public getInstructorReattemptRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const courseId = req.query.courseId as string | undefined;
      const requests = await quizService.getInstructorReattemptRequests(req.user.id, courseId);
      sendResponse(res, 200, 'Reattempt requests retrieved successfully', requests);
    } catch (error) {
      next(error);
    }
  };

  public approveReattemptRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const requestId = req.params.requestId as string;
      const updated = await quizService.approveReattemptRequest(req.user.id, requestId);
      sendResponse(res, 200, 'Reattempt request approved successfully', updated);
    } catch (error) {
      next(error);
    }
  };

  public rejectReattemptRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const requestId = req.params.requestId as string;
      const { feedback } = req.body;
      const updated = await quizService.rejectReattemptRequest(req.user.id, requestId, feedback);
      sendResponse(res, 200, 'Reattempt request rejected', updated);
    } catch (error) {
      next(error);
    }
  };

  public reviewReattemptRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id) throw ApiError.unauthorized('Authentication required');
      const requestId = req.params.requestId as string;
      const { status, instructorFeedback } = req.body;
      const updated = await quizService.reviewReattemptRequest(
        req.user.id,
        requestId,
        status,
        instructorFeedback
      );
      sendResponse(res, 200, `Reattempt request marked as ${status}`, updated);
    } catch (error) {
      next(error);
    }
  };
}

export const quizController = new QuizController();
