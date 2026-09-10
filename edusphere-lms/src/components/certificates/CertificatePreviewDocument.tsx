import React, { useState } from 'react';
import {
  FiAward,
  FiDownload,
  FiPrinter,
  FiShield,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { StudentCertificateDetail } from '../../types';
import { downloadCertificatePdf } from '../../utils/certificatePdfGenerator';

interface CertificatePreviewDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: StudentCertificateDetail | null;
}

export const CertificatePreviewDocument: React.FC<CertificatePreviewDocumentProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!certificate) return null;

  const {
    studentName,
    courseTitle,
    courseDescription,
    instructorName,
    instructorTitle,
    certificateCode,
    issueDate,
    completionDate,
    verificationUrl,
  } = certificate;

  const formattedDate = issueDate || completionDate || new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fullVerifyUrl = verificationUrl || `https://edusphere.edu/verify/${certificateCode}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullVerifyUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Certificate Details & Official Preview"
      maxWidth="max-w-[95vw] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl"
      maxHeight="max-h-[88vh]"
      bodyClassName="p-3 sm:p-5 md:p-6"
    >
      <div className="flex flex-col space-y-4 sm:space-y-5">
        {/* Certificate Printable Canvas Document Container - Centered and Responsive */}
        <div className="w-full flex items-center justify-center overflow-x-auto py-1">
          <div
            id="printable-certificate-document"
            className="w-full max-w-5xl relative p-5 sm:p-8 md:p-12 lg:p-14 rounded-2xl bg-[#FCFBF7] dark:bg-slate-900 border-[8px] sm:border-[10px] md:border-[12px] border-[#1E293B] dark:border-slate-700 text-center space-y-4 sm:space-y-6 shadow-2xl overflow-hidden print:p-8 print:m-0 print:border-[8px] print:border-[#1E293B] print:shadow-none print:w-full print:max-w-none"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* Inner Decorative Gold/Navy Double Border */}
            <div className="absolute inset-2 sm:inset-3 md:inset-4 border border-[#C5A059]/60 dark:border-amber-500/40 pointer-events-none rounded-lg" />
            <div className="absolute inset-3 sm:inset-4 md:inset-5 border-2 border-[#C5A059] dark:border-amber-500/60 pointer-events-none rounded-lg" />

            {/* Corner Flourish Accents */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-l-2 border-[#C5A059] pointer-events-none" />
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-r-2 border-[#C5A059] pointer-events-none" />
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-l-2 border-[#C5A059] pointer-events-none" />
            <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-r-2 border-[#C5A059] pointer-events-none" />

            {/* Watermark Ornate Seal Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <FiAward className="w-[350px] sm:w-[480px] h-[350px] sm:h-[480px] text-[#1E293B] dark:text-amber-400" />
            </div>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 border-b border-[#C5A059]/30 pb-4 sm:pb-5 relative z-10">
              <div className="flex items-center gap-2.5 sm:gap-3 text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1E293B] dark:bg-brand-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md border border-[#C5A059] shrink-0">
                  ES
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-wider font-serif">
                    EDUSPHERE LMS
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-[#C5A059] dark:text-amber-400 uppercase font-mono tracking-widest font-bold">
                    Academic Council & Global Credentialing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#F1E9D2]/70 dark:bg-amber-950/40 rounded-xl border border-[#C5A059]/50 text-slate-900 dark:text-amber-300 text-xs">
                <FiShield className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#C5A059] dark:text-amber-400 shrink-0" />
                <div className="text-left font-mono text-[8px] sm:text-[9px] md:text-[10px]">
                  <span className="block font-bold text-[#8C6D23] dark:text-amber-300">OFFICIAL VERIFIED CREDENTIAL</span>
                  <span className="text-slate-600 dark:text-slate-400">AUTHENTICITY GUARANTEED</span>
                </div>
              </div>
            </div>

            {/* Certificate Main Content */}
            <div className="space-y-3 sm:space-y-4 py-1 sm:py-2 relative z-10">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-serif font-black tracking-wider text-slate-900 dark:text-slate-100 uppercase">
                  Certificate of Completion
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
                  THIS IS PROUDLY PRESENTED TO
                </p>
              </div>

              <div className="py-1 sm:py-2">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#1E293B] dark:text-amber-400 font-serif tracking-tight">
                  {studentName}
                </h1>
                <div className="w-36 sm:w-56 h-0.5 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent mx-auto mt-1.5 sm:mt-2" />
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed pt-1">
                for successfully completing all required curriculum modules, laboratory assignments, and passing the comprehensive knowledge verification assessment for the course:
              </p>

              <div className="py-1">
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif max-w-2xl mx-auto">
                  "{courseTitle}"
                </h3>
                {courseDescription && (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto line-clamp-1 italic mt-1">
                    {courseDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Signatures & Footer Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-[#C5A059]/30 text-xs text-slate-600 dark:text-slate-400 items-end relative z-10">
              {/* Instructor Signature */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="font-serif italic text-sm sm:text-base md:text-lg text-slate-900 dark:text-slate-200 border-b border-slate-400 dark:border-slate-600 pb-1 font-medium">
                  {instructorName}
                </div>
                <span className="font-bold block text-slate-900 dark:text-slate-100 text-[11px] sm:text-xs">
                  Instructor: {instructorName}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block">{instructorTitle || 'Lead Instructor & Mentor'}</span>
              </div>

              {/* Official Gold Seal Emblem */}
              <div className="flex flex-col items-center justify-center space-y-1 my-2 sm:my-0">
                <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[#A67C1E] via-[#C5A059] to-[#E5C989] text-slate-900 p-1 shadow-lg flex items-center justify-center border-2 border-white/40">
                  <div className="w-full h-full rounded-full border border-dashed border-slate-900/40 flex flex-col items-center justify-center text-center p-1">
                    <FiAward className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-950 mb-0.5" />
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter leading-none text-slate-950">
                      EDUSPHERE<br />VERIFIED
                    </span>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                  ID: {certificateCode}
                </span>
              </div>

              {/* Issuer & Issue Date */}
              <div className="space-y-1 text-center sm:text-right">
                <div className="font-serif italic text-sm sm:text-base md:text-lg text-slate-900 dark:text-slate-200 border-b border-slate-400 dark:border-slate-600 pb-1 font-medium">
                  EduSphere Academic Registrar
                </div>
                <span className="font-bold block text-slate-900 dark:text-slate-100 text-[11px] sm:text-xs">
                  Issued: {formattedDate}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block">
                  EduSphere Academic Board
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Control Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 print:hidden">
          {/* Verification Badge & Link */}
          <div className="flex items-center gap-2 text-xs flex-wrap justify-center sm:justify-start">
            <Badge variant="success" className="flex items-center gap-1.5 bg-emerald-600 text-white font-extrabold px-3 py-1">
              <FiShield className="w-3.5 h-3.5" /> Verified Credential
            </Badge>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
              {certificateCode}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              {copiedUrl ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Link Copied' : 'Copy Verification Link'}</span>
            </button>
          </div>

          {/* Download & Print Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrint}
              className="text-xs sm:text-sm flex items-center justify-center gap-2 font-bold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex-1 sm:flex-initial"
            >
              <FiPrinter className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Print Certificate</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-xs sm:text-sm flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2 shadow-lg shadow-brand-600/25 flex-1 sm:flex-initial"
            >
              <FiDownload className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Downloading PDF...' : 'Download Certificate'}</span>
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
