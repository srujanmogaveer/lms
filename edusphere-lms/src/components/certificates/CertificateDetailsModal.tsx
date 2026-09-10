import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAward,
  FiLock,
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiChevronRight,
  FiDownload,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import type { StudentCertificateDetail } from '../../types';
import { downloadCertificatePdf } from '../../utils/certificatePdfGenerator';

interface CertificateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: StudentCertificateDetail | null;
  onOpenPreview: (certificate: StudentCertificateDetail) => void;
}

export const CertificateDetailsModal: React.FC<CertificateDetailsModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onOpenPreview,
}) => {
  const navigate = useNavigate();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadDirect = async () => {
    if (!certificate) return;
    try {
      setIsDownloading(true);
      await downloadCertificatePdf(certificate);
    } catch (err: any) {
      alert(err.message || 'Unable to download certificate. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!certificate) return null;

  const {
    studentName,
    courseTitle,
    courseCategory,
    instructorName,
    certificateCode,
    verificationUrl,
    status,
    requirements,
    learningHours,
  } = certificate;

  const {
    lessonsCompletionPercent,
    assignmentsCompletionPercent,
    quizzesPassPercent,
    overallProgressPercent,
  } = requirements;

  const isUnlocked = (status === 'earned' || status === 'eligible') && overallProgressPercent === 100;

  const getStatusBadge = () => {
    switch (status) {
      case 'earned':
        return (
          <Badge variant="success" className="flex items-center gap-1 font-bold">
            <FiAward className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Certificate Issued & Verified
          </Badge>
        );
      case 'eligible':
        return (
          <Badge variant="success" className="flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Certificate Eligible (Auto-Generated)
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="flex items-center gap-1 font-bold">
            <FiLock className="w-3.5 h-3.5" /> Locked: Final Quiz & Assessment Passing Required
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="flex items-center gap-1 font-bold">
            <FiLock className="w-3.5 h-3.5" /> Locked
          </Badge>
        );
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Credential Requirements Details"
    >
      <div className="space-y-6 py-2">
        {/* Header Summary Box */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/60 dark:border-slate-700 pb-3">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {courseCategory}
            </span>

            {getStatusBadge()}
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {courseTitle}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Recipient</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{studentName}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Instructor</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{instructorName}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Certificate ID</span>
              <span className="font-bold text-brand-600 font-mono">{certificateCode}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Study Time</span>
              <span className="font-bold text-emerald-600 font-mono">{learningHours} Hours</span>
            </div>
          </div>
        </div>

        {/* Detailed Requirements Progress Checklist */}
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-slate-100">
            <span>Course Graduation Criteria Checklist</span>
            <span className={isUnlocked ? 'text-emerald-600 font-mono text-sm' : 'text-amber-600 font-mono text-sm'}>
              {overallProgressPercent}% Complete
            </span>
          </div>

          <ProgressBar progress={overallProgressPercent} color={isUnlocked ? 'emerald' : 'amber'} size="md" />

          <div className="space-y-2 pt-2 text-xs">
            {/* 1. Lessons Checklist */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle className={`w-4 h-4 ${lessonsCompletionPercent === 100 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  1. Video Lectures & Reading Modules
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {lessonsCompletionPercent}%
              </span>
            </div>

            {/* 2. Assignments Checklist */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle className={`w-4 h-4 ${assignmentsCompletionPercent === 100 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  2. Mandatory Laboratory Assignments
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {assignmentsCompletionPercent}%
              </span>
            </div>

            {/* 3. Quizzes Checklist */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle className={`w-4 h-4 ${quizzesPassPercent === 100 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  3. Mandatory Knowledge Verification Quizzes
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {quizzesPassPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Verification URL Footer Box */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-500 shrink-0">Verification Link:</span>
            <span className="font-mono text-brand-600 dark:text-brand-400 font-bold truncate">
              {verificationUrl}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center gap-1 text-xs text-brand-600 font-bold hover:underline shrink-0 ml-2"
          >
            {copiedUrl ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
          <Button variant="outline" size="md" onClick={onClose} className="text-xs">
            Close Details
          </Button>

          {isUnlocked ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  onOpenPreview(certificate);
                }}
                className="text-xs flex items-center gap-1.5 font-bold"
              >
                <FiAward className="w-3.5 h-3.5 text-amber-500" />
                <span>Preview</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleDownloadDirect}
                disabled={isDownloading}
                className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 text-xs font-bold shadow-md shadow-brand-600/20"
              >
                <FiDownload className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Downloading PDF...' : 'Download Certificate'}</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                navigate('/student/courses');
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 text-xs"
            >
              <span>Continue Learning to Unlock</span>
              <FiChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
