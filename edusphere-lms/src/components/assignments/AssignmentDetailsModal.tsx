import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentService } from '../../services/assignmentService';
import { quizService } from '../../services/quizService';
import {
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFile,
  FiTrash2,
  FiSend,
  FiFolder,
  FiAward,
  FiArrowRight,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../../utils/swalAlerts';
import type { StudentAssignmentDetail } from '../../types';

interface AssignmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: StudentAssignmentDetail | null;
  onSubmitAssignment: (
    assignmentId: string,
    fileName: string,
    fileSize: string,
    submissionText?: string,
    storagePath?: string
  ) => Promise<void> | void;
}

export const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSubmitAssignment,
}) => {
  // ─── ALL HOOKS MUST BE CALLED UNCONDITIONALLY ───────────────────────────────
  // React Rules of Hooks: hooks must always run in the same order every render.
  // They are declared here BEFORE any early return.
  const navigate = useNavigate();

  // Active Tab inside modal: 'submission' | 'history'
  const [activeTab, setActiveTab] = useState<'submission' | 'history'>('submission');
  const [isResubmittingMode, setIsResubmittingMode] = useState<boolean>(false);

  // Reattempt Request State
  const [isRequestingAttempt, setIsRequestingAttempt] = useState<boolean>(false);
  const [requestReason, setRequestReason] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [localRequestStatus, setLocalRequestStatus] = useState<string | null>(null);

  // File and Submission State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // ────────────────────────────────────────────────────────────────────────────

  // Early return AFTER all hooks — safe per React Rules of Hooks
  if (!assignment) return null;

  // Derived values that depend on assignment (below the early return is fine
  // because hooks above already executed unconditionally)
  const allowedFileTypes =
    assignment.allowedFileTypes && Array.isArray(assignment.allowedFileTypes) && assignment.allowedFileTypes.length > 0
      ? assignment.allowedFileTypes
      : ['.pdf', '.zip', '.docx', '.txt', '.pptx'];

  const maxAttempts = assignment.maxAttempts || 3;
  const attemptsUsed = assignment.attemptsUsed || assignment.submissionHistory?.length || 0;
  const passingMarks = assignment.passingMarks || 60;
  const latestGrade = assignment.grade;

  // Determine whether any attempt passed
  const isPassed = assignment.submissionHistory?.some(
    (sub) => sub.status === 'graded' && sub.grade !== undefined && sub.grade >= passingMarks
  ) || (assignment.status === 'graded' && latestGrade !== undefined && latestGrade >= passingMarks);

  // Determine whether latest attempt is under review / waiting for grading
  const isWaitingForGrading = assignment.status === 'submitted' || assignment.status === 'under_review';

  // Determine whether student can resubmit
  const hasAttemptsRemaining = attemptsUsed < maxAttempts;
  const canResubmit = !isPassed && !isWaitingForGrading && hasAttemptsRemaining && (attemptsUsed > 0);


  // Validate File Types and Size
  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();

    // Check extension
    const matchesExtension = allowedFileTypes.some((ext) => {
      const cleanExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
      return fileName.endsWith(cleanExt);
    });

    if (!matchesExtension) {
      showErrorAlert(
        'Invalid File',
        `Please select a supported file (${allowedFileTypes.join(', ')}). Selected: ${file.name}`
      );
      return false;
    }

    // Default max size 25MB if unspecified
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showErrorAlert(
        'Invalid File',
        `File size exceeds limit (${assignment.maxFileSize || '25 MB'}). Selected size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
      );
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !submissionText.trim()) {
      showErrorAlert(
        'File Required',
        'Please select a file to submit.'
      );
      return;
    }

    if (selectedFile && !validateFile(selectedFile)) {
      return;
    }

    setIsSubmitting(true);
    try {
      let storagePath = '';
      const fName = selectedFile ? selectedFile.name : 'solution_submission.txt';
      const fSize = selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
        : 'Text Submission';

      // Upload the actual file securely via authenticated backend endpoint
      if (selectedFile) {
        const uploadRes = await assignmentService.uploadSubmissionFile(assignment.id, selectedFile);
        if (uploadRes.success && uploadRes.data?.path) {
          storagePath = uploadRes.data.path;
        } else {
          throw new Error(uploadRes.message || 'Failed to upload assignment file.');
        }
      }

      await onSubmitAssignment(assignment.id, fName, fSize, submissionText, storagePath);

      showSuccessAlert(
        'Assignment Submitted',
        'Your assignment has been submitted successfully.'
      );

      setSelectedFile(null);
      setSubmissionText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err: any) {
      showErrorAlert(
        'Upload Failed',
        err.message || 'Unable to upload your assignment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestExtraAttempt = async () => {
    if (!requestReason.trim() || requestReason.trim().length < 3) {
      showWarningAlert('Reason Required', 'Please provide a clear reason for requesting another attempt.');
      return;
    }
    try {
      setIsSubmittingRequest(true);
      const res = await assignmentService.requestExtraAttempt(assignment.id, requestReason.trim());
      if (res.success) {
        showSuccessAlert(
          'Request Submitted',
          'Your request for an additional attempt has been sent to your instructor for review.'
        );
        setLocalRequestStatus('pending');
        setIsRequestingAttempt(false);
        setRequestReason('');
      } else {
        showErrorAlert('Request Failed', res.message || 'Unable to submit attempt request.');
      }
    } catch (err: any) {
      showErrorAlert('Error', err?.message || 'Failed to submit attempt request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };


  const getStatusBadge = () => {
    if (isWaitingForGrading) {
      return (
        <Badge variant="primary" className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <FiSend className="w-3.5 h-3.5" /> Waiting for Instructor Grading
        </Badge>
      );
    }
    if (isPassed) {
      return (
        <Badge variant="success" className="flex items-center gap-1 text-xs px-2.5 py-1">
          <FiCheckCircle className="w-3.5 h-3.5" /> Assignment Passed ({assignment.grade ?? 0}/{assignment.totalPoints})
        </Badge>
      );
    }
    if (attemptsUsed > 0) {
      return (
        <Badge variant="danger" className="flex items-center gap-1 text-xs px-2.5 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <FiClock className="w-3.5 h-3.5" /> Assignment Failed ({assignment.grade ?? 0}/{assignment.totalPoints})
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <FiClock className="w-3.5 h-3.5" /> Pending Submission
      </Badge>
    );
  };

  const getFileTypeLabel = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={assignment.title}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 py-1">
        {/* Header Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-700 pb-3">
            <div>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block mb-0.5">
                {assignment.courseTitle}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {assignment.title}
              </h3>
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[11px]">Instructor</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {assignment.instructorName || 'Lead Instructor'}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-400 block">Passing Score</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {assignment.passingMarks || 60} / {assignment.totalPoints} Marks
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[11px]">Maximum Score</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {assignment.totalPoints} Marks
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[11px]">Attempts</span>
              <span className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                {attemptsUsed} / {maxAttempts}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('submission');
              setIsResubmittingMode(false);
            }}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'submission'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <FiFileText className="w-4 h-4" />
            <span>Overview & Submission</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setIsResubmittingMode(false);
            }}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <FiClock className="w-4 h-4" />
            <span>Submission History & Feedback</span>
            {attemptsUsed > 0 && (
              <span className="px-1.5 py-0.2 bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 rounded-full text-[10px]">
                {attemptsUsed}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Overview & Submission Form */}
        {activeTab === 'submission' && (
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Description & Instructions */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Assignment Description & Instructions
              </h4>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                {assignment.description}
              </p>
              {assignment.instructions && assignment.instructions.length > 0 && (
                <ul className="space-y-1.5 pt-1 pl-1">
                  {assignment.instructions.map((inst, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-brand-600 shrink-0">•</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Allowed Formats Requirements Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-[11px] text-slate-400 block">Accepted File Formats</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {allowedFileTypes.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Maximum File Size</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {assignment.maxFileSize || '25 MB'}
                </span>
              </div>
            </div>

            {/* If Locked: Render Lock Banner */}
            {assignment.isLocked ? (
              <div className="p-6 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-900 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
                  🔒
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-950 dark:text-amber-100 text-sm">
                    Assignment Submission Locked
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 max-w-md mx-auto">
                    Complete all course lessons before submitting this assignment.
                  </p>
                </div>
                {assignment.totalLessons !== undefined && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <span>Lessons Completed:</span>
                    <span className="font-mono font-bold">
                      {assignment.completedLessons ?? 0} / {assignment.totalLessons}
                    </span>
                  </div>
                )}
              </div>
            ) : isWaitingForGrading && !isResubmittingMode ? (
              /* Awaiting Grading */
              <div className="p-5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                  <FiCheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Waiting for Instructor Grading</span>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Your submission (Attempt #{attemptsUsed}) is currently awaiting review by your instructor. A new attempt cannot be submitted while the current attempt is under review.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                    className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                  >
                    View Submission Details
                  </Button>
                </div>
              </div>
            ) : isPassed && !isResubmittingMode ? (
              /* Already Passed */
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                    <FiAward className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Assignment Passed ({assignment.grade ?? 0}/{assignment.totalPoints} Marks)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200">
                    Passed
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Congratulations! You have successfully passed this assignment. You can now proceed to the course quiz.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await quizService.getStudentCourseQuiz(assignment.courseId);
                        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                          onClose();
                          navigate(`/student/quizzes?courseId=${assignment.courseId}`);
                        } else {
                          showWarningAlert(
                            'Quiz Not Available',
                            'The quiz for this course is not yet published by your instructor.'
                          );
                        }
                      } catch {
                        onClose();
                        navigate(`/student/quizzes?courseId=${assignment.courseId}`);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Continue to Quiz</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                    className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  >
                    View Evaluation & Feedback
                  </Button>
                </div>
              </div>
            ) : attemptsUsed > 0 && !hasAttemptsRemaining && !isResubmittingMode ? (
              /* Maximum Attempts Reached */
              (() => {
                const reqStatus = (localRequestStatus || assignment.attemptRequestStatus || 'none').toLowerCase();
                const reqFeedback = assignment.attemptRequestFeedback;

                if (reqStatus === 'pending') {
                  return (
                    <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                          <FiClock className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>Reattempt Request Pending Instructor Review</span>
                        </div>
                        <Badge variant="warning" className="font-bold">Pending Review</Badge>
                      </div>
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        You have submitted a request for an additional attempt on this assignment. Your instructor is reviewing it. You will be notified once a decision is made.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('history')}
                        className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      >
                        View Feedback History
                      </Button>
                    </div>
                  );
                }

                if (reqStatus === 'rejected') {
                  return (
                    <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm">
                          <FiClock className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>Assignment Failed — Reattempt Request Rejected</span>
                        </div>
                        <Badge variant="danger" className="font-bold">Request Rejected</Badge>
                      </div>
                      <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                        Your request for an additional attempt was reviewed and rejected by your instructor.
                        {reqFeedback && (
                          <span className="block mt-1 font-semibold text-rose-950 dark:text-rose-200">
                            Instructor Feedback: "{reqFeedback}"
                          </span>
                        )}
                        You have exhausted all {maxAttempts} allowed attempts. No further submissions are permitted.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('history')}
                        className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                      >
                        View Feedback History
                      </Button>
                    </div>
                  );
                }

                if (isRequestingAttempt) {
                  return (
                    <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                        <FiSend className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span>Request Another Submission Attempt</span>
                      </div>
                      <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                        Please explain why you need an additional attempt. Your instructor will review your note and can approve an extra submission.
                      </p>
                      <textarea
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        placeholder="Explain why you are requesting another attempt (e.g., reviewed feedback, corrected previous code/answers)..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isSubmittingRequest || !requestReason.trim()}
                          onClick={handleRequestExtraAttempt}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                          {isSubmittingRequest ? 'Submitting...' : 'Submit Request to Instructor'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRequestingAttempt(false)}
                          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm">
                        <FiClock className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Assignment Failed — Maximum attempts reached.</span>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 rounded-lg">
                        {attemptsUsed} / {maxAttempts} Used
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                      You have used all {maxAttempts} of {maxAttempts} allowed submission attempts. You can request an additional attempt from your instructor.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsRequestingAttempt(true)}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
                      >
                        Request Another Attempt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('history')}
                        className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                      >
                        View Feedback History
                      </Button>
                    </div>
                  </div>
                );
              })()
            ) : attemptsUsed > 0 && canResubmit && !isResubmittingMode ? (
              /* Failed With Attempts Remaining -> Show Resubmit Button */
              <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                    <FiClock className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Assignment Failed (Score: {latestGrade ?? 0}/{assignment.totalPoints})</span>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 rounded-lg">
                    Attempts: {attemptsUsed} / {maxAttempts}
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {assignment.attemptRequestStatus === 'approved'
                    ? `Your instructor approved an extra attempt! You can now submit attempt #${attemptsUsed + 1} of ${maxAttempts}.`
                    : `Your previous submission did not meet the passing score (${passingMarks} marks). You have ${maxAttempts - attemptsUsed} attempt(s) remaining.`}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsResubmittingMode(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
                  >
                    Resubmit Assignment (Attempt #{attemptsUsed + 1})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                    className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  >
                    View Instructor Feedback
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal / Resubmission Drop Zone & Form */
              <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {attemptsUsed > 0 ? `Upload Solution File (Attempt #${attemptsUsed + 1} of ${maxAttempts})` : 'Upload Solution File'}
                  </h4>
                  {attemptsUsed > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsResubmittingMode(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                    >
                      Cancel Resubmission
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={allowedFileTypes.join(',')}
                  className="hidden"
                  id="assignment-file-input"
                />

                {/* Drag and Drop Zone or Selected File Preview */}
                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    aria-label="Upload assignment file dropzone"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer space-y-3 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDragOver
                        ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 scale-[0.99]'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 hover:border-brand-500 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-sm">
                      <FiUploadCloud className="w-7 h-7" />
                    </div>

                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        Upload your file
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Drag & drop your file here or{' '}
                        <span className="text-brand-600 dark:text-brand-400 font-bold underline cursor-pointer">
                          Browse Files
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 pt-1">
                        Supported: {allowedFileTypes.join(', ')} (Max {assignment.maxFileSize || '25 MB'})
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Clean File Preview Card */
                  <div className="p-4 sm:p-5 bg-brand-50/90 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 bg-brand-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                        <FiFile className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs truncate">
                          {selectedFile.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-semibold">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold uppercase text-[9px]">
                            {getFileTypeLabel(selectedFile.name)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-lg transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        aria-label="Remove selected file"
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Optional Submission Notes */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Submission Notes or Additional Comments (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter any notes, repository links, or explanation for your instructor..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 pt-3">
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto justify-center"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={!selectedFile || isSubmitting}
                    className="w-full sm:w-auto justify-center bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 font-bold px-6 shadow-md"
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : attemptsUsed > 0 ? (
                      <>
                        <FiSend className="w-4 h-4" />
                        <span>Resubmit Assignment (Attempt #{attemptsUsed + 1})</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        <span>Submit Assignment</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Submission History & Feedback */}
        {activeTab === 'history' && (
          <div className="space-y-4 text-xs">
            {!assignment.submissionHistory || assignment.submissionHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <FiFolder className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  No Submissions Recorded Yet
                </h4>
                <p className="text-[11px] max-w-sm mx-auto">
                  Upload and submit your assignment solution from the "Overview & Submission" tab to record your attempt.
                </p>
              </div>
            ) : (
              assignment.submissionHistory.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4"
                >
                  {/* Submission Row Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          Attempt #{sub.attemptNumber}
                        </span>
                        <Badge variant="primary" className="text-[10px]">
                          {sub.submittedAt}
                        </Badge>
                        {sub.status === 'graded' && sub.grade !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              sub.grade >= (assignment.passingMarks || 60)
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {sub.grade >= (assignment.passingMarks || 60) ? 'Passed' : 'Failed'} ({sub.grade}/{assignment.totalPoints})
                          </span>
                        )}
                        {sub.status !== 'graded' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Waiting for Grading
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        File: {sub.fileName} ({sub.fileSize})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!sub.fileUrl) {
                            showErrorAlert(
                              'No File Attached',
                              'This submission was text-only and has no downloadable file attached.'
                            );
                            return;
                          }
                          try {
                            const res = await assignmentService.getStudentSubmissionFileUrl(sub.id);
                            if (res.success && res.data?.signedUrl) {
                              const a = document.createElement('a');
                              a.href = res.data.signedUrl;
                              a.download = res.data.fileName || sub.fileName || 'submission_file';
                              a.target = '_blank';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            } else {
                              showErrorAlert(
                                'Download Failed',
                                res.message || 'Could not retrieve the submitted file. It may have been removed from storage.'
                              );
                            }
                          } catch (err: any) {
                            showErrorAlert(
                              'Download Failed',
                              err.message || 'Unable to download the submission file.'
                            );
                          }
                        }}
                        className="flex items-center gap-1 py-1 text-[11px]"
                      >
                        <FiDownload className="w-3.5 h-3.5" /> Download File
                      </Button>
                    </div>
                  </div>

                  {/* Instructor Feedback Section */}
                  {sub.feedback ? (() => {
                    const isFeedbackObj = typeof sub.feedback === 'object' && sub.feedback !== null;
                    const comment = isFeedbackObj
                      ? (sub.feedback as any).comment || ''
                      : typeof sub.feedback === 'string'
                      ? sub.feedback
                      : '';
                    const insName = (isFeedbackObj && (sub.feedback as any).instructorName)
                      ? (sub.feedback as any).instructorName
                      : assignment.instructorName || 'Course Instructor';
                    const insAvatar = (isFeedbackObj && (sub.feedback as any).instructorAvatar)
                      ? (sub.feedback as any).instructorAvatar
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
                    const marks = (isFeedbackObj && (sub.feedback as any).marksObtained !== undefined)
                      ? (sub.feedback as any).marksObtained
                      : sub.grade ?? 0;
                    const maxMarks = (isFeedbackObj && (sub.feedback as any).maxMarks !== undefined)
                      ? (sub.feedback as any).maxMarks
                      : assignment.totalPoints || 100;
                    const rubricList = (isFeedbackObj && Array.isArray((sub.feedback as any).rubricBreakdown))
                      ? (sub.feedback as any).rubricBreakdown
                      : null;

                    return (
                      <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                            <img
                              src={insAvatar}
                              alt={insName}
                              className="w-6 h-6 rounded-full object-cover border border-emerald-500"
                            />
                            <span>Instructor Evaluation ({insName})</span>
                          </div>
                          <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-mono">
                            {marks} / {maxMarks} Marks
                          </span>
                        </div>

                        {comment && (
                          <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed font-normal">
                            "{comment}"
                          </p>
                        )}

                        {/* Rubric Breakdown */}
                        {rubricList && rubricList.length > 0 && (
                          <div className="pt-2 space-y-2 border-t border-emerald-200/50 dark:border-emerald-900/50">
                            <span className="font-bold text-[11px] text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                              Grading Rubric Breakdown
                            </span>
                            <div className="space-y-1.5">
                              {rubricList.map((rub: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-[11px] bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40"
                                >
                                  <span className="font-medium">{rub.criterion}</span>
                                  <span className="font-bold font-mono text-emerald-600">
                                    {rub.score} / {rub.maxScore}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex flex-col gap-1 border border-amber-200 dark:border-amber-900">
                      <div className="flex items-center gap-2 font-bold">
                        <FiClock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Assignment submitted successfully. Pending instructor evaluation.</span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400 pl-6">
                        Your submission has been safely recorded. You will be notified when your grade and feedback are published.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
