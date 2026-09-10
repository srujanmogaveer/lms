import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlay,
  FiFileText,
  FiHelpCircle,
  FiArrowRight,
  FiClock,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { PlayerUpcomingLearning } from '../../types';

interface UpcomingLearningCardProps {
  upcomingData: PlayerUpcomingLearning;
  onNavigateNextLesson?: () => void;
}

export const UpcomingLearningCard: React.FC<UpcomingLearningCardProps> = ({
  upcomingData,
  onNavigateNextLesson,
}) => {
  const navigate = useNavigate();
  const { nextLesson, upcomingAssignment, upcomingQuiz } = upcomingData;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
          <FiClock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Upcoming Learning Roadmap</span>
        </h3>
        <Badge variant="primary">Module Queue</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Lesson Card */}
        {nextLesson && (
          <div className="p-4 bg-brand-50/50 dark:bg-brand-950/40 rounded-xl border border-brand-200/80 dark:border-brand-900/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300">
                <FiPlay className="w-3.5 h-3.5 fill-brand-600" /> Next Lesson
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2">
                {nextLesson.title}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {nextLesson.moduleTitle}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateNextLesson}
              className="w-full justify-center text-xs gap-1 py-1.5"
            >
              <span>Play Next</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Upcoming Assignment Card */}
        {upcomingAssignment && (
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-900/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                <FiFileText className="w-3.5 h-3.5" /> Upcoming Assignment
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2">
                {upcomingAssignment.title}
              </h4>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  Self-Paced Learning
                </span>
                <span className="font-bold text-purple-600 text-[11px] ml-auto">{upcomingAssignment.points} pts</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/assignments')}
              className="w-full justify-center text-xs gap-1 py-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/50"
            >
              <span>View Assignment</span>
            </Button>
          </div>
        )}

        {/* Upcoming Quiz Card */}
        {upcomingQuiz && (
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <FiHelpCircle className="w-3.5 h-3.5" /> Upcoming Knowledge Quiz
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2">
                {upcomingQuiz.title}
              </h4>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Time: {upcomingQuiz.timeLimit}</span>
                <span className="font-bold text-emerald-600">{upcomingQuiz.questionsCount} questions</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/quizzes')}
              className="w-full justify-center text-xs gap-1 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              <span>Take Quiz</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
