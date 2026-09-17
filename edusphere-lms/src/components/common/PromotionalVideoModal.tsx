import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlay, FiFilm } from 'react-icons/fi';
import { VideoLessonPlayer } from '../player/VideoLessonPlayer';
import type { PlayerLesson } from '../../types';

interface PromotionalVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  courseTitle: string;
}

export const PromotionalVideoModal: React.FC<PromotionalVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  courseTitle,
}) => {
  if (!isOpen) return null;

  const promoPlayerLesson: PlayerLesson = useMemo(() => ({
    id: `promo-modal-${courseTitle || 'preview'}`,
    moduleId: 'promo-mod',
    moduleTitle: 'Course Preview',
    title: courseTitle || 'Course Promotional Video',
    duration: '02:00',
    type: 'video',
    isCompleted: false,
    isBookmarked: false,
    videoUrl: videoUrl || '',
  }), [courseTitle, videoUrl]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
                <FiFilm className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Course Preview & Teaser</h3>
                <p className="text-xs text-slate-400 truncate max-w-md">{courseTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Video Player Frame */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            {!videoUrl || !videoUrl.trim() ? (
              <div className="text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FiPlay className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">No Promotional Video Available</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  The instructor has not uploaded a teaser video for this course yet. Please check the curriculum below for preview lessons.
                </p>
              </div>
            ) : (
              <VideoLessonPlayer
                key={videoUrl}
                lesson={promoPlayerLesson}
                showDetailsBanner={false}
                className="border-0 rounded-none shadow-none"
              />
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3.5 px-6 bg-slate-900/90 text-xs text-slate-400 flex items-center justify-between">
            <span>Free Course Preview • No enrollment required</span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
