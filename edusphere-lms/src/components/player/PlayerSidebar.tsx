import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown,
  FiChevronRight,
  FiCheckCircle,
  FiPlayCircle,
  FiFileText,
  FiFile,
  FiFolder,
  FiSearch,
  FiMaximize2,
  FiMinimize2,
  FiBookmark,
  FiLock,
} from 'react-icons/fi';
import type { PlayerModule, PlayerLesson } from '../../types';

interface PlayerSidebarProps {
  modules: PlayerModule[];
  activeLessonId: string;
  onSelectLesson: (lesson: PlayerLesson) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
  modules,
  activeLessonId,
  onSelectLesson,
}) => {
  // Track open/collapsed modules. Initially all modules open.
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    modules.forEach((m) => {
      map[m.id] = true;
    });
    return map;
  });

  // Keep expandedModules updated when modules load or change
  React.useEffect(() => {
    setExpandedModules((prev) => {
      const map: Record<string, boolean> = { ...prev };
      modules.forEach((m) => {
        if (map[m.id] === undefined) {
          map[m.id] = true;
        }
      });
      return map;
    });
  }, [modules]);

  const [searchQuery, setSearchQuery] = useState('');

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !(prev[moduleId] ?? true),
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    modules.forEach((m) => {
      map[m.id] = true;
    });
    setExpandedModules(map);
  };

  const collapseAll = () => {
    const map: Record<string, boolean> = {};
    modules.forEach((m) => {
      map[m.id] = false;
    });
    setExpandedModules(map);
  };

  // Filter modules/lessons based on search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();
    return modules
      .map((mod) => {
        const matchingLessons = mod.lessons.filter(
          (l) => l.title.toLowerCase().includes(q) || mod.title.toLowerCase().includes(q)
        );
        return {
          ...mod,
          lessons: matchingLessons,
        };
      })
      .filter((mod) => mod.lessons.length > 0);
  }, [modules, searchQuery]);

  // Overall statistics
  const totalLessons = useMemo(() => {
    return modules.reduce((acc, m) => acc + m.lessons.length, 0);
  }, [modules]);

  const completedLessons = useMemo(() => {
    return modules.reduce(
      (acc, m) => acc + m.lessons.filter((l) => l.isCompleted).length,
      0
    );
  }, [modules]);

  const getLessonIcon = (type: PlayerLesson['type']) => {
    switch (type) {
      case 'video':
        return <FiPlayCircle className="w-4 h-4 text-brand-500" />;
      case 'pdf':
        return <FiFileText className="w-4 h-4 text-red-500" />;
      case 'text':
        return <FiFile className="w-4 h-4 text-emerald-500" />;
      case 'resource':
        return <FiFolder className="w-4 h-4 text-amber-500" />;
      default:
        return <FiPlayCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <aside className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <span>Course Curriculum</span>
            <span className="text-xs bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2.5 py-0.5 rounded-full font-bold">
              {completedLessons}/{totalLessons} Done
            </span>
          </h2>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={expandAll}
              className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Expand All"
              aria-label="Expand All Modules"
            >
              <FiMaximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Collapse All"
              aria-label="Collapse All Modules"
            >
              <FiMinimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
      </div>

      {/* Curriculum Tree List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {filteredModules.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No lessons match "{searchQuery}"
          </div>
        ) : (
          filteredModules.map((module) => {
            const isExpanded = expandedModules[module.id] ?? true;
            const moduleCompletedCount = module.lessons.filter((l) => l.isCompleted).length;
            const isModuleAllDone = moduleCompletedCount === module.lessons.length;

            return (
              <div
                key={module.id}
                className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40"
              >
                {/* Module Header Toggle */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                    {isExpanded ? (
                      <FiChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <FiChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="line-clamp-1">{module.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-slate-500">
                    {isModuleAllDone ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <FiCheckCircle className="w-3 h-3" /> Done
                      </span>
                    ) : (
                      <span className="bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                        {moduleCompletedCount}/{module.lessons.length}
                      </span>
                    )}
                  </div>
                </button>

                {/* Module Lessons Tree List */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900"
                    >
                      {module.lessons.map((lesson) => {
                        const isActive = lesson.id === activeLessonId;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-all text-xs group ${
                              lesson.isLocked
                                ? 'opacity-60 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 hover:opacity-80'
                                : isActive
                                ? 'bg-brand-50/90 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold border-l-4 border-brand-600'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                            title={lesson.isLocked ? '🔒 Complete preceding lesson to unlock' : undefined}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {/* Completion, Lock or Type Icon */}
                              <div className="shrink-0">
                                {lesson.isCompleted ? (
                                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : lesson.isLocked ? (
                                  <FiLock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                ) : (
                                  getLessonIcon(lesson.type)
                                )}
                              </div>

                              <span className={`line-clamp-1 ${isActive ? 'font-bold' : ''} ${lesson.isLocked ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                                {lesson.title}
                              </span>

                              {lesson.isBookmarked && (
                                <FiBookmark className="w-3 h-3 text-amber-500 fill-amber-500/40 shrink-0" />
                              )}
                            </div>

                            <span className="text-[11px] text-slate-400 shrink-0 font-medium font-mono flex items-center gap-1">
                              {lesson.isLocked ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                  Locked
                                </span>
                              ) : (
                                lesson.duration
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
