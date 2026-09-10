import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAward,
  FiLock,
  FiCheckCircle,
  FiClock,
  FiChevronRight,
  FiAlertCircle,
  FiDownload,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import type { StudentCertificateDetail } from '../../types';
import { downloadCertificatePdf } from '../../utils/certificatePdfGenerator';

interface CertificateCardProps {
  certificate: StudentCertificateDetail;
  onOpenPreview?: (certificate: StudentCertificateDetail) => void;
  onOpenDetails: (certificate: StudentCertificateDetail) => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onOpenPreview,
  onOpenDetails,
}) => {
  const navigate = useNavigate();
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

  const {
    courseTitle,
    courseCategory,
    courseThumbnail,
    instructorName,
    instructorAvatar,
    issueDate,
    certificateCode,
    status,
    requirements,
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
          <Badge variant="success" className="flex items-center gap-1">
            <FiAward className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Issued & Verified
          </Badge>
        );
      case 'eligible':
        return (
          <Badge variant="success" className="flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Eligible (Auto-Generated)
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <FiClock className="w-3.5 h-3.5 text-amber-600" /> Requirements Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="flex items-center gap-1">
            <FiLock className="w-3.5 h-3.5" /> Locked
          </Badge>
        );
    }
  };

  return (
    <Card
      hoverEffect
      className={`flex flex-col justify-between h-full space-y-4 p-5 border transition-all ${
        isUnlocked
          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-xs'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="space-y-4">
        {/* Header Thumbnail & Status */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900">
          <img
            src={courseThumbnail}
            alt={courseTitle}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-2">
            <Badge variant="primary" className="bg-slate-900/80 text-white backdrop-blur-md">
              {courseCategory}
            </Badge>
            {getStatusBadge()}
          </div>

          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white flex justify-between items-center font-mono text-[10px]">
            <span>Code: {certificateCode}</span>
            {issueDate && <span>Issued: {issueDate}</span>}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetails(certificate)}
          className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1 hover:text-brand-600 transition-colors cursor-pointer"
        >
          {courseTitle}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 text-xs">
          <img
            src={instructorAvatar}
            alt={instructorName}
            className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
            Instructor: {instructorName}
          </span>
        </div>

        {/* Visual Progress Requirements Checklist */}
        <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-900 dark:text-slate-100">
            <span>Unlock Requirement Progress</span>
            <span className={isUnlocked ? 'text-emerald-600' : 'text-amber-600'}>
              {overallProgressPercent}%
            </span>
          </div>

          <ProgressBar progress={overallProgressPercent} color={isUnlocked ? 'emerald' : 'amber'} size="sm" />

          {/* Checklist metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <FiCheckCircle className={lessonsCompletionPercent === 100 ? 'text-emerald-500' : 'text-slate-300'} />
              <span>Lessons {lessonsCompletionPercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <FiCheckCircle className={assignmentsCompletionPercent === 100 ? 'text-emerald-500' : 'text-slate-300'} />
              <span>Assignments {assignmentsCompletionPercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <FiCheckCircle className={quizzesPassPercent === 100 ? 'text-emerald-500' : 'text-slate-300'} />
              <span>Quizzes {quizzesPassPercent}%</span>
            </div>
          </div>
        </div>

        {/* Pending remaining requirements callout if locked */}
        {!isUnlocked && (
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1 text-[11px] text-amber-900 dark:text-amber-300">
            <div className="flex items-center gap-1.5 font-bold">
              <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Complete all certificate requirements to unlock your certificate.</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDetails(certificate)}
            className="w-full justify-center text-xs flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>Details</span>
          </Button>

          {isUnlocked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPreview ? onOpenPreview(certificate) : onOpenDetails(certificate)}
              className="w-full justify-center text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold border-amber-300 dark:border-amber-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <FiAward className="w-3.5 h-3.5 text-amber-500" />
              <span>Preview</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/student/courses')}
              className="w-full justify-center text-xs flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white"
            >
              <span>Continue Learning</span>
              <FiChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {isUnlocked && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadDirect}
            disabled={isDownloading}
            className="w-full justify-center text-xs flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
          >
            <FiDownload className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'Downloading...' : 'Download Certificate'}</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
