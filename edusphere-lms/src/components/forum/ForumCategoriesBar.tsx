import React from 'react';
import {
  FiGrid,
  FiFileText,
  FiHelpCircle,
  FiBookOpen,
  FiTerminal,
  FiBell,
  FiMessageCircle,
} from 'react-icons/fi';
import { forumCategories } from '../../data/forumData';

interface ForumCategoriesBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export const ForumCategoriesBar: React.FC<ForumCategoriesBarProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'General Discussion':
        return <FiMessageCircle className="w-3.5 h-3.5" />;
      case 'Assignments':
        return <FiFileText className="w-3.5 h-3.5" />;
      case 'Quizzes':
        return <FiHelpCircle className="w-3.5 h-3.5" />;
      case 'Course Content':
        return <FiBookOpen className="w-3.5 h-3.5" />;
      case 'Technical Issues':
        return <FiTerminal className="w-3.5 h-3.5" />;
      case 'Announcements':
        return <FiBell className="w-3.5 h-3.5" />;
      default:
        return <FiGrid className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
      {forumCategories.map((cat) => {
        const isActive = activeCategory === cat;
        const count = categoryCounts[cat] || 0;

        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              isActive
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {getCategoryIcon(cat)}
            <span>{cat}</span>
            {cat !== 'All Categories' && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
