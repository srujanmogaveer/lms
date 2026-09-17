import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBookOpen,
  FiLayers,
  FiVideo,
  FiFileText,
  FiFile,
  FiPackage,
  FiClock,
  FiLock,
  FiUnlock,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiChevronDown,
  FiChevronRight,
  FiEye,
  FiArrowLeft,
  FiSend,
  FiAlertTriangle,
  FiX,
  FiMove,
  FiLoader
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  type CurriculumModule,
  type CurriculumLesson,
  type LessonType,
} from '../../data/curriculumData';
import { curriculumService } from '../../services/curriculumService';
import type { BackendModule } from '../../services/curriculumService';
import { courseService } from '../../services/courseService';

import {
  showWarningAlert,
  showErrorAlert,
  showConfirmAlert,
  showToastAlert,
} from '../../utils/swalAlerts';
import { CourseProgressTracker } from '../../components/instructor/CourseProgressTracker';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const InstructorCurriculumBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCourseId = searchParams.get('courseId');

  // Courses list initialized with client memory cache
  const cachedCourses = courseService.getCachedInstructorCourses();
  const cachedCurrentCourse = paramCourseId ? courseService.getCachedCourseById(paramCourseId) : null;
  const [coursesList, setCoursesList] = useState<any[]>(cachedCourses || (cachedCurrentCourse ? [cachedCurrentCourse] : []));
  const [selectedCourseId, setSelectedCourseId] = useState<string>(paramCourseId || (cachedCourses?.[0]?.id || ''));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active course item
  const course =
    coursesList.find((c) => c.id === selectedCourseId) ||
    (selectedCourseId ? courseService.getCachedCourseById(selectedCourseId) : null) ||
    coursesList[0] || {
      id: selectedCourseId || '',
      title: 'Loading Course...',
      category: 'General',
      difficulty: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      shortDescription: '',
      durationHours: 0,
      lessonsCount: 0,
    };

  // Curriculum Modules State initialized instantly from memory cache if available
  const cachedInitialModules = selectedCourseId ? curriculumService.getCachedCourseModules(selectedCourseId) : null;
  const [modules, setModules] = useState<CurriculumModule[]>(() =>
    cachedInitialModules ? mapBackendModulesToFrontend(cachedInitialModules) : []
  );

  const isPublishedCourse = Boolean(
    course?.courseStatus === 'Published' ||
    (course as any)?.isPublished ||
    (course as any)?.approvalStatus === 'Approved' ||
    (course as any)?.approvalStatus === 'Pending Approval' ||
    course?.status === 'Published' ||
    course?.status === 'Pending Approval'
  );

  // Active View / Preview State

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Modal / Drawer States for Module & Lesson editing
  const [moduleModalState, setModuleModalState] = useState<{
    isOpen: boolean;
    editingModule: CurriculumModule | null;
  }>({ isOpen: false, editingModule: null });

  const [lessonModalState, setLessonModalState] = useState<{
    isOpen: boolean;
    moduleId: string;
    editingLesson: CurriculumLesson | null;
  }>({ isOpen: false, moduleId: '', editingLesson: null });

  // Form inputs for Module modal
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  // Form inputs for Lesson modal
  const [lessonForm, setLessonForm] = useState<{
    title: string;
    shortDescription: string;
    durationMinutes: number;
    type: LessonType;
    isLocked: boolean;
    prerequisiteId: string;
  }>({
    title: '',
    shortDescription: '',
    durationMinutes: 15,
    type: 'Video',
    isLocked: false,
    prerequisiteId: '',
  });

  // Map Backend Modules to Frontend CurriculumModule structure
  function mapBackendModulesToFrontend(backendMods: BackendModule[]): CurriculumModule[] {
    return backendMods.map((bm, idx) => ({
      id: bm.id,
      courseId: bm.courseId,
      title: bm.title,
      description: bm.description || '',
      order: bm.position || idx + 1,
      position: bm.position,
      isExpanded: true,
      lessons: (bm.lessons || []).map((bl) => ({
        id: bl.id,
        moduleId: bl.moduleId,
        title: bl.title,
        shortDescription: bl.shortDescription || '',
        durationMinutes: bl.durationMinutes || 0,
        type: (bl.lessonType as LessonType) || 'Video',
        status: 'Published',
        isLocked: bl.isPreview !== undefined ? !bl.isPreview : Boolean((bl as any).isLocked),
        videoUrl: bl.videoUrl,
        pdfUrl: bl.documentUrl,
        textContent: bl.content,
        resourceUrl: bl.resourceUrl,
        position: bl.position,
        isPreview: bl.isPreview,
      })),
    }));
  }

  // Synchronize selectedCourseId with paramCourseId immediately
  useEffect(() => {
    if (paramCourseId && paramCourseId !== selectedCourseId) {
      setSelectedCourseId(paramCourseId);
    }
  }, [paramCourseId]);

  // Fetch course list for dropdown in background without blocking curriculum rendering
  useEffect(() => {
    courseService
      .getInstructorCourses()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCoursesList(res.data);
          if (!selectedCourseId && res.data.length > 0) {
            setSelectedCourseId(res.data[0].id);
          }
        }
      })
      .catch(() => null);
  }, []);

  // Load modules for the selected course
  const loadCurriculum = useCallback(async () => {
    if (!selectedCourseId) return;
    const cached = curriculumService.getCachedCourseModules(selectedCourseId);
    if (cached) {
      setModules(mapBackendModulesToFrontend(cached));
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await curriculumService.getInstructorCourseModules(selectedCourseId);
      if (res.success && res.data) {
        setModules(mapBackendModulesToFrontend(res.data));
      }
    } catch {
      // Keep existing cached state if error
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  // Handle course switch
  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    setSearchParams({ courseId: newCourseId });
  };

  // Calculate Summary Statistics
  const totalModulesCount = modules.length;
  const allLessons = modules.flatMap((m) => m.lessons);
  const totalLessonsCount = allLessons.length;
  const pdfLessonsCount = allLessons.filter((l) => l.type === 'PDF').length;
  const totalDurationMinutes = allLessons.reduce(
    (acc, l) => acc + (l.type === 'PDF' ? 0 : Number(l.durationMinutes) || 0),
    0
  );

  const formatTotalDuration = (mins: number) => {
    if (mins <= 0) return '0 mins';
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) return `${remainingMins} mins`;
    if (remainingMins === 0) return `${hrs} hrs`;
    return `${hrs}h ${remainingMins}m`;
  };

  // Validation Warnings
  const warnings: string[] = [];
  if (modules.length === 0) {
    warnings.push('Course contains no modules. Every published course requires at least 1 module.');
  } else {
    modules.forEach((mod, idx) => {
      if (mod.lessons.length === 0) {
        warnings.push(`Module ${idx + 1} ("${mod.title}") is empty. Add at least one lesson.`);
      }
    });

    // Check duplicate lesson titles
    const titleCounts: Record<string, number> = {};
    allLessons.forEach((l) => {
      const lower = l.title.trim().toLowerCase();
      titleCounts[lower] = (titleCounts[lower] || 0) + 1;
    });
    Object.entries(titleCounts).forEach(([title, count]) => {
      if (count > 1) {
        warnings.push(`Duplicate lesson title detected: "${title}" (${count} instances).`);
      }
    });
  }

  // Toggle Module Expand / Collapse
  const toggleModuleExpand = (moduleId: string) => {
    setModules(
      modules.map((m) => (m.id === moduleId ? { ...m, isExpanded: !m.isExpanded } : m))
    );
  };

  // Module Actions
  const openAddModuleModal = () => {
    if (isPublishedCourse) {
      showWarningAlert('Curriculum Locked', 'Curriculum is locked for published courses to protect active students and certificates.');
      return;
    }
    if (!selectedCourseId) {
      showWarningAlert('No Course Selected', 'Please select or create a course first before adding modules.');
      return;
    }
    setModuleForm({ title: '', description: '' });
    setModuleModalState({ isOpen: true, editingModule: null });
  };

  const openEditModuleModal = (module: CurriculumModule) => {
    if (isPublishedCourse) {
      showWarningAlert('Curriculum Locked', 'Curriculum is locked for published courses.');
      return;
    }
    setModuleForm({ title: module.title, description: module.description });
    setModuleModalState({ isOpen: true, editingModule: module });
  };

  const handleSaveModule = async () => {
    if (isPublishedCourse) {
      showWarningAlert('Curriculum Locked', 'Published courses cannot be modified.');
      return;
    }
    if (!selectedCourseId) {
      showWarningAlert('No Course Selected', 'No active course selected. Please select a valid course first.');
      return;
    }

    if (!moduleForm.title.trim()) {
      showWarningAlert('Validation Error', 'Module title is required.');
      return;
    }

    try {
      if (moduleModalState.editingModule) {
        // Update module via backend API
        await curriculumService.updateModule(moduleModalState.editingModule.id, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim(),
        });
        showToastAlert(`Module "${moduleForm.title}" updated.`, 'success');
      } else {
        // Create module via backend API
        await curriculumService.createModule(selectedCourseId, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim(),
        });
        showToastAlert(`Module "${moduleForm.title}" added to curriculum.`, 'success');
      }

      await loadCurriculum();
      setModuleModalState({ isOpen: false, editingModule: null });
    } catch (err: any) {
      showErrorAlert('Error', err.message || 'Failed to save module.');
    }
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    if (isPublishedCourse) {
      showWarningAlert('Curriculum Locked', 'Curriculum order is locked for published courses.');
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    
    const newModules = [...modules];
    const temp = newModules[index];
    newModules[index] = newModules[targetIndex];
    newModules[targetIndex] = temp;
    setModules(newModules);

    const reorderedItems = newModules.map((m, idx) => ({
      id: m.id,
      position: idx + 1,
    }));

    try {
      await curriculumService.reorderModules(selectedCourseId, reorderedItems);
      showToastAlert('Reordered modules.', 'info');
    } catch (err: any) {
      showErrorAlert('Reorder Failed', err.message || 'Failed to reorder modules.');
      loadCurriculum();
    }
  };

  // Lesson Actions
  const openAddLessonModal = (moduleId: string) => {
    if (isPublishedCourse) {
      showWarningAlert('Curriculum Locked', 'Curriculum is locked for published courses.');
      return;
    }
    setLessonForm({
      title: '',
      shortDescription: '',
      durationMinutes: 15,
      type: 'Video',
      isLocked: false,
      prerequisiteId: '',
    });
    setLessonModalState({ isOpen: true, moduleId, editingLesson: null });
  };

  const openEditLessonModal = (moduleId: string, lesson: CurriculumLesson) => {
    if (isPublishedCourse) {
      showWarningAlert('Curriculum Locked', 'Curriculum is locked for published courses.');
      return;
    }
    setLessonForm({
      title: lesson.title,
      shortDescription: lesson.shortDescription,
      durationMinutes: lesson.durationMinutes || 15,
      type: lesson.type || 'Video',
      isLocked: Boolean(lesson.isLocked),
      prerequisiteId: lesson.prerequisiteId || '',
    });
    setLessonModalState({ isOpen: true, moduleId, editingLesson: lesson });
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      showWarningAlert('Validation Error', 'Lesson title is required.');
      return;
    }

    try {
      if (lessonModalState.editingLesson) {
        // Edit existing lesson
        await curriculumService.updateLesson(lessonModalState.editingLesson.id, {
          title: lessonForm.title.trim(),
          shortDescription: lessonForm.shortDescription.trim(),
          durationMinutes: Number(lessonForm.durationMinutes) || 0,
          lessonType: lessonForm.type,
          isPreview: !lessonForm.isLocked,
        });
        showToastAlert(`Lesson "${lessonForm.title}" saved.`, 'success');
      } else {
        // Create new lesson
        await curriculumService.createLesson(lessonModalState.moduleId, {
          title: lessonForm.title.trim(),
          shortDescription: lessonForm.shortDescription.trim(),
          durationMinutes: Number(lessonForm.durationMinutes) || 0,
          lessonType: lessonForm.type,
          isPreview: !lessonForm.isLocked,
        });
        showToastAlert(`New lesson "${lessonForm.title}" created.`, 'success');
      }

      await loadCurriculum();
      setLessonModalState({ isOpen: false, moduleId: '', editingLesson: null });
    } catch (err: any) {
      showErrorAlert('Error', err.message || 'Failed to save lesson.');
    }
  };

  const handleDuplicateLesson = async (moduleId: string, lesson: CurriculumLesson) => {
    try {
      await curriculumService.createLesson(moduleId, {
        title: `${lesson.title} (Copy)`,
        shortDescription: lesson.shortDescription,
        durationMinutes: lesson.durationMinutes,
        lessonType: lesson.type,
        videoUrl: lesson.videoUrl,
        documentUrl: lesson.pdfUrl,
        content: lesson.textContent,
        resourceUrl: lesson.resourceUrl,
      });
      showToastAlert(`Lesson duplicated: "${lesson.title} (Copy)"`, 'success');
      await loadCurriculum();
    } catch (err: any) {
      showErrorAlert('Error', err.message || 'Failed to duplicate lesson.');
    }
  };

  const handleMoveLesson = async (moduleId: string, lessonIndex: number, direction: 'up' | 'down') => {
    const currentModule = modules.find((m) => m.id === moduleId);
    if (!currentModule) return;

    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentModule.lessons.length) return;

    const newLessons = [...currentModule.lessons];
    const temp = newLessons[lessonIndex];
    newLessons[lessonIndex] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    setModules(
      modules.map((m) => (m.id === moduleId ? { ...m, lessons: newLessons } : m))
    );

    const reorderedItems = newLessons.map((l, idx) => ({
      id: l.id,
      position: idx + 1,
    }));

    try {
      await curriculumService.reorderLessons(moduleId, reorderedItems);
      showToastAlert('Lesson reordered.', 'info');
    } catch (err: any) {
      showErrorAlert('Reorder Failed', err.message || 'Failed to reorder lessons.');
      loadCurriculum();
    }
  };

  const handleDeleteModule = async (moduleId: string, title: string) => {
    const confirmed = await showConfirmAlert(
      'Delete Module?',
      `Are you sure you want to delete "${title}" and all its lessons? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel',
      'warning'
    );
    if (!confirmed) return;

    try {
      await curriculumService.deleteModule(moduleId);
      showToastAlert(`Module "${title}" deleted.`, 'success');
      await loadCurriculum();
    } catch (err: any) {
      showErrorAlert('Delete Failed', err.message || 'Failed to delete module.');
    }
  };

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    const confirmed = await showConfirmAlert(
      'Delete Lesson?',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel',
      'warning'
    );
    if (!confirmed) return;

    try {
      await curriculumService.deleteLesson(lessonId);
      showToastAlert(`Lesson "${title}" deleted.`, 'success');
      await loadCurriculum();
    } catch (err: any) {
      showErrorAlert('Delete Failed', err.message || 'Failed to delete lesson.');
    }
  };

  const getLessonTypeIcon = (type: LessonType) => {
    switch (type) {
      case 'Video':
        return <FiVideo className="w-4 h-4 text-sky-500" />;
      case 'PDF':
        return <FiFileText className="w-4 h-4 text-rose-500" />;
      case 'Text':
        return <FiFile className="w-4 h-4 text-emerald-500" />;
      case 'Resource':
        return <FiPackage className="w-4 h-4 text-amber-500" />;
      default:
        return <FiFile className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleSaveAndContinue = () => {
    if (!selectedCourseId) {
      showWarningAlert('Course Required', 'Please select a course first before proceeding.');
      return;
    }

    if (!modules || modules.length === 0) {
      showWarningAlert('Curriculum Required', 'Please create at least 1 module before proceeding to Content Management.');
      return;
    }

    const emptyModule = modules.find((m) => !m.lessons || m.lessons.length === 0);
    if (emptyModule) {
      showWarningAlert(
        'Empty Module Found',
        `Module "${emptyModule.title}" has no lessons. Each module must contain at least 1 lesson before proceeding.`
      );
      return;
    }

    showToastAlert('Curriculum verified! Proceeding to Step 3: Content Management...', 'success');
    setTimeout(() => {
      navigate(`/instructor/content?courseId=${selectedCourseId}`);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Step 2 Progress Tracker */}
      <CourseProgressTracker currentStep={2} courseId={selectedCourseId} completedSteps={[1]} />

      {/* Top Header / Workflow Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/instructor/courses?courseId=${selectedCourseId}`)}
              className="text-xs"
            >
              <FiArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Step 1
            </Button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Curriculum Builder
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize modules, lectures, sections, and structural ordering for <span className="font-semibold text-slate-700 dark:text-slate-200">{course.title}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          >
            <FiEye className="w-4 h-4 mr-2" /> {isPreviewOpen ? 'Edit Curriculum' : 'Preview Curriculum'}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAndContinue}
          >
            <FiSend className="w-4 h-4 mr-2" /> Save & Continue
          </Button>
        </div>
      </div>

      {/* 1. Course Header Bar */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  {course.category}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Badge variant="primary">{course.difficulty}</Badge>
              </div>

              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                {course.title}
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-xl">
                {course.shortDescription || 'Course overview and learning milestones.'}
              </p>
            </div>
          </div>

          {/* Quick Course Selector */}
          <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full md:w-72 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            >
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Modules</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalModulesCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
            <FiLayers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Lessons</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalLessonsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
            <FiBookOpen className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Duration</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {formatTotalDuration(totalDurationMinutes)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <FiClock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">PDF Documents</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {pdfLessonsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
            <FiFileText className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Published / Pending Approval Course Lock Banner */}
      {isPublishedCourse && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs font-medium">
          <FiLock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">
              {(course as any)?.approvalStatus === 'Pending Approval' ? 'Course Under Admin Review (Curriculum Locked):' : 'Published Course (Curriculum Locked):'}
            </span>{' '}
            {(course as any)?.approvalStatus === 'Pending Approval'
              ? 'Modifying, adding, or deleting modules and lessons is locked while under Admin Review.'
              : 'Modifying, adding, or deleting modules and lessons is locked to protect active student learning progress and issued certificates.'}
          </div>
        </div>
      )}

      {/* 3. Validation Warnings Box */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
            <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Curriculum Quality & Structure Warnings ({warnings.length}):</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-400 space-y-1 pl-1">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top action bar to Add Module */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Course Structure & Modules
        </h2>
        {!isPublishedCourse && (
          <Button variant="primary" size="sm" onClick={openAddModuleModal}>
            <FiPlus className="w-4 h-4 mr-1.5" /> Add Module
          </Button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. MAIN CURRICULUM TREE & BUILDER VIEW */}
      {/* ======================================================== */}
      {!isPreviewOpen ? (
        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 custom-scrollbar">
          {isLoading ? (
            <Card className="p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl">
              <FiLoader className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading course curriculum...</p>
            </Card>
          ) : modules.length === 0 ? (
            /* Empty State */
            <Card className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-3xl my-6">
              <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLayers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No curriculum has been created
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
                Start structuring your course syllabus by creating your first module and adding video, PDF, or text lessons.
              </p>
              {!isPublishedCourse && (
                <Button variant="primary" size="md" onClick={openAddModuleModal}>
                  <FiPlus className="w-4 h-4 mr-2" /> Create First Module
                </Button>
              )}
            </Card>
          ) : (
            /* Module Accordion List */
            modules.map((mod, modIdx) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                {/* Module Bar */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Expand/Collapse Toggle Button */}
                    <button
                      onClick={() => toggleModuleExpand(mod.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      {mod.isExpanded ? (
                        <FiChevronDown className="w-5 h-5" />
                      ) : (
                        <FiChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleModuleExpand(mod.id)}>
                      <span className="w-7 h-7 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                        {modIdx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{mod.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Module Control Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-slate-400 font-medium mr-2 hidden sm:inline">
                      {mod.lessons.length} Lessons
                    </span>

                    {isPublishedCourse ? (
                      <span
                        className="text-xs text-slate-400 dark:text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-not-allowed select-none"
                        title="Published Course: Curriculum is locked"
                      >
                        <FiLock className="w-3 h-3 text-slate-400" /> Locked
                      </span>
                    ) : (
                      <>
                        {/* Reorder Buttons */}
                        <button
                          onClick={() => handleMoveModule(modIdx, 'up')}
                          disabled={modIdx === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Module Up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveModule(modIdx, 'down')}
                          disabled={modIdx === modules.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Module Down"
                        >
                          ▼
                        </button>

                        <button
                          onClick={() => openEditModuleModal(mod)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                          title="Rename / Edit Module"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openAddLessonModal(mod.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-100 flex items-center gap-1"
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Add Lesson
                        </button>

                        <button
                          onClick={() => handleDeleteModule(mod.id, mod.title)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                          title="Delete Module"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Lessons List inside Module */}
                <AnimatePresence>
                  {mod.isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-4 space-y-2 bg-slate-50/30 dark:bg-slate-900/30"
                    >
                      {mod.lessons.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <p className="text-xs text-slate-400">
                            No lessons in this module yet. Click <strong>Add Lesson</strong> to create content.
                          </p>
                        </div>
                      ) : (
                        mod.lessons.map((les, lesIdx) => (
                          <div
                            key={les.id}
                            className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4 hover:border-brand-300 dark:hover:border-brand-700 transition-all shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="cursor-grab text-slate-300 hover:text-slate-500">
                                <FiMove className="w-4 h-4" />
                              </span>

                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                {getLessonTypeIcon(les.type)}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                                    {lesIdx + 1}. {les.title}
                                  </h4>
                                  <Badge variant="neutral">
                                    {les.type === 'PDF' ? 'PDF' : 'Video'}
                                  </Badge>

                                  {les.isLocked && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                                      <FiLock className="w-3 h-3" /> Locked Rule
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {les.shortDescription || `${les.type} lesson content`}
                                </p>
                              </div>
                            </div>

                            {/* Lesson Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                {les.type === 'PDF' ? (
                                  <>
                                    <FiFileText className="w-3 h-3 text-rose-500" /> PDF Document
                                  </>
                                ) : (
                                  <>
                                    <FiClock className="w-3 h-3" /> {les.durationMinutes || 0} mins
                                  </>
                                )}
                              </span>

                              {isPublishedCourse ? (
                                <span
                                  className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 rounded-md flex items-center gap-1 cursor-not-allowed select-none"
                                  title="Published Course: Lesson editing is locked"
                                >
                                  <FiLock className="w-3 h-3 text-slate-400" /> Read Only
                                </span>
                              ) : (
                                <>
                                  {/* Reorder lesson */}
                                  <button
                                    onClick={() => handleMoveLesson(mod.id, lesIdx, 'up')}
                                    disabled={lesIdx === 0}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    title="Move Up"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    onClick={() => handleMoveLesson(mod.id, lesIdx, 'down')}
                                    disabled={lesIdx === mod.lessons.length - 1}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    title="Move Down"
                                  >
                                    ▼
                                  </button>

                                  <button
                                    onClick={() => openEditLessonModal(mod.id, les)}
                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                    title="Edit Lesson"
                                  >
                                    <FiEdit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDuplicateLesson(mod.id, les)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    title="Duplicate Lesson"
                                  >
                                    <FiCopy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteLesson(les.id, les.title)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                                    title="Delete Lesson"
                                  >
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* 5. STUDENT-STYLE CURRICULUM PREVIEW VIEW */
        /* ======================================================== */
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Student Learning Player View</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Course Curriculum Preview</h2>
            </div>
            <Badge variant="success">Interactive Preview Mode</Badge>
          </div>

          <div className="space-y-4">
            {modules.map((mod, modIdx) => (
              <div key={mod.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Module {modIdx + 1}: {mod.title}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{mod.lessons.length} Lessons</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mod.lessons.map((les, lesIdx) => (
                    <div key={les.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        {les.isLocked ? (
                          <FiLock className="w-4 h-4 text-rose-500" title="Locked by prerequisite rule" />
                        ) : (
                          <FiUnlock className="w-4 h-4 text-emerald-500" title="Unlocked lesson" />
                        )}

                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {modIdx + 1}.{lesIdx + 1} {les.title}
                        </span>

                        <Badge variant="neutral">{les.type}</Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        {les.type === 'PDF' ? (
                          <span className="text-slate-400 font-medium">PDF Document</span>
                        ) : (
                          <span className="text-slate-400 font-medium">{les.durationMinutes || 0} mins</span>
                        )}
                        {les.isLocked ? (
                          <span className="text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                            Complete previous lesson to unlock
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                            Available Now
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom Step Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(`/instructor/courses?courseId=${selectedCourseId}`)}
          className="w-full sm:w-auto"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" /> Back to Step 1: Course Details
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAndContinue}
            className="w-full sm:w-auto font-bold"
          >
            <FiSend className="w-4 h-4 mr-2" /> Save & Continue to Step 3 →
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: Add / Edit Module */}
      {/* ======================================================== */}
      <AnimatePresence>
        {moduleModalState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {moduleModalState.editingModule ? 'Rename Module' : 'Create New Module'}
                </h3>
                <button onClick={() => setModuleModalState({ isOpen: false, editingModule: null })}>
                  <FiX className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Module 1: Introduction to Fundamentals"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Module Objectives / Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Short overview of what students will achieve in this module..."
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModuleModalState({ isOpen: false, editingModule: null })}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveModule}>
                  {moduleModalState.editingModule ? 'Update Module' : 'Save Module'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: Add / Edit Lesson */}
      {/* ======================================================== */}
      <AnimatePresence>
        {lessonModalState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {lessonModalState.editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h3>
                <button onClick={() => setLessonModalState({ isOpen: false, moduleId: '', editingLesson: null })}>
                  <FiX className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Virtual DOM & Fiber Architecture Explained"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Summary of lesson key takeaways..."
                    value={lessonForm.shortDescription}
                    onChange={(e) => setLessonForm({ ...lessonForm, shortDescription: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {lessonForm.type === 'Video' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Lesson Type
                      </label>
                      <select
                        value={lessonForm.type}
                        onChange={(e) => {
                          const newType = e.target.value as LessonType;
                          setLessonForm({
                            ...lessonForm,
                            type: newType,
                            durationMinutes: newType === 'PDF' ? 0 : 15,
                          });
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none font-semibold"
                      >
                        <option value="Video">Video Lesson</option>
                        <option value="PDF">PDF Document</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Video Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={600}
                        placeholder="15"
                        value={lessonForm.durationMinutes === 0 ? '' : (lessonForm.durationMinutes || '')}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setLessonForm({ ...lessonForm, durationMinutes: '' as any });
                          } else {
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed) && parsed >= 0) {
                              setLessonForm({ ...lessonForm, durationMinutes: parsed });
                            }
                          }
                        }}
                        onBlur={() => {
                          if (!lessonForm.durationMinutes || Number(lessonForm.durationMinutes) < 1) {
                            setLessonForm((prev) => ({ ...prev, durationMinutes: 15 }));
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lesson Type
                    </label>
                    <select
                      value={lessonForm.type}
                      onChange={(e) => {
                        const newType = e.target.value as LessonType;
                        setLessonForm({
                          ...lessonForm,
                          type: newType,
                          durationMinutes: newType === 'PDF' ? 0 : 15,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none font-semibold"
                    >
                      <option value="Video">Video Lesson</option>
                      <option value="PDF">PDF Document</option>
                    </select>
                  </div>
                )}

                {/* Sequential Progression Lock */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="lesson-seq-lock-toggle"
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiLock className="w-3.5 h-3.5 text-amber-500" />
                      Sequential Lock
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Require students to complete previous lesson before unlocking
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      id="lesson-seq-lock-toggle"
                      type="checkbox"
                      checked={lessonForm.isLocked}
                      onChange={(e) => setLessonForm({ ...lessonForm, isLocked: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {lessonForm.isLocked && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <FiLock className="w-3.5 h-3.5" /> Sequential Unlock Rule Enabled
                    </div>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Students must complete the preceding lesson before this lesson becomes accessible.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLessonModalState({ isOpen: false, moduleId: '', editingLesson: null })}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveLesson}>
                  {lessonModalState.editingLesson ? 'Save Changes' : 'Add Lesson'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
