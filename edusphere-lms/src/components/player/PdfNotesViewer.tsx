import React, { useState, useEffect } from 'react';
import {
  FiDownload,
  FiFileText,
  FiZoomIn,
  FiZoomOut,
  FiAlertCircle,
  FiLoader,
  FiExternalLink,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import type { PlayerLesson } from '../../types';
import { curriculumService } from '../../services/curriculumService';
import { supabase } from '../../lib/supabase';

interface PdfNotesViewerProps {
  lesson: PlayerLesson;
}

const LESSON_DOCUMENTS_BUCKET = 'lesson-documents';

export const PdfNotesViewer: React.FC<PdfNotesViewerProps> = ({ lesson }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [hasError, setHasError] = useState(false);

  const pdfTitle = lesson.pdfTitle || lesson.title;

  useEffect(() => {
    setHasError(false);
    setResolvedPdfUrl(null);

    if (!lesson.pdfUrl || !lesson.pdfUrl.trim()) {
      setIsLoadingPdf(false);
      return;
    }

    const rawUrl = lesson.pdfUrl.trim();

    // If it's already an external HTTP/HTTPS direct URL
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      setResolvedPdfUrl(rawUrl);
      setIsLoadingPdf(false);
      return;
    }

    // It's a Supabase Storage path in 'lesson-documents'
    let isMounted = true;
    setIsLoadingPdf(true);

    let cleanPath = rawUrl;
    if (cleanPath.startsWith(`${LESSON_DOCUMENTS_BUCKET}/`)) {
      cleanPath = cleanPath.replace(`${LESSON_DOCUMENTS_BUCKET}/`, '');
    }

    curriculumService
      .getSignedDocumentUrl(cleanPath, false, `${pdfTitle}.pdf`)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data?.signedUrl) {
          setResolvedPdfUrl(res.data.signedUrl);
        } else {
          // Fallback to client storage
          const { data } = supabase.storage
            .from(LESSON_DOCUMENTS_BUCKET)
            .getPublicUrl(cleanPath);

          if (data?.publicUrl) {
            setResolvedPdfUrl(data.publicUrl);
          } else {
            setHasError(true);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        try {
          const { data } = supabase.storage
            .from(LESSON_DOCUMENTS_BUCKET)
            .getPublicUrl(cleanPath);

          if (data?.publicUrl) {
            setResolvedPdfUrl(data.publicUrl);
          } else {
            setHasError(true);
          }
        } catch {
          setHasError(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPdf(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lesson.id, lesson.pdfUrl, pdfTitle]);

  const handleDownload = async () => {
    if (!lesson.pdfUrl) return;

    const rawUrl = lesson.pdfUrl.trim();
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      window.open(rawUrl, '_blank');
      return;
    }

    try {
      let cleanPath = rawUrl;
      if (cleanPath.startsWith(`${LESSON_DOCUMENTS_BUCKET}/`)) {
        cleanPath = cleanPath.replace(`${LESSON_DOCUMENTS_BUCKET}/`, '');
      }

      const res = await curriculumService.getSignedDocumentUrl(cleanPath, true, `${pdfTitle}.pdf`);
      if (res.success && res.data?.signedUrl) {
        window.open(res.data.signedUrl, '_blank');
      } else {
        if (resolvedPdfUrl) {
          window.open(resolvedPdfUrl, '_blank');
        }
      }
    } catch {
      if (resolvedPdfUrl) {
        window.open(resolvedPdfUrl, '_blank');
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  if (!lesson.pdfUrl) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center space-y-3 shadow-sm">
        <FiFileText className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
          PDF Notes Unavailable
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The instructor has not attached a PDF document for this lesson yet. Please check the Video or Text Reading tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PDF Header & Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <FiFileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
              {pdfTitle}
            </h3>
            <p className="text-xs text-slate-500">
              Instructor Lecture Notes & Reference Guide
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 rounded-lg hover:bg-white dark:hover:bg-slate-700"
              title="Zoom Out"
              aria-label="Zoom Out PDF"
            >
              <FiZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetZoom}
              className="px-2 font-mono font-semibold text-slate-700 dark:text-slate-200"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>

            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 rounded-lg hover:bg-white dark:hover:bg-slate-700"
              title="Zoom In"
              aria-label="Zoom In PDF"
            >
              <FiZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Download Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-sm"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download PDF</span>
          </Button>

          {resolvedPdfUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(resolvedPdfUrl, '_blank')}
              className="flex items-center gap-1.5 text-xs"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>
          )}
        </div>
      </div>

      {/* Document View Area */}
      <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 min-h-[600px] h-[650px] overflow-hidden relative shadow-inner">
        {isLoadingPdf ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 text-slate-500 bg-slate-900/10 dark:bg-slate-950">
            <FiLoader className="w-8 h-8 text-brand-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Loading document stream...
            </span>
          </div>
        ) : hasError || !resolvedPdfUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <FiAlertCircle className="w-10 h-10 text-amber-500" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Unable to preview this document directly
            </h4>
            <p className="text-xs text-slate-500 max-w-sm">
              You can still download the complete PDF file using the download button above.
            </p>
            <Button variant="primary" size="sm" onClick={handleDownload} className="bg-red-600 text-white">
              <FiDownload className="w-4 h-4 mr-1.5" /> Download File
            </Button>
          </div>
        ) : (
          <iframe
            key={resolvedPdfUrl}
            src={`${resolvedPdfUrl}#zoom=${zoomLevel}`}
            title={pdfTitle}
            className="w-full h-full border-0 rounded-2xl bg-white"
          />
        )}
      </div>
    </div>
  );
};
