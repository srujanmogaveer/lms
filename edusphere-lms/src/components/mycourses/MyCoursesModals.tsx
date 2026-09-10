import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../common/Avatar';
import { FiPlayCircle, FiStar, FiInfo } from 'react-icons/fi';
import type { EnrolledCourseDetail } from '../../types';

interface PlayerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EnrolledCourseDetail | null;
}

export const LearningPlayerModal: React.FC<PlayerPreviewModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!item) return null;
  const { course, progress, lastAccessedLesson } = item;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Learning Player Preview`}>
      <div className="space-y-4 py-2">
        {/* Player Mock Canvas */}
        <div className="relative overflow-hidden rounded-2xl h-52 bg-slate-950 flex flex-col items-center justify-center text-white p-6 shadow-inner border border-slate-800">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm"
          />
          <div className="relative z-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-brand-600/90 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/40">
              <FiPlayCircle className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-white line-clamp-1">{lastAccessedLesson}</h4>
            <span className="text-[11px] text-brand-200 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              Playing Video Lesson • Progress {progress}%
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
            <span>Course:</span>
            <span>{course.title}</span>
          </div>
          <p className="leading-relaxed text-slate-500">
            In Prompt 18 / Learning Player, this will launch the interactive video player with transcript synchronization, video speed control, and lesson notes taking!
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" className="w-full justify-center" onClick={onClose}>
            Resume Later
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

interface QuickNavNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  courseTitle: string;
}

export const QuickNavNoticeModal: React.FC<QuickNavNoticeModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  courseTitle,
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Course ${moduleName} Shortcut`}>
      <div className="space-y-4 text-center py-2">
        <div className="w-14 h-14 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-full flex items-center justify-center mx-auto">
          <FiInfo className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <Badge variant="primary">{moduleName} Module</Badge>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Navigating to {moduleName}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            You launched the <strong>{moduleName}</strong> shortcut for course: <br />
            <span className="font-semibold text-brand-600 dark:text-brand-400">"{courseTitle}"</span>.
          </p>
        </div>

        <div className="pt-2">
          <Button variant="primary" size="md" className="w-full justify-center" onClick={onClose}>
            Continue Browsing
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

interface InstructorBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EnrolledCourseDetail | null;
}

export const InstructorBioModal: React.FC<InstructorBioModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const navigate = useNavigate();
  if (!item) return null;
  const { course } = item;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Instructor Profile">
      <div className="space-y-4 text-center py-2">
        <div className="flex justify-center">
          <Avatar
            src={course.instructorAvatar}
            name={course.instructorName}
            role="instructor"
            size="2xl"
            className="border-4 border-brand-500 shadow-md mx-auto"
          />
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
            {course.instructorName}
          </h4>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 block">
            {course.instructorSpecialization || course.instructorQualification || 'Masterclass Instructor & Mentor'}
          </span>
        </div>

        {course.instructorBio && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              About Instructor
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {course.instructorBio}
            </p>
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Instructor Rating:</span>
            <span className="font-bold text-amber-500 flex items-center gap-1">
              <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {course.rating ? `${course.rating} / 5.0` : '5.0 / 5.0'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Students Mentored:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {course.studentsEnrolled && course.studentsEnrolled > 0
                ? `${course.studentsEnrolled}+ Learners`
                : 'Verified Instructor'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Course Category:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{course.category || 'General'}</span>
          </div>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center text-xs"
            onClick={() => {
              onClose();
              navigate(`/student/chat?courseId=${course.id}`);
            }}
          >
            Chat with Instructor
          </Button>
          <Button variant="outline" size="md" className="w-full justify-center text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
