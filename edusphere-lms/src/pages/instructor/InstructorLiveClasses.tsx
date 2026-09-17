import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiVideo,
  FiPlus,
  FiSearch,
  FiEdit,
  FiCheckCircle,
  FiX,
  FiClock,
  FiCalendar,
  FiArrowLeft,
  FiFileText,
  FiEye,
  FiExternalLink,
  FiSlash,
  FiCopy,
  FiCheck,
  FiRadio,
  FiTrash2,
  FiMessageSquare,
  FiThumbsUp,
  FiSend,
  FiCornerDownRight,
  FiRefreshCw,
  FiPlayCircle,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  showSuccessAlert,
  showWarningAlert,
  showConfirmAlert,
  showErrorAlert
} from '../../utils/swalAlerts';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import {
  liveClassService,
  type BackendLiveClass,
  type BackendLiveClassQA,
  type LiveClassStatus,
  type LiveClassAudienceType,
} from '../../services/liveClassService';

type ActiveTabType = 'dashboard' | 'upcoming' | 'ongoing' | 'past' | 'create';
type SortOption = 'newest' | 'oldest' | 'date';

export const InstructorLiveClasses: React.FC = () => {
  const navigate = useNavigate();

  // Data State
  const [liveClasses, setLiveClasses] = useState<BackendLiveClass[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<{ id: string; name: string; email: string; avatar: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Modal / Viewing / Editing / Rescheduling / Deleting States
  const [editingClass, setEditingClass] = useState<BackendLiveClass | null>(null);
  const [viewingClass, setViewingClass] = useState<BackendLiveClass | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<BackendLiveClassQA[]>([]);
  const [cancellingClass, setCancellingClass] = useState<BackendLiveClass | null>(null);
  const [reschedulingClass, setReschedulingClass] = useState<BackendLiveClass | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', startTime: '', endTime: '' });
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Student Selection State for Private Live Class
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Q&A State
  const [replyInputText, setReplyInputText] = useState<{ [key: string]: string }>({});

  // Form State
  const [classForm, setClassForm] = useState({
    title: '',
    courseId: '',
    audienceType: 'All Enrolled Students' as LiveClassAudienceType,
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '17:30',
    platform: 'In-App Live Classroom',
    instructions: '',
    recordingUrl: '',
    status: 'Scheduled' as LiveClassStatus,
  });

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch Instructor Courses & Live Classes
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Courses
      const coursesRes = await courseService.getInstructorCourses({}, true);
      const rawCourses = coursesRes?.data || (coursesRes as any)?.data?.courses || coursesRes || [];
      const instructorCourseList = (Array.isArray(rawCourses) ? rawCourses : []).map((c: any) => ({
        id: c.id,
        title: c.title,
      }));
      setCourses(instructorCourseList);

      if (instructorCourseList.length > 0) {
        setClassForm((prev) => (prev.courseId ? prev : { ...prev, courseId: instructorCourseList[0].id }));
      }

      // Fetch Live Classes
      const classes = await liveClassService.getInstructorLiveClasses();
      setLiveClasses(classes);
    } catch (err: any) {
      showErrorAlert('Error Loading Live Classes', err.message || 'Failed to load live classes from server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Fetch Enrolled Students when selected course changes for private class selector
  const fetchStudentsForCourse = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setIsLoadingStudents(true);
    try {
      const res = await enrollmentService.getInstructorEnrollments({ courseId });
      const rawStudents = res?.data?.students || res?.data || [];
      const formatted = rawStudents.map((s: any) => ({
        id: s.studentId || s.id,
        name: s.studentName || s.fullName || s.name || 'Student',
        email: s.studentEmail || s.email || '',
        avatar: s.studentAvatar || s.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      }));
      setEnrolledStudents(formatted);
    } catch {
      setEnrolledStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (classForm.courseId) {
      fetchStudentsForCourse(classForm.courseId);
    }
  }, [classForm.courseId, fetchStudentsForCourse]);

  // Dashboard Overview Metrics
  const stats = useMemo(() => {
    const total = liveClasses.length;
    const upcoming = liveClasses.filter((c) => c.status === 'Scheduled').length;
    const ongoing = liveClasses.filter((c) => c.status === 'Live').length;
    const completed = liveClasses.filter((c) => c.status === 'Completed').length;
    const cancelled = liveClasses.filter((c) => c.status === 'Cancelled').length;
    const draft = liveClasses.filter((c) => c.status === 'Draft').length;

    return { total, upcoming, ongoing, completed, cancelled, draft };
  }, [liveClasses]);

  // Helper date formatter
  const formatDateTimeDisplay = (startTime: string, endTime: string) => {
    try {
      const d = new Date(startTime);
      const dateStr = d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const startStr = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endD = new Date(endTime);
      const endStr = endD.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { dateStr, timeStr: `${startStr} - ${endStr}` };
    } catch {
      return { dateStr: startTime, timeStr: endTime };
    }
  };

  // Filtered Live Classes List
  const filteredClasses = useMemo(() => {
    return liveClasses
      .filter((c) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.courseTitle && c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCourse = selectedCourseFilter === 'All' || c.courseId === selectedCourseFilter;
        const matchesStatus = selectedStatusFilter === 'All' || c.status === selectedStatusFilter;

        return matchesSearch && matchesCourse && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        if (sortBy === 'date') return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [liveClasses, searchQuery, selectedCourseFilter, selectedStatusFilter, sortBy]);

  // Tab-Specific Filtered Classes
  const tabFilteredClasses = useMemo(() => {
    if (activeTab === 'upcoming') {
      return filteredClasses.filter((c) => c.status === 'Scheduled');
    }
    if (activeTab === 'ongoing') {
      return filteredClasses.filter((c) => c.status === 'Live');
    }
    if (activeTab === 'past') {
      return filteredClasses.filter((c) => c.status === 'Completed' || c.status === 'Cancelled');
    }
    return filteredClasses;
  }, [filteredClasses, activeTab]);

  // Reschedule Open Handler
  const openRescheduleModal = (item: BackendLiveClass) => {
    if (item.status !== 'Scheduled' && item.status !== 'Draft') {
      showWarningAlert('Cannot Reschedule', `Live classes with status "${item.status}" cannot be rescheduled.`);
      return;
    }

    setReschedulingClass(item);
    const startDate = new Date(item.startTime).toISOString().split('T')[0];
    const startTimeStr = new Date(item.startTime).toTimeString().slice(0, 5);
    const endTimeStr = new Date(item.endTime).toTimeString().slice(0, 5);

    setRescheduleData({
      date: startDate,
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingClass) return;
    if (!rescheduleData.date || !rescheduleData.startTime || !rescheduleData.endTime) {
      showWarningAlert('Warning!', 'Date, Start Time, and End Time are required for rescheduling.');
      return;
    }

    const newStartISO = new Date(`${rescheduleData.date}T${rescheduleData.startTime}:00`).toISOString();
    const newEndISO = new Date(`${rescheduleData.date}T${rescheduleData.endTime}:00`).toISOString();

    if (new Date(newEndISO).getTime() <= new Date(newStartISO).getTime()) {
      showWarningAlert('Invalid Time', 'End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await liveClassService.rescheduleLiveClass(reschedulingClass.id, {
        startTime: newStartISO,
        endTime: newEndISO,
      });

      setLiveClasses(liveClasses.map((c) => (c.id === updated.id ? updated : c)));
      showSuccessAlert('Success!', `Live class "${reschedulingClass.title}" rescheduled successfully.`);
      setReschedulingClass(null);
    } catch (err: any) {
      showErrorAlert('Reschedule Failed', err.message || 'Failed to reschedule live class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteClass = async (item: BackendLiveClass) => {
    const confirmed = await showConfirmAlert(
      'Delete Live Class',
      `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`,
      'Delete Class',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        await liveClassService.deleteLiveClass(item.id);
        setLiveClasses((prev) => prev.filter((c) => c.id !== item.id));
        await fetchData();
        showSuccessAlert('Success!', `Live class "${item.title}" deleted completely.`);
      } catch (err: any) {
        showErrorAlert('Delete Failed', err.message || 'Failed to delete live class');
      }
    }
  };

  // View Q&A Modal Open Handler
  const openViewingModal = async (item: BackendLiveClass) => {
    setViewingClass(item);
    try {
      const qs = await liveClassService.getQuestions(item.id);
      setViewingQuestions(qs);
    } catch {
      setViewingQuestions([]);
    }
  };

  // Q&A Handlers
  const handleReplyToQuestion = async (classId: string, qId: string) => {
    const text = replyInputText[qId];
    if (!text || !text.trim()) {
      showToast('Please type a reply before sending.', 'warning');
      return;
    }
    try {
      const updatedQ = await liveClassService.replyToQuestion(classId, qId, text.trim());
      setViewingQuestions(viewingQuestions.map((q) => (q.id === qId ? updatedQ : q)));
      setReplyInputText({ ...replyInputText, [qId]: '' });
      showToast('Reply posted to student question.');
    } catch (err: any) {
      showToast(err.message || 'Failed to post reply', 'warning');
    }
  };

  const handleTogglePinQuestion = async (classId: string, qId: string) => {
    try {
      const updatedQ = await liveClassService.togglePinQuestion(classId, qId);
      setViewingQuestions(viewingQuestions.map((q) => (q.id === qId ? updatedQ : q)));
      showToast('Question pin status updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle pin', 'warning');
    }
  };

  const handleDeleteQAQuestion = async (classId: string, qId: string) => {
    try {
      await liveClassService.deleteQuestion(classId, qId);
      setViewingQuestions(viewingQuestions.filter((q) => q.id !== qId));
      showToast('Question deleted.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete question', 'warning');
    }
  };

  // Copy Meeting Link Handler
  const handleCopyMeetingUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    showToast('Meeting link copied to clipboard.');
    setTimeout(() => setCopiedUrlId(null), 2500);
  };

  // Create / Edit Open Handlers
  const openScheduleForm = () => {
    setEditingClass(null);
    setSelectedStudentIds([]);
    setStudentSearchQuery('');
    const defaultCourse = courses.length > 0 ? courses[0].id : '';
    setClassForm({
      title: '',
      courseId: defaultCourse,
      audienceType: 'All Enrolled Students',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '16:00',
      endTime: '17:30',
      platform: 'In-App Live Classroom',
      instructions: 'Please join 5 minutes early with your camera and mic ready.',
      recordingUrl: '',
      status: 'Scheduled',
    });
    if (defaultCourse) {
      fetchStudentsForCourse(defaultCourse);
    }
    setActiveTab('create');
  };

  const openEditForm = (item: BackendLiveClass) => {
    if (item.status === 'Live') {
      showWarningAlert('Cannot Edit Active Class', 'Live classes cannot be edited while in progress. You can manage Q&A or enter the session.');
      return;
    }
    if (item.status === 'Completed') {
      showWarningAlert('Cannot Edit Completed Class', 'Completed classes are finalized and cannot be edited.');
      return;
    }
    if (item.status === 'Cancelled') {
      showWarningAlert('Cannot Edit Cancelled Class', 'Cancelled classes cannot be edited.');
      return;
    }

    setEditingClass(item);
    setSelectedStudentIds(item.selectedStudentIds || []);
    setStudentSearchQuery('');
    const startDate = new Date(item.startTime).toISOString().split('T')[0];
    const startTimeStr = new Date(item.startTime).toTimeString().slice(0, 5);
    const endTimeStr = new Date(item.endTime).toTimeString().slice(0, 5);

    setClassForm({
      title: item.title,
      courseId: item.courseId,
      audienceType: item.audienceType || 'All Enrolled Students',
      description: item.description || '',
      date: startDate,
      startTime: startTimeStr,
      endTime: endTimeStr,
      platform: 'In-App Live Classroom',
      instructions: item.instructions || '',
      recordingUrl: item.recordingUrl || '',
      status: item.status,
    });
    fetchStudentsForCourse(item.courseId);
    setActiveTab('create');
  };

  // Student selection toggle helpers
  const handleToggleStudentSelection = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  // Filtered Roster for search
  const filteredStudentsRoster = useMemo(() => {
    if (!studentSearchQuery.trim()) return enrolledStudents;
    const q = studentSearchQuery.toLowerCase();
    return enrolledStudents.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [studentSearchQuery, enrolledStudents]);

  // Save Class Handler (Draft / Publish)
  const handleSaveClass = async (targetStatus: LiveClassStatus) => {
    if (!classForm.title.trim()) {
      showToast('Live Class Title is required.', 'warning');
      return;
    }
    if (!classForm.courseId) {
      showToast('Please select a Course.', 'warning');
      return;
    }
    if (!classForm.date.trim()) {
      showToast('Class Date is required.', 'warning');
      return;
    }
    if (!classForm.startTime.trim()) {
      showToast('Start Time is required.', 'warning');
      return;
    }
    if (classForm.audienceType === 'Selected Students' && selectedStudentIds.length === 0) {
      showToast('Please select at least 1 student for a Private Live Class.', 'warning');
      return;
    }

    const startISO = new Date(`${classForm.date}T${classForm.startTime}:00`).toISOString();
    const endISO = new Date(`${classForm.date}T${classForm.endTime}:00`).toISOString();

    if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
      showToast('End Time must be after Start Time.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClass) {
        // Edit Mode
        const updated = await liveClassService.updateLiveClass(editingClass.id, {
          title: classForm.title.trim(),
          courseId: classForm.courseId,
          audienceType: classForm.audienceType,
          selectedStudentIds: classForm.audienceType === 'Selected Students' ? selectedStudentIds : [],
          description: classForm.description,
          startTime: startISO,
          endTime: endISO,
          platform: 'In-App Live Classroom',
          instructions: classForm.instructions,
          recordingUrl: classForm.recordingUrl?.trim() || undefined,
          status: targetStatus,
        });

        setLiveClasses(liveClasses.map((c) => (c.id === updated.id ? updated : c)));
        showToast(
          targetStatus === 'Scheduled'
            ? `Live class updated & published (${classForm.audienceType}).`
            : 'Live class saved as draft.',
          'success'
        );
      } else {
        // Create Mode
        const created = await liveClassService.createLiveClass(classForm.courseId, {
          title: classForm.title.trim(),
          courseId: classForm.courseId,
          audienceType: classForm.audienceType,
          selectedStudentIds: classForm.audienceType === 'Selected Students' ? selectedStudentIds : [],
          description: classForm.description,
          startTime: startISO,
          endTime: endISO,
          platform: 'In-App Live Classroom',
          instructions: classForm.instructions,
          recordingUrl: classForm.recordingUrl?.trim() || undefined,
          status: targetStatus,
        });

        setLiveClasses([created, ...liveClasses]);
        showToast(
          targetStatus === 'Scheduled'
            ? `Live class scheduled & published (${classForm.audienceType}).`
            : 'Live class saved as Draft.',
          'success'
        );
      }
      await fetchData();
      setActiveTab('dashboard');
    } catch (err: any) {
      showErrorAlert('Save Failed', err.message || 'Failed to save live class');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Live Class Handler
  const handleConfirmCancelClass = async () => {
    if (!cancellingClass) return;
    setIsSubmitting(true);
    try {
      const updated = await liveClassService.cancelLiveClass(cancellingClass.id);
      setLiveClasses(liveClasses.map((c) => (c.id === updated.id ? updated : c)));
      await fetchData();
      showToast(`Live class "${cancellingClass.title}" has been cancelled.`, 'warning');
      setCancellingClass(null);
    } catch (err: any) {
      showErrorAlert('Cancel Failed', err.message || 'Failed to cancel live class');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badge Renderer
  const renderStatusBadge = (status: LiveClassStatus) => {
    switch (status) {
      case 'Live':
        return (
          <Badge variant="success" className="flex items-center gap-1 font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            <FiRadio className="w-3 h-3 text-emerald-600 animate-ping" /> LIVE NOW
          </Badge>
        );
      case 'Scheduled':
        return (
          <Badge variant="primary" className="flex items-center gap-1 font-bold">
            <FiCalendar className="w-3 h-3 text-blue-500" /> Scheduled
          </Badge>
        );
      case 'Completed':
        return (
          <Badge variant="primary" className="flex items-center gap-1 font-bold">
            <FiCheckCircle className="w-3 h-3" /> Completed
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="danger" className="flex items-center gap-1 font-bold">
            <FiSlash className="w-3 h-3" /> Cancelled
          </Badge>
        );
      case 'Draft':
      default:
        return (
          <Badge variant="warning" className="flex items-center gap-1 font-bold">
            <FiClock className="w-3 h-3" /> Draft
          </Badge>
        );
    }
  };

  // Platform Badge Renderer
  const renderPlatformBadge = (_platform?: string) => {
    return (
      <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-300 dark:border-purple-800 flex items-center gap-1 w-max">
        <FiVideo className="w-3 h-3 text-purple-600" /> In-App Live (LiveKit)
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
              toast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 text-amber-900 dark:text-amber-200'
                : toast.type === 'info'
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 text-blue-900 dark:text-blue-200'
                : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
            <FiVideo className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Instructor Live Classes
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Schedule, publish, and manage live interactive workshops and video sessions for enrolled students.
            </p>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === 'dashboard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1 text-xs"
          >
            <FiFileText className="w-3.5 h-3.5" /> All Classes
          </Button>

          <Button
            variant={activeTab === 'upcoming' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('upcoming')}
            className="flex items-center gap-1 text-xs"
          >
            <FiCalendar className="w-3.5 h-3.5" /> Upcoming ({stats.upcoming})
          </Button>

          <Button
            variant={activeTab === 'ongoing' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('ongoing')}
            className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
          >
            <FiRadio className="w-3.5 h-3.5 animate-pulse" /> Ongoing ({stats.ongoing})
          </Button>

          <Button
            variant={activeTab === 'past' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('past')}
            className="flex items-center gap-1 text-xs"
          >
            <FiClock className="w-3.5 h-3.5" /> Past / Completed
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs"
            title="Refresh Live Classes"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openScheduleForm}
            className="flex items-center gap-1 text-xs shadow-md bg-purple-600 hover:bg-purple-700 text-white"
          >
            <FiPlus className="w-4 h-4" /> Schedule Live Class
          </Button>
        </div>
      </div>

      {/* KPI Dashboard Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Live Classes
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {stats.total}
            </div>
          </div>
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600">
            <FiVideo className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
              Upcoming Classes
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.upcoming}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
            <FiRadio className="w-5 h-5 animate-pulse" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
              Completed Classes
            </span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {stats.completed}
            </div>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
            <FiCheckCircle className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block">
              Cancelled Classes
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {stats.cancelled}
            </div>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600">
            <FiSlash className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main View Switcher */}
      {activeTab !== 'create' && (
        <div className="space-y-4">
          {/* Search & Filters Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Class Title or Course Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Course & Status Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="All">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="date">Sort by Date</option>
                <option value="newest">Sort Newest First</option>
                <option value="oldest">Sort Oldest First</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <div className="w-8 h-8 mx-auto border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading live classes from database...</p>
            </div>
          ) : tabFilteredClasses.length === 0 ? (
            /* Empty State */
            <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 bg-white dark:bg-slate-900">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FiVideo className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No live classes scheduled.
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Schedule live workshops, interactive Q&A sessions, or mentoring calls for your enrolled students.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={openScheduleForm}
                className="inline-flex items-center gap-1.5 shadow-md bg-purple-600 hover:bg-purple-700 text-white"
              >
                <FiPlus className="w-4 h-4" /> Schedule Live Class
              </Button>
            </Card>
          ) : (
            /* Live Classes Table View */
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4">Class Title & Course</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Platform</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tabFilteredClasses.map((item) => {
                    const { dateStr, timeStr } = formatDateTimeDisplay(item.startTime, item.endTime);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Title & Course */}
                        <td className="p-4 max-w-md">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold line-clamp-1">
                              {item.courseTitle}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.audienceType === 'Selected Students'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                  : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              }`}
                            >
                              {item.audienceType === 'Selected Students'
                                ? `Private (${item.selectedStudentIds?.length || 0} Students)`
                                : 'All Enrolled'}
                            </span>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <FiCalendar className="w-3.5 h-3.5 text-purple-500" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <FiClock className="w-3 h-3 text-slate-400" />
                            <span>{timeStr}</span>
                          </div>
                        </td>

                        {/* Platform */}
                        <td className="p-4 whitespace-nowrap">
                          {renderPlatformBadge(item.platform)}
                        </td>

                        {/* Status */}
                        <td className="p-4 whitespace-nowrap">
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* Buttons: Start In-App, Join In-App, View (Q&A), Edit, Reschedule, Cancel, Delete */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Scheduled Class: Start button */}
                            {item.status === 'Scheduled' && (
                              <button
                                onClick={() => navigate(`/instructor/live/room/${item.id}`)}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                                title="Start In-App Live Class"
                              >
                                <FiVideo className="w-3.5 h-3.5" /> Start Class
                              </button>
                            )}

                            {/* 2. Live Class: Join/Continue button */}
                            {item.status === 'Live' && (
                              <button
                                onClick={() => navigate(`/instructor/live/room/${item.id}`)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs animate-pulse transition-colors"
                                title="Join In-App Live Class"
                              >
                                <FiRadio className="w-3.5 h-3.5 text-white" /> Join Class
                              </button>
                            )}

                            {/* View Details / Q&A: Available for all statuses */}
                            <button
                              onClick={() => openViewingModal(item)}
                              className="px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 font-bold text-[11px] flex items-center gap-1"
                              title="View Details & Q&A"
                            >
                              <FiEye className="w-3.5 h-3.5" /> View / Q&A
                            </button>

                            {/* Completed Class: View Recording (if exists) */}
                            {item.status === 'Completed' && item.isRecordingAvailable && item.recordingUrl && (
                              <a
                                href={item.recordingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 font-bold text-[11px] flex items-center gap-1 border border-purple-300 dark:border-purple-800"
                                title="View Recording"
                              >
                                <FiPlayCircle className="w-3.5 h-3.5 text-purple-600" /> View Recording
                              </a>
                            )}

                            {/* Edit: Available ONLY for Scheduled or Draft classes */}
                            {(item.status === 'Scheduled' || item.status === 'Draft') && (
                              <button
                                onClick={() => openEditForm(item)}
                                className="px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 font-bold text-[11px] flex items-center gap-1"
                                title="Edit Class"
                              >
                                <FiEdit className="w-3.5 h-3.5" /> Edit
                              </button>
                            )}

                            {/* Reschedule: Available ONLY for Scheduled classes */}
                            {item.status === 'Scheduled' && (
                              <button
                                onClick={() => openRescheduleModal(item)}
                                className="px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 font-bold text-[11px] flex items-center gap-1"
                                title="Reschedule Class"
                              >
                                <FiClock className="w-3.5 h-3.5" /> Reschedule
                              </button>
                            )}

                            {/* Cancel: Available ONLY for Scheduled classes */}
                            {item.status === 'Scheduled' && (
                              <button
                                onClick={() => setCancellingClass(item)}
                                className="px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 font-bold text-[11px] flex items-center gap-1"
                                title="Cancel Class"
                              >
                                <FiSlash className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}

                            {/* Delete: Available for all */}
                            <button
                              onClick={() => handleConfirmDeleteClass(item)}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-[11px] flex items-center gap-1"
                              title="Delete Class"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* SCHEDULE / EDIT LIVE CLASS FORM */}
      {activeTab === 'create' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingClass ? 'Edit Scheduled Live Class' : 'Schedule Live Class'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure live meeting parameters, select video platform, and provide class instructions for enrolled students.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('dashboard')}>
              <FiArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Live Class Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Live Class Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Next.js 15 Server Actions & Optimistic State Masterclass"
                value={classForm.title}
                onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Course Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course *
              </label>
              <select
                value={classForm.courseId}
                onChange={(e) => setClassForm({ ...classForm, courseId: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {courses.length === 0 ? (
                  <option value="">No courses available</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* In-App Live Classroom Banner */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <FiVideo className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  EduSphere In-App Live Classroom (LiveKit WebRTC)
                </h4>
                <p className="text-[11px] text-purple-700 dark:text-purple-300/80 leading-relaxed">
                  A dedicated high-performance virtual classroom will be provisioned inside EduSphere. 
                  Enrolled students join directly in their browser with audio, HD video, screen sharing, and real-time interactive Q&A.
                </p>
              </div>
            </div>

            {/* Class Date & Start / End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Class Date *
                </label>
                <input
                  type="date"
                  value={classForm.date}
                  onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={classForm.startTime}
                  onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={classForm.endTime}
                  onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Provide a brief overview of the live class topics and agenda..."
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Audience Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Audience Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                    classForm.audienceType === 'All Enrolled Students'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="audienceRadio"
                    checked={classForm.audienceType === 'All Enrolled Students'}
                    onChange={() => setClassForm({ ...classForm, audienceType: 'All Enrolled Students' })}
                    className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs">All Enrolled Students</span>
                </label>

                <label
                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${
                    classForm.audienceType === 'Selected Students'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="audienceRadio"
                    checked={classForm.audienceType === 'Selected Students'}
                    onChange={() => setClassForm({ ...classForm, audienceType: 'Selected Students' })}
                    className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs">Selected Students (Private)</span>
                </label>
              </div>
            </div>

            {/* Student Selection Section (Only if "Selected Students" is chosen) */}
            {classForm.audienceType === 'Selected Students' && (
              <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    Select Students for Private Live Class ({selectedStudentIds.length} Selected)
                  </span>
                  {selectedStudentIds.length > 0 && (
                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Search Student Input */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search actively enrolled students by Name or Email..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Student Checklist Grid */}
                {isLoadingStudents ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading course students...</div>
                ) : filteredStudentsRoster.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl">
                    No enrolled students found for this course.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredStudentsRoster.map((std) => {
                      const isSelected = selectedStudentIds.includes(std.id);
                      return (
                        <label
                          key={std.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-purple-100/80 dark:bg-purple-900/60 border-purple-400 dark:border-purple-700'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={std.avatar}
                              alt={std.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {std.name}
                              </div>
                              <div className="text-[10px] text-slate-500">{std.email}</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStudentSelection(std.id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Class Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Joining guidelines (e.g., Keep microphones muted, clone repository prior to call)..."
                value={classForm.instructions}
                onChange={(e) => setClassForm({ ...classForm, instructions: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Recording URL (Optional / Post-Session) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recording URL (Optional — for Completed Sessions)
              </label>
              <input
                type="url"
                placeholder="https://commondatastorage.googleapis.com/.../session-recording.mp4"
                value={classForm.recordingUrl}
                onChange={(e) => setClassForm({ ...classForm, recordingUrl: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none font-mono text-xs"
              />
            </div>
          </div>

          {/* Form Actions: Save Draft & Schedule Class */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setActiveTab('dashboard')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="md"
              disabled={isSubmitting}
              onClick={() => handleSaveClass('Draft')}
              className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={isSubmitting}
              onClick={() => handleSaveClass('Scheduled')}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md font-bold"
            >
              {isSubmitting ? 'Saving...' : editingClass ? 'Update Live Class' : 'Schedule Live Class'}
            </Button>
          </div>
        </Card>
      )}

      {/* VIEW CLASS DETAILS & Q&A MODAL */}
      {viewingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FiVideo className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Live Class Details
                </h3>
              </div>
              <button
                onClick={() => setViewingClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                  Class Title
                </span>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  {viewingClass.title}
                </h4>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                  Course Name
                </span>
                <p className="font-bold text-purple-600 dark:text-purple-400">
                  {viewingClass.courseTitle}
                </p>
              </div>

              {viewingClass.description && (
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                    Description
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {viewingClass.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Date & Time
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatDateTimeDisplay(viewingClass.startTime, viewingClass.endTime).dateStr} (
                    {formatDateTimeDisplay(viewingClass.startTime, viewingClass.endTime).timeStr})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Meeting Platform
                  </span>
                  {renderPlatformBadge(viewingClass.platform)}
                </div>
              </div>

              {/* Meeting Link & Status Notice */}
              {viewingClass.status === 'Completed' ? (
                <div className="space-y-3 p-3.5 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900">
                  <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 font-bold">
                    <FiCheckCircle className="w-4 h-4 text-purple-600" />
                    <span>Session Concluded: This live class is completed and room is closed.</span>
                  </div>

                  {viewingClass.isRecordingAvailable && viewingClass.recordingUrl ? (
                    <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-purple-900 dark:text-purple-200 font-bold">
                        <FiPlayCircle className="w-4 h-4 text-purple-600" />
                        <span>Class Recording Available</span>
                      </div>
                      <a
                        href={viewingClass.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1"
                      >
                        <FiExternalLink className="w-3 h-3" /> Watch Recording
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No recording has been uploaded for this session.</p>
                  )}
                </div>
              ) : viewingClass.status === 'Cancelled' ? (
                <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                  <FiSlash className="w-4 h-4 text-rose-600" />
                  <span>This live class session has been cancelled.</span>
                </div>
              ) : (
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                    Meeting Link
                  </span>
                  <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold truncate flex-1">
                      {viewingClass.meetingUrl}
                    </span>
                    <button
                      onClick={() =>
                        handleCopyMeetingUrl(viewingClass.meetingUrl, viewingClass.id)
                      }
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="Copy Link"
                    >
                      {copiedUrlId === viewingClass.id ? (
                        <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <FiCopy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setViewingClass(null);
                        navigate(`/instructor/live/room/${viewingClass.id}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-bold text-xs flex items-center gap-1"
                      title="Enter In-App Classroom"
                    >
                      <FiVideo className="w-3.5 h-3.5" /> Enter Room
                    </button>
                  </div>
                </div>
              )}

              {viewingClass.instructions && (
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900">
                  <span className="font-bold text-purple-900 dark:text-purple-200 block mb-0.5">
                    Class Instructions:
                  </span>
                  <p className="text-purple-800 dark:text-purple-300">
                    {viewingClass.instructions}
                  </p>
                </div>
              )}

              {/* QUESTIONS & ANSWERS SECTION FOR LIVE CLASS */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    <FiMessageSquare className="w-4 h-4 text-purple-600" />
                    Student Questions & Answers ({viewingQuestions.length})
                  </h4>
                </div>

                {viewingQuestions.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    No questions submitted by students yet for this class.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {viewingQuestions.map((q) => (
                      <div
                        key={q.id}
                        className={`p-3 rounded-2xl border space-y-2 ${
                          q.isPinned
                            ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Student Info & Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={q.studentAvatar}
                              alt={q.studentName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {q.studentName}
                            </span>
                            {q.isPinned && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                                Pinned
                              </span>
                            )}
                            {q.isAnswered && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                                Answered
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTogglePinQuestion(viewingClass.id, q.id)}
                              className="text-slate-400 hover:text-amber-600 text-[11px] font-bold"
                              title={q.isPinned ? 'Unpin' : 'Pin Question'}
                            >
                              {q.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              onClick={() => handleDeleteQAQuestion(viewingClass.id, q.id)}
                              className="text-slate-400 hover:text-rose-600"
                              title="Delete Question"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {q.questionText}
                        </p>

                        {/* Likes Count */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                          <FiThumbsUp className="w-3 h-3 text-purple-500" />
                          <span>{q.likesCount} Helpful Likes</span>
                        </div>

                        {/* Instructor Existing Reply */}
                        {q.instructorReply && (
                          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl border border-purple-200 dark:border-purple-900 flex items-start gap-2">
                            <FiCornerDownRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-purple-900 dark:text-purple-200 block text-[11px]">
                                Your Instructor Reply:
                              </span>
                              <p className="text-purple-800 dark:text-purple-300 font-medium">
                                {q.instructorReply}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Reply Input Box */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Type instructor reply..."
                            value={replyInputText[q.id] || ''}
                            onChange={(e) =>
                              setReplyInputText({ ...replyInputText, [q.id]: e.target.value })
                            }
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                          />
                          <button
                            onClick={() => handleReplyToQuestion(viewingClass.id, q.id)}
                            className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold shrink-0"
                            title="Send Reply"
                          >
                            <FiSend className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingClass(null)}>
                Close
              </Button>

              {/* Scheduled: Allow Start and Edit */}
              {viewingClass.status === 'Scheduled' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const item = viewingClass;
                      setViewingClass(null);
                      openEditForm(item);
                    }}
                    className="text-amber-700 dark:text-amber-300 border-amber-300"
                  >
                    <FiEdit className="w-3.5 h-3.5 mr-1" /> Edit Class
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setViewingClass(null);
                      navigate(`/instructor/live/room/${viewingClass.id}`);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    <FiVideo className="w-3.5 h-3.5 mr-1" /> Start Live Classroom
                  </Button>
                </>
              )}

              {/* Live: Allow Join (No Edit) */}
              {viewingClass.status === 'Live' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setViewingClass(null);
                    navigate(`/instructor/live/room/${viewingClass.id}`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold animate-pulse"
                >
                  <FiRadio className="w-3.5 h-3.5 mr-1" /> Join Live Classroom
                </Button>
              )}

              {/* Draft: Allow Edit */}
              {viewingClass.status === 'Draft' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const item = viewingClass;
                    setViewingClass(null);
                    openEditForm(item);
                  }}
                >
                  <FiEdit className="w-3.5 h-3.5 mr-1" /> Edit Class
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* RESCHEDULE CLASS MODAL */}
      {reschedulingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2 text-blue-600">
                <FiClock className="w-4 h-4" /> Reschedule Live Class
              </h3>
              <button
                onClick={() => setReschedulingClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Update date and timing for{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                "{reschedulingClass.title}"
              </strong>
              .
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Date *
                </label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={rescheduleData.startTime}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={rescheduleData.endTime}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReschedulingClass(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReschedule}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CANCEL CLASS CONFIRMATION MODAL */}
      {cancellingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2 text-rose-600">
                <FiSlash className="w-4 h-4" /> Cancel Live Class Confirmation
              </h3>
              <button
                onClick={() => setCancellingClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to cancel{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                "{cancellingClass.title}"
              </strong>
              ? Enrolled students will be notified of the cancellation.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCancellingClass(null)} disabled={isSubmitting}>
                Keep Class
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmCancelClass} disabled={isSubmitting}>
                {isSubmitting ? 'Cancelling...' : 'Cancel Class'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
