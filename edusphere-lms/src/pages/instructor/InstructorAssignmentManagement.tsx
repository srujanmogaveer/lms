import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText,
  FiCheckSquare,
  FiClock,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiX,
  FiDownload,
  FiUsers,
  FiLock,
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiHelpCircle,
  FiAlertCircle,
  FiPaperclip,
  FiUploadCloud,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  showSuccessAlert,
  showConfirmAlert
} from '../../utils/swalAlerts';
import {
  type InstructorAssignmentItem,
  type InstructorStudentSubmission,
  type InstructorAssignmentType,
  type InstructorAssignmentStatus,
} from '../../data/instructorAssignmentData';

import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { uploadAssignmentAttachment } from '../../services/storageService';

import { CourseProgressTracker } from '../../components/instructor/CourseProgressTracker';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SubmissionPreviewModal, type SubmissionPreviewData } from '../../components/assignments/SubmissionPreviewModal';

export interface AllowedFileTypeOption {
  ext: string;
  label: string;
  color: string;
}

export const AVAILABLE_FILE_TYPES: AllowedFileTypeOption[] = [
  { ext: '.pdf', label: 'PDF Document', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900' },
  { ext: '.zip', label: 'ZIP Archive', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900' },
  { ext: '.docx', label: 'Word Document', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900' },
  { ext: '.txt', label: 'Plain Text', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900' },
  { ext: '.pptx', label: 'PowerPoint', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' },
];

export const STANDARD_ALLOWED_FILE_TYPES = AVAILABLE_FILE_TYPES.map((t) => t.ext);

export const InstructorAssignmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCourseId = searchParams.get('courseId');

  const paramTab = searchParams.get('tab');

  // Active View Tab: 'list' | 'pending' | 'requests' | 'create' | 'submissions' | 'analytics'
  const [activeTab, setActiveTab] = useState<'list' | 'pending' | 'requests' | 'create' | 'submissions' | 'analytics'>(
    paramTab === 'pending' ? 'pending' : paramTab === 'requests' ? 'requests' : 'list'
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [coursesList, setCoursesList] = useState<any[]>(courseService.getCachedInstructorCourses() || []);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(paramCourseId || 'All');

  // Active target course ID derived with priority: paramCourseId -> selected filter (if not 'All') -> first course
  const activeCourseId =
    paramCourseId ||
    (selectedCourseFilter !== 'All' ? selectedCourseFilter : '') ||
    coursesList[0]?.id ||
    '';

  const currentCourse =
    coursesList.find((c) => c.id === activeCourseId) ||
    (activeCourseId ? courseService.getCachedCourseById(activeCourseId) : null);

  const isPublishedCourse = Boolean(
    currentCourse?.courseStatus === 'Published' ||
    currentCourse?.course_status === 'Published' ||
    currentCourse?.approvalStatus === 'Approved' ||
    currentCourse?.approvalStatus === 'Pending Approval' ||
    currentCourse?.status === 'Published' ||
    currentCourse?.status === 'Pending Approval'
  );

  // Assignments List State (initialized with instant memory cache if available)
  const initialCachedAsgs = activeCourseId
    ? assignmentService.getCachedInstructorAssignments(activeCourseId)
    : null;


  const [assignments, setAssignments] = useState<InstructorAssignmentItem[]>(() => {
    if (initialCachedAsgs && initialCachedAsgs.length > 0) {
      return initialCachedAsgs.map((ba) => ({
        id: ba.id,
        courseId: ba.courseId,
        courseTitle: ba.courseTitle || 'Course',
        title: ba.title,
        description: ba.description || '',
        instructions: (ba.instructions || '').split('\n').filter((i) => i.trim().length > 0),
        maxMarks: ba.maxScore,
        passingMarks: ba.passingScore,
        allowedFileTypes: ['.pdf', '.zip'],
        maxFileSizeMB: 25,
        maxSubmissionAttempts: 3,
        assignmentType: 'Mandatory',
        status: ba.status,
        attachmentUrl: ba.attachmentUrl,
        attachmentFileName: ba.attachmentName,
        attachmentSize: ba.attachmentSize,
        createdAt: new Date(ba.createdAt).toLocaleDateString('en-IN'),
        submissions: [],
      }));
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(!initialCachedAsgs);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Load instructor assignments & courses in parallel
  const loadInstructorData = async () => {
    try {
      if (assignments.length === 0) {
        setIsLoading(true);
      }
      const coursesRes = await courseService.getInstructorCourses();
      let activeCourses = coursesList;
      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCoursesList(coursesRes.data);
        activeCourses = coursesRes.data;
      }

      if (activeCourses.length === 0) {
        setAssignments([]);
        return;
      }

      // Determine courses to fetch assignments for
      let rawAssignments: any[] = [];

      if (!selectedCourseFilter || selectedCourseFilter === 'All') {
        const allRes = await assignmentService.getAllInstructorAssignments();
        if (allRes.success && Array.isArray(allRes.data)) {
          allRes.data.forEach((ba) => {
            rawAssignments.push({
              ba,
              courseId: ba.courseId,
              courseTitle: ba.courseTitle || activeCourses.find((c) => c.id === ba.courseId)?.title || 'Course',
            });
          });
        }
      } else {
        const asgRes = await assignmentService.getInstructorCourseAssignments(selectedCourseFilter);
        if (asgRes.success && Array.isArray(asgRes.data)) {
          asgRes.data.forEach((ba) => {
            rawAssignments.push({
              ba,
              courseId: ba.courseId || selectedCourseFilter,
              courseTitle: ba.courseTitle || activeCourses.find((c) => c.id === (ba.courseId || selectedCourseFilter))?.title || 'Course',
            });
          });
        }
      }

      // Fetch real submissions for all assignments in parallel (settled safely)
      const submissionsResults = await Promise.allSettled(
        rawAssignments.map((item) => assignmentService.getAssignmentSubmissions(item.ba.id))
      );

      const allFetchedAssignments: InstructorAssignmentItem[] = rawAssignments.map((item, idx) => {
        const { ba, courseId, courseTitle } = item;
        const settledResult = submissionsResults[idx];
        const subRes = settledResult.status === 'fulfilled' ? settledResult.value : null;
        const subs: InstructorStudentSubmission[] = (subRes && subRes.success && Array.isArray(subRes.data))
          ? subRes.data.map((s) => {
              const subDate = s.submittedAt ? new Date(s.submittedAt) : new Date();
              const dateStr = subDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'Asia/Kolkata',
              });
              const timeStr = subDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
              }) + ' IST';

              // Extract actual file name from URL or submission text
              let fName = 'Assignment_Submission.pdf';
              if (s.fileUrl) {
                fName = s.fileUrl.split('/').pop() || fName;
              } else if (s.submissionText && s.submissionText.includes('[Attachment: ')) {
                const match = s.submissionText.match(/\[Attachment:\s*([^\](]+)/);
                if (match && match[1]) fName = match[1].trim();
              }

              let status: 'Submitted' | 'Under Review' | 'Graded' | 'Not Submitted' = 'Submitted';
              if (s.status === 'Graded') status = 'Graded';
              else if (s.status === 'Under Review') status = 'Under Review';
              else status = 'Submitted';

              return {
                id: s.id,
                assignmentId: s.assignmentId || ba.id,
                attemptNumber: s.attemptNumber || 1,
                studentId: s.studentId,
                studentName: s.studentName || 'Student',
                studentAvatar: s.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.studentName || 'Student')}&background=6366f1&color=fff`,
                submittedDate: dateStr,
                submittedTimeIST: timeStr,
                fileName: fName,
                fileSize: 'Submitted File',
                fileUrl: s.fileUrl,
                submissionNotes: s.submissionText,
                status,
                marksAwarded: s.score,
                maxMarks: ba.maxScore || 100,
                instructorFeedback: s.feedback,
                gradedAt: s.gradedAt ? new Date(s.gradedAt).toLocaleDateString('en-IN') : undefined,
              };
            })
          : [];

        return {
          id: ba.id,
          courseId,
          courseTitle,
          title: ba.title,
          description: ba.description || '',
          instructions: (ba.instructions || '').split('\n').filter((i: string) => i.trim().length > 0),
          maxMarks: ba.maxScore,
          passingMarks: ba.passingScore,
          allowedFileTypes: ['.pdf', '.zip'],
          maxFileSizeMB: 25,
          maxSubmissionAttempts: ba.maxAttempts || 3,
          assignmentType: 'Mandatory',
          status: ba.status,
          attachmentUrl: ba.attachmentUrl,
          attachmentFileName: ba.attachmentName,
          attachmentSize: ba.attachmentSize,
          createdAt: new Date(ba.createdAt).toLocaleDateString('en-IN'),
          submissions: subs,
        };
      });

      setAssignments(allFetchedAssignments);
    } catch (err: any) {
      showToast(err.message || 'Failed to load assignments.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (paramCourseId && paramCourseId !== selectedCourseFilter) {
      setSelectedCourseFilter(paramCourseId);
    }
  }, [paramCourseId]);

  React.useEffect(() => {
    loadInstructorData();
  }, [selectedCourseFilter]);

  // Reattempt Requests State
  const [attemptRequests, setAttemptRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState<string>('');

  const loadAttemptRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const res = await assignmentService.getInstructorReattemptRequests(
        selectedCourseFilter !== 'All' ? selectedCourseFilter : undefined
      );
      if (res.success && Array.isArray(res.data)) {
        setAttemptRequests(res.data);
      } else {
        setAttemptRequests([]);
      }
    } catch (err: any) {
      console.warn('Failed to load assignment reattempt requests:', err);
      setAttemptRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  React.useEffect(() => {
    loadAttemptRequests();
  }, [selectedCourseFilter]);

  const handleApproveRequest = async (reqItem: any) => {
    try {
      const res = await assignmentService.approveReattemptRequest(reqItem.id);
      if (res.success) {
        showSuccessAlert(
          'Request Approved (+1 Attempt)',
          `Student ${reqItem.studentName} has been granted an extra submission attempt for "${reqItem.assignmentTitle}".`
        );
        await loadAttemptRequests();
        await loadInstructorData();
      } else {
        showToast(res.message || 'Failed to approve request', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to approve attempt request.', 'warning');
    }
  };

  const handleRejectRequest = async () => {
    if (!reviewingRequest) return;
    try {
      const res = await assignmentService.rejectReattemptRequest(reviewingRequest.id, rejectionFeedback);
      if (res.success) {
        showSuccessAlert(
          'Request Rejected',
          `Reattempt request from ${reviewingRequest.studentName} has been rejected.`
        );
        setReviewingRequest(null);
        setRejectionFeedback('');
        await loadAttemptRequests();
      } else {
        showToast(res.message || 'Failed to reject request', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reject attempt request.', 'warning');
    }
  };

  // Selection states for Modals / Editing / Reviewing / Previewing
  const [editingAssignment, setEditingAssignment] = useState<InstructorAssignmentItem | null>(null);
  const [reviewingAssignment, setReviewingAssignment] = useState<InstructorAssignmentItem | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<InstructorStudentSubmission | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<InstructorAssignmentItem | null>(null);
  const [previewSubmissionData, setPreviewSubmissionData] = useState<SubmissionPreviewData | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Grading form state
  const [marksInput, setMarksInput] = useState<number>(90);
  const [feedbackInput, setFeedbackInput] = useState<string>('Well structured solution! Good code readability.');

  // Create / Edit Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    courseId: activeCourseId || '',
    description: '',
    instructions: '1. Complete all exercises.\n2. Submit ZIP archive.',
    maxMarks: 100,
    passingMarks: 70,
    allowedFileTypes: ['.pdf', '.zip'] as string[],
    maxFileSizeMB: 25,
    maxSubmissionAttempts: 3,
    assignmentType: 'Mandatory' as InstructorAssignmentType,
    status: 'Published' as InstructorAssignmentStatus,
    attachmentUrl: '' as string | undefined,
    attachmentFileName: '' as string | undefined,
    attachmentSize: '' as string | undefined,
  });

  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState<File | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Allowed File Types Multi-Select Dropdown State
  const [isFileTypesDropdownOpen, setIsFileTypesDropdownOpen] = useState<boolean>(false);
  const fileTypesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileTypesDropdownRef.current && !fileTypesDropdownRef.current.contains(event.target as Node)) {
        setIsFileTypesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFileType = (ext: string) => {
    const current = assignmentForm.allowedFileTypes || [];
    if (current.includes(ext)) {
      if (current.length === 1) {
        showToast('Please keep at least one allowed file format selected.', 'warning');
        return;
      }
      setAssignmentForm({
        ...assignmentForm,
        allowedFileTypes: current.filter((t) => t !== ext),
      });
    } else {
      setAssignmentForm({
        ...assignmentForm,
        allowedFileTypes: [...current, ext],
      });
    }
  };

  // Dynamic Dashboard Statistics
  const stats = {
    total: assignments.length,
    mandatory: assignments.length,
    pendingReviews: assignments.flatMap((a) => a.submissions).filter((s) => s.status === 'Under Review' || s.status === 'Submitted').length,
    graded: assignments.flatMap((a) => a.submissions).filter((s) => s.status === 'Graded').length,
  };

  // Filtered Assignments
  const filteredAssignments = assignments.filter((asg) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      asg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourseFilter === 'All' || asg.courseId === selectedCourseFilter;
    const matchesStatus = selectedStatusFilter === 'All' || asg.status === selectedStatusFilter;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Actions
  const openCreateForm = () => {
    if (isPublishedCourse) {
      showToast('Assignment structure is locked for published courses.', 'warning');
      return;
    }
    setEditingAssignment(null);
    setSelectedAttachmentFile(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';

    const activeCourseId =
      (selectedCourseFilter !== 'All' ? selectedCourseFilter : paramCourseId) ||
      coursesList[0]?.id ||
      '';
    setAssignmentForm({
      title: '',
      courseId: activeCourseId,
      description: '',
      instructions: '1. Follow requirements.\n2. Submit project files.',
      maxMarks: 100,
      passingMarks: 60,
      allowedFileTypes: ['.pdf', '.zip'],
      maxFileSizeMB: 25,
      maxSubmissionAttempts: 3,
      assignmentType: 'Mandatory',
      status: 'Published',
      attachmentUrl: '',
      attachmentFileName: '',
      attachmentSize: '',
    });
    setIsFileTypesDropdownOpen(false);
    setActiveTab('create');
  };

  const openEditForm = (asg: InstructorAssignmentItem) => {
    if (isPublishedCourse) {
      showToast('Assignment editing is locked for published courses.', 'warning');
      return;
    }
    setEditingAssignment(asg);
    setSelectedAttachmentFile(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';

    setAssignmentForm({
      title: asg.title,
      courseId: asg.courseId,
      description: asg.description,
      instructions: asg.instructions.join('\n'),
      maxMarks: asg.maxMarks,
      passingMarks: asg.passingMarks,
      allowedFileTypes: Array.isArray(asg.allowedFileTypes) && asg.allowedFileTypes.length > 0
        ? asg.allowedFileTypes
        : ['.pdf', '.zip'],
      maxFileSizeMB: asg.maxFileSizeMB,
      maxSubmissionAttempts: asg.maxSubmissionAttempts,
      assignmentType: asg.assignmentType,
      status: asg.status,
      attachmentUrl: asg.attachmentUrl || '',
      attachmentFileName: asg.attachmentFileName || '',
      attachmentSize: asg.attachmentSize || '',
    });
    setIsFileTypesDropdownOpen(false);
    setActiveTab('create');
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds the 15 MB limit. Please choose a smaller file.', 'warning');
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      return;
    }

    const formattedSize =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    setSelectedAttachmentFile(file);
    setAssignmentForm((prev) => ({
      ...prev,
      attachmentFileName: file.name,
      attachmentSize: formattedSize,
    }));
  };

  const handleRemoveAttachment = () => {
    setSelectedAttachmentFile(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    setAssignmentForm((prev) => ({
      ...prev,
      attachmentUrl: '',
      attachmentFileName: '',
      attachmentSize: '',
    }));
  };

  const handleSaveAssignment = async (
    targetStatus?: InstructorAssignmentStatus,
    redirectToQuiz: boolean = false
  ) => {
    if (isPublishedCourse) {
      showToast('Cannot modify assignments on a published course.', 'warning');
      return;
    }
    if (!assignmentForm.title.trim()) {
      showToast('Assignment Title is required.', 'warning');
      return;
    }
    if (!assignmentForm.description.trim()) {
      showToast('Assignment Description is required.', 'warning');
      return;
    }
    if (!assignmentForm.instructions.trim()) {
      showToast('Assignment Instructions are required (one requirement per line).', 'warning');
      return;
    }

    const selectedCourse = coursesList.find((c) => c.id === assignmentForm.courseId);
    const courseId =
      assignmentForm.courseId ||
      (selectedCourseFilter !== 'All' ? selectedCourseFilter : paramCourseId) ||
      coursesList[0]?.id;

    if (!courseId) {
      showToast('Please select a valid course first.', 'warning');
      return;
    }

    const statusToSave = targetStatus || assignmentForm.status;

    try {
      setIsSaving(true);

      let finalAttachmentUrl = assignmentForm.attachmentUrl || undefined;
      let finalAttachmentName = assignmentForm.attachmentFileName || undefined;
      let finalAttachmentSize = assignmentForm.attachmentSize || undefined;

      if (selectedAttachmentFile) {
        setIsUploadingAttachment(true);
        try {
          const uploadRes = await uploadAssignmentAttachment(selectedAttachmentFile, courseId);
          if (uploadRes && uploadRes.url) {
            finalAttachmentUrl = uploadRes.url;
            finalAttachmentName = uploadRes.name;
            finalAttachmentSize = uploadRes.size;
          }
        } catch (uploadErr: any) {
          showToast(`Attachment upload warning: ${uploadErr.message}`, 'warning');
        } finally {
          setIsUploadingAttachment(false);
        }
      }

      if (editingAssignment) {
        // Update backend assignment
        const res = await assignmentService.updateAssignment(editingAssignment.id, {
          title: assignmentForm.title,
          description: assignmentForm.description,
          instructions: assignmentForm.instructions,
          maxScore: Number(assignmentForm.maxMarks) || 100,
          passingScore: Number(assignmentForm.passingMarks) || 60,
          maxAttempts: Number(assignmentForm.maxSubmissionAttempts) || 3,
          attachmentUrl: finalAttachmentUrl,
          attachmentName: finalAttachmentName,
          attachmentSize: finalAttachmentSize,
          status: statusToSave,
        });

        if (res.success && res.data) {
          const ba = res.data;
          setAssignments((prev) =>
            prev.map((a) =>
              a.id === editingAssignment.id
                ? {
                    ...a,
                    title: ba.title,
                    description: ba.description || '',
                    instructions: (ba.instructions || '').split('\n').filter((i) => i.trim().length > 0),
                    maxMarks: ba.maxScore,
                    passingMarks: ba.passingScore,
                    allowedFileTypes: assignmentForm.allowedFileTypes.length > 0 ? assignmentForm.allowedFileTypes : a.allowedFileTypes || ['.pdf', '.zip'],
                    maxSubmissionAttempts: ba.maxAttempts || 3,
                    assignmentType: assignmentForm.assignmentType || a.assignmentType || 'Mandatory',
                    status: ba.status,
                    attachmentUrl: ba.attachmentUrl || finalAttachmentUrl,
                    attachmentFileName: ba.attachmentName || finalAttachmentName,
                    attachmentSize: ba.attachmentSize || finalAttachmentSize,
                  }
                : a
            )
          );
          showSuccessAlert('Success!', `Assignment "${assignmentForm.title}" updated successfully.`);
          if (redirectToQuiz) {
            const quizRoute = courseId ? `/instructor/quizzes?courseId=${courseId}` : '/instructor/quizzes';
            navigate(quizRoute);
          } else {
            setActiveTab('list');
          }
        }
      } else {
        // Create backend assignment
        const res = await assignmentService.createAssignment(courseId, {
          title: assignmentForm.title,
          description: assignmentForm.description,
          instructions: assignmentForm.instructions,
          maxScore: Number(assignmentForm.maxMarks) || 100,
          passingScore: Number(assignmentForm.passingMarks) || 60,
          maxAttempts: Number(assignmentForm.maxSubmissionAttempts) || 3,
          attachmentUrl: finalAttachmentUrl,
          attachmentName: finalAttachmentName,
          attachmentSize: finalAttachmentSize,
          status: statusToSave,
        });

        if (res.success && res.data) {
          const ba = res.data;
          const newAsg: InstructorAssignmentItem = {
            id: ba.id,
            courseId: ba.courseId,
            courseTitle: selectedCourse ? selectedCourse.title : 'Course',
            title: ba.title,
            description: ba.description || '',
            instructions: (ba.instructions || '').split('\n').filter((i) => i.trim().length > 0),
            maxMarks: ba.maxScore,
            passingMarks: ba.passingScore,
            allowedFileTypes: assignmentForm.allowedFileTypes.length > 0 ? assignmentForm.allowedFileTypes : ['.pdf', '.zip'],
            maxFileSizeMB: 25,
            maxSubmissionAttempts: ba.maxAttempts || 3,
            assignmentType: assignmentForm.assignmentType || 'Mandatory',
            status: ba.status,
            attachmentUrl: ba.attachmentUrl || finalAttachmentUrl,
            attachmentFileName: ba.attachmentName || finalAttachmentName,
            attachmentSize: ba.attachmentSize || finalAttachmentSize,
            createdAt: new Date(ba.createdAt).toLocaleDateString('en-IN'),
            submissions: [],
          };
          setAssignments((prev) => [newAsg, ...prev]);
          showSuccessAlert('Assignment Created!', `Assignment "${assignmentForm.title}" created successfully.`);
          if (redirectToQuiz) {
            const quizRoute = courseId ? `/instructor/quizzes?courseId=${courseId}` : '/instructor/quizzes';
            navigate(quizRoute);
          } else {
            setActiveTab('list');
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save assignment', 'warning');
    } finally {
      setIsSaving(false);
      setIsUploadingAttachment(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!reviewingAssignment || !reviewingSubmission) return;

    try {
      const res = await assignmentService.gradeSubmission(reviewingSubmission.id, {
        score: Number(marksInput),
        feedback: feedbackInput,
        status: 'Graded',
      });

      if (res.success) {
        showSuccessAlert('Graded!', `Submission graded: ${marksInput}/${reviewingAssignment.maxMarks}`);
        // Optimistically update assignments state so in-page badges & pending stats update immediately
        setAssignments((prev) =>
          prev.map((asg) => ({
            ...asg,
            submissions: asg.submissions.map((sub) =>
              sub.id === reviewingSubmission.id
                ? {
                    ...sub,
                    status: 'Graded',
                    score: Number(marksInput),
                    feedback: feedbackInput,
                    gradedAt: new Date().toISOString(),
                  }
                : sub
            ),
          }))
        );
        await loadInstructorData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to grade submission.', 'warning');
    }

    setReviewingSubmission(null);
  };

  const handleDeleteAssignment = async (asg: InstructorAssignmentItem) => {
    if (isPublishedCourse) {
      showToast('Published course assignments cannot be deleted.', 'warning');
      return;
    }
    const confirmed = await showConfirmAlert(
      'Delete Assignment',
      `Are you sure you want to delete "${asg.title}"? This action cannot be undone.`,
      'Delete Assignment',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        await assignmentService.deleteAssignment(asg.id);
        setAssignments((prev) => prev.filter((a) => a.id !== asg.id));
        showSuccessAlert('Success!', `Assignment "${asg.title}" deleted.`);
      } catch (err: any) {
        showToast(err.message || 'Failed to delete assignment', 'warning');
      }
    }
  };


  // Helper Badge Renderers
  const renderTypeBadge = (_type?: string) => {
    return (
      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
        <FiLock className="w-3 h-3" /> Mandatory
      </span>
    );
  };

  const renderStatusBadge = (status: InstructorAssignmentStatus) => {
    switch (status) {
      case 'Published':
        return <Badge variant="success">Published</Badge>;
      case 'Draft':
        return <Badge variant="warning">Draft</Badge>;
      case 'Archived':
        return <Badge variant="neutral">Archived</Badge>;
    }
  };

  const renderSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'Graded':
        return <Badge variant="success">Graded</Badge>;
      case 'Under Review':
        return <Badge variant="warning">Under Review</Badge>;
      case 'Submitted':
        return <Badge variant="primary">Submitted</Badge>;
      case 'Late Submission':
        return <Badge variant="danger">Late</Badge>;
      default:
        return <Badge variant="neutral">Not Submitted</Badge>;
    }
  };

  // Check if current course has at least one assignment
  const targetCourseId =
    (activeCourseId && activeCourseId !== 'All' ? activeCourseId : (selectedCourseFilter !== 'All' ? selectedCourseFilter : coursesList[0]?.id)) || '';
  const currentCourseAssignments = assignments.filter(
    (a) => !targetCourseId || a.courseId === targetCourseId
  );
  const hasMandatoryAssignment = currentCourseAssignments.length > 0 || assignments.length > 0;

  const handleSaveAndContinue = () => {
    if (!hasMandatoryAssignment) {
      showToast('Please create at least one Assignment for this course before proceeding to Quiz Management.', 'warning');
      return;
    }
    showToast('Assignments verified! Redirecting to Quiz Management...');
    setTimeout(() => {
      const targetRoute = targetCourseId ? `/instructor/quizzes?courseId=${targetCourseId}` : '/instructor/quizzes';
      navigate(targetRoute);
    }, 300);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Step 4 Progress Tracker */}
      <CourseProgressTracker
        currentStep={4}
        courseId={activeCourseId}
        completedSteps={hasMandatoryAssignment ? [1, 2, 3, 4] : [1, 2, 3]}
      />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-500'
                : toast.type === 'warning'
                ? 'bg-amber-900 border-amber-500'
                : 'bg-slate-900 border-brand-500'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                toast.type === 'success'
                  ? 'bg-emerald-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-brand-400'
              }`}
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory Certificate Rule Banner */}
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiLock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-rose-900 dark:text-rose-200">
              Certificate Eligibility & Progression Rule Enforced
            </h4>
            <p className="text-[11px] text-rose-700 dark:text-rose-300">
              Flow: <strong>Lessons → Mandatory Assignments → Mandatory Quizzes → Certificate Unlocked</strong>. At least 1 Mandatory Assignment is required to unlock Quiz Management and Course Publishing.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSaveAndContinue}
        >
          Save & Continue →
        </Button>
      </div>

      {/* Published / Pending Approval Course Lock Banner */}
      {isPublishedCourse && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs font-medium">
          <FiLock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">
              {currentCourse?.approvalStatus === 'Pending Approval' ? 'Course Under Admin Review (Assignments Locked):' : 'Published Course (Assignments Locked):'}
            </span>{' '}
            {currentCourse?.approvalStatus === 'Pending Approval'
              ? 'Assignment creation, instructions, and passing criteria are locked while under Admin Review.'
              : 'Assignment creation, instructions, and passing scores are locked to protect student submission histories. You can still review and grade student homework in the Submissions tab.'}
          </div>
        </div>
      )}

      {/* 1. Header & Primary Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Assignment Management
            </h1>
            <Badge variant="primary">Instructor Studio</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create mandatory course assignments, evaluate student submissions, and publish grades.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'list' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setActiveTab('list')}
          >
            <FiFileText className="w-4 h-4 mr-2" /> Assignment List
          </Button>

          <Button
            variant={activeTab === 'pending' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setActiveTab('pending')}
            className="relative"
          >
            <FiClock className="w-4 h-4 mr-2" /> Pending Grading
            {stats.pendingReviews > 0 && (
              <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                {stats.pendingReviews}
              </span>
            )}
          </Button>

          <Button
            variant={activeTab === 'requests' ? 'primary' : 'outline'}
            size="md"
            onClick={() => setActiveTab('requests')}
            className="relative"
          >
            <FiHelpCircle className="w-4 h-4 mr-2" /> Attempt Requests
            {attemptRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
                {attemptRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </Button>

          {!isPublishedCourse && (
            <Button variant="primary" size="md" onClick={openCreateForm}>
              <FiPlus className="w-4 h-4 mr-2" /> Create Assignment
            </Button>
          )}
        </div>
      </div>


      {/* 2. Assignment Dashboard Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Assignments</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.total}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
            <FiFileText className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Mandatory Required</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.mandatory}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
            <FiLock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Reviews</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pendingReviews}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <FiClock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Graded Submissions</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.graded}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <FiCheckCircle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ASSIGNMENT LIST & FILTERS */}
      {/* ======================================================== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-96">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search assignment title, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCourseFilter(val);
                    if (val !== 'All') {
                      navigate(`/instructor/assignments?courseId=${val}`, { replace: true });
                    } else {
                      navigate('/instructor/assignments', { replace: true });
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
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Assignments Table View */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Assignment Title</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Assignment Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Submissions</th>
                  <th className="p-4">Maximum Marks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading assignments...
                    </td>
                  </tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No assignments yet. Click "+ Create Assignment" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 max-w-xs">{asg.title}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs">
                          {asg.courseTitle}
                        </div>
                      </td>
                      <td className="p-4">{renderTypeBadge(asg.assignmentType)}</td>
                      <td className="p-4">{renderStatusBadge(asg.status)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setReviewingAssignment(asg);
                            setActiveTab('submissions');
                          }}
                          className="font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                        >
                          <FiUsers className="w-3.5 h-3.5" /> {asg.submissions.length} Submissions
                        </button>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                        {asg.maxMarks} Marks <span className="text-[10px] text-slate-400 font-normal">(Pass: {asg.passingMarks})</span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setReviewingAssignment(asg);
                            setActiveTab('submissions');
                          }}
                          className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950"
                          title="Review Submissions"
                        >
                          <FiCheckSquare className="w-4 h-4" />
                        </button>
                        {isPublishedCourse ? (
                          <span
                            className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md inline-flex items-center gap-1 cursor-not-allowed select-none"
                            title="Published Course: Assignment structure is locked"
                          >
                            <FiLock className="w-3 h-3 text-slate-400" /> Locked
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditForm(asg)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                              title="Edit Assignment"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(asg)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                              title="Delete Assignment"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
      {/* TAB 2: CREATE / EDIT ASSIGNMENT FORM */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingAssignment ? 'Edit Course Assignment' : 'Create Course Assignment'}
              </h2>
              <p className="text-xs text-slate-500">Configure parameters at the Course Level (No module/lesson scope).</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('list')}>
              <FiArrowLeft className="w-4 h-4 mr-1" /> Back to List
            </Button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Full-Stack API Integration & State Management Exercise"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Select Course & Requirement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Course *</label>
                <select
                  value={assignmentForm.courseId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Requirement</label>
                <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold min-h-[38px] select-none">
                  <span className="flex items-center gap-1.5">
                    <FiLock className="w-3.5 h-3.5" /> Mandatory (Required for Completion)
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Standard</span>
                </div>
              </div>
            </div>

            {/* Description & Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description *
              </label>
              <textarea
                rows={2}
                placeholder="Overview of assignment goal..."
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Instructions (One requirement per line) *
              </label>
              <textarea
                rows={3}
                placeholder="1. Build REST API endpoints&#10;2. Add Zod validation schemas&#10;3. Include Postman collection JSON"
                value={assignmentForm.instructions}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Maximum Marks & Passing Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maximum Marks *</label>
                <input
                  type="number"
                  value={assignmentForm.maxMarks}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Passing Marks *</label>
                <input
                  type="number"
                  value={assignmentForm.passingMarks}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, passingMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Allowed File Types, File Size MB & Submission Attempts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Allowed File Types Multi-Select Dropdown */}
              <div className="relative" ref={fileTypesDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Allowed File Types *
                  </label>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                    {assignmentForm.allowedFileTypes.length} Selected
                  </span>
                </div>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsFileTypesDropdownOpen(!isFileTypesDropdownOpen)}
                  className="w-full min-h-[38px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center justify-between gap-2 hover:border-brand-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {assignmentForm.allowedFileTypes.map((ext) => {
                      const typeInfo = AVAILABLE_FILE_TYPES.find((t) => t.ext === ext);
                      return (
                        <span
                          key={ext}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                            typeInfo ? typeInfo.color : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {ext}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFileType(ext);
                            }}
                            className="hover:opacity-75 cursor-pointer ml-0.5 text-xs leading-none"
                            title="Remove"
                          >
                            ×
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-slate-400 shrink-0 ml-1">
                    {isFileTypesDropdownOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isFileTypesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Select File Formats</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setAssignmentForm({
                                ...assignmentForm,
                                allowedFileTypes: AVAILABLE_FILE_TYPES.map((t) => t.ext),
                              })
                            }
                            className="text-[10px] font-bold text-brand-600 hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300 text-[10px]">|</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAssignmentForm({
                                ...assignmentForm,
                                allowedFileTypes: ['.pdf'],
                              })
                            }
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {AVAILABLE_FILE_TYPES.map((type) => {
                          const isSelected = assignmentForm.allowedFileTypes.includes(type.ext);
                          return (
                            <div
                              key={type.ext}
                              onClick={() => toggleFileType(type.ext)}
                              className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors text-xs ${
                                isSelected
                                  ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                />
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${type.color}`}>
                                  {type.ext}
                                </span>
                                <span className="text-[11px]">{type.label}</span>
                              </div>
                              {isSelected && <FiCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsFileTypesDropdownOpen(false)}
                          className="px-3 py-1 bg-brand-600 text-white text-[11px] font-bold rounded-lg hover:bg-brand-700 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maximum File Size (MB)</label>
                <input
                  type="number"
                  value={assignmentForm.maxFileSizeMB}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, maxFileSizeMB: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maximum Submission Attempts</label>
                <select
                  value={assignmentForm.maxSubmissionAttempts < 3 ? 3 : assignmentForm.maxSubmissionAttempts}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, maxSubmissionAttempts: Math.max(3, Number(e.target.value) || 3) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={3}>3 Attempts (Default / Min)</option>
                  <option value={4}>4 Attempts</option>
                  <option value={5}>5 Attempts</option>
                  <option value={10}>10 Attempts</option>
                </select>
              </div>
            </div>

            {/* Attachment (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Attachment / Reference Material (Optional)</span>
                {isUploadingAttachment && (
                  <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold animate-pulse">
                    Uploading attachment...
                  </span>
                )}
              </label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={attachmentInputRef}
                onChange={handleAttachmentChange}
                className="hidden"
                id="instructor-assignment-attachment-input"
              />

              {/* If an attachment is attached or selected */}
              {(selectedAttachmentFile || assignmentForm.attachmentUrl || assignmentForm.attachmentFileName) ? (
                <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0">
                      <FiPaperclip className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedAttachmentFile?.name || assignmentForm.attachmentFileName || 'Attached Reference Document'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{selectedAttachmentFile ? `${(selectedAttachmentFile.size / (1024 * 1024)).toFixed(2)} MB` : assignmentForm.attachmentSize || 'Reference File'}</span>
                        {selectedAttachmentFile && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] rounded font-bold">
                            Ready to upload on Save
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {assignmentForm.attachmentUrl && !selectedAttachmentFile && (
                      <a
                        href={assignmentForm.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1"
                        title="Download / View Attachment"
                      >
                        <FiDownload className="w-3.5 h-3.5 text-brand-600" />
                        <span className="hidden sm:inline">Preview</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (attachmentInputRef.current) attachmentInputRef.current.click();
                      }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1"
                    >
                      <FiUploadCloud className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                      title="Remove Attachment"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* No attachment selected */
                <div
                  onClick={() => {
                    if (attachmentInputRef.current) attachmentInputRef.current.click();
                  }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <FiPaperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Attach Reference Sheet, Starter Code, or Sample Template
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Supports PDF, ZIP, DOCX, Code files, etc. (Max 15MB)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-lg text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors shrink-0"
                  >
                    Choose File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Action Buttons: Save Draft & Publish / Continue to Quiz Management */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setActiveTab('list')} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="md"
              disabled={isSaving}
              onClick={() => handleSaveAssignment('Draft', false)}
              className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSaveAssignment('Published', true)}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save & Continue to Quiz Management'}
            </Button>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB: PENDING GRADING */}
      {/* ======================================================== */}
      {activeTab === 'pending' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FiClock className="w-5 h-5 text-rose-500" /> Pending Grading Roster
              </h2>
              <p className="text-xs text-slate-500">
                All student assignment submissions waiting for instructor review and evaluation.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('list')}>
              <FiArrowLeft className="w-4 h-4 mr-1" /> Back to Assignments
            </Button>
          </div>

          {/* Certificate Reminder Banner */}
          {stats.pendingReviews > 0 && (
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <FiLock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold block">Certificate Generation Reminder</span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    {stats.pendingReviews} {stats.pendingReviews === 1 ? 'student is' : 'students are'} waiting for assignment grading before certificates can be generated.
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast(`Filtered all ${stats.pendingReviews} pending submissions.`)}
                className="bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-xs shrink-0"
              >
                Review Submissions
              </Button>
            </div>
          )}

          {/* Submissions List / Empty State */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {assignments.flatMap((a) =>
              a.submissions
                .filter((s) => s.status === 'Submitted' || s.status === 'Under Review')
                .map((s) => ({ ...s, assignmentTitle: a.title, courseTitle: a.courseTitle, parentAsg: a }))
            ).length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <FiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  All assignment submissions have been graded.
                </h3>
                <p className="text-xs text-slate-500">
                  Great job! There are currently no pending student submissions awaiting review.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Course Name</th>
                    <th className="p-4">Assignment Title</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments
                    .flatMap((a) =>
                      a.submissions
                        .filter((s) => s.status === 'Submitted' || s.status === 'Under Review')
                        .map((s) => ({ ...s, assignmentTitle: a.title, courseTitle: a.courseTitle, parentAsg: a }))
                    )
                    .map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-3">
                            <img
                              src={sub.studentAvatar}
                              alt={sub.studentName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span>{sub.studentName}</span>
                              <span className="block text-[10px] text-slate-400 font-mono">ID: {sub.studentId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {sub.courseTitle}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                          <div>{sub.assignmentTitle}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-extrabold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-md">
                            Attempt #{sub.attemptNumber || 1}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{sub.submittedDate}</div>
                          <span className="text-[10px] text-slate-400">{sub.submittedTimeIST}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="warning" className="flex items-center gap-1 w-fit text-[11px]">
                            <FiClock className="w-3 h-3" /> Waiting for Grading
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPreviewSubmissionData({
                                  submissionId: sub.id,
                                  attemptNumber: sub.attemptNumber || 1,
                                  fileName: sub.fileName || 'Assignment_Submission.pdf',
                                  fileSize: sub.fileSize || 'Submitted File',
                                  studentName: sub.studentName,
                                  studentId: sub.studentId,
                                  courseTitle: sub.courseTitle || 'Course',
                                  assignmentTitle: sub.assignmentTitle || 'Assignment',
                                  submittedDate: sub.submittedDate || 'Submitted',
                                  submittedTimeIST: sub.submittedTimeIST,
                                  fileUrl: sub.fileUrl,
                                  notes: sub.submissionNotes,
                                  contentSnippet: sub.submissionNotes,
                                  status: sub.status,
                                  score: sub.marksAwarded,
                                  maxScore: sub.maxMarks,
                                });
                              }}
                              className="text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 text-xs"
                            >
                              View Submission
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setReviewingAssignment(sub.parentAsg);
                                setReviewingSubmission(sub);
                                setMarksInput(sub.marksAwarded || 90);
                                setFeedbackInput(sub.instructorFeedback || 'Good work on this submission!');
                              }}
                            >
                              Grade Assignment
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ATTEMPT REQUESTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'requests' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FiHelpCircle className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Student Assignment Attempt Requests
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Review student requests for additional assignment attempts after exhausting configured attempt limits.
              </p>
            </div>

            <Badge variant="warning" className="px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {attemptRequests.filter((r) => r.status === 'pending').length} Pending Requests
            </Badge>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {isLoadingRequests ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading attempt requests...</div>
            ) : attemptRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto opacity-75" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No attempt requests found</p>
                <p className="text-slate-400">All student reattempt requests for your assignments are up to date.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Course Name</th>
                      <th className="p-4">Assignment Name</th>
                      <th className="p-4 text-center">Attempts Used</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Request Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attemptRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={req.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.studentName)}&background=6366f1&color=fff`}
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
                          {req.assignmentTitle}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="danger" className="font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            {req.attemptsUsed} / {req.maxAttempts} Used
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                          {req.requestDate || new Date(req.requestedAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4">
                          {req.status === 'pending' && (
                            <Badge variant="warning" className="font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Pending
                            </Badge>
                          )}
                          {req.status === 'approved' && (
                            <Badge variant="success" className="font-bold">
                              Approved (+1 Attempt)
                            </Badge>
                          )}
                          {req.status === 'rejected' && (
                            <Badge variant="danger" className="font-bold">
                              Rejected
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApproveRequest(req)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReviewingRequest(req);
                                  setRejectionFeedback('');
                                }}
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Reject Reattempt Request Modal */}
      <AnimatePresence>
        {reviewingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <FiAlertCircle className="w-5 h-5" />
                  <span>Reject Attempt Request</span>
                </div>
                <button
                  onClick={() => setReviewingRequest(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-600 dark:text-slate-300">
                  Student: <strong>{reviewingRequest.studentName}</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Assignment: <strong>{reviewingRequest.assignmentTitle}</strong>
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Student Reason:</span>
                  <p className="text-slate-700 dark:text-slate-200 italic">"{reviewingRequest.reason}"</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason / Feedback (Optional)
                </label>
                <textarea
                  value={rejectionFeedback}
                  onChange={(e) => setRejectionFeedback(e.target.value)}
                  placeholder="Explain why this request is rejected..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingRequest(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRejectRequest}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* TAB 3: STUDENT SUBMISSIONS & GRADING STUDIO */}
      {/* ======================================================== */}
      {activeTab === 'submissions' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Student Submissions Roster
                </h2>
                {reviewingAssignment && renderTypeBadge(reviewingAssignment.assignmentType)}
              </div>
              <p className="text-xs text-slate-500">
                Course: <strong>{reviewingAssignment?.courseTitle || 'All Courses'}</strong> • Target:{' '}
                <strong>{reviewingAssignment?.title || 'Selected Assignment'}</strong>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('list')}>
              <FiArrowLeft className="w-4 h-4 mr-1" /> Back to Assignments
            </Button>
          </div>

          {/* Submissions Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Student Name, Student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="All">All Submissions</option>
                <option value="Submitted">Submitted (Pending)</option>
                <option value="Graded">Graded</option>
              </select>
            </div>
          </div>

          {/* Submissions List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Submission Status</th>
                  <th className="p-4">Marks</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(!reviewingAssignment ? assignments.flatMap((a) => a.submissions) : reviewingAssignment.submissions)
                  .filter((sub) => {
                    const q = searchQuery.toLowerCase().trim();
                    const matchesSearch =
                      q === '' ||
                      sub.studentName.toLowerCase().includes(q) ||
                      sub.studentId.toLowerCase().includes(q);

                    let matchesStatus = true;
                    if (selectedStatusFilter === 'Submitted') matchesStatus = sub.status === 'Submitted' || sub.status === 'Under Review';
                    if (selectedStatusFilter === 'Graded') matchesStatus = sub.status === 'Graded';

                    return matchesSearch && matchesStatus;
                  })
                  .length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No student submissions found matching current search/filter criteria.
                    </td>
                  </tr>
                ) : (
                  (!reviewingAssignment ? assignments.flatMap((a) => a.submissions) : reviewingAssignment.submissions)
                    .filter((sub) => {
                      const q = searchQuery.toLowerCase().trim();
                      const matchesSearch =
                        q === '' ||
                        sub.studentName.toLowerCase().includes(q) ||
                        sub.studentId.toLowerCase().includes(q);

                      let matchesStatus = true;
                      if (selectedStatusFilter === 'Submitted') matchesStatus = sub.status === 'Submitted' || sub.status === 'Under Review';
                      if (selectedStatusFilter === 'Graded') matchesStatus = sub.status === 'Graded';

                      return matchesSearch && matchesStatus;
                    })
                    .map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-3">
                            <img
                              src={sub.studentAvatar}
                              alt={sub.studentName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <span>{sub.studentName}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                          {sub.studentId}
                        </td>
                        <td className="p-4">
                          {sub.submittedDate ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{sub.submittedDate}</div>
                              <span className="text-[10px] text-slate-400">{sub.submittedTimeIST}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-4">{renderSubmissionStatusBadge(sub.status)}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                          {sub.status === 'Graded' ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {sub.marksAwarded} / {sub.maxMarks}
                            </span>
                          ) : (
                            <span className="text-slate-400">Not Graded</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {sub.status !== 'Not Submitted' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewSubmissionData({
                                    submissionId: sub.id,
                                    fileName: sub.fileName || 'Assignment_Submission.pdf',
                                    fileSize: sub.fileSize || 'Submitted File',
                                    studentName: sub.studentName,
                                    studentId: sub.studentId,
                                    courseTitle: reviewingAssignment?.courseTitle || 'Course',
                                    assignmentTitle: reviewingAssignment?.title || 'Assignment',
                                    submittedDate: sub.submittedDate || 'Submitted',
                                    submittedTimeIST: sub.submittedTimeIST,
                                    fileUrl: sub.fileUrl,
                                    notes: sub.submissionNotes,
                                    contentSnippet: sub.submissionNotes,
                                    status: sub.status,
                                    score: sub.marksAwarded,
                                    maxScore: sub.maxMarks,
                                  });
                                }}
                                className="text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 text-xs"
                              >
                                View Submission
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setReviewingSubmission(sub);
                                  setMarksInput(sub.marksAwarded || 90);
                                  setFeedbackInput(sub.instructorFeedback || 'Good work on this assignment submission!');
                                }}
                              >
                                Grade Assignment
                              </Button>
                            </div>
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
      {/* MODAL: Review & Grade Submission */}
      {/* ======================================================== */}
      <AnimatePresence>
        {reviewingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Grade Assignment Submission
                </h3>
                <button onClick={() => setReviewingSubmission(null)}>
                  <FiX className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Student Information Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-600 dark:text-brand-400">
                  Student Information
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Student Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {reviewingSubmission.studentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Student ID</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {reviewingSubmission.studentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Course Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {reviewingAssignment?.courseTitle || 'Enrolled Course'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Information Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-600 dark:text-brand-400">
                  Assignment Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assignment Title</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {reviewingAssignment?.title || 'Course Assignment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Attempt</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      Attempt #{reviewingSubmission.attemptNumber || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Submission Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {reviewingSubmission.submittedDate || 'Submitted'} {reviewingSubmission.submittedTimeIST}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submission File Section */}
              <div className="p-4 bg-brand-50/50 dark:bg-brand-950/40 rounded-2xl border border-brand-200 dark:border-brand-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                    <FiFileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {reviewingSubmission.fileName || 'Uploaded_Submission_File.pdf'}
                    </h4>
                    <span className="text-[11px] text-slate-400">{reviewingSubmission.fileSize || '3.5 MB'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPreviewSubmissionData({
                        submissionId: reviewingSubmission.id,
                        attemptNumber: reviewingSubmission.attemptNumber || 1,
                        fileName: reviewingSubmission.fileName || 'Assignment_Submission.pdf',
                        fileSize: reviewingSubmission.fileSize || 'Submitted File',
                        studentName: reviewingSubmission.studentName,
                        studentId: reviewingSubmission.studentId,
                        courseTitle: reviewingAssignment?.courseTitle || 'Enrolled Course',
                        assignmentTitle: reviewingAssignment?.title || 'Assignment',
                        submittedDate: reviewingSubmission.submittedDate || 'Submitted',
                        submittedTimeIST: reviewingSubmission.submittedTimeIST,
                        fileUrl: reviewingSubmission.fileUrl,
                        notes: reviewingSubmission.submissionNotes,
                        contentSnippet: reviewingSubmission.submissionNotes,
                        status: reviewingSubmission.status,
                        score: reviewingSubmission.marksAwarded,
                        maxScore: reviewingSubmission.maxMarks,
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-slate-100 transition"
                  >
                    View Submission
                  </button>
                  <button
                    onClick={() => {
                      const fName = reviewingSubmission.fileName || 'Assignment_Submission.pdf';
                      if (
                        reviewingSubmission.fileUrl &&
                        (reviewingSubmission.fileUrl.startsWith('http://') ||
                          reviewingSubmission.fileUrl.startsWith('https://') ||
                          reviewingSubmission.fileUrl.startsWith('blob:'))
                      ) {
                        const a = document.createElement('a');
                        a.href = reviewingSubmission.fileUrl;
                        a.download = fName;
                        a.target = '_blank';
                        a.rel = 'noreferrer noopener';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        showToast(`Downloading "${fName}"`);
                      } else {
                        const content =
                          reviewingSubmission.submissionNotes ||
                          `Submission by ${reviewingSubmission.studentName} for ${reviewingAssignment?.title || 'Assignment'}`;
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        showToast(`Downloading "${fName}"`);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition flex items-center gap-1"
                  >
                    <FiDownload className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>

              {/* Grading Input Fields */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Marks Obtained *
                    </label>
                    <input
                      type="number"
                      max={reviewingSubmission.maxMarks}
                      value={marksInput}
                      onChange={(e) => setMarksInput(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Maximum Marks (Read Only)
                    </label>
                    <input
                      type="number"
                      value={reviewingSubmission.maxMarks}
                      readOnly
                      disabled
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Provide evaluation feedback for the student..."
                  />
                </div>
              </div>

              {/* Action Buttons: Save Grade & Publish Grade */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setReviewingSubmission(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleSaveGrade();
                    showToast(`Draft grade saved for ${reviewingSubmission.studentName}.`, 'info');
                  }}
                  className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                >
                  Save Grade
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleSaveGrade();
                  }}
                >
                  Publish Grade
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: Confirm Delete Assignment */}
      {/* ======================================================== */}
      <AnimatePresence>
        {deletingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <FiTrash2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Assignment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{deletingAssignment.title}"</strong>?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="md" onClick={() => setDeletingAssignment(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="md" onClick={() => deletingAssignment && handleDeleteAssignment(deletingAssignment)}>
                  Yes, Delete Assignment
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: Submission Document & Code Preview */}
      {/* ======================================================== */}
      <SubmissionPreviewModal
        isOpen={Boolean(previewSubmissionData)}
        onClose={() => setPreviewSubmissionData(null)}
        submission={previewSubmissionData}
      />
    </div>
  );
};
