import React from 'react';
import { FiCheck, FiClock, FiBookOpen, FiLayers, FiVideo, FiFileText, FiHelpCircle, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export interface StepItem {
  id: number;
  label: string;
  route: string;
  icon: React.ReactNode;
}

const STEPS: StepItem[] = [
  { id: 1, label: 'Create Course', route: '/instructor/courses', icon: <FiBookOpen className="w-4 h-4" /> },
  { id: 2, label: 'Curriculum', route: '/instructor/curriculum', icon: <FiLayers className="w-4 h-4" /> },
  { id: 3, label: 'Content', route: '/instructor/content', icon: <FiVideo className="w-4 h-4" /> },
  { id: 4, label: 'Assignment', route: '/instructor/assignments', icon: <FiFileText className="w-4 h-4" /> },
  { id: 5, label: 'Quiz', route: '/instructor/quizzes', icon: <FiHelpCircle className="w-4 h-4" /> },
  { id: 6, label: 'Admin Approval', route: '/instructor/courses', icon: <FiShield className="w-4 h-4" /> },
];

interface CourseProgressTrackerProps {
  currentStep: number; // 1 to 6
  courseId?: string;
  completedSteps?: number[];
  isLocked?: boolean;
}

export const CourseProgressTracker: React.FC<CourseProgressTrackerProps> = ({
  currentStep,
  courseId = '',
  completedSteps = [],
  isLocked = false,
}) => {
  const navigate = useNavigate();

  const handleStepClick = (step: StepItem) => {
    if (isLocked) return;
    // Allow navigation to completed steps or current step
    if (completedSteps.includes(step.id) || step.id <= currentStep) {
      const targetRoute = courseId && courseId !== 'All' ? `${step.route}?courseId=${courseId}` : step.route;
      navigate(targetRoute);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
          Course Creation Workflow
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          Step {currentStep} of {STEPS.length}
        </span>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
        
        {/* Progress Fill */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id) || step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isNavigable = (isCompleted || step.id <= currentStep) && !isLocked;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                onClick={() => handleStepClick(step)}
                disabled={!isNavigable}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 font-semibold text-xs shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-indigo-500/30 scale-110'
                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                }`}
                title={step.label}
              >
                {isCompleted ? (
                  <FiCheck className="w-5 h-5 text-white" />
                ) : step.id === 6 ? (
                  <FiClock className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </button>

              <span
                className={`mt-2 text-xs font-medium text-center hidden sm:block max-w-[80px] leading-tight ${
                  isCurrent
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {isCompleted ? `✓ ${step.label}` : step.id === 6 ? `⏳ ${step.label}` : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
