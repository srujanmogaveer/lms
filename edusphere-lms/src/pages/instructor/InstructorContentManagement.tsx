import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLayers,
  FiVideo,
  FiFileText,
  FiPackage,
  FiPlus,
  FiEye,
  FiSend,
  FiArrowLeft,
  FiUploadCloud,
  FiDownload,
  FiExternalLink,
  FiCheckCircle,
  FiLink,
  FiTrash2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiZap,
  FiCode,
  FiBold,
  FiItalic,
  FiList,
  FiHash,
  FiCornerDownRight,
  FiRefreshCw,
  FiInfo,
  FiLock,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  type CurriculumModule,
  type CurriculumLesson,
  type LessonType,
} from '../../data/curriculumData';
import type { PlayerLesson } from '../../types';
import { VideoLessonPlayer } from '../../components/player/VideoLessonPlayer';
import { curriculumService } from '../../services/curriculumService';
import type { BackendModule } from '../../services/curriculumService';
import { courseService } from '../../services/courseService';

import { CourseProgressTracker } from '../../components/instructor/CourseProgressTracker';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { showSuccessAlert, showWarningAlert } from '../../utils/swalAlerts';

type ContentSourceType = 'upload' | 'url';

export const InstructorContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCourseId = searchParams.get('courseId');

  // Courses state initialized with client memory cache
  const cachedCourses = courseService.getCachedInstructorCourses();
  const cachedCurrentCourse = paramCourseId ? courseService.getCachedCourseById(paramCourseId) : null;
  const [coursesList, setCoursesList] = useState<any[]>(cachedCourses || (cachedCurrentCourse ? [cachedCurrentCourse] : []));
  const [selectedCourseId, setSelectedCourseId] = useState<string>(paramCourseId || (cachedCourses?.[0]?.id || ''));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const course =
    coursesList.find((c) => c.id === selectedCourseId) ||
    (selectedCourseId ? courseService.getCachedCourseById(selectedCourseId) : null) ||
    coursesList[0] || {
      id: selectedCourseId || '',
      title: 'Loading Course...',
      thumbnail: '',
      category: 'General',
      difficulty: 'Beginner',
    };

  const isLockedCourse = Boolean(
    course?.courseStatus === 'Published' ||
    (course as any)?.isPublished ||
    (course as any)?.approvalStatus === 'Approved' ||
    (course as any)?.approvalStatus === 'Pending Approval' ||
    course?.status === 'Published' ||
    course?.status === 'Pending Approval'
  );

  // Curriculum state initialized instantly from memory cache if available
  const cachedInitialModules = selectedCourseId ? curriculumService.getCachedCourseModules(selectedCourseId) : null;
  const [modules, setModules] = useState<CurriculumModule[]>(() =>
    cachedInitialModules ? mapBackendModulesToFrontend(cachedInitialModules) : []
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => {
    if (cachedInitialModules && cachedInitialModules.length > 0) return cachedInitialModules[0].id;
    return '';
  });
  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => {
    if (cachedInitialModules && cachedInitialModules.length > 0 && cachedInitialModules[0].lessons?.length > 0) {
      return cachedInitialModules[0].lessons[0].id;
    }
    return '';
  });
  const [lessonSearchQuery, setLessonSearchQuery] = useState<string>('');

  // Active module & lesson objects
  const activeModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const activeLesson: CurriculumLesson =
    activeModule?.lessons.find((l) => l.id === selectedLessonId) ||
    activeModule?.lessons[0] || {
      id: '',
      title: 'Select a Lesson',
      shortDescription: '',
      durationMinutes: 0,
      type: 'Video',
      status: 'Published',
      isLocked: false,
    };

  // Content Source Mode per Lesson Type ('upload' | 'url')
  const [contentSource, setContentSource] = useState<ContentSourceType>('url');

  // Content Details State (Completely isolated per lesson)
  const [lessonVideoUrl, setLessonVideoUrl] = useState<string>('');
  const [videoInputUrl, setVideoInputUrl] = useState<string>('');
  const [uploadedVideoName, setUploadedVideoName] = useState<string>('');

  const [lessonPdfUrl, setLessonPdfUrl] = useState<string>('');
  const [_pdfInputUrl, setPdfInputUrl] = useState<string>('');
  const [uploadedPdfName, setUploadedPdfName] = useState<string>('');

  const [lessonResourceUrl, setLessonResourceUrl] = useState<string>('');
  const [resourceInputUrl, setResourceInputUrl] = useState<string>('');
  const [uploadedResourceName, setUploadedResourceName] = useState<string>('');

  const [lessonTextContent, setLessonTextContent] = useState<string>('');
  const [lessonShortDescription, setLessonShortDescription] = useState<string>('');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState<number | string>(10);

  // Uploading and drag-drop state
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Video playback & status state
  const [_videoPlaybackError, setVideoPlaybackError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper to extract filename from URL or path
  const extractFileName = (url?: string): string => {
    if (!url) return '';
    try {
      const clean = url.split('?')[0];
      const segments = clean.split('/');
      return decodeURIComponent(segments[segments.length - 1] || '');
    } catch {
      return url || '';
    }
  };

  // Helper to determine initial content source based on saved lesson values
  const determineInitialSource = (lesson: CurriculumLesson): ContentSourceType => {
    if (lesson.type === 'Video') {
      const v = lesson.videoUrl || '';
      if (!v) return 'url';
      if (
        (v.includes('/storage/') || v.includes('supabase') || /\.(mp4|webm|mov|mkv|avi)$/i.test(v)) &&
        !v.includes('youtube.com') &&
        !v.includes('youtu.be') &&
        !v.includes('vimeo.com')
      ) {
        return 'upload';
      }
      return 'url';
    }

    if (lesson.type === 'PDF') {
      return 'upload';
    }

    if (lesson.type === 'Resource') {
      const r = (lesson.resourceUrl || '').trim();
      if (!r) return 'url';
      if (r.startsWith('http://') || r.startsWith('https://')) {
        if (r.includes('lesson-resources') || r.includes('/storage/')) {
          return 'upload';
        }
        return 'url';
      }
      return 'upload';
    }

    return 'url';
  };

  // Strictly reset and populate state for a specific lesson without state leakage
  const applyLessonState = (les?: CurriculumLesson) => {
    if (!les || !les.id) {
      setLessonVideoUrl('');
      setVideoInputUrl('');
      setUploadedVideoName('');
      setLessonPdfUrl('');
      setPdfInputUrl('');
      setUploadedPdfName('');
      setLessonResourceUrl('');
      setResourceInputUrl('');
      setUploadedResourceName('');
      setLessonTextContent('');
      setLessonShortDescription('');
      setContentSource('url');
      setHasUnsavedChanges(false);
      return;
    }

    const initialSource = determineInitialSource(les);
    setContentSource(initialSource);

    // Video
    const vUrl = les.videoUrl || '';
    setUploadedVideoName(vUrl ? extractFileName(vUrl) : '');

    if (vUrl && !vUrl.startsWith('http://') && !vUrl.startsWith('https://')) {
      // It's a relative storage path (Uploaded Video)
      setVideoInputUrl('');
      curriculumService
        .getSignedVideoUrl(vUrl)
        .then((res) => {
          if (res.success && res.data?.signedUrl) {
            setLessonVideoUrl(res.data.signedUrl);
            setVideoPlaybackError(null);
          } else {
            setLessonVideoUrl(vUrl);
          }
        })
        .catch(() => {
          setLessonVideoUrl(vUrl);
        });
    } else {
      // It's an external URL (YouTube / Vimeo / Direct stream URL)
      setVideoInputUrl(vUrl);
      setLessonVideoUrl(vUrl);
    }

    // PDF
    const pUrl = les.pdfUrl || '';
    setLessonPdfUrl(pUrl);
    setUploadedPdfName(pUrl ? extractFileName(pUrl) : '');

    if (pUrl && !pUrl.startsWith('http://') && !pUrl.startsWith('https://')) {
      // It's a private relative storage path in lesson-documents
      setPdfInputUrl('');
    } else {
      // It's an external web PDF URL
      setPdfInputUrl(pUrl);
    }

    // Resource
    const rUrl = les.resourceUrl || '';
    setLessonResourceUrl(rUrl);
    setUploadedResourceName(rUrl ? extractFileName(rUrl) : '');

    if (rUrl && (rUrl.includes('lesson-resources') || rUrl.includes('/storage/v1/object/'))) {
      setResourceInputUrl('');
    } else {
      setResourceInputUrl(rUrl);
    }

    // Text & Description & Duration
    setLessonTextContent(les.textContent || '');
    setLessonShortDescription(les.shortDescription || '');
    setLessonDurationMinutes(Number(les.durationMinutes) > 0 ? Number(les.durationMinutes) : 10);
    setVideoPlaybackError(null);
    setHasUnsavedChanges(false);
  };

  // Flattened list of all lessons for fast previous/next traversal & progress calculation
  const allFlattenedLessons = useMemo(() => {
    return modules.flatMap((mod) =>
      mod.lessons.map((les) => ({
        ...les,
        moduleId: mod.id,
        moduleTitle: mod.title,
      }))
    );
  }, [modules]);

  // Construct PlayerLesson object for student VideoLessonPlayer preview
  const previewPlayerLesson: PlayerLesson = useMemo(() => ({
    id: activeLesson?.id || 'preview-lesson',
    moduleId: activeModule?.id || '',
    moduleTitle: activeModule?.title || '',
    title: activeLesson?.title || 'Lesson Video',
    duration: `${Number(lessonDurationMinutes) > 0 ? lessonDurationMinutes : activeLesson?.durationMinutes || 10}:00`,
    type: 'video',
    isCompleted: false,
    isBookmarked: false,
    videoUrl: lessonVideoUrl,
  }), [activeLesson?.id, activeLesson?.title, activeLesson?.durationMinutes, activeModule?.id, activeModule?.title, lessonDurationMinutes, lessonVideoUrl]);

  // Determine if a lesson has complete/ready content (checks active live state for selected lesson)
  const isLessonConfigured = useCallback(
    (les: CurriculumLesson): boolean => {
      const isSelected = les.id === selectedLessonId;

      if (les.type === 'Video') {
        const v = isSelected ? lessonVideoUrl : les.videoUrl;
        return Boolean(v && v.trim().length > 0);
      }
      if (les.type === 'PDF') {
        const p = isSelected ? lessonPdfUrl : les.pdfUrl;
        return Boolean(p && p.trim().length > 0);
      }
      if (les.type === 'Resource') {
        const r = isSelected ? lessonResourceUrl : les.resourceUrl;
        return Boolean(r && r.trim().length > 0);
      }
      if (les.type === 'Text') {
        const t = isSelected ? lessonTextContent : les.textContent;
        return Boolean(t && t.trim().length > 0);
      }
      return false;
    },
    [selectedLessonId, lessonVideoUrl, lessonPdfUrl, lessonResourceUrl, lessonTextContent]
  );

  const configuredCount = useMemo(() => {
    return allFlattenedLessons.filter(isLessonConfigured).length;
  }, [allFlattenedLessons]);

  const currentLessonIndex = useMemo(() => {
    return allFlattenedLessons.findIndex((l) => l.id === selectedLessonId);
  }, [allFlattenedLessons, selectedLessonId]);

  const prevLesson = currentLessonIndex > 0 ? allFlattenedLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allFlattenedLessons.length - 1
      ? allFlattenedLessons[currentLessonIndex + 1]
      : null;

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
        isLocked: false,
        videoUrl: bl.videoUrl || '',
        pdfUrl: bl.documentUrl || '',
        textContent: bl.content || '',
        resourceUrl: bl.resourceUrl || '',
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

  // Fetch courses list for dropdown in background
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

  // Load modules for the selected course with instant cache utilization and reliable lesson preservation
  const loadCurriculum = useCallback(async (preserveLessonId?: string) => {
    if (!selectedCourseId) return;
    const targetId = preserveLessonId || selectedLessonId;

    const cached = curriculumService.getCachedCourseModules(selectedCourseId);
    if (cached) {
      const mapped = mapBackendModulesToFrontend(cached);
      setModules(mapped);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await curriculumService.getInstructorCourseModules(selectedCourseId);
      if (res.success && res.data) {
        const mapped = mapBackendModulesToFrontend(res.data);
        setModules(mapped);

        if (mapped.length > 0) {
          let foundLesson: CurriculumLesson | undefined;
          let foundModuleId: string | undefined;

          if (targetId) {
            for (const mod of mapped) {
              const l = mod.lessons.find((item) => item.id === targetId);
              if (l) {
                foundLesson = l;
                foundModuleId = mod.id;
                break;
              }
            }
          }

          if (foundLesson && foundModuleId) {
            setSelectedModuleId(foundModuleId);
            setSelectedLessonId(foundLesson.id);
            applyLessonState(foundLesson);
          } else if (!targetId) {
            // Only select the first lesson if no lesson was ever selected before
            const firstMod = mapped[0];
            setSelectedModuleId(firstMod.id);
            if (firstMod.lessons.length > 0) {
              const firstLes = firstMod.lessons[0];
              setSelectedLessonId(firstLes.id);
              applyLessonState(firstLes);
            } else {
              setSelectedLessonId('');
              applyLessonState(undefined);
            }
          }
        } else {
          setSelectedModuleId('');
          setSelectedLessonId('');
          applyLessonState(undefined);
        }
      }
    } catch {
      // Keep cached state
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, selectedLessonId]);

  useEffect(() => {
    loadCurriculum();
  }, [selectedCourseId]);

  // When instructor clicks a different lesson in sidebar
  const handleSelectLesson = (modId: string, les: CurriculumLesson) => {
    setSelectedModuleId(modId);
    setSelectedLessonId(les.id);
    applyLessonState(les);
  };

  // Convert raw YouTube, Vimeo, or Video URL to embed/streamable format
  const formatVideoEmbedUrl = (rawUrl: string): string => {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return '';

    // If it's already an embed URL
    if (trimmed.includes('youtube.com/embed/') || trimmed.includes('youtube-nocookie.com/embed/')) {
      const idPart = (trimmed.split('embed/')[1] || '').split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${idPart}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
    }

    // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
    if (trimmed.includes('youtube.com/shorts/')) {
      const vId = trimmed.split('shorts/')[1]?.split('?')[0]?.split('&')[0];
      if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
    }

    // Standard YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (trimmed.includes('youtube.com/watch')) {
      try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const vId = urlObj.searchParams.get('v');
        if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
      } catch {
        const vId = trimmed.split('watch?v=')[1]?.split('&')[0];
        if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
      }
    }

    // Shortened YouTube URL: https://youtu.be/VIDEO_ID
    if (trimmed.includes('youtu.be/')) {
      const vId = trimmed.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
      if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
    }

    // YouTube live / other: youtube.com/live/VIDEO_ID
    if (trimmed.includes('youtube.com/live/')) {
      const vId = trimmed.split('live/')[1]?.split('?')[0]?.split('&')[0];
      if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
    }

    // Vimeo URL (must use player.vimeo.com/video/{id})
    if (trimmed.includes('player.vimeo.com/video/')) {
      return trimmed;
    }
    if (trimmed.includes('vimeo.com/')) {
      const match = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)(?:\/([a-zA-Z0-9]+))?/);
      if (match && match[1]) {
        const videoId = match[1];
        const privacyHash = match[2];
        return `https://player.vimeo.com/video/${videoId}${privacyHash ? `?h=${privacyHash}` : ''}`;
      }
      const parts = trimmed.split('vimeo.com/')[1]?.split('?')[0]?.split('/');
      const vId = parts?.find((p) => /^[0-9]+$/.test(p));
      if (vId) return `https://player.vimeo.com/video/${vId}`;
    }

    // Google Drive URL (convert /view, /open?id= into /preview for embedding)
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
      if (trimmed.includes('/file/d/')) {
        const fileId = trimmed.split('/file/d/')[1]?.split('/')[0]?.split('?')[0];
        if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
      } else if (trimmed.includes('id=')) {
        try {
          const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
          const fileId = urlObj.searchParams.get('id');
          if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
        } catch {}
      }
    }

    // Dailymotion URL (convert /video/ID or dai.ly/ID into /embed/video/ID)
    if (trimmed.includes('dailymotion.com') || trimmed.includes('dai.ly')) {
      if (trimmed.includes('dai.ly/')) {
        const vId = trimmed.split('dai.ly/')[1]?.split('?')[0]?.split('/')[0];
        if (vId) return `https://www.dailymotion.com/embed/video/${vId}?autoplay=0`;
      } else if (trimmed.includes('/video/')) {
        const vId = trimmed.split('/video/')[1]?.split('?')[0]?.split('/')[0];
        if (vId) return `https://www.dailymotion.com/embed/video/${vId}?autoplay=0`;
      } else if (trimmed.includes('/embed/video/')) {
        return trimmed;
      }
    }

    return trimmed;
  };

  // Preview & Validate Video Link
  const handlePreviewVideoLink = () => {
    const raw = videoInputUrl.trim();
    if (!raw) {
      showToast('Please enter a valid video URL.', 'warning');
      return;
    }

    setLessonVideoUrl(raw);
    setHasUnsavedChanges(true);
    showToast('Video link validated and preview generated!');
  };

  // Simulated upload progress helper for smooth UI feedback
  const runUploadAnimation = (callback: () => Promise<void>) => {
    setIsUploadingFile(true);
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 200);

    return callback()
      .then(() => {
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploadingFile(false);
          setUploadProgress(0);
        }, 500);
      })
      .catch((err) => {
        clearInterval(interval);
        setIsUploadingFile(false);
        setUploadProgress(0);
        throw err;
      });
  };

  // Upload Video File to Supabase Storage
  const handleVideoFileUpload = async (file: File) => {
    if (isLockedCourse) {
      showToast('Cannot upload video: Course is locked under Admin Review or Published.', 'warning');
      return;
    }
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      showToast('File is too large. Max video size is 100MB.', 'warning');
      return;
    }

    if (!file.type.startsWith('video/')) {
      showToast('Invalid file format. Please upload an MP4 or valid video file.', 'warning');
      return;
    }

    setVideoPlaybackError(null);

    try {
      await runUploadAnimation(async () => {
        const res = await curriculumService.uploadVideo(
          file,
          selectedLessonId,
          selectedCourseId,
          selectedModuleId
        );
        if (res.success && res.data) {
          const storagePath = res.data.path || res.data.url;
          const playbackUrl = res.data.url;

          setLessonVideoUrl(playbackUrl);
          setVideoInputUrl('');
          setUploadedVideoName(res.data.fileName || file.name);

          // Try to detect video duration from file metadata
          let detectedDuration = 10;
          try {
            const videoElem = document.createElement('video');
            videoElem.preload = 'metadata';
            videoElem.onloadedmetadata = () => {
              window.URL.revokeObjectURL(videoElem.src);
              const durationMins = Math.max(1, Math.round(videoElem.duration / 60));
              if (durationMins > 0) {
                setLessonDurationMinutes(durationMins);
                detectedDuration = durationMins;
              }
            };
            videoElem.src = URL.createObjectURL(file);
          } catch {
            // fallback gracefully
          }

          // Auto-persist storage path to backend database immediately
          if (selectedLessonId) {
            await curriculumService.updateLesson(selectedLessonId, {
              videoUrl: storagePath,
              durationMinutes: Math.max(1, Number(lessonDurationMinutes) || detectedDuration),
            });
          }

          setHasUnsavedChanges(false);
          showToast(`Video "${res.data.fileName || file.name}" uploaded & saved successfully!`);
          // Refresh curriculum from backend
          await loadCurriculum(selectedLessonId);
        }
      });
    } catch (err: any) {
      setVideoPlaybackError(err.message || 'Failed to upload video file');
      showToast(err.message || 'Failed to upload video file', 'warning');
    }
  };

  // Remove Video from Lesson (persists immediately to backend & storage)
  const handleRemoveVideo = async () => {
    if (isLockedCourse) {
      showToast('Cannot remove video: Course is locked under Admin Review or Published.', 'warning');
      return;
    }
    if (!selectedLessonId) return;

    try {
      setIsSaving(true);
      // Persist deletion to backend (which cleans up Supabase storage and resets video_url to null)
      const res = await curriculumService.updateLesson(selectedLessonId, {
        videoUrl: null,
      });

      if (res.success) {
        setLessonVideoUrl('');
        setVideoInputUrl('');
        setUploadedVideoName('');
        setHasUnsavedChanges(false);
        showToast('Video removed successfully.');
        // Refresh curriculum from backend database
        await loadCurriculum(selectedLessonId);
      } else {
        showToast(res.message || 'Failed to remove video.', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove video.', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  // View PDF Document (handles both private Supabase Storage paths & external URLs)
  const handleViewPdf = async (urlOrPath?: string) => {
    const target = urlOrPath || lessonPdfUrl;
    if (!target) {
      showToast('No PDF document attached to view.', 'warning');
      return;
    }

    // If it's already a full external URL (http/https), open directly
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank');
      return;
    }

    // Otherwise it's a private Supabase Storage path in 'lesson-documents'
    try {
      const res = await curriculumService.getSignedDocumentUrl(target, false);
      if (res.success && res.data?.signedUrl) {
        window.open(res.data.signedUrl, '_blank');
      } else {
        showToast(res.message || 'Failed to generate signed document URL.', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Storage bucket error generating document preview.', 'warning');
    }
  };

  // Download PDF Document (handles both private Supabase Storage paths & external URLs)
  const handleDownloadPdf = async (urlOrPath?: string, filename?: string) => {
    const target = urlOrPath || lessonPdfUrl;
    if (!target) {
      showToast('No PDF document attached to download.', 'warning');
      return;
    }

    const downloadName = filename || uploadedPdfName || `${activeLesson.title || 'document'}.pdf`;

    // If it's already a full external URL (http/https), open directly
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank');
      return;
    }

    // Otherwise request signed download URL for 'lesson-documents'
    try {
      const res = await curriculumService.getSignedDocumentUrl(target, true, downloadName);
      if (res.success && res.data?.signedUrl) {
        window.open(res.data.signedUrl, '_blank');
      } else {
        showToast(res.message || 'Failed to generate signed download URL.', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Storage bucket error generating document download.', 'warning');
    }
  };

  // Upload PDF Document to Supabase Storage (lesson-documents)
  const handlePdfUpload = async (file: File) => {
    if (isLockedCourse) {
      showToast('Cannot upload PDF: Course is locked under Admin Review or Published.', 'warning');
      return;
    }
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please select a valid PDF file (application/pdf).', 'warning');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      showToast('File is too large. Max document size is 30MB.', 'warning');
      return;
    }

    try {
      await runUploadAnimation(async () => {
        const res = await curriculumService.uploadDocument(
          file,
          selectedLessonId,
          selectedCourseId,
          selectedModuleId
        );
        if (res.success && res.data) {
          // Store storage path in lessonPdfUrl (e.g. courseId/moduleId/lessonId/filename.pdf)
          const savedPath = res.data.path || res.data.url;
          setLessonPdfUrl(savedPath);
          setPdfInputUrl('');
          setUploadedPdfName(res.data.fileName || file.name);

          // Auto-persist PDF storage path to backend database immediately
          if (selectedLessonId) {
            await curriculumService.updateLesson(selectedLessonId, {
              documentUrl: savedPath,
            });
          }

          setHasUnsavedChanges(false);
          showToast(`PDF document "${res.data.fileName || file.name}" uploaded & saved successfully!`);
          // Refresh curriculum from backend
          await loadCurriculum(selectedLessonId);
        }
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to upload PDF document', 'warning');
    }
  };

  // Remove PDF Document from Lesson (persists immediately to backend & storage)
  const handleRemovePdf = async () => {
    if (isLockedCourse) {
      showToast('Cannot remove PDF: Course is locked under Admin Review or Published.', 'warning');
      return;
    }
    if (!selectedLessonId) return;

    try {
      setIsSaving(true);
      // Persist deletion to backend (which cleans up Supabase storage and resets document_url to null)
      const res = await curriculumService.updateLesson(selectedLessonId, {
        documentUrl: null,
      });

      if (res.success) {
        setLessonPdfUrl('');
        setPdfInputUrl('');
        setUploadedPdfName('');
        setHasUnsavedChanges(false);
        showToast('PDF document removed successfully.');
        // Refresh curriculum from backend database
        await loadCurriculum(selectedLessonId);
      } else {
        showToast(res.message || 'Failed to remove PDF document.', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove PDF document.', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Downloadable Resource to Supabase Storage
  const handleResourceUpload = async (file: File) => {
    if (isLockedCourse) {
      showToast('Cannot upload resource: Course is locked under Admin Review or Published.', 'warning');
      return;
    }
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('File is too large. Max resource file size is 50MB.', 'warning');
      return;
    }

    try {
      await runUploadAnimation(async () => {
        const res = await curriculumService.uploadResource(
          file,
          selectedLessonId,
          selectedCourseId,
          selectedModuleId
        );
        if (res.success && res.data) {
          const resourceUrl = res.data.url;
          setLessonResourceUrl(resourceUrl);
          setResourceInputUrl('');
          setUploadedResourceName(res.data.fileName || file.name);

          // Auto-persist resource URL to backend database immediately
          if (selectedLessonId) {
            await curriculumService.updateLesson(selectedLessonId, {
              resourceUrl: resourceUrl,
            });
          }

          setHasUnsavedChanges(false);
          showToast(`Resource file "${res.data.fileName || file.name}" uploaded & saved successfully!`);
          // Refresh curriculum from backend
          await loadCurriculum(selectedLessonId);
        }
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to upload resource file', 'warning');
    }
  };

  // Remove Resource File/URL from Lesson (persists immediately to backend & storage)
  const handleRemoveResource = async () => {
    if (isLockedCourse) {
      showToast('Cannot remove resource: Course is locked under Admin Review or Published.', 'warning');
      return;
    }
    if (!selectedLessonId) return;

    try {
      setIsSaving(true);
      const res = await curriculumService.updateLesson(selectedLessonId, {
        resourceUrl: null,
      });

      if (res.success) {
        setLessonResourceUrl('');
        setResourceInputUrl('');
        setUploadedResourceName('');
        setHasUnsavedChanges(false);
        showToast('Resource removed successfully.');
        await loadCurriculum(selectedLessonId);
      } else {
        showToast(res.message || 'Failed to remove resource.', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove resource.', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLockedCourse) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isLockedCourse) {
      showToast('Course content is locked while under Admin Review or Published.', 'warning');
      return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (activeLesson.type === 'Video') {
      handleVideoFileUpload(file);
    } else if (activeLesson.type === 'PDF') {
      handlePdfUpload(file);
    } else if (activeLesson.type === 'Resource') {
      handleResourceUpload(file);
    }
  };

  // Markdown Rich Formatting Helper
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
    if (isLockedCourse) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end) || placeholder;

    const updated = current.substring(0, start) + prefix + selected + suffix + current.substring(end);
    setLessonTextContent(updated);
    setHasUnsavedChanges(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // Save Lesson Content to Backend
  const handleSaveLessonContent = async (isPublishAndContinue: boolean = false) => {
    if (isLockedCourse) {
      showToast('Course content is locked while under Admin Review or published.', 'warning');
      return;
    }
    if (!selectedLessonId) {
      showToast('No active lesson selected to save.', 'warning');
      return;
    }

    // Determine final values to save based on selected Content Source
    let finalVideoUrl: string | null = null;
    let finalDocumentUrl: string | null = null;
    let finalResourceUrl: string | null = null;
    const finalContent: string | null = lessonTextContent.trim() || null;

    if (activeLesson.type === 'Video') {
      if (contentSource === 'url') {
        const raw = videoInputUrl.trim() || lessonVideoUrl.trim();
        if (!raw) {
          showToast('Validation Error: Please enter a valid video URL.', 'warning');
          return;
        }
        finalVideoUrl = raw;
      } else {
        if (!lessonVideoUrl.trim()) {
          showToast('Validation Error: Please upload a video file first.', 'warning');
          return;
        }
        // If activeLesson already has a storage path, preserve that relative path; otherwise use lessonVideoUrl
        const existingPath = activeLesson.videoUrl || '';
        if (existingPath && !existingPath.startsWith('http://') && !existingPath.startsWith('https://')) {
          finalVideoUrl = existingPath;
        } else {
          finalVideoUrl = lessonVideoUrl.trim();
        }
      }
    }

    if (activeLesson.type === 'PDF') {
      if (!lessonPdfUrl.trim()) {
        showToast('Validation Error: Please upload a PDF document first.', 'warning');
        return;
      }
      const existingPath = activeLesson.pdfUrl || '';
      if (existingPath && !existingPath.startsWith('http://') && !existingPath.startsWith('https://')) {
        finalDocumentUrl = existingPath;
      } else {
        finalDocumentUrl = lessonPdfUrl.trim();
      }
    }

    if (activeLesson.type === 'Resource') {
      if (contentSource === 'url') {
        const raw = resourceInputUrl.trim();
        if (!raw) {
          showToast('Validation Error: Please enter an external resource URL.', 'warning');
          return;
        }
        finalResourceUrl = raw;
      } else {
        if (!lessonResourceUrl.trim()) {
          showToast('Validation Error: Please upload a resource file first.', 'warning');
          return;
        }
        finalResourceUrl = lessonResourceUrl.trim();
      }
    }

    if (activeLesson.type === 'Text' && !finalContent) {
      showToast('Validation Error: Text lesson requires article content.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const res = await curriculumService.updateLesson(selectedLessonId, {
        shortDescription: lessonShortDescription.trim(),
        videoUrl: finalVideoUrl,
        documentUrl: finalDocumentUrl,
        content: finalContent,
        resourceUrl: finalResourceUrl,
        durationMinutes: activeLesson.type === 'PDF' ? 0 : Math.max(1, Number(lessonDurationMinutes) || 10),
      });

      if (res.success && res.data) {
        // Update local lesson state from verified backend response
        const updatedVideo = res.data.videoUrl || '';
        const updatedDoc = res.data.documentUrl || '';
        const updatedRes = res.data.resourceUrl || '';
        const updatedCont = res.data.content || '';
        const updatedDur = Number(res.data.durationMinutes) || 10;

        // If updatedVideo is a relative storage path (Uploaded Video), preserve the valid active playback URL
        // or resolve a new signed URL so the preview player does not attempt to play the raw relative path
        if (updatedVideo && !updatedVideo.startsWith('http://') && !updatedVideo.startsWith('https://')) {
          setVideoInputUrl('');
          if (!lessonVideoUrl || (!lessonVideoUrl.startsWith('http://') && !lessonVideoUrl.startsWith('https://'))) {
            curriculumService.getSignedVideoUrl(updatedVideo).then((signRes) => {
              if (signRes.success && signRes.data?.signedUrl) {
                setLessonVideoUrl(signRes.data.signedUrl);
                setVideoPlaybackError(null);
              }
            });
          }
        } else {
          setLessonVideoUrl(updatedVideo);
          setVideoInputUrl(updatedVideo && (updatedVideo.startsWith('http://') || updatedVideo.startsWith('https://')) && !updatedVideo.includes('lesson-resources') ? updatedVideo : '');
        }

        setVideoPlaybackError(null);
        setLessonPdfUrl(updatedDoc);
        setPdfInputUrl(updatedDoc && (updatedDoc.startsWith('http://') || updatedDoc.startsWith('https://')) && !updatedDoc.includes('lesson-documents') ? updatedDoc : '');
        setLessonResourceUrl(updatedRes);
        setResourceInputUrl(updatedRes && (updatedRes.startsWith('http://') || updatedRes.startsWith('https://')) && !updatedRes.includes('lesson-resources') ? updatedRes : '');
        setLessonTextContent(updatedCont);
        setLessonDurationMinutes(updatedDur);
        setHasUnsavedChanges(false);

        if (isPublishAndContinue) {
          // Check that every lesson in every module has content before proceeding
          const isLessonComplete = (l: CurriculumLesson): boolean => {
            switch (l.type) {
              case 'Video':    return !!(l.videoUrl?.trim());
              case 'PDF':      return !!(l.pdfUrl?.trim());
              case 'Text':     return !!(l.textContent?.trim());
              case 'Resource': return !!(l.resourceUrl?.trim());
              default:         return false;
            }
          };

          // Build list of incomplete lessons using current modules state
          const incompleteLessons: string[] = [];
          for (const mod of modules) {
            for (const les of mod.lessons) {
              if (!isLessonComplete(les)) {
                incompleteLessons.push(`"${les.title}" (${mod.title})`);
              }
            }
          }

          if (incompleteLessons.length > 0) {
            await showWarningAlert(
              'Incomplete Lessons',
              `Please complete all lessons before proceeding to Step 4. The following ${incompleteLessons.length === 1 ? 'lesson is' : `${incompleteLessons.length} lessons are`} missing content:\n\n${incompleteLessons.slice(0, 5).map((n) => `• ${n}`).join('\n')}${incompleteLessons.length > 5 ? `\n• ...and ${incompleteLessons.length - 5} more` : ''}`
            );
            return;
          }

          showSuccessAlert(
            'All Lessons Complete!',
            `Curriculum is ready. Proceeding to Step 4.`
          );
          setTimeout(() => {
            navigate(`/instructor/assignments?courseId=${selectedCourseId}`);
          }, 800);
        } else {
          showToast(`Lesson "${activeLesson.title}" draft saved successfully!`);
          await loadCurriculum(selectedLessonId);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save lesson content', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  const getLessonTypeIcon = (type: LessonType) => {
    switch (type) {
      case 'Video':
        return <FiVideo className="w-3.5 h-3.5 text-sky-500" />;
      case 'PDF':
        return <FiFileText className="w-3.5 h-3.5 text-rose-500" />;
      case 'Text':
        return <FiCode className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Resource':
        return <FiPackage className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <FiFileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Filter lessons based on search query
  const filteredModules = useMemo(() => {
    if (!lessonSearchQuery.trim()) return modules;
    const q = lessonSearchQuery.toLowerCase();
    return modules
      .map((mod) => ({
        ...mod,
        lessons: mod.lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.type.toLowerCase().includes(q) ||
            (l.shortDescription && l.shortDescription.toLowerCase().includes(q))
        ),
      }))
      .filter((mod) => mod.lessons.length > 0 || mod.title.toLowerCase().includes(q));
  }, [modules, lessonSearchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Step 3 Progress Tracker */}
      <CourseProgressTracker currentStep={3} courseId={selectedCourseId} completedSteps={[1, 2]} />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/40'
                : 'bg-slate-900/90 border-brand-500/40 text-slate-100'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                toast.type === 'success'
                  ? 'bg-emerald-400 animate-ping'
                  : toast.type === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-brand-400'
              }`}
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                {course.difficulty}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-0.5 rounded-lg">
                  {course.category}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <FiLayers className="w-3.5 h-3.5 text-indigo-400" />
                  {modules.length} Modules &bull; {allFlattenedLessons.length} Lessons
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {course.title}
              </h1>

              <p className="text-xs text-slate-300 max-w-xl line-clamp-1">
                Upload media streams, configure reading documentation, and bind interactive starter packages.
              </p>
            </div>
          </div>

          {/* Right Metrics & Course Selector */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
            <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
              <div className="text-left sm:text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Content Readiness
                </div>
                <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <FiCheckCircle className="w-4 h-4" />
                  {configuredCount} / {allFlattenedLessons.length} Ready
                </div>
              </div>
              <div className="w-12 h-12 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${
                      allFlattenedLessons.length > 0
                        ? (configuredCount / allFlattenedLessons.length) * 100
                        : 0
                    }, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">
                  {allFlattenedLessons.length > 0
                    ? Math.round((configuredCount / allFlattenedLessons.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* Course Switcher */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSearchParams({ courseId: e.target.value });
                }}
                className="w-full sm:w-64 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
              >
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Published / Pending Approval Course Lock Banner */}
      {isLockedCourse && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs font-medium">
          <FiLock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">
              {(course as any)?.approvalStatus === 'Pending Approval' ? 'Course Under Admin Review (Content Locked):' : 'Published Course (Content Locked):'}
            </span>{' '}
            {(course as any)?.approvalStatus === 'Pending Approval'
              ? 'Video uploads, documents, and lesson materials are locked while under Admin Review.'
              : 'Video uploads, documents, and lesson materials are locked to protect active student learning records.'}
          </div>
        </div>
      )}

      {/* 2. Top Action Bar & Status Breadcrumbs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/instructor/curriculum?courseId=${selectedCourseId}`)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiArrowLeft className="w-4 h-4" /> Step 2 (Curriculum)
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40 animate-pulse">
              <FiAlertCircle className="w-3.5 h-3.5" /> Unsaved changes in current lesson
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              <FiCheck className="w-3.5 h-3.5" /> All content synced
            </span>
          )}
        </div>

        {/* Quick Save and Preview Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <FiEye className="w-4 h-4 text-slate-500" />
            {isPreviewOpen ? 'Edit Studio' : 'Live Preview'}
          </Button>

          <Button
            variant="outline"
            size="md"
            disabled={isLockedCourse || isSaving}
            onClick={() => handleSaveLessonContent(false)}
            className="text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <FiRefreshCw className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <FiCheck className="w-4 h-4 text-brand-600" />
            )}
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={isLockedCourse || isSaving}
            onClick={() => handleSaveLessonContent(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiSend className="w-4 h-4" /> Next Step (Assignments)
          </Button>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse">
          {/* Skeleton Sidebar */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 h-[740px] flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-slate-700" />
              </div>
              {/* Search bar */}
              <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
              {/* Module 1 */}
              <div className="space-y-2">
                <div className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 pl-4 py-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 rounded bg-slate-200 dark:bg-slate-700 w-3/4" />
                      <div className="h-2 rounded bg-slate-100 dark:bg-slate-800 w-1/2" />
                    </div>
                    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                  </div>
                ))}
              </div>
              {/* Module 2 */}
              <div className="space-y-2">
                <div className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 pl-4 py-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 rounded bg-slate-200 dark:bg-slate-700 w-2/3" />
                      <div className="h-2 rounded bg-slate-100 dark:bg-slate-800 w-1/3" />
                    </div>
                    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton Main Panel */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top lesson header card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded-lg bg-slate-200 dark:bg-slate-700 w-1/2" />
                  <div className="h-2.5 rounded bg-slate-100 dark:bg-slate-800 w-1/3" />
                </div>
                <div className="h-7 w-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            </div>

            {/* Content area card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-5">
              <div className="flex gap-3">
                <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="h-9 w-28 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-2">
                <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 w-full" />
                <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 w-5/6" />
                <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 w-4/6" />
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              <div className="flex justify-end gap-3">
                <div className="h-9 w-28 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-9 w-36 rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      ) : modules.length === 0 ? (
        <Card className="p-16 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-4 text-brand-600 dark:text-brand-400">
            <FiLayers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Modules or Lessons Available
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 mb-6">
            You must structure your curriculum with modules and lessons before configuring lesson video streams and resources.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/instructor/curriculum?courseId=${selectedCourseId}`)}
            className="shadow-md"
          >
            <FiPlus className="w-4 h-4 mr-2" /> Go to Curriculum Builder
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Lesson Navigation Studio Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl flex flex-col h-[740px] max-h-[calc(100vh-100px)]">
              {/* Sidebar Header & Search */}
              <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <FiLayers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Curriculum Tree
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md">
                    {configuredCount}/{allFlattenedLessons.length} Ready
                  </span>
                </div>

                {/* Lesson Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={lessonSearchQuery}
                    onChange={(e) => setLessonSearchQuery(e.target.value)}
                    placeholder="Search lessons..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Module & Lesson List Container */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-3 custom-scrollbar">
                {filteredModules.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No lessons found matching &quot;{lessonSearchQuery}&quot;
                  </div>
                ) : (
                  filteredModules.map((mod, modIdx) => {
                    const modConfigured = mod.lessons.filter(isLessonConfigured).length;
                    return (
                      <div key={mod.id} className="space-y-1.5">
                        {/* Module Section Header */}
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {modIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {mod.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            {modConfigured}/{mod.lessons.length}
                          </span>
                        </div>

                        {/* Lessons in Module */}
                        <div className="space-y-1 pl-1">
                          {mod.lessons.map((les) => {
                            const isSelected = les.id === selectedLessonId;
                            const isReady = isLessonConfigured(les);

                            return (
                              <button
                                key={les.id}
                                onClick={() => handleSelectLesson(mod.id, les)}
                                className={`w-full text-left p-2.5 rounded-2xl text-xs font-medium flex items-center justify-between transition-all duration-150 group ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-indigo-600 to-brand-600 text-white shadow-md font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate pr-2">
                                  <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {getLessonTypeIcon(les.type)}
                                  </div>
                                  <div className="truncate">
                                    <div className="truncate text-xs font-semibold">{les.title}</div>
                                    <div
                                      className={`text-[10px] flex items-center gap-1.5 ${
                                        isSelected ? 'text-indigo-100' : 'text-slate-400'
                                      }`}
                                    >
                                      <span>{les.type === 'PDF' ? 'PDF Document' : 'Video'}</span>
                                      {les.type !== 'PDF' && (
                                        <>
                                          <span>&bull;</span>
                                          <span>{les.durationMinutes} min</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Status Dot / Icon */}
                                <div className="shrink-0 flex items-center gap-1.5">
                                  {isReady ? (
                                    <span
                                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                        isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                      }`}
                                      title="Content Ready"
                                    >
                                      <FiCheck className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        isSelected ? 'bg-amber-300 animate-ping' : 'bg-amber-400/80'
                                      }`}
                                      title="Content Pending"
                                    />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer Navigation */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  disabled={!prevLesson}
                  onClick={() => prevLesson && handleSelectLesson(prevLesson.moduleId, prevLesson)}
                  className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-500 font-semibold px-2 py-1 rounded-lg transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" /> Prev
                </button>

                <span className="text-[11px] text-slate-400 font-mono">
                  {currentLessonIndex >= 0 ? `${currentLessonIndex + 1} of ${allFlattenedLessons.length}` : '—'}
                </span>

                <button
                  disabled={!nextLesson}
                  onClick={() => nextLesson && handleSelectLesson(nextLesson.moduleId, nextLesson)}
                  className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-500 font-semibold px-2 py-1 rounded-lg transition-colors"
                >
                  Next <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </div>

          {/* Right Column: Selected Lesson Content Editor / Preview Studio (8 Cols) */}
          <div className="lg:col-span-8 space-y-6 max-h-[calc(100vh-100px)] overflow-y-auto pr-1.5 custom-scrollbar">
            {!selectedLessonId ? (
              <Card className="p-16 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
                <FiFileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Select a lesson to manage content
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click any lesson in the curriculum tree to configure video streams, PDF guides, markdown articles, or downloadable assets.
                </p>
              </Card>
            ) : isPreviewOpen ? (
              /* ============================================================ */
              /* LIVE STUDENT LEARNING PLAYER PREVIEW SIMULATION */
              /* ============================================================ */
              <div className="space-y-6">
                {/* 1. Student Player Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Course Info & Live Simulation Badge */}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hidden xs:block">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 uppercase tracking-wider flex items-center gap-1">
                            <FiEye className="w-3.5 h-3.5" /> Student Player Simulation
                          </span>
                          <Badge variant="primary">{course.category || 'Development'}</Badge>
                        </div>

                        <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {course.title}
                        </h1>

                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            Instructor: You
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">
                            {allFlattenedLessons.length} Lessons Total
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Exit Preview and Progress Summary */}
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Content Progress</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {configuredCount} of {allFlattenedLessons.length} ready ({allFlattenedLessons.length > 0 ? Math.round((configuredCount / allFlattenedLessons.length) * 100) : 0}%)
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPreviewOpen(false)}
                        className="text-xs font-bold shadow-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                      >
                        Back to Studio
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2. Content Tabs Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
                  <div className="flex items-center gap-1.5" role="tablist" aria-label="Learning content tabs">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeLesson.type === 'Video'}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeLesson.type === 'Video'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FiVideo className="w-4 h-4" />
                      <span>Video Lesson</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeLesson.type === 'PDF'}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeLesson.type === 'PDF'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FiFileText className="w-4 h-4" />
                      <span>PDF Document</span>
                    </button>
                  </div>
                </div>

                {/* 3. Main Player Canvas Area */}
                <div className="relative min-h-[400px]">
                  {/* Video Player */}
                  {activeLesson.type === 'Video' && (
                    <div className="space-y-6">
                      <div className="relative group w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 flex flex-col justify-between">
                        {lessonVideoUrl ? (
                          <VideoLessonPlayer key={lessonVideoUrl} lesson={previewPlayerLesson} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
                            <FiVideo className="w-12 h-12 text-slate-600 mb-2" />
                            <span className="font-bold text-slate-300 text-sm">No video has been added to this lesson.</span>
                            <span className="text-slate-500 mt-1">
                              Switch to Studio mode to attach a video stream URL or upload a file.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lesson Details Banner */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-3 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                              {activeModule?.title || 'Course Module'}
                            </span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                              {activeLesson.title}
                            </h2>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono shrink-0">
                            <FiClock className="w-4 h-4 text-brand-500" />
                            <span>
                              Duration:{' '}
                              {Number(lessonDurationMinutes) > 0
                                ? lessonDurationMinutes
                                : activeLesson.durationMinutes > 0
                                ? activeLesson.durationMinutes
                                : 10}{' '}
                              mins
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {lessonShortDescription ||
                            'In this lesson, we walk step-by-step through practical implementations and best practice patterns. Follow along using the attached resources.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PDF Document Viewer */}
                  {activeLesson.type === 'PDF' && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <FiFileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                              {uploadedPdfName || activeLesson.title + ' (PDF Document)'}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Interactive PDF Document • Student Study Guide
                            </p>
                          </div>
                        </div>

                        {lessonPdfUrl && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(lessonPdfUrl, uploadedPdfName)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                            >
                              <FiDownload className="w-4 h-4" /> Download PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewPdf(lessonPdfUrl)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <FiExternalLink className="w-4 h-4" /> View Fullscreen
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-950 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-[500px] flex items-center justify-center overflow-auto shadow-inner">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 sm:p-12 w-full max-w-3xl space-y-6 text-slate-800 dark:text-slate-200">
                          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-widest">
                              <FiFileText className="w-4 h-4" /> EduSphere Course Document
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              PAGE 1 / 1
                            </span>
                          </div>

                          <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                              {activeLesson.title}
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                              {activeModule?.title || 'General'} — Architectural Blueprint
                            </p>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs leading-relaxed space-y-2">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                                Overview & Objectives
                              </h4>
                              <p>
                                {lessonShortDescription ||
                                  'This document serves as an authoritative reference manual for this learning unit.'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                            <span>EduSphere LMS Technical Masterclass Library</span>
                            <span>Status: Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text Lesson Reader */}
                  {activeLesson.type === 'Text' && (
                    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-3xl space-y-8 shadow-xs text-slate-800 dark:text-slate-200">
                      <header className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                          <FiCode className="w-4 h-4" /> Text Reading Module
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                          {activeLesson.title}
                        </h1>
                        {lessonShortDescription && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                            {lessonShortDescription}
                          </p>
                        )}
                      </header>

                      {lessonTextContent ? (
                        <div className="p-6 bg-brand-50/40 dark:bg-brand-950/30 rounded-2xl border border-brand-200/60 dark:border-brand-900/50 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-sans">
                          {lessonTextContent}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-400 italic text-xs">
                          No reading article content entered yet.
                        </div>
                      )}
                    </article>
                  )}

                  {/* Resource Lesson View */}
                  {activeLesson.type === 'Resource' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Downloadable Lesson Attachments
                          </h2>
                          <p className="text-xs text-slate-500">
                            Access exercise starter projects, slides, and cheat sheets.
                          </p>
                        </div>
                        <Badge variant="primary">1 File Linked</Badge>
                      </div>

                      {lessonResourceUrl ? (
                        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                              <FiPackage className="w-6 h-6" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                                {uploadedResourceName || activeLesson.title + ' (Resource Bundle)'}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="uppercase font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                  ZIP / Asset
                                </span>
                              </div>
                            </div>
                          </div>

                          <a
                            href={lessonResourceUrl}
                            target="_blank"
                            download
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                          >
                            <FiDownload className="w-4 h-4" /> Download
                          </a>
                        </Card>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center space-y-2">
                          <FiPackage className="w-8 h-8 text-slate-400 mx-auto" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Resource Uploaded</h4>
                          <p className="text-xs text-slate-500">Attach a ZIP starter project or resource URL in the editor.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Student Linear Navigation Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => prevLesson && handleSelectLesson(prevLesson.moduleId, prevLesson)}
                    disabled={!prevLesson}
                    className="flex items-center gap-2 disabled:opacity-40 text-xs font-bold"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    <span>Previous Lesson</span>
                  </Button>

                  <span className="text-xs text-slate-400 font-mono">
                    Lesson {currentLessonIndex + 1} of {allFlattenedLessons.length}
                  </span>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => nextLesson && handleSelectLesson(nextLesson.moduleId, nextLesson)}
                    disabled={!nextLesson}
                    className="flex items-center gap-2 disabled:opacity-40 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    <span>Next Lesson</span>
                    <FiChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* STUDIO LESSON CONTENT EDITOR */
              /* ============================================================ */
              <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-6">
                {/* Editor Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      {getLessonTypeIcon(activeLesson.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Module: {activeModule?.title || 'General'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <Badge variant="primary" className="text-[10px] py-0.5 px-2">
                          {activeLesson.type} Lesson
                        </Badge>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {activeLesson.title}
                      </h2>
                    </div>
                  </div>

                  {/* Readiness status badge */}
                  <div>
                    {isLessonConfigured(activeLesson) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                        <FiCheckCircle className="w-4 h-4" /> Ready for Students
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800/40">
                        <FiAlertCircle className="w-4 h-4" /> Content Missing
                      </span>
                    )}
                  </div>
                </div>

                {/* Lesson Description & Duration Fields */}
                {activeLesson.type === 'PDF' ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Lesson Summary & Reading Objectives
                    </label>
                    <textarea
                      rows={2}
                      value={lessonShortDescription}
                      onChange={(e) => {
                        setLessonShortDescription(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Briefly state what students will understand or learn from this PDF document..."
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Lesson Summary & Learning Goals
                      </label>
                      <textarea
                        rows={2}
                        value={lessonShortDescription}
                        onChange={(e) => {
                          setLessonShortDescription(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Briefly state what students will understand or build by completing this lesson..."
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Video Duration (Mins)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="600"
                          value={lessonDurationMinutes === '' ? '' : lessonDurationMinutes}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setLessonDurationMinutes('');
                            } else {
                              const parsed = parseInt(val, 10);
                              if (!isNaN(parsed) && parsed >= 0) {
                                setLessonDurationMinutes(parsed);
                              }
                            }
                            setHasUnsavedChanges(true);
                          }}
                          onBlur={() => {
                            if (lessonDurationMinutes === '' || Number(lessonDurationMinutes) < 1) {
                              setLessonDurationMinutes(activeLesson.durationMinutes > 0 ? activeLesson.durationMinutes : 10);
                            }
                          }}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                          mins
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* 1. VIDEO LESSON STUDIO FORM */}
                {/* ============================================================ */}
                {activeLesson.type === 'Video' && (
                  <div className="space-y-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Source Selector Pill */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <FiVideo className="w-4 h-4 text-sky-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Video Delivery Source
                        </span>
                      </div>
                      <div className="inline-flex p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <button
                          type="button"
                          disabled={isLockedCourse}
                          onClick={() => {
                            setContentSource('url');
                            setHasUnsavedChanges(true);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            contentSource === 'url'
                              ? 'bg-brand-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          <FiLink className="inline w-3 h-3 mr-1" /> URL
                        </button>
                        <button
                          type="button"
                          disabled={isLockedCourse}
                          onClick={() => {
                            setContentSource('upload');
                            setHasUnsavedChanges(true);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            contentSource === 'upload'
                              ? 'bg-brand-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          <FiUploadCloud className="inline w-3 h-3 mr-1" /> Upload Video File
                        </button>
                      </div>
                    </div>

                    {/* Option A: Enter Video Embed URL */}
                    {contentSource === 'url' && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Video Stream URL (YouTube, Vimeo, Google Drive, Dailymotion, Cloudinary, MP4)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="https://www.youtube.com/... or Google Drive / Vimeo / Dailymotion / MP4 link"
                            value={videoInputUrl}
                            disabled={isLockedCourse}
                            onChange={(e) => {
                              setVideoInputUrl(e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <Button
                            variant="outline"
                            size="md"
                            disabled={isLockedCourse}
                            onClick={handlePreviewVideoLink}
                            className="text-xs font-bold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Verify & Embed
                          </Button>
                          {(videoInputUrl || lessonVideoUrl) && (
                            <Button
                              variant="ghost"
                              size="md"
                              disabled={isLockedCourse}
                              onClick={handleRemoveVideo}
                              className="text-xs font-bold text-rose-500 hover:text-rose-700 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FiTrash2 className="w-3.5 h-3.5 mr-1" /> Clear
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <FiInfo className="w-3.5 h-3.5 text-slate-400" /> Supports YouTube, Vimeo, Google Drive (shared with link), Dailymotion, and direct MP4 video streams.
                        </p>
                      </div>
                    )}

                    {/* Option B: Drag and Drop Upload Zone */}
                    {contentSource === 'upload' && (
                      <div className="space-y-4">
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 ${
                            isLockedCourse
                              ? 'opacity-60 cursor-not-allowed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50'
                              : isDragOver
                              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01] cursor-pointer'
                              : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 bg-slate-50/50 dark:bg-slate-850/50 cursor-pointer'
                          }`}
                        >
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleVideoFileUpload(f);
                            }}
                            disabled={isLockedCourse || isUploadingFile}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />

                          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto mb-3 shadow-xs">
                            <FiUploadCloud className="w-7 h-7" />
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            {isLockedCourse
                              ? 'Video upload locked while under review or published'
                              : isUploadingFile
                              ? 'Uploading video to Cloud Storage...'
                              : 'Drag & drop video file here or browse'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Supports MP4, WebM, MOV, MKV up to 100MB
                          </p>

                          {/* Upload Progress Bar */}
                          {isUploadingFile && (
                            <div className="mt-4 max-w-xs mx-auto space-y-1.5">
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-500 to-brand-500 transition-all duration-300 rounded-full"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {uploadProgress}% uploaded
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Uploaded File Chip */}
                        {lessonVideoUrl && (
                          <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5 truncate pr-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                                <FiVideo className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {uploadedVideoName || extractFileName(lessonVideoUrl)}
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" /> Storage asset linked
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isLockedCourse}
                              onClick={handleRemoveVideo}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FiTrash2 className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Video Player Canvas */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <FiZap className="w-3.5 h-3.5 text-brand-500" /> Active Video Stream:
                        </span>
                        {lessonVideoUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(formatVideoEmbedUrl(lessonVideoUrl), '_blank')}
                            className="hover:text-brand-600 inline-flex items-center gap-1"
                          >
                            <FiExternalLink className="w-3 h-3" /> Direct Link
                          </button>
                        )}
                      </div>
                      <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-xl relative">
                        {lessonVideoUrl ? (
                          <VideoLessonPlayer
                            key={lessonVideoUrl}
                            lesson={previewPlayerLesson}
                            showDetailsBanner={false}
                            className="rounded-3xl border-0 shadow-none"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
                            <FiVideo className="w-10 h-10 text-slate-600 mb-2" />
                            <span className="font-bold text-slate-300 text-sm">No video has been added to this lesson.</span>
                            <span className="text-slate-500 mt-1">
                              Enter a YouTube URL above or upload a video file.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* 2. PDF DOCUMENT LESSON STUDIO FORM */}
                {/* ============================================================ */}
                {activeLesson.type === 'PDF' && (
                  <div className="space-y-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <FiFileText className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Upload PDF Document
                      </span>
                    </div>

                    {/* Upload PDF Drag & Drop */}
                    <div className="space-y-4">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 ${
                          isLockedCourse
                            ? 'opacity-60 cursor-not-allowed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50'
                            : isDragOver
                            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 scale-[1.01] cursor-pointer'
                            : 'border-slate-300 dark:border-slate-700 hover:border-rose-400 bg-slate-50/50 dark:bg-slate-850/50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePdfUpload(f);
                          }}
                          disabled={isLockedCourse || isUploadingFile}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />

                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-3 shadow-xs">
                          <FiFileText className="w-7 h-7" />
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {isLockedCourse
                            ? 'PDF upload locked while under review or published'
                            : isUploadingFile
                            ? 'Uploading PDF Document...'
                            : 'Drag & drop PDF document here or browse'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Supports PDF manuals, slide decks, and lecture notes up to 30MB
                        </p>

                        {/* Upload Progress Bar */}
                        {isUploadingFile && (
                          <div className="mt-4 max-w-xs mx-auto space-y-1.5">
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {uploadProgress}% uploaded
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Uploaded PDF Chip */}
                      {lessonPdfUrl && (
                        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3 truncate pr-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <FiFileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {uploadedPdfName || extractFileName(lessonPdfUrl)}
                              </div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <FiCheck className="w-3 h-3" /> PDF ready for reading & download
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleViewPdf(lessonPdfUrl)}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-rose-600 font-bold rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs hover:bg-rose-50 flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" /> View
                            </button>
                            <button
                              type="button"
                              disabled={isLockedCourse}
                              onClick={handleRemovePdf}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* 3. TEXT READING LESSON STUDIO FORM */}
                {/* ============================================================ */}
                {activeLesson.type === 'Text' && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FiCode className="w-4 h-4 text-indigo-500" /> Article Content & Technical Guide
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {lessonTextContent.length} characters &bull;{' '}
                        {lessonTextContent.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    {/* Markdown Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap">
                      <button
                        type="button"
                        disabled={isLockedCourse}
                        onClick={() => insertFormatting('### ', '\n', 'Heading Title')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Heading 3"
                      >
                        <FiHash className="w-3.5 h-3.5" /> H3
                      </button>
                      <button
                        type="button"
                        disabled={isLockedCourse}
                        onClick={() => insertFormatting('**', '**', 'bold text')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Bold Text"
                      >
                        <FiBold className="w-3.5 h-3.5" /> Bold
                      </button>
                      <button
                        type="button"
                        disabled={isLockedCourse}
                        onClick={() => insertFormatting('*', '*', 'italic text')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Italic Text"
                      >
                        <FiItalic className="w-3.5 h-3.5" /> Italic
                      </button>
                      <button
                        type="button"
                        disabled={isLockedCourse}
                        onClick={() => insertFormatting('- ', '\n', 'List item')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Bullet List"
                      >
                        <FiList className="w-3.5 h-3.5" /> List
                      </button>
                      <button
                        type="button"
                        disabled={isLockedCourse}
                        onClick={() => insertFormatting('```ts\n', '\n```', '// Code block')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Code Snippet"
                      >
                        <FiCode className="w-3.5 h-3.5" /> Code
                      </button>
                      <button
                        type="button"
                        disabled={isLockedCourse}
                        onClick={() => insertFormatting('> [!NOTE]\n> ', '\n', 'Important concept')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Callout Box"
                      >
                        <FiCornerDownRight className="w-3.5 h-3.5" /> Callout
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={14}
                      value={lessonTextContent}
                      disabled={isLockedCourse}
                      onChange={(e) => {
                        setLessonTextContent(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Write your in-depth technical article or interactive tutorial here using Markdown formatting..."
                      className="w-full p-4 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono leading-relaxed custom-scrollbar shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {/* ============================================================ */}
                {/* 4. RESOURCE LESSON STUDIO FORM */}
                {/* ============================================================ */}
                {activeLesson.type === 'Resource' && (
                  <div className="space-y-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Source Selector Pill */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <FiPackage className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Resource Delivery Type
                        </span>
                      </div>
                      <div className="inline-flex p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <button
                          type="button"
                          disabled={isLockedCourse}
                          onClick={() => {
                            setContentSource('upload');
                            setHasUnsavedChanges(true);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            contentSource === 'upload'
                              ? 'bg-brand-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          <FiUploadCloud className="inline w-3 h-3 mr-1" /> Upload ZIP / File
                        </button>
                        <button
                          type="button"
                          disabled={isLockedCourse}
                          onClick={() => {
                            setContentSource('url');
                            setHasUnsavedChanges(true);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            contentSource === 'url'
                              ? 'bg-brand-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          <FiLink className="inline w-3 h-3 mr-1" /> External Link (GitHub / Drive)
                        </button>
                      </div>
                    </div>

                    {/* Option A: Upload Resource Drag & Drop */}
                    {contentSource === 'upload' && (
                      <div className="space-y-4">
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 ${
                            isLockedCourse
                              ? 'opacity-60 cursor-not-allowed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50'
                              : isDragOver
                              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 scale-[1.01] cursor-pointer'
                              : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50/50 dark:bg-slate-850/50 cursor-pointer'
                          }`}
                        >
                          <input
                            type="file"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleResourceUpload(f);
                            }}
                            disabled={isLockedCourse || isUploadingFile}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />

                          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-xs">
                            <FiPackage className="w-7 h-7" />
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            {isLockedCourse
                              ? 'Resource upload locked while under review or published'
                              : isUploadingFile
                              ? 'Uploading Resource Bundle...'
                              : 'Drag & drop ZIP archive or project starter'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Supports ZIP, TAR, PDF, DOCX, Code files up to 50MB
                          </p>

                          {/* Upload Progress Bar */}
                          {isUploadingFile && (
                            <div className="mt-4 max-w-xs mx-auto space-y-1.5">
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {uploadProgress}% uploaded
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Uploaded Resource Chip */}
                        {lessonResourceUrl && (
                          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 truncate pr-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <FiPackage className="w-5 h-5" />
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {uploadedResourceName || extractFileName(lessonResourceUrl)}
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" /> Resource file attached
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={lessonResourceUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-amber-600 font-bold rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs hover:bg-amber-50 flex items-center gap-1 text-xs"
                              >
                                <FiDownload className="w-3.5 h-3.5" /> Test Download
                              </a>
                                <button
                                  type="button"
                                  disabled={isLockedCourse}
                                  onClick={handleRemoveResource}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Option B: External Resource URL */}
                    {contentSource === 'url' && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          External Repository or Resource Link
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="https://github.com/organization/course-starter-code or https://drive.google.com/..."
                            value={resourceInputUrl}
                            disabled={isLockedCourse}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResourceInputUrl(val);
                              setLessonResourceUrl(val);
                              setHasUnsavedChanges(true);
                            }}
                            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {resourceInputUrl && (
                            <>
                              <a
                                href={resourceInputUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5"
                              >
                                <FiExternalLink className="w-4 h-4" /> Test Link
                              </a>
                              <button
                                type="button"
                                disabled={isLockedCourse}
                                onClick={() => {
                                  setResourceInputUrl('');
                                  setLessonResourceUrl('');
                                  setHasUnsavedChanges(true);
                                }}
                                className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Clear Resource URL"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Paste a valid link to a GitHub repository, Google Drive folder, or external web resource.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Studio Action Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {activeLesson.type === 'PDF' ? (
                      <>
                        <FiFileText className="w-3.5 h-3.5 text-rose-500" />
                        <span>PDF Document</span>
                      </>
                    ) : (
                      <>
                        <FiClock className="w-3.5 h-3.5 text-brand-500" />
                        <span>
                          Estimated time: {Number(lessonDurationMinutes) > 0 ? lessonDurationMinutes : activeLesson.durationMinutes || 10} minutes
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="md"
                      disabled={isLockedCourse || isSaving}
                      onClick={() => handleSaveLessonContent(false)}
                      className="text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>

                    <Button
                      variant="primary"
                      size="md"
                      disabled={isLockedCourse || isSaving}
                      onClick={() => handleSaveLessonContent(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiCheckCircle className="w-4 h-4" /> Save & Go to Step 4
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
