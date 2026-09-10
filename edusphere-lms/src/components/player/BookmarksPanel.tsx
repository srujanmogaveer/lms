import React from 'react';
import { FiBookmark, FiPlayCircle, FiChevronRight } from 'react-icons/fi';
import type { PlayerLesson } from '../../types';

interface BookmarksPanelProps {
  bookmarkedLessons: PlayerLesson[];
  activeLessonId: string;
  onSelectLesson: (lesson: PlayerLesson) => void;
}

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  bookmarkedLessons,
  activeLessonId,
  onSelectLesson,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
          <FiBookmark className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          <span>Bookmarked Lessons</span>
        </h3>
        <span className="text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
          {bookmarkedLessons.length}
        </span>
      </div>

      {bookmarkedLessons.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">
          No lessons bookmarked yet. Click "Bookmark Lesson" during any lesson to save it here for quick access.
        </p>
      ) : (
        <div className="space-y-2">
          {bookmarkedLessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;
            return (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors text-xs ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FiPlayCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <span className="line-clamp-1 font-bold">{lesson.title}</span>
                    <span className="text-[11px] text-slate-400 block line-clamp-1">
                      {lesson.moduleTitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  <span className="font-mono text-[11px]">{lesson.duration}</span>
                  <FiChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
