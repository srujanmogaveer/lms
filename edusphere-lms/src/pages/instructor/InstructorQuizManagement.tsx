import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHelpCircle,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiArchive,
  FiSearch,
  FiEye,
  FiUsers,
  FiPieChart,
  FiAlertTriangle,
  FiLock,
  FiX,
  FiLayers,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  showSuccessAlert,
  showConfirmAlert,
} from '../../utils/swalAlerts';
import {
  type InstructorQuizItem,
  type InstructorQuizType,
  type InstructorQuizStatus,
  type QuestionBankItem,
  type QuestionType,
} from '../../data/instructorQuizData';
import { CourseProgressTracker } from '../../components/instructor/CourseProgressTracker';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { quizService, type BackendQuiz, type BackendQuizQuestion } from '../../services/quizService';

type ActiveTabType = 'list' | 'create' | 'attempts' | 'analytics';
type SortOption = 'newest' | 'oldest' | 'alphabetical';

export const InstructorQuizManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCourseId = searchParams.get('courseId');

  // Courses list
  const cachedCourses = courseService.getCachedInstructorCourses();
  const [coursesList, setCoursesList] = useState<any[]>(cachedCourses || []);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(paramCourseId || 'All');
  
  // Priority: URL param -> selected filter if not 'All' -> first instructor course
  const activeCourseId =
    paramCourseId ||
    (selectedCourseFilter !== 'All' ? selectedCourseFilter : '') ||
    coursesList[0]?.id ||
    cachedCourses?.[0]?.id ||
    '';

  // Active course object
  const activeCourse = coursesList.find((c) => c.id === activeCourseId) || 
    (activeCourseId ? courseService.getCachedCourseById(activeCourseId) : null);

  const isCoursePublished = Boolean(
    activeCourse &&
    (activeCourse.courseStatus === 'Published' ||
     activeCourse.course_status === 'Published' ||
     activeCourse.approvalStatus === 'Approved' ||
     activeCourse.status === 'Published')
  );

  const isPendingApproval = Boolean(
    activeCourse &&
    !isCoursePublished &&
    (activeCourse.approvalStatus === 'Pending Approval' ||
     activeCourse.status === 'Pending Approval')
  );

  const isSubmitted = isPendingApproval || isCoursePublished;
  const isPublishedCourse = isCoursePublished;


  // Quizzes list state initialized from memory cache for instant render
  const initialCachedQuizzes = activeCourseId ? quizService.getCachedInstructorQuizzes(activeCourseId) : null;
  const [quizzes, setQuizzes] = useState<InstructorQuizItem[]>(() => {
    if (initialCachedQuizzes && initialCachedQuizzes.length > 0) {
      return initialCachedQuizzes.map((bq: BackendQuiz) => ({
        id: bq.id,
        courseId: bq.courseId,
        courseTitle: bq.courseTitle || 'Course',
        title: bq.title,
        description: bq.description || '',
        quizType: bq.quizType,
        questionsCount: bq.questionsCount || (bq.questions ? bq.questions.length : 0),
        passingMarks: bq.passingScore,
        timeLimitMinutes: bq.timeLimitMinutes,
        maxAttempts: bq.maxAttempts,
        randomizeQuestions: bq.randomizeQuestions,
        shuffleOptions: bq.shuffleOptions,
        status: bq.status,
        createdAt: new Date(bq.createdAt).toLocaleDateString('en-IN'),
        totalAttemptsCount: 0,
        questions: (bq.questions || []).map((q: BackendQuizQuestion) => ({
          id: q.id,
          courseId: bq.courseId,
          courseTitle: bq.courseTitle || 'Course',
          type: q.questionType,
          questionText: q.questionText,
          options: (q.options || []).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect ?? false })),
          marks: q.points,
          explanation: q.explanation,
        })),
      }));
    }
    return [];
  });

  const [, setIsLoading] = useState<boolean>(!initialCachedQuizzes);

