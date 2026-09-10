import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiFileText,
  FiDownload,
  FiAlertCircle,
  FiLoader,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { assignmentService, type BackendSubmission } from '../../services/assignmentService';

export interface SubmissionPreviewData {
  submissionId?: string;
  attemptNumber?: number;
  fileName?: string;
  fileSize?: string;
  studentName?: string;
  studentEmail?: string;
  studentId?: string;
  courseTitle?: string;
  assignmentTitle?: string;
  submittedDate?: string;
  submittedTimeIST?: string;
  fileUrl?: string;
  notes?: string;
  contentSnippet?: string;
  status?: string;
  score?: number;
  maxScore?: number;
  passingScore?: number;
  feedback?: string;
}

interface SubmissionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId?: string | null;
  submission?: SubmissionPreviewData | null;
}

export const SubmissionPreviewModal: React.FC<SubmissionPreviewModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  submission: initialSubmission,
}) => {
  const [submissionData, setSubmissionData] = useState<SubmissionPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF viewer state
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('submission.pdf');

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubmissionData(null);
      setErrorMsg(null);
      setIsLoading(false);
      setPdfSignedUrl(null);
      setPdfLoading(false);
      setPdfError(null);
      return;
    }

    const activeSubId = submissionId || initialSubmission?.submissionId;
    if (!activeSubId) {
      if (initialSubmission) {
        setSubmissionData(initialSubmission);
        setIsLoading(false);
        setErrorMsg(null);
      }
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);
    setPdfSignedUrl(null);
    setPdfError(null);

    if (import.meta.env.DEV) {
      console.log('[SubmissionPreviewModal] Fetching submission ID:', activeSubId);
    }

    assignmentService
      .getInstructorSubmissionById(activeSubId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          const s: BackendSubmission = res.data;
          const subDate = s.submittedAt ? new Date(s.submittedAt) : new Date();
          const dateStr = subDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata',
          });
          const timeStr =
            subDate.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Kolkata',
            }) + ' IST';

          let fName = 'Assignment_Submission.pdf';
          if (s.fileUrl) {
            fName = s.fileUrl.split('/').pop() || fName;
          } else if (s.submissionText && s.submissionText.includes('[Attachment: ')) {
            const match = s.submissionText.match(/\[Attachment:\s*([^\](]+)/);
            if (match && match[1]) fName = match[1].trim();
          }

          if (isMounted) {
            setSubmissionData({
              submissionId: s.id,
              attemptNumber: s.attemptNumber || 1,
              fileName: fName,
              fileSize: 'Submitted File',
              studentName: s.studentName || 'Student',
              studentEmail: s.studentEmail,
              studentId: s.studentId,
              courseTitle: s.courseTitle || 'Course',
              assignmentTitle: s.assignmentTitle || 'Assignment',
              submittedDate: dateStr,
              submittedTimeIST: timeStr,
              fileUrl: s.fileUrl,
              notes: s.submissionText,
              contentSnippet: s.submissionText || undefined,
              status: s.status,
              score: s.score,
              maxScore: s.maxScore || 100,
              passingScore: s.passingScore,
              feedback: s.feedback,
            });
          }

          // Fetch signed URL for PDF preview if there is a file
          if (s.fileUrl && isMounted) {
            setPdfLoading(true);
            setPdfFileName(fName);
            assignmentService
              .getSubmissionFileUrl(s.id)
              .then((urlRes) => {
                if (!isMounted) return;
                if (urlRes.success && urlRes.data?.signedUrl) {
                  setPdfSignedUrl(urlRes.data.signedUrl);
                  if (urlRes.data.fileName) setPdfFileName(urlRes.data.fileName);
                } else {
                  setPdfError(urlRes.message || 'Unable to generate secure preview URL.');
                }
              })
              .catch((err: any) => {
                if (!isMounted) return;
                const specificMessage = err?.response?.data?.message || err?.message || 'Submitted file was not found in Storage.';
                setPdfError(specificMessage);
              })
              .finally(() => {
                if (isMounted) setPdfLoading(false);
              });
          }
        } else {
          setErrorMsg(res.message || 'Submission not found.');
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        const status = err?.response?.status || err?.status;
        if (status === 404) {
          setErrorMsg('Submission not found.');
        } else if (status === 403) {
          setErrorMsg('You are not authorized to view this submission.');
        } else if (status === 401) {
          setErrorMsg('Please log in again.');
        } else {
          setErrorMsg(err.message || 'Unable to retrieve submission. Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, submissionId, initialSubmission]);

  if (!isOpen) return null;

  const currentData = submissionData || initialSubmission;
  const fileName = currentData?.fileName || pdfFileName || 'Assignment_Submission.pdf';
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    if (pdfSignedUrl) {
      const a = document.createElement('a');
      a.href = pdfSignedUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
            style={{ maxHeight: '92vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                  <FiFileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                      Student Submission Viewer
                    </h3>
                    {currentData?.attemptNumber && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 rounded-lg">
                        Attempt #{currentData.attemptNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {currentData?.studentName && currentData?.assignmentTitle
                      ? `${currentData.studentName} — ${currentData.assignmentTitle}`
                      : 'Loading submission...'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Loading State */}
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">Loading submission...</p>
                </div>
              ) : errorMsg ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                    <FiAlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Unable to load submission.</h4>
                    <p className="text-xs text-slate-500">{errorMsg}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                </div>
              ) : currentData ? (
                <>
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                        {currentData.studentName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currentData.studentEmail || `ID: ${currentData.studentId}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Assignment</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                        {currentData.assignmentTitle}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {currentData.courseTitle}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Attempt</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400 block">
                        Attempt #{currentData.attemptNumber || 1}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Submitted</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {currentData.submittedDate}
                      </span>
                      {currentData.submittedTimeIST && (
                        <span className="text-[10px] text-slate-400">{currentData.submittedTimeIST}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Status</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400 block truncate">
                        {currentData.status || 'Submitted'}
                      </span>
                      {currentData.score !== undefined ? (
                        <span className={`text-[10px] font-bold ${(currentData.score ?? 0) >= (currentData.passingScore || 60) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          Score: {currentData.score} / {currentData.maxScore} ({(currentData.score ?? 0) >= (currentData.passingScore || 60) ? 'Passed' : 'Failed'})
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-500 font-semibold">Awaiting Grade</span>
                      )}
                    </div>
                  </div>

                  {/* Submission Notes */}
                  {currentData.notes && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Submission Notes</p>
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                        {currentData.notes}
                      </div>
                    </div>
                  )}

                  {/* PDF / File Viewer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <FiFileText className="w-4 h-4 text-brand-500" />
                        Submitted File
                        {fileName && (
                          <span className="font-mono font-normal text-slate-400 ml-1">{fileName}</span>
                        )}
                      </p>
                      {pdfSignedUrl && (
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          Download
                        </button>
                      )}
                    </div>

                    {pdfLoading ? (
                      <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
                        <FiLoader className="w-5 h-5 text-brand-500 animate-spin" />
                        <span className="text-xs text-slate-500 font-semibold">Loading file preview...</span>
                      </div>
                    ) : pdfError ? (
                      <div className="flex flex-col items-center justify-center h-48 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 gap-3 text-center px-6">
                        <FiAlertCircle className="w-6 h-6 text-rose-500" />
                        <div>
                          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Unable to preview this file.</p>
                          <p className="text-[11px] text-rose-500 mt-0.5">{pdfError}</p>
                        </div>
                      </div>
                    ) : pdfSignedUrl && isPdf ? (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-800">
                        <iframe
                          src={pdfSignedUrl}
                          title="Student Assignment Submission"
                          className="w-full"
                          style={{ height: '480px', border: 'none' }}
                          allow="fullscreen"
                        />
                      </div>
                    ) : pdfSignedUrl && !isPdf ? (
                      <div className="flex flex-col items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
                        <FiFileText className="w-8 h-8 text-slate-400" />
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{fileName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">This file type cannot be previewed inline.</p>
                        </div>
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:underline"
                        >
                          <FiDownload className="w-4 h-4" /> Download File
                        </button>
                      </div>
                    ) : !currentData.fileUrl ? (
                      <div className="flex items-center justify-center h-24 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-400">No file attached to this submission.</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Graded Feedback */}
                  {currentData.feedback && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Instructor Feedback</p>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                        {currentData.feedback}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>

              {pdfSignedUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center gap-2 shadow-md"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download {fileName}</span>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