// Active Tab: 'list' | 'create' | 'attempts' | 'analytics'
  const [activeTab, setActiveTab] = useState<ActiveTabType>('list');

  // Real Attempt Requests State fetched from backend
  const [attemptRequests, setAttemptRequests] = useState<any[]>([]);
  const [, setIsLoadingRequests] = useState<boolean>(false);

  const loadAttemptRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const res = await quizService.getInstructorReattemptRequests();
      if (res.success && Array.isArray(res.data)) {
        setAttemptRequests(res.data);
      } else {
        setAttemptRequests([]);
      }
    } catch {
      setAttemptRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  React.useEffect(() => {
    loadAttemptRequests();
  }, [activeTab, activeCourseId]);

  // Admin approval modal and completion verification state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);
  const [completionSummary, setCompletionSummary] = useState<any>(null);

  // Track latest request to prevent race conditions
  const latestCourseRef = React.useRef<string>(activeCourseId);
  latestCourseRef.current = activeCourseId;

  const checkCourseCompletion = async (cId: string) => {
    if (!cId || cId === 'All') {
      setCompletionSummary(null);
      return null;
    }
    try {
      const res = await courseService.getCourseCompletion(cId);
      if (latestCourseRef.current === cId || !latestCourseRef.current) {
        if (res.success && res.data) {
          setCompletionSummary(res.data);
          return res.data;
        } else {
          setCompletionSummary(null);
        }
      }
    } catch {
      if (latestCourseRef.current === cId || !latestCourseRef.current) {
        setCompletionSummary(null);
      }
    }
    return null;
  };

  React.useEffect(() => {
    if (activeCourseId && activeCourseId !== 'All') {
      checkCourseCompletion(activeCourseId);
    } else {
      setCompletionSummary(null);
    }
  }, [activeCourseId]);

  // Load instructor quizzes & courses from backend in parallel
  const loadInstructorQuizData = async () => {
    try {
      const currentTargetCourse = latestCourseRef.current;
      const [coursesRes, compRes] = await Promise.all([
        courseService.getInstructorCourses(),
        currentTargetCourse && currentTargetCourse !== 'All'
          ? courseService.getCourseCompletion(currentTargetCourse).catch(() => null)
          : Promise.resolve(null),
      ]);

      let currentCourses = coursesList;
      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCoursesList(coursesRes.data);
        currentCourses = coursesRes.data;
        if (coursesRes.data.length > 0) {
          const firstCourseId = coursesRes.data[0]?.id || '';
          setQuizForm((prev) => ({
            ...prev,
            courseId: prev.courseId || paramCourseId || (selectedCourseFilter !== 'All' ? selectedCourseFilter : '') || firstCourseId,
          }));
        }
      }
      if (compRes && compRes.success && compRes.data && latestCourseRef.current === currentTargetCourse) {
        setCompletionSummary(compRes.data);
      }

      if (currentCourses.length === 0) {
        setQuizzes([]);
        return;
      }

      const targetCourseIds =
        selectedCourseFilter && selectedCourseFilter !== 'All'
          ? [selectedCourseFilter]
          : paramCourseId
          ? [paramCourseId]
          : currentCourses.map((c) => c.id);

      // Fetch all course quizzes in parallel
      const quizResults = await Promise.all(
        targetCourseIds.map((cId) => quizService.getInstructorCourseQuizzes(cId))
      );

      // Only apply if the course selection hasn't changed during fetch
      if (latestCourseRef.current === currentTargetCourse) {
        const allFetched: InstructorQuizItem[] = [];

        quizResults.forEach((qRes, idx) => {
          const cId = targetCourseIds[idx];
          if (qRes.success && Array.isArray(qRes.data)) {
            const mapped: InstructorQuizItem[] = qRes.data.map((bq: BackendQuiz) => ({
              id: bq.id,
              courseId: bq.courseId,
              courseTitle: bq.courseTitle || currentCourses.find((c) => c.id === bq.courseId || c.id === cId)?.title || 'Course',
              title: bq.title,
              description: bq.description || '',
              quizType: bq.quizType,
              questionsCount: bq.questionsCount || (bq.questions ? bq.questions.length : 0),
              passingMarks: bq.passingScore,
              timeLimitMinutes: bq.timeLimitMinutes,
              maxAttempts: bq.maxAttempts,
              randomizeQuestions: bq.randomizeQuestions,
              shuffleOptions: bq.shuffleOptions,
              status: bq.status,
              createdAt: new Date(bq.createdAt).toLocaleDateString('en-IN'),
              totalAttemptsCount: 0,
              questions: (bq.questions || []).map((q: BackendQuizQuestion) => ({
                id: q.id,
                courseId: bq.courseId,
                courseTitle: bq.courseTitle || 'Course',
                type: q.questionType,
                questionText: q.questionText,
                options: (q.options || []).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect ?? false })),
                marks: q.points,
                explanation: q.explanation,
              })),
            }));
            allFetched.push(...mapped);
          }
        });

        setQuizzes(allFetched);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Search & Filters State for Quiz List
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  React.useEffect(() => {
    if (paramCourseId && paramCourseId !== selectedCourseFilter) {
      setSelectedCourseFilter(paramCourseId);
    }
  }, [paramCourseId]);

  React.useEffect(() => {
    loadInstructorQuizData();
  }, [selectedCourseFilter, paramCourseId]);

  // Editing & Viewing Modals State
  const [editingQuiz, setEditingQuiz] = useState<InstructorQuizItem | null>(null);
  const [viewingQuiz, setViewingQuiz] = useState<InstructorQuizItem | null>(null);

  // Inline Question Builder State
  const [inlineQuestions, setInlineQuestions] = useState<QuestionBankItem[]>([]);

  // Instructor Quiz Form State
  const [quizForm, setQuizForm] = useState({
    title: '',
    courseId: activeCourseId || '',
    description: '',
    quizType: 'Mandatory' as InstructorQuizType,
    questionsCount: 15,
    passingMarks: 75,
    timeLimitMinutes: 20,
    maxAttempts: 3,
    randomizeQuestions: true,
    shuffleOptions: true,
    status: 'Published' as InstructorQuizStatus,
  });

  // Add Multiple Questions Modal State
  const [isAddQuestionsModalOpen, setIsAddQuestionsModalOpen] = useState<boolean>(false);
  const [numQuestionsToAdd, setNumQuestionsToAdd] = useState<number | string>('');

  const handleAddNewQuestionCard = () => {
    setNumQuestionsToAdd('');
    setIsAddQuestionsModalOpen(true);
  };

  const handleConfirmAddQuestions = () => {
    const parsed = typeof numQuestionsToAdd === 'number' ? numQuestionsToAdd : parseInt(numQuestionsToAdd, 10);
    const count = Math.max(1, Math.min(50, isNaN(parsed) ? 1 : parsed));
    const newQuestions: QuestionBankItem[] = [];

    for (let i = 0; i < count; i++) {
      const qId = `iq-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 6)}-${i + 1}`;
      newQuestions.push({
        id: qId,
        courseId: quizForm.courseId,
        courseTitle: 'Course Quiz Question',
        type: 'Single Answer',
        questionText: '',
        options: [
          { id: `opt-${qId}-a`, text: '', isCorrect: true },
          { id: `opt-${qId}-b`, text: '', isCorrect: false },
          { id: `opt-${qId}-c`, text: '', isCorrect: false },
          { id: `opt-${qId}-d`, text: '', isCorrect: false },
        ],
        fillBlankAnswer: '',
        marks: 10,
      });
    }

    setInlineQuestions((prev) => [...prev, ...newQuestions]);
    setIsAddQuestionsModalOpen(false);
    showToast(`Added ${count} question card${count > 1 ? 's' : ''} to quiz draft.`);
  };

  const handleQuestionTypeChange = (qId: string, newType: QuestionType) => {
    setInlineQuestions(
      inlineQuestions.map((q) => {
        if (q.id === qId) {
          if (newType === 'True or False') {
            return {
              ...q,
              type: newType,
              options: [
                { id: 'opt-tf-1', text: 'True', isCorrect: true },
                { id: 'opt-tf-2', text: 'False', isCorrect: false },
              ],
            };
          }
          if (newType === 'Fill in the Blanks') {
            return {
              ...q,
              type: newType,
              options: [],
              fillBlankAnswer: q.fillBlankAnswer || '',
            };
          }
          if (newType === 'Single Answer' || newType === 'Multiple Answer') {
            const hasOptions = q.options && q.options.length >= 4;
            const defaultOpts = [
              { id: 'opt-a', text: '', isCorrect: true },
              { id: 'opt-b', text: '', isCorrect: false },
              { id: 'opt-c', text: '', isCorrect: false },
              { id: 'opt-d', text: '', isCorrect: false },
            ];
            return {
              ...q,
              type: newType,
              options: hasOptions ? q.options : defaultOpts,
            };
          }
        }
        return q;
      })
    );
  };

  const handleUpdateInlineQuestion = (qId: string, updatedFields: Partial<QuestionBankItem>) => {
    setInlineQuestions(
      inlineQuestions.map((q) => (q.id === qId ? { ...q, ...updatedFields } : q))
    );
  };

  const handleUpdateOptionText = (qId: string, oIdx: number, text: string) => {
    setInlineQuestions(
      inlineQuestions.map((q) => {
        if (q.id === qId) {
          const newOptions = [...q.options];
          newOptions[oIdx] = { ...newOptions[oIdx], text };
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const handleSetSingleCorrectOption = (qId: string, correctIdx: number) => {
    setInlineQuestions(
      inlineQuestions.map((q) => {
        if (q.id === qId) {
          const newOptions = q.options.map((opt, idx) => ({
            ...opt,
            isCorrect: idx === correctIdx,
          }));
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const handleToggleMultipleCorrectOption = (qId: string, oIdx: number) => {
    setInlineQuestions(
      inlineQuestions.map((q) => {
        if (q.id === qId) {
          const newOptions = [...q.options];
          newOptions[oIdx] = { ...newOptions[oIdx], isCorrect: !newOptions[oIdx].isCorrect };
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const handleDeleteInlineQuestion = (qId: string) => {
    setInlineQuestions(inlineQuestions.filter((q) => q.id !== qId));
    showToast('Question removed from quiz draft.');
  };

  const handlePreviewCurrentFormQuiz = () => {
    if (!quizForm.title.trim()) {
      showToast('Please enter a Quiz Title to preview.', 'warning');
      return;
    }
    const selectedCourse = coursesList.find((c) => c.id === quizForm.courseId);

    const tempPreviewQuiz: InstructorQuizItem = {
      id: 'temp-preview',
      courseId: quizForm.courseId,
      courseTitle: selectedCourse ? selectedCourse.title : 'Full-Stack Web Bootcamp',
      title: quizForm.title,
      description: quizForm.description,
      quizType: quizForm.quizType,
      questionsCount: inlineQuestions.length || quizForm.questionsCount,
      passingMarks: quizForm.passingMarks,
      timeLimitMinutes: quizForm.timeLimitMinutes,
      maxAttempts: quizForm.maxAttempts,
      randomizeQuestions: quizForm.randomizeQuestions,
      shuffleOptions: quizForm.shuffleOptions,
      status: quizForm.status,
      createdAt: '04/08/2026',
      totalAttemptsCount: 0,
      questions: inlineQuestions,
    };
    setViewingQuiz(tempPreviewQuiz);
  };

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Dashboard Overview Metrics
  const stats = useMemo(() => {
    const total = quizzes.length;
    const mandatory = quizzes.filter((q) => q.quizType === 'Mandatory').length;
    const optional = quizzes.filter((q) => q.quizType === 'Optional').length;
    const published = quizzes.filter((q) => q.status === 'Published').length;
    const draft = quizzes.filter((q) => q.status === 'Draft').length;

    return { total, mandatory, optional, published, draft };
  }, [quizzes]);

  // Filtered & Sorted Quizzes List
  const filteredQuizzes = useMemo(() => {
    return quizzes
      .filter((q) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCourse = selectedCourseFilter === 'All' || q.courseId === selectedCourseFilter;
        const matchesType = selectedTypeFilter === 'All' || q.quizType === selectedTypeFilter;
        const matchesStatus = selectedStatusFilter === 'All' || q.status === selectedStatusFilter;

        return matchesSearch && matchesCourse && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return a.id.localeCompare(b.id);
        if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
        // Default newest
        return b.id.localeCompare(a.id);
      });
  }, [quizzes, searchQuery, selectedCourseFilter, selectedTypeFilter, selectedStatusFilter, sortBy]);

  // Quiz Form Validation State & Errors
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const formValidation = useMemo(() => {
    const warnings: string[] = [];
    if (!quizForm.title.trim()) warnings.push('Missing Quiz Title.');
    const effectiveCourseId = quizForm.courseId || activeCourseId || coursesList[0]?.id;
    if (!effectiveCourseId) warnings.push('Missing Target Course.');
    if (quizForm.passingMarks < 1 || quizForm.passingMarks > 100) warnings.push('Invalid Passing Marks (Must be 1-100%).');
    return warnings;
  }, [quizForm, activeCourseId, coursesList]);

  // Open creation form
  const openCreateForm = () => {
    if (isPublishedCourse) {
      showToast('Quiz creation is locked for published courses.', 'warning');
      return;
    }
    setEditingQuiz(null);
    setHasAttemptedSubmit(false);
    setInlineQuestions([]);
    const defaultCourseId =
      (selectedCourseFilter && selectedCourseFilter !== 'All' ? selectedCourseFilter : '') ||
      activeCourseId ||
      coursesList[0]?.id ||
      '';

    setQuizForm({
      title: '',
      courseId: defaultCourseId,
      description: '',
      quizType: 'Mandatory',
      questionsCount: 10,
      passingMarks: 70,
      timeLimitMinutes: 15,
      maxAttempts: 3,
      randomizeQuestions: true,
      shuffleOptions: true,
      status: 'Published',
    });
    setActiveTab('create');
  };

  const openEditForm = async (q: InstructorQuizItem) => {
    if (isPublishedCourse) {
      showToast('Quiz editing is locked for published courses.', 'warning');
      return;
    }
    setEditingQuiz(q);
    setHasAttemptedSubmit(false);
    setQuizForm({
      title: q.title,
      courseId: q.courseId,
      description: q.description,
      quizType: q.quizType,
      questionsCount: q.questionsCount,
      passingMarks: q.passingMarks,
      timeLimitMinutes: q.timeLimitMinutes,
      maxAttempts: q.maxAttempts,
      randomizeQuestions: q.randomizeQuestions,
      shuffleOptions: q.shuffleOptions,
      status: q.status,
    });

    try {
      const qRes = await quizService.getQuizQuestions(q.id);
      if (qRes.success && Array.isArray(qRes.data)) {
        const mappedQuestions: QuestionBankItem[] = qRes.data.map((bq: BackendQuizQuestion) => ({
          id: bq.id,
          courseId: q.courseId,
          courseTitle: q.courseTitle,
          type: bq.questionType,
          questionText: bq.questionText,
          options: (bq.options || []).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect ?? false })),
          fillBlankAnswer: typeof bq.correctAnswer === 'string' ? bq.correctAnswer : '',
          marks: bq.points,
          explanation: bq.explanation,
        }));
        setInlineQuestions(mappedQuestions);
      }
    } catch {
      // Fallback
    }

    setActiveTab('create');
  };

  const handleSaveQuiz = async (targetStatus?: InstructorQuizStatus) => {
    if (isPublishedCourse) {
      showToast('Cannot modify quizzes on a published course.', 'warning');
      return;
    }
    if (formValidation.length > 0) {
      setHasAttemptedSubmit(true);
      showToast(formValidation[0], 'warning');
      return;
    }

    const statusToSave = targetStatus || quizForm.status;

    if (statusToSave === 'Published') {
      const confirmed = await showConfirmAlert(
        'Publish Quiz Confirmation',
        'Are you sure you want to publish this quiz?',
        'Publish',
        'Cancel',
        'question'
      );
      if (!confirmed) return;

      // Validate each question strictly when publishing
      if (inlineQuestions.length === 0) {
        showToast('Please add at least one question before publishing the quiz.', 'warning');
        return;
      }

      for (let i = 0; i < inlineQuestions.length; i++) {
        const q = inlineQuestions[i];
        const qNum = i + 1;
        if (!q.questionText || !q.questionText.trim()) {
          showToast(`Question ${qNum}: Question statement is required.`, 'warning');
          return;
        }
        if (!q.marks || q.marks <= 0) {
          showToast(`Question ${qNum}: Marks must be greater than 0.`, 'warning');
          return;
        }

        if (q.type === 'Single Answer') {
          if (!q.options || q.options.length < 2) {
            showToast(`Question ${qNum} (Single Answer): At least 2 options are required.`, 'warning');
            return;
          }
          const hasEmptyOpt = q.options.some((o) => !o.text || !o.text.trim());
          if (hasEmptyOpt) {
            showToast(`Question ${qNum} (Single Answer): All option fields must be filled.`, 'warning');
            return;
          }
          const correctCount = q.options.filter((o) => o.isCorrect).length;
          if (correctCount !== 1) {
            showToast(`Question ${qNum} (Single Answer): Exactly 1 correct answer must be selected.`, 'warning');
            return;
          }
        } else if (q.type === 'Multiple Answer') {
          if (!q.options || q.options.length < 2) {
            showToast(`Question ${qNum} (Multiple Answer): At least 2 options are required.`, 'warning');
            return;
          }
          const hasEmptyOpt = q.options.some((o) => !o.text || !o.text.trim());
          if (hasEmptyOpt) {
            showToast(`Question ${qNum} (Multiple Answer): All option fields must be filled.`, 'warning');
            return;
          }
          const correctCount = q.options.filter((o) => o.isCorrect).length;
          if (correctCount < 1) {
            showToast(`Question ${qNum} (Multiple Answer): At least 1 correct answer must be selected.`, 'warning');
            return;
          }
        } else if (q.type === 'True or False') {
          const correctCount = (q.options || []).filter((o) => o.isCorrect).length;
          if (correctCount !== 1) {
            showToast(`Question ${qNum} (True or False): Exactly 1 correct answer (True or False) must be selected.`, 'warning');
            return;
          }
        } else if (q.type === 'Fill in the Blanks') {
          if (!q.fillBlankAnswer || !q.fillBlankAnswer.trim()) {
            showToast(`Question ${qNum} (Fill in the Blanks): Expected blank answer is required.`, 'warning');
            return;
          }
        }
      }
    }

    const selectedCourse = coursesList.find((c) => c.id === quizForm.courseId);

    setIsSaving(true);
    try {
      if (editingQuiz) {
        // Edit mode
        const res = await quizService.updateQuiz(editingQuiz.id, {
          title: quizForm.title,
          description: quizForm.description,
          quizType: quizForm.quizType,
          passingScore: Number(quizForm.passingMarks),
          timeLimitMinutes: Number(quizForm.timeLimitMinutes),
          maxAttempts: Number(quizForm.maxAttempts),
          randomizeQuestions: quizForm.randomizeQuestions,
          shuffleOptions: quizForm.shuffleOptions,
          status: statusToSave,
        });

        if (res.success && res.data) {
          const updatedInlineQuestions = [...inlineQuestions];
          const newQuestionsIndices: number[] = [];
          const newQuestionsPayloads: any[] = [];
          const updatePromises: Promise<any>[] = [];

          // Separate newly added questions (batch create) from existing questions (concurrent update)
          for (let i = 0; i < updatedInlineQuestions.length; i++) {
            const q = updatedInlineQuestions[i];
            const fallbackOptions = [
              { id: 'opt-1', text: 'Option A', isCorrect: true },
              { id: 'opt-2', text: 'Option B', isCorrect: false },
            ];
            const opts = q.type === 'True or False'
              ? (q.options && q.options.length === 2 ? q.options : [
                  { id: 'opt-tf-1', text: 'True', isCorrect: true },
                  { id: 'opt-tf-2', text: 'False', isCorrect: false },
                ])
              : (q.options && q.options.length > 0 ? q.options : fallbackOptions);

            const correctAns = q.type === 'Fill in the Blanks'
              ? (q.fillBlankAnswer?.trim() || 'Answer')
              : (opts.find((o) => o.isCorrect)?.id || (q.type === 'Multiple Answer' ? opts.filter((o) => o.isCorrect).map((o) => o.id) : opts[0]?.id));

            const safeQuestionText = q.questionText.trim() || `Draft Question ${i + 1}`;

            if (q.id.startsWith('iq-') || q.id.startsWith('ai-q-')) {
              newQuestionsIndices.push(i);
              newQuestionsPayloads.push({
                questionText: safeQuestionText,
                questionType: q.type,
                options: opts,
                correctAnswer: correctAns,
                points: q.marks || 10,
                explanation: q.explanation || '',
                position: i + 1,
              });
            } else {
              updatePromises.push(
                quizService.updateQuestion(q.id, {
                  questionText: safeQuestionText,
                  questionType: q.type,
                  options: opts,
                  correctAnswer: correctAns,
                  points: q.marks || 10,
                  explanation: q.explanation || '',
                })
              );
            }
          }

          // Execute batch creation for new questions and parallel updates for existing ones concurrently
          const tasks: Promise<any>[] = [];
          if (newQuestionsPayloads.length > 0) {
            tasks.push(
              quizService.createQuestionsBatch(editingQuiz.id, newQuestionsPayloads).then((batchRes) => {
                if (batchRes.success && Array.isArray(batchRes.data)) {
                  batchRes.data.forEach((createdQ, idx) => {
                    const origIdx = newQuestionsIndices[idx];
                    if (origIdx !== undefined && updatedInlineQuestions[origIdx]) {
                      updatedInlineQuestions[origIdx] = {
                        ...updatedInlineQuestions[origIdx],
                        id: createdQ.id,
                        options: createdQ.options || updatedInlineQuestions[origIdx].options,
                      };
                    }
                  });
                }
              })
            );
          }
          if (updatePromises.length > 0) {
            tasks.push(Promise.all(updatePromises));
          }

          if (tasks.length > 0) {
            await Promise.all(tasks);
          }

          setInlineQuestions(updatedInlineQuestions);

          const updatedQuizItem: InstructorQuizItem = {
            ...editingQuiz,
            title: quizForm.title,
            courseId: quizForm.courseId,
            courseTitle: selectedCourse ? selectedCourse.title : editingQuiz.courseTitle,
            description: quizForm.description,
            quizType: quizForm.quizType,
            questionsCount: updatedInlineQuestions.length || Number(quizForm.questionsCount) || 10,
            passingMarks: Number(quizForm.passingMarks) || 70,
            timeLimitMinutes: Number(quizForm.timeLimitMinutes) || 15,
            maxAttempts: Number(quizForm.maxAttempts) || 3,
            randomizeQuestions: quizForm.randomizeQuestions,
            shuffleOptions: quizForm.shuffleOptions,
            status: statusToSave,
            questions: updatedInlineQuestions,
          };

          const updated = quizzes.map((q) => (q.id === editingQuiz.id ? updatedQuizItem : q));
          setQuizzes(updated);
          setEditingQuiz(updatedQuizItem);
          setQuizForm((prev) => ({ ...prev, status: statusToSave }));
          showSuccessAlert('Success!', `Quiz "${quizForm.title}" ${statusToSave === 'Draft' ? 'saved as draft' : 'updated'} successfully.`);
        }
      } else {
        // Create mode
        const targetCourseId =
          quizForm.courseId ||
          (selectedCourseFilter !== 'All' ? selectedCourseFilter : '') ||
          activeCourseId ||
          coursesList[0]?.id;

        if (!targetCourseId) {
          showToast('Target course is required. Please select a course.', 'warning');
          return;
        }

        const res = await quizService.createQuiz(targetCourseId, {
          title: quizForm.title.trim(),
          description: quizForm.description,
          quizType: quizForm.quizType,
          passingScore: Number(quizForm.passingMarks),
          timeLimitMinutes: Number(quizForm.timeLimitMinutes),
          maxAttempts: Number(quizForm.maxAttempts),
          randomizeQuestions: quizForm.randomizeQuestions,
          shuffleOptions: quizForm.shuffleOptions,
          status: statusToSave,
        });

        if (res.success && res.data) {
          const createdQuiz = res.data;
          const updatedInlineQuestions = [...inlineQuestions];

          // Format questions for single batch insert
          const questionPayloads = updatedInlineQuestions.map((q, idx) => {
            const fallbackOptions = [
              { id: 'opt-1', text: 'Option A', isCorrect: true },
              { id: 'opt-2', text: 'Option B', isCorrect: false },
            ];
            const opts = q.type === 'True or False'
              ? (q.options && q.options.length === 2 ? q.options : [
                  { id: 'opt-tf-1', text: 'True', isCorrect: true },
                  { id: 'opt-tf-2', text: 'False', isCorrect: false },
                ])
              : (q.options && q.options.length > 0 ? q.options : fallbackOptions);

            const correctAns = q.type === 'Fill in the Blanks'
              ? (q.fillBlankAnswer?.trim() || 'Answer')
              : (opts.find((o) => o.isCorrect)?.id || (q.type === 'Multiple Answer' ? opts.filter((o) => o.isCorrect).map((o) => o.id) : opts[0]?.id));

            return {
              questionText: q.questionText.trim() || `Draft Question ${idx + 1}`,
              questionType: q.type,
              options: opts,
              correctAnswer: correctAns,
              points: q.marks || 10,
              explanation: q.explanation || '',
              position: idx + 1,
            };
          });

          if (questionPayloads.length > 0) {
            const qBatchRes = await quizService.createQuestionsBatch(createdQuiz.id, questionPayloads);
            if (qBatchRes.success && Array.isArray(qBatchRes.data)) {
              qBatchRes.data.forEach((createdQ, idx) => {
                if (updatedInlineQuestions[idx]) {
                  updatedInlineQuestions[idx] = {
                    ...updatedInlineQuestions[idx],
                    id: createdQ.id,
                    options: createdQ.options || updatedInlineQuestions[idx].options,
                  };
                }
              });
            }
          }

          setInlineQuestions(updatedInlineQuestions);

          const newQuizItem: InstructorQuizItem = {
            id: createdQuiz.id,
            courseId: createdQuiz.courseId,
            courseTitle: selectedCourse ? selectedCourse.title : 'Course',
            title: createdQuiz.title,
            description: createdQuiz.description || '',
            quizType: createdQuiz.quizType,
            questionsCount: updatedInlineQuestions.length || 0,
            passingMarks: createdQuiz.passingScore,
            timeLimitMinutes: createdQuiz.timeLimitMinutes,
            maxAttempts: createdQuiz.maxAttempts,
            randomizeQuestions: createdQuiz.randomizeQuestions,
            shuffleOptions: createdQuiz.shuffleOptions,
            status: createdQuiz.status,
            createdAt: new Date().toLocaleDateString('en-IN'),
            totalAttemptsCount: 0,
            questions: updatedInlineQuestions,
          };

          setQuizzes([newQuizItem, ...quizzes]);
          showSuccessAlert('Quiz Created!', `Quiz "${quizForm.title}" ${statusToSave === 'Draft' ? 'saved as draft' : 'created'} successfully!`);
          setEditingQuiz(newQuizItem);
          setQuizForm((prev) => ({ ...prev, status: statusToSave }));
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save quiz', 'warning');
      return;
    } finally {
      setIsSaving(false);
    }

    // Refresh course completion status immediately so the Submit for Admin Approval button and checklist update instantly
    const targetCourse = quizForm.courseId || activeCourseId;
    if (targetCourse && targetCourse !== 'All') {
      await checkCourseCompletion(targetCourse);
    }

    if (statusToSave !== 'Draft') {
      setActiveTab('list');
    }
  };

  const handlePublishDirect = async (quizId: string) => {
    if (isPublishedCourse) {
      showToast('Published course quizzes cannot be modified.', 'warning');
      return;
    }
    try {
      await quizService.updateQuiz(quizId, { status: 'Published' });
      setQuizzes(
        quizzes.map((q) => (q.id === quizId ? { ...q, status: 'Published' as const } : q))
      );
      showSuccessAlert('Success!', 'Quiz published successfully.');
      if (activeCourseId && activeCourseId !== 'All') {
        await checkCourseCompletion(activeCourseId);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to publish quiz', 'warning');
    }
  };

  const handleDeleteQuiz = async (quiz: InstructorQuizItem) => {
    if (isPublishedCourse) {
      showToast('Published course quizzes cannot be deleted.', 'warning');
      return;
    }
    const confirmed = await showConfirmAlert(
      'Delete Quiz',
      `Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`,
      'Delete Quiz',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        await quizService.deleteQuiz(quiz.id);
        setQuizzes(quizzes.filter((q) => q.id !== quiz.id));
        showSuccessAlert('Success!', `Quiz "${quiz.title}" deleted.`);
        if (activeCourseId && activeCourseId !== 'All') {
          await checkCourseCompletion(activeCourseId);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to delete quiz', 'warning');
      }
    }
  };


  const handleApproveRequest = async (req: any) => {
    const confirmed = await showConfirmAlert(
      'Approve additional quiz attempt?',
      `Student ${req.studentName} will receive 1 additional quiz attempt for "${req.quizTitle}".`,
      'Approve (+1)',
      'Cancel',
      'question'
    );

    if (confirmed) {
      try {
        const res = await quizService.approveReattemptRequest(req.id);
        if (res.success) {
          showSuccessAlert('Approved!', `1 additional quiz attempt granted to ${req.studentName}.`);
          loadAttemptRequests();
        } else {
          showToast(res.message || 'Failed to approve request', 'warning');
        }
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Failed to approve request', 'warning');
      }
    }
  };

  const handleRejectRequest = async (req: any) => {
    const confirmed = await showConfirmAlert(
      'Reject reattempt request?',
      `Are you sure you want to reject the additional attempt request from ${req.studentName}?`,
      'Reject Request',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        const res = await quizService.rejectReattemptRequest(req.id, 'Request rejected by instructor.');
        if (res.success) {
          showSuccessAlert('Rejected', `Attempt request rejected for ${req.studentName}.`);
          loadAttemptRequests();
        } else {
          showToast(res.message || 'Failed to reject request', 'warning');
        }
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Failed to reject request', 'warning');
      }
    }
  };

  // Helper status badge render
  const renderStatusBadge = (status: InstructorQuizStatus) => {
    if (status === 'Published') {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <FiCheckCircle className="w-3 h-3" /> Published
        </Badge>
      );
    }
    if (status === 'Archived') {
      return (
        <Badge variant="neutral" className="flex items-center gap-1">
          <FiArchive className="w-3 h-3" /> Archived
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1">
        <FiClock className="w-3 h-3" /> Draft
      </Badge>
    );
  };

  // Dynamic completed steps array
  const completedSteps = React.useMemo(() => {
    const steps: number[] = [];
    if (completionSummary?.courseInfoComplete) steps.push(1);
    if (completionSummary?.curriculumComplete) steps.push(2);
    if (completionSummary?.contentComplete) steps.push(3);
    if (completionSummary?.assignmentsComplete) steps.push(4);
    if (completionSummary?.quizzesComplete) steps.push(5);
    if (isSubmitted) steps.push(6);
    return steps;
  }, [completionSummary, isSubmitted]);

  return (
    <div className="space-y-6 pb-12">
      {/* Step 5 & 6 Progress Tracker */}
      <CourseProgressTracker
        currentStep={isSubmitted ? 6 : 5}
        courseId={activeCourseId}
        completedSteps={completedSteps}
        isLocked={isSubmitted}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
              toast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 text-amber-900 dark:text-amber-200'
                : toast.type === 'info'
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 text-blue-900 dark:text-blue-200'
                : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Success Banner ONLY if course is Pending Approval */}
      {isPendingApproval && (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              ⏳
            </div>
            <div>
              <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-200">
                Pending Admin Approval
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Your course has been submitted successfully and is waiting for admin approval. Course editing is currently locked.
              </p>
            </div>
          </div>
          <Badge variant="warning" className="px-3 py-1.5 text-xs font-bold whitespace-nowrap">
            Status: Pending Approval
          </Badge>
        </div>
      )}

      {/* Course Readiness Breakdown Banner (only for Draft courses that are not yet submitted or published) */}
      {!isSubmitted && completionSummary && (
        <div className={`p-5 rounded-3xl border ${
          completionSummary.courseComplete
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{completionSummary.courseComplete ? '🎉 Course Ready for Submission' : '📋 Course Readiness Checklist'}</span>
                <Badge variant={completionSummary.courseComplete ? 'success' : 'warning'} className="text-[10px]">
                  {completionSummary.courseComplete ? 'All 5 Steps Complete' : 'Incomplete'}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {completionSummary.courseComplete
                  ? 'All sections are complete. You can now submit this course for Admin review and publication.'
                  : 'Complete all required course sections before submitting for Admin approval.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1.5 ${
                completionSummary.courseInfoComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
              }`}>
                {completionSummary.courseInfoComplete ? '✓' : '✗'} 1. Course Info
              </span>

              <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1.5 ${
                completionSummary.curriculumComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
              }`}>
                {completionSummary.curriculumComplete ? '✓' : '✗'} 2. Curriculum
              </span>

              <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1.5 ${
                completionSummary.contentComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
              }`}>
                {completionSummary.contentComplete ? '✓' : '✗'} 3. Lessons
              </span>

              <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1.5 ${
                completionSummary.assignmentsComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
              }`}>
                {completionSummary.assignmentsComplete ? '✓' : '✗'} 4. Assignments
              </span>

              <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1.5 ${
                completionSummary.quizzesComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
              }`}>
                {completionSummary.quizzesComplete ? '✓' : '✗'} 5. Quiz
              </span>
            </div>
          </div>

          {completionSummary.missingItems && completionSummary.missingItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <span className="font-bold shrink-0">Missing Requirements:</span>
              <span>{completionSummary.missingItems.join(' • ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Published / Pending Approval Course Lock Banner */}
      {isSubmitted && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs font-medium">
          <FiLock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">
              {isPendingApproval ? 'Course Under Admin Review (Quizzes Locked):' : 'Published Course (Quizzes Locked):'}
            </span>{' '}
            {isPendingApproval
              ? 'Quiz parameters, passing criteria, and questions are locked while under Admin Review.'
              : 'Quiz parameters, passing criteria, and questions are locked to protect student exam records and certificates. You can view student attempt logs in the Attempt Requests tab.'}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
              <FiHelpCircle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Instructor Quiz Management
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage course-level quizzes, question banks, student attempt histories, and certificate requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Submit for Admin Approval & Quick Action Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            disabled={
              isSubmitted ||
              !activeCourseId ||
              activeCourseId === 'All' ||
              !completionSummary ||
              !completionSummary.courseComplete
            }
            onClick={() => {
              if (!activeCourseId || activeCourseId === 'All') {
                showToast('Please select a specific course to submit for approval.', 'warning');
                return;
              }
              setIsSubmitModalOpen(true);
            }}
            className={`font-bold shadow-lg ${
              isSubmitted
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : !activeCourseId || activeCourseId === 'All' || !completionSummary || !completionSummary.courseComplete
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
            }`}
            title={
              isCoursePublished
                ? 'This course has already been approved and published.'
                : isPendingApproval
                ? 'This course has already been submitted for Admin approval.'
                : !activeCourseId || activeCourseId === 'All'
                ? 'Please select a specific course before submitting.'
                : completionSummary && !completionSummary.courseComplete
                ? 'Complete all required course sections (Course Information, Curriculum, Content, Assignments, Quiz) before submitting for approval.'
                : 'Submit course for Admin review and publication'
            }
          >
            {isCoursePublished
              ? '✓ Course Published'
              : isPendingApproval
              ? '⏳ Pending Admin Approval'
              : !activeCourseId || activeCourseId === 'All'
              ? 'Select a Course to Submit'
              : completionSummary && !completionSummary.courseComplete
              ? '⚠️ Complete All Sections to Submit'
              : '🚀 Submit for Admin Approval'}
          </Button>

          <Button
            variant={activeTab === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('list')}
            className="flex items-center gap-1 text-xs"
          >
            <FiHelpCircle className="w-3.5 h-3.5" /> All Quizzes
          </Button>

          {!isPublishedCourse && (
            <Button
              variant={activeTab === 'create' ? 'primary' : 'outline'}
              size="sm"
              onClick={openCreateForm}
              className="flex items-center gap-1 text-xs"
            >
              <FiPlus className="w-3.5 h-3.5" /> {editingQuiz ? 'Edit Quiz' : 'Create Quiz'}
            </Button>
          )}

          <Button
            variant={activeTab === 'attempts' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('attempts')}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <FiUsers className="w-3.5 h-3.5" />
            <span>Attempt Requests</span>
            {attemptRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {attemptRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </Button>

          <Button
            variant={activeTab === 'analytics' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-1 text-xs"
          >
            <FiPieChart className="w-3.5 h-3.5" /> Analytics
          </Button>
        </div>
      </div>


      {/* Overview Metric Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Quizzes</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.total}</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">Mandatory</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{stats.mandatory}</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Optional</span>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{stats.optional}</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">Published</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.published}</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">Draft</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.draft}</div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: QUIZZES LIST */}
      {/* ======================================================== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Search & Multi-Filter Bar */}
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full lg:w-80">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quiz title or course name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {/* Select Filters & Sort */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCourseFilter(val);
                    if (val !== 'All') {
                      navigate(`/instructor/quizzes?courseId=${val}`, { replace: true });
                    } else {
                      navigate('/instructor/quizzes', { replace: true });
                    }
                  }}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="All">All Courses</option>
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Mandatory">Mandatory</option>
                  <option value="Optional">Optional</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none font-medium"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="alphabetical">Sort: Title (A-Z)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Quizzes Table View */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Quiz Title</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Total Questions</th>
                  <th className="p-4">Passing Marks</th>
                  <th className="p-4">Time Limit</th>
                  <th className="p-4">Max Attempts</th>
                  <th className="p-4">Quiz Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuizzes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No quizzes found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {quiz.title}
                      </td>
                      <td className="p-4 text-brand-600 dark:text-brand-400 font-semibold max-w-xs truncate">
                        {quiz.courseTitle}
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                        {quiz.questionsCount} Qs
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{quiz.passingMarks}%</span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {quiz.timeLimitMinutes} mins
                      </td>
                      <td className="p-4 text-slate-500">
                        {quiz.maxAttempts} Attempts
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={quiz.quizType === 'Mandatory' ? 'primary' : 'neutral'}
                          className="text-[10px] font-bold"
                        >
                          {quiz.quizType}
                        </Badge>
                      </td>
                      <td className="p-4">{renderStatusBadge(quiz.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingQuiz(quiz)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Preview Quiz"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>

                          {isPublishedCourse ? (
                            <span
                              className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md inline-flex items-center gap-1 cursor-not-allowed select-none"
                              title="Published Course: Quiz structure is locked"
                            >
                              <FiLock className="w-3 h-3 text-slate-400" /> Locked
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditForm(quiz)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Quiz"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>

                              {quiz.status !== 'Published' && (
                                <button
                                  onClick={() => handlePublishDirect(quiz.id)}
                                  className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Publish Quiz"
                                >
                                  <FiCheckCircle className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteQuiz(quiz)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Delete Quiz"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CREATE / EDIT QUIZ & INLINE QUESTIONS */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Validation Warnings if any (only shown after submit attempt) */}
          {hasAttemptedSubmit && formValidation.length > 0 && (
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <FiAlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Validation Checklist:</span>
              </div>
              <ul className="list-disc list-inside text-amber-700 dark:text-amber-400 text-[11px] space-y-0.5 pl-2">
                {formValidation.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {editingQuiz ? 'Edit Quiz & Question Bank' : 'Create New Course Quiz'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure assessment parameters, timer constraints, passing threshold, and questions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewCurrentFormQuiz}
                  className="flex items-center gap-1 text-xs"
                >
                  <FiEye className="w-3.5 h-3.5" /> Preview
                </Button>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 14 App Router & Server Actions Exam"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Course *
                </label>
                <select
                  value={quizForm.courseId || activeCourseId || coursesList[0]?.id || ''}
                  onChange={(e) => setQuizForm({ ...quizForm, courseId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                >
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quiz Description & Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe concepts tested in this assessment..."
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quiz Type
                </label>
                <select
                  value={quizForm.quizType}
                  onChange={(e) => setQuizForm({ ...quizForm, quizType: e.target.value as InstructorQuizType })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Mandatory">Mandatory (Required for Completion Certificate)</option>
                  <option value="Optional">Optional (Practice Quiz)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Passing Marks (% Required) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quizForm.passingMarks}
                  onChange={(e) => setQuizForm({ ...quizForm, passingMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={quizForm.timeLimitMinutes}
                  onChange={(e) => setQuizForm({ ...quizForm, timeLimitMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Attempts Allowed
                </label>
                <input
                  type="number"
                  min={1}
                  value={quizForm.maxAttempts}
                  onChange={(e) => setQuizForm({ ...quizForm, maxAttempts: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={quizForm.randomizeQuestions}
                    onChange={(e) => setQuizForm({ ...quizForm, randomizeQuestions: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Randomize Question Order</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={quizForm.shuffleOptions}
                    onChange={(e) => setQuizForm({ ...quizForm, shuffleOptions: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Shuffle Answer Options</span>
                </label>
              </div>
            </div>

            {/* Inline Question Authoring Section */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <FiHelpCircle className="w-4 h-4 text-purple-600" /> Inline Question Bank
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Total Questions: <strong className="text-purple-600 font-extrabold">{inlineQuestions.length}</strong> (Supports: Single Answer, Multiple Answer, True or False, Fill in the Blanks)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddNewQuestionCard}
                    className="flex items-center gap-1 text-xs font-bold bg-white dark:bg-slate-900"
                  >
                    <FiPlus className="w-4 h-4" /> Add Question Card
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              {inlineQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                    <FiHelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      0 Question Cards Added
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click below to choose how many question cards you want to add to this quiz.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddNewQuestionCard}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    <FiPlus className="w-4 h-4 mr-1" /> Add Question Cards
                  </Button>
                </div>
              ) : (
                inlineQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 bg-slate-50/80 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4 text-xs shadow-sm"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-b border-slate-200/60 dark:border-slate-700/60 pb-3 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Question Type *
                      </label>
                      <select
                        value={q.type}
                        onChange={(e) => handleQuestionTypeChange(q.id, e.target.value as QuestionType)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                      >
                        <option value="Single Answer">Single Answer</option>
                        <option value="Multiple Answer">Multiple Answer</option>
                        <option value="Fill in the Blanks">Fill in the Blanks</option>
                        <option value="True or False">True or False</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Marks / Points
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={q.marks}
                        onChange={(e) => handleUpdateInlineQuestion(q.id, { marks: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <span>Question {idx + 1}</span>
                        <Badge variant="primary" className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px]">
                          {q.marks} Pts
                        </Badge>
                      </span>
                      <button
                        onClick={() => handleDeleteInlineQuestion(q.id)}
                        className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/80 border border-rose-200 dark:border-rose-900 flex items-center gap-1 text-xs font-bold transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Remove Question
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Question Statement *
                    </label>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleUpdateInlineQuestion(q.id, { questionText: e.target.value })}
                      placeholder={`Enter question ${idx + 1} text...`}
                      className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  {/* Single Answer Radio */}
                  {q.type === 'Single Answer' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Options & Select 1 Correct Answer *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                              opt.isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`singleRadio-${q.id}`}
                              checked={opt.isCorrect}
                              onChange={() => handleSetSingleCorrectOption(q.id, oIdx)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              {String.fromCharCode(65 + oIdx)}:
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleUpdateOptionText(q.id, oIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)} text...`}
                              className="w-full text-xs bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-brand-500 px-1 py-0.5 text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multiple Answer Checkbox */}
                  {q.type === 'Multiple Answer' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Options & Select Multiple Correct Answers (At least 1) *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                              opt.isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={opt.isCorrect}
                              onChange={() => handleToggleMultipleCorrectOption(q.id, oIdx)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              {String.fromCharCode(65 + oIdx)}:
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleUpdateOptionText(q.id, oIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)} text...`}
                              className="w-full text-xs bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-brand-500 px-1 py-0.5 text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* True or False */}
                  {q.type === 'True or False' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Select Correct Answer (True or False) *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(q.options && q.options.length === 2 ? q.options : [
                          { id: 'opt-tf-1', text: 'True', isCorrect: true },
                          { id: 'opt-tf-2', text: 'False', isCorrect: false },
                        ]).map((opt, oIdx) => (
                          <label
                            key={opt.id}
                            className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer ${
                              opt.isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-extrabold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`tfRadio-${q.id}`}
                              checked={opt.isCorrect}
                              onChange={() => handleSetSingleCorrectOption(q.id, oIdx)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-sm font-bold">{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fill in the Blanks */}
                  {q.type === 'Fill in the Blanks' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Expected Blank Answer *
                      </label>
                      <input
                        type="text"
                        value={q.fillBlankAnswer || ''}
                        onChange={(e) => handleUpdateInlineQuestion(q.id, { fillBlankAnswer: e.target.value })}
                        placeholder="Enter the exact correct word / phrase..."
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => setActiveTab('list')}
                className="text-xs"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="md"
                  disabled={isSaving}
                  onClick={() => handleSaveQuiz('Draft')}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save as Draft'}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  onClick={() => handleSaveQuiz('Published')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Submitting...' : 'Save & Submit Quiz'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ATTEMPT REQUESTS */}
      {/* ======================================================== */}
      {activeTab === 'attempts' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-brand-600" />
                <span>Student Quiz Attempt Requests</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review student requests for additional quiz attempts after exhausting the standard attempt limit.
              </p>
            </div>

            <Badge variant="warning" className="px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {attemptRequests.filter((r) => r.status === 'pending').length} Pending Requests
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Course Name</th>
                  <th className="p-4">Quiz Name</th>
                  <th className="p-4 text-center">Attempts Used</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attemptRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No quiz attempt requests found.
                    </td>
                  </tr>
                ) : (
                  attemptRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={req.studentAvatar}
                            alt={req.studentName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{req.studentName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {req.studentId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-brand-600 dark:text-brand-400 max-w-xs truncate">
                        {req.courseTitle}
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {req.quizTitle}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="danger" className="font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {req.attemptsUsed}/{req.maxAttempts} Used
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {req.requestDate}
                      </td>
                      <td className="p-4">
                        {req.status === 'pending' && (
                          <Badge variant="warning" className="font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Pending</Badge>
                        )}
                        {req.status === 'approved' && (
                          <Badge variant="success" className="font-bold">Approved (+1 Attempt)</Badge>
                        )}
                        {req.status === 'rejected' && (
                          <Badge variant="danger" className="font-bold">Rejected</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveRequest(req)}
                              className="text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                              Approve (+1)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(req)}
                              className="text-[11px] py-1 px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200 font-bold"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 4: QUIZ ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Attempts Recorded</span>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                120
              </div>
              <p className="text-xs text-slate-500 mt-1">Across all published quizzes.</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Pass Rate</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                84.2%
              </div>
              <p className="text-xs text-slate-500 mt-1">Passing score benchmark: ≥ 70%.</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Attempt Appeals</span>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {attemptRequests.filter((r) => r.status === 'pending').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Students needing attempt reset.</p>
            </Card>
          </div>
        </div>
      )}



      {/* Quiz Preview Modal */}
      {viewingQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-600 dark:text-purple-400">
                  {viewingQuiz.quizType} Assessment Preview
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {viewingQuiz.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingQuiz(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Passing Score</span>
                <strong className="text-emerald-600 font-bold">{viewingQuiz.passingMarks}%</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Time Limit</span>
                <strong className="text-brand-600 font-bold">{viewingQuiz.timeLimitMinutes} Mins</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Max Attempts</span>
                <strong className="text-slate-900 dark:text-slate-100 font-bold">{viewingQuiz.maxAttempts}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Questions</span>
                <strong className="text-purple-600 font-bold">{viewingQuiz.questions?.length || viewingQuiz.questionsCount}</strong>
              </div>
            </div>

            {viewingQuiz.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                "{viewingQuiz.description}"
              </p>
            )}

            <div className="space-y-4">
              {(viewingQuiz.questions || []).map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      Q{idx + 1}. {q.questionText}
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      {q.type} • {q.marks} Pts
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {q.options?.map((opt, oIdx) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-xl border flex items-center gap-2 ${
                          opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs">{String.fromCharCode(65 + oIdx)}.</span>
                        <span>{opt.text}</span>
                        {opt.isCorrect && (
                          <span className="ml-auto text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    ))}

                    {q.fillBlankAnswer && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-900 dark:text-emerald-200 font-bold">
                        Blank Solution: "{q.fillBlankAnswer}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setViewingQuiz(null)}>
                Close Preview
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Multiple Questions Modal */}
      {isAddQuestionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FiLayers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Add Question Cards
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Specify the number of question cards to add.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddQuestionsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  How many question cards?
                </label>
                
                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumQuestionsToAdd(num)}
                      className={`py-2 px-2.5 rounded-xl font-extrabold text-xs transition-all border ${
                        numQuestionsToAdd === num
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>

                {/* Custom Number Input */}
                <div className="space-y-1">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={numQuestionsToAdd}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setNumQuestionsToAdd('');
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setNumQuestionsToAdd(Math.min(50, Math.max(1, parsed)));
                        }
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter number (e.g. 5)"
                    autoFocus
                  />
                  <div className="text-center text-[11px] text-slate-400">
                    Min 1 • Max 50 cards
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddQuestionsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAddQuestions}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
              >
                <FiPlus className="w-4 h-4" /> Add {Number(numQuestionsToAdd) || 1} {Number(numQuestionsToAdd) === 1 ? 'Card' : 'Cards'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Admin Approval Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-5"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              🚀
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Submit Course for Admin Approval?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                By submitting, your course status will change to <span className="font-bold text-amber-600">Pending Approval</span>. Course editing will be locked until the Admin completes the review.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-left text-xs space-y-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                Course Readiness Checklist:
              </div>
              <p className="flex items-center gap-2">
                <span className={completionSummary?.courseInfoComplete !== false ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {completionSummary?.courseInfoComplete !== false ? '✓' : '✗'}
                </span>
                <span><strong>Step 1:</strong> Course Details Completed</span>
              </p>
              <p className="flex items-center gap-2">
                <span className={completionSummary?.curriculumComplete !== false ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {completionSummary?.curriculumComplete !== false ? '✓' : '✗'}
                </span>
                <span><strong>Step 2:</strong> Curriculum Built ({completionSummary?.modulesCount || 0} Modules)</span>
              </p>
              <p className="flex items-center gap-2">
                <span className={completionSummary?.contentComplete !== false ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {completionSummary?.contentComplete !== false ? '✓' : '✗'}
                </span>
                <span><strong>Step 3:</strong> Lesson Content Uploaded ({completionSummary?.lessonsCount || 0} Lessons)</span>
              </p>
              <p className="flex items-center gap-2">
                <span className={completionSummary?.assignmentsComplete !== false ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {completionSummary?.assignmentsComplete !== false ? '✓' : '✗'}
                </span>
                <span><strong>Step 4:</strong> Assignments Created</span>
              </p>
              <p className="flex items-center gap-2">
                <span className={completionSummary?.quizzesComplete !== false ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {completionSummary?.quizzesComplete !== false ? '✓' : '✗'}
                </span>
                <span><strong>Step 5:</strong> Quizzes Created & Published</span>
              </p>

              {completionSummary?.missingItems && completionSummary.missingItems.length > 0 && (
                <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-[11px] text-rose-700 dark:text-rose-300">
                  <div className="font-bold mb-1">Missing Requirements:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {completionSummary.missingItems.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmittingApproval}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={isSubmittingApproval || (completionSummary && !completionSummary.courseComplete)}
                onClick={async () => {
                  try {
                    setIsSubmittingApproval(true);
                    const res = await courseService.submitCourseForApproval(activeCourseId);
                    if (res.success) {
                      setCoursesList((prev) =>
                        prev.map((c) =>
                          c.id === activeCourseId
                            ? { ...c, approvalStatus: 'Pending Approval', status: 'Pending Approval' }
                            : c
                        )
                      );
                      setIsSubmitModalOpen(false);
                      showSuccessAlert(
                        'Submitted for Approval!',
                        'Course submitted successfully and is waiting for Admin approval.'
                      );
                      setTimeout(() => {
                        navigate('/instructor/courses');
                      }, 1000);
                    }
                  } catch (err: any) {
                    showToast(err.message || 'Failed to submit course for approval', 'warning');
                  } finally {
                    setIsSubmittingApproval(false);
                  }
                }}
              >
                {isSubmittingApproval ? 'Submitting...' : 'Confirm Submission'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
