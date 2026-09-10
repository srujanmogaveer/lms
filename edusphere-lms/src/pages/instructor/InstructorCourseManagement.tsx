import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBookOpen,
  FiCheckCircle,
  FiFileText,
  FiClock,
  FiXCircle,
  FiArchive,
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiEye,
  FiEdit,
  FiCopy,
  FiTrash2,
  FiLock,
  FiLayers,
  FiFolder,
  FiVideo,
  FiHelpCircle,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiUsers,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiUploadCloud
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import {
  showSuccessAlert,
  showConfirmAlert
} from '../../utils/swalAlerts';
import {
  type InstructorCourseItem,
  type CourseStatusType,
  type ApprovalStatusType,
  type CourseDifficultyType,
  type CourseLanguageType,
} from '../../data/instructorCoursesData';
import { type CategoryItem } from '../../data/categoryData';
import { categoryService } from '../../services/categoryService';

import { CourseProgressTracker } from '../../components/instructor/CourseProgressTracker';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';

export const InstructorCourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State for Courses List (initialized with memory cache if available for instant display)
  const cachedInitialCourses = courseService.getCachedInstructorCourses();
  const [courses, setCourses] = useState<InstructorCourseItem[]>(cachedInitialCourses || []);
  const activeCourseId = searchParams.get('courseId') || courses[0]?.id || cachedInitialCourses?.[0]?.id || '';
  const [isLoading, setIsLoading] = useState<boolean>(!cachedInitialCourses);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Live categories fetched from Supabase via categoryService
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);

  // Load Instructor Courses & Categories in parallel on mount
  const fetchInstructorData = async () => {
    try {
      if (courses.length === 0) {
        setIsLoading(true);
      }
      const [courseRes, catRes] = await Promise.all([
        courseService.getInstructorCourses(undefined, true),
        categoryService.getCategories(true),
      ]);

      if (courseRes.success && Array.isArray(courseRes.data)) {
        setCourses(courseRes.data);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setDbCategories(catRes.data);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorData();
  }, []);

  // Auto-open create drawer if navigated with ?action=create or ?create=true
  useEffect(() => {
    const action = searchParams.get('action');
    const isCreate = searchParams.get('create');
    const isNew = searchParams.get('new');
    if (action === 'create' || isCreate === 'true' || isNew === 'true') {
      openCreateForm();
    }
  }, [searchParams, dbCategories]);

  // View state: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCourseStatus, setSelectedCourseStatus] = useState<string>('All');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedPriceType, setSelectedPriceType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'students' | 'rating'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Drawer & Modal States
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<InstructorCourseItem | null>(null);
  const [previewCourse, setPreviewCourse] = useState<InstructorCourseItem | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<InstructorCourseItem | null>(null);
  const [futureModuleNotice, setFutureModuleNotice] = useState<{ moduleName: string; courseTitle: string } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Form State for Create / Edit
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'url'>('upload');
  const [thumbnailError, setThumbnailError] = useState<string>('');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState<boolean>(false);
  const [thumbnailFitMode, setThumbnailFitMode] = useState<'contain' | 'cover'>('contain');

  const [formData, setFormData] = useState<{
    title: string;
    shortDescription: string;
    fullDescription: string;
    categoryId: string;
    category: string;
    subcategory: string;
    difficulty: CourseDifficultyType;
    language: CourseLanguageType;
    thumbnail: string;
    promoVideoUrl: string;
    price: number;
    discountPrice: number;
    requirements: string;
    learningOutcomes: string;
  }>({
    title: '',
    shortDescription: '',
    fullDescription: '',
    categoryId: '',
    category: '',
    subcategory: '',
    difficulty: 'Beginner',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 1999,
    discountPrice: 499,
    requirements: 'Basic computer operations and web browser experience.',
    learningOutcomes: 'Master core concepts and complete practical projects.',
  });

  // Calculate Statistics dynamically
  const stats = {
    total: courses.length,
    published: courses.filter((c) => c.courseStatus === 'Published').length,
    draft: courses.filter((c) => c.courseStatus === 'Draft').length,
    pendingApproval: courses.filter((c) => c.approvalStatus === 'Pending Approval').length,
    rejected: courses.filter((c) => c.approvalStatus === 'Rejected').length,
    archived: courses.filter((c) => c.courseStatus === 'Archived').length,
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedCourseStatus,
    selectedApprovalStatus,
    selectedDifficulty,
    selectedLanguage,
    selectedPriceType,
    sortBy,
  ]);

  // Filter & Search Logic
  const filteredCourses = courses.filter((course) => {
    // Search query matches Title or Category
    const matchesSearch =
      searchQuery.trim() === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.tags && course.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;

    // Course Status filter (Draft, Published, Archived)
    const matchesCourseStatus = selectedCourseStatus === 'All' || course.courseStatus === selectedCourseStatus;

    // Approval Status filter (Pending Approval, Approved, Rejected)
    const matchesApprovalStatus =
      selectedApprovalStatus === 'All' || course.approvalStatus === selectedApprovalStatus;

    // Difficulty filter
    const matchesDifficulty = selectedDifficulty === 'All' || course.difficulty === selectedDifficulty;

    // Language filter
    const matchesLanguage = selectedLanguage === 'All' || course.language === selectedLanguage;

    // Price Type filter (Free, Paid, Discounted)
    const matchesPriceType = selectedPriceType === 'All' || course.priceType === selectedPriceType;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesCourseStatus &&
      matchesApprovalStatus &&
      matchesDifficulty &&
      matchesLanguage &&
      matchesPriceType
    );
  });

  // Sorting Logic
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt.split('/').reverse().join('-')).getTime() - new Date(a.createdAt.split('/').reverse().join('-')).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt.split('/').reverse().join('-')).getTime() - new Date(b.createdAt.split('/').reverse().join('-')).getTime();
    }
    if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'students') {
      return b.studentsEnrolled - a.studentsEnrolled;
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  // Pagination calculation
  const totalPages = Math.ceil(sortedCourses.length / pageSize) || 1;
  const paginatedCourses = sortedCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Helper Badge Renderers
  const renderStatusBadge = (status: CourseStatusType) => {
    switch (status) {
      case 'Published':
        return <Badge variant="success">Published</Badge>;
      case 'Draft':
        return <Badge variant="warning">Draft</Badge>;
      case 'Archived':
        return <Badge variant="neutral">Archived</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const renderApprovalBadge = (approval: ApprovalStatusType) => {
    switch (approval) {
      case 'Approved':
        return <Badge variant="success">Approved</Badge>;
      case 'Pending Approval':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'Rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{approval}</Badge>;
    }
  };

  // Form Reset / Load Form
  const openCreateForm = () => {
    const firstCat = dbCategories[0];
    const firstSub = (firstCat?.subcategories || [])[0];
    setFormData({
      title: '',
      shortDescription: '',
      fullDescription: '',
      categoryId: firstCat?.id || '',
      category: firstCat?.name || '',
      subcategory: (typeof firstSub === 'string' ? firstSub : firstSub?.name) || '',
      difficulty: 'Beginner',
      language: 'English',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      promoVideoUrl: '',
      price: 1999,
      discountPrice: 499,
      requirements: 'Basic computer operations and web browser experience.',
      learningOutcomes: 'Master core concepts and complete practical projects.',
    });
    setEditingCourse(null);
    setIsCreateDrawerOpen(true);
  };

  const openEditForm = (course: InstructorCourseItem) => {
    if (course.approvalStatus === 'Pending Approval' || course.courseStatus === 'Published') {
      showToast(
        course.approvalStatus === 'Pending Approval'
          ? 'Course is currently pending Admin Approval. Editing is locked until review completes.'
          : 'Published courses cannot be edited directly.',
        'warning'
      );
      return;
    }
    // Find the matching DB category for the existing course category name
    const matchedCat = dbCategories.find(
      (c) => c.name.toLowerCase() === (course.category || '').toLowerCase()
    );
    setEditingCourse(course);
    setFormData({
      title: course.title,
      shortDescription: course.shortDescription,
      fullDescription: course.fullDescription,
      categoryId: (course as any).categoryId || matchedCat?.id || '',
      category: course.category,
      subcategory: course.subcategory,
      difficulty: course.difficulty,
      language: course.language,
      thumbnail: course.thumbnail,
      promoVideoUrl: course.promoVideoUrl || '',
      price: course.price,
      discountPrice: course.discountPrice || 0,
      requirements: course.requirements.join('\n'),
      learningOutcomes: course.learningOutcomes.join('\n'),
    });
    setIsCreateDrawerOpen(true);
  };
  // Image Upload & Validation Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setThumbnailError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      setThumbnailError('Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP.');
      showToast('Unsupported image format (JPG, PNG, WEBP allowed).', 'warning');
      return;
    }

    try {
      setIsUploadingThumbnail(true);
      showToast('Uploading thumbnail...', 'info');
      const slug = (formData.title || 'course').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
      const { uploadCourseThumbnail } = await import('../../services/storageService');
      const publicUrl = await uploadCourseThumbnail(slug, file);
      setFormData((prev) => ({ ...prev, thumbnail: publicUrl }));
      setThumbnailError('');
      showToast('Thumbnail uploaded successfully!');
    } catch (err: any) {
      console.error('Thumbnail upload error:', err);
      showToast(err.message || 'Failed to upload thumbnail.', 'warning');
    } finally {
      setIsUploadingThumbnail(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemoveThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnail: '' }));
    setThumbnailError('');
    showToast('Thumbnail removed.', 'info');
  };

  // Actions
  const handleSaveCourse = async (isSubmitForApproval: boolean) => {
    setThumbnailError('');

    if (!formData.title.trim()) {
      showToast('Course Title is required.', 'warning');
      return;
    }

    if (!formData.thumbnail || formData.thumbnail.trim() === '') {
      setThumbnailError('Course Thumbnail is mandatory. Please upload an image or provide an Image URL.');
      showToast('Please provide a course thumbnail.', 'warning');
      return;
    }

    const priceNum = Number(formData.price) || 0;
    const discountNum = Number(formData.discountPrice) || 0;

    const formattedReqs = formData.requirements
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const formattedOutcomes = formData.learningOutcomes
      .split('\n')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    let realCourseId = editingCourse ? editingCourse.id : '';

    try {
      setIsSaving(true);
      if (editingCourse) {
        // Edit mode via backend API
        const updateRes = await courseService.updateInstructorCourse(editingCourse.id, {
          title: formData.title,
          shortDescription: formData.shortDescription,
          fullDescription: formData.fullDescription,
          categoryId: formData.categoryId || undefined,
          category: formData.category,
          subcategory: formData.subcategory,
          difficulty: formData.difficulty,
          language: formData.language,
          thumbnail: formData.thumbnail,
          promoVideoUrl: formData.promoVideoUrl,
          price: priceNum,
          discountPrice: discountNum,
          tags: editingCourse.tags || [],
          requirements: formattedReqs,
          learningOutcomes: formattedOutcomes,
          isSubmitForApproval,
        });

        const updatedCourse = updateRes.data;
        if (updatedCourse) {
          setCourses((prev) => prev.map((c) => (c.id === editingCourse.id ? (updatedCourse as any) : c)));
        }
        showToast(`"${formData.title}" saved!`);
        setIsCreateDrawerOpen(false);
        navigate(`/instructor/curriculum?courseId=${editingCourse.id}`);
      } else {
        // Create mode via backend API
        const createRes = await courseService.createCourse({
          title: formData.title,
          shortDescription: formData.shortDescription,
          fullDescription: formData.fullDescription,
          categoryId: formData.categoryId || undefined,
          category: formData.category,
          subcategory: formData.subcategory,
          difficulty: formData.difficulty,
          language: formData.language,
          thumbnail: formData.thumbnail,
          promoVideoUrl: formData.promoVideoUrl,
          price: priceNum,
          discountPrice: discountNum,
          tags: [],
          requirements: formattedReqs,
          learningOutcomes: formattedOutcomes,
          isSubmitForApproval,
        });

        const createdCourse = createRes.data;
        realCourseId = createdCourse?.id || '';
        if (createdCourse) {
          setCourses((prev) => [createdCourse as any, ...prev]);
        }
        showToast(`"${formData.title}" draft saved!`);
        setIsCreateDrawerOpen(false);
        if (realCourseId) {
          navigate(`/instructor/curriculum?courseId=${realCourseId}`);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save course', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateCourse = (course: InstructorCourseItem) => {
    const todayIST = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });

    const duplicateItem: InstructorCourseItem = {
      ...course,
      id: `course-dup-${Date.now().toString().slice(-4)}`,
      title: `${course.title} (Copy)`,
      slug: `${course.slug}-copy`,
      studentsEnrolled: 0,
      rating: 0,
      reviewsCount: 0,
      courseStatus: 'Draft',
      approvalStatus: 'Pending Approval', // Reset approval on duplicate copy
      createdAt: todayIST,
      updatedAt: todayIST,
    };

    setCourses([duplicateItem, ...courses]);
    showToast(`Duplicated draft created: "${duplicateItem.title}"`);
  };

  const handleArchiveCourse = (course: InstructorCourseItem) => {
    const updated = courses.map((c) => (c.id === course.id ? { ...c, courseStatus: 'Archived' as CourseStatusType } : c));
    setCourses(updated);
    showToast(`Course "${course.title}" has been archived.`, 'info');
  };

  const handleDeleteCourse = async (course: InstructorCourseItem) => {
    if (course.courseStatus === 'Published' || (course.studentsEnrolled && course.studentsEnrolled > 0)) {
      showToast('Published courses with active students cannot be deleted.', 'warning');
      return;
    }

    const confirmed = await showConfirmAlert(
      'Delete Draft Course',
      `Are you sure you want to delete "${course.title}"? This action cannot be undone.`,
      'Delete Course',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        await courseService.deleteInstructorCourse(course.id);
        setCourses(courses.filter((c) => c.id !== course.id));
        showSuccessAlert('Success!', `Course "${course.title}" deleted successfully.`);
      } catch (err: any) {
        showToast(err.message || 'Failed to delete course', 'warning');
      }
    }
  };


  return (
    <div className="space-y-6 pb-16">
      {/* Step 1 Progress Tracker */}
      <CourseProgressTracker currentStep={1} courseId={activeCourseId} completedSteps={[]} />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-500'
                : toast.type === 'warning'
                ? 'bg-amber-900 border-amber-500'
                : 'bg-slate-900 border-brand-500'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                toast.type === 'success'
                  ? 'bg-emerald-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-brand-400'
              }`}
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">My Courses</h1>
            <span className="bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-extrabold px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              Instructor Studio
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your course catalog, track approval states, and build learning curricula.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={openCreateForm} className="shadow-md shadow-brand-500/20">
            <FiPlus className="w-4 h-4 mr-2" />
            Create New Course
          </Button>
        </div>
      </div>

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Courses</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
              <FiBookOpen className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{stats.total}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.published}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Draft</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <FiFileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{stats.draft}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Approval</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-2">{stats.pendingApproval}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <FiXCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{stats.rejected}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Archived</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <FiArchive className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-2">{stats.archived}</span>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        {/* Top Search Line + View Switcher */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search title, category, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
                <option value="students">Most Students</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {dbCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Course Status</label>
            <select
              value={selectedCourseStatus}
              onChange={(e) => setSelectedCourseStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Approval Status</label>
            <select
              value={selectedApprovalStatus}
              onChange={(e) => setSelectedApprovalStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Approvals</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Kannada">Kannada</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Price Type</label>
            <select
              value={selectedPriceType}
              onChange={(e) => setSelectedPriceType(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="All">All Price Types</option>
              <option value="Free">Free</option>
              <option value="Paid">Paid</option>
              <option value="Discounted">Discounted</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 4. Course Grid / Table View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} className="h-80 w-full rounded-3xl" />
          ))}
        </div>
      ) : paginatedCourses.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-3xl my-8">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">You haven't created any courses yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            No matching courses found with current filters. Create your first course to start publishing content to EduSphere LMS.
          </p>
          <Button variant="primary" size="md" onClick={openCreateForm}>
            <FiPlus className="w-4 h-4 mr-2" />
            Create Your First Course
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail & Badges overlay */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                  {/* Ambient Backdrop */}
                  <img
                    src={course.thumbnail}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                  />
                  {/* Full Fitted Image */}
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="relative z-10 w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5">
                    {renderStatusBadge(course.courseStatus)}
                    {renderApprovalBadge(course.approvalStatus)}
                  </div>
                  <div className="absolute bottom-3 right-3 z-20 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {course.price === 0 ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        ₹{course.discountPrice || course.price}
                        {course.discountPrice ? (
                          <span className="line-through text-slate-400 text-[10px]">₹{course.price}</span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="text-brand-600 dark:text-brand-400 font-bold">{course.category}</span>
                    <span>{course.difficulty} • {course.language}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-2 leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.shortDescription}
                  </p>

                  {/* Rejection notice preview if rejected */}
                  {course.approvalStatus === 'Rejected' && course.rejectionReason && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-2">
                      <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{course.rejectionReason}</span>
                    </div>
                  )}

                  {/* Course stats */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <FiUsers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{course.studentsEnrolled} students</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {course.rating > 0 ? course.rating : 'N/A'}
                      </span>
                      {course.reviewsCount > 0 && <span>({course.reviewsCount})</span>}
                    </div>

                    <div className="text-[11px] text-slate-400">Upd: {course.updatedAt}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                {/* Main Course Lifecycle Actions */}
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => setPreviewCourse(course)}
                    className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1"
                    title="View Course Preview"
                  >
                    <FiEye className="w-3.5 h-3.5 text-brand-600" /> View
                  </button>

                  {course.courseStatus === 'Published' || course.approvalStatus === 'Pending Approval' ? (
                    <span
                      className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center gap-1 cursor-not-allowed select-none"
                      title={
                        course.approvalStatus === 'Pending Approval'
                          ? 'Under Admin Review: Editing is locked'
                          : 'Published Course: Editing is locked to protect active students & certificates'
                      }
                    >
                      <FiLock className="w-3.5 h-3.5 text-slate-400" /> Locked
                    </span>
                  ) : (
                    <button
                      onClick={() => openEditForm(course)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1"
                      title="Edit Details"
                    >
                      <FiEdit className="w-3.5 h-3.5 text-amber-600" /> Edit
                    </button>
                  )}

                  <button
                    onClick={() => handleDuplicateCourse(course)}
                    className="p-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                    title="Duplicate Course"
                  >
                    <FiCopy className="w-3.5 h-3.5" />
                  </button>

                  {course.courseStatus !== 'Archived' && (
                    <button
                      onClick={() => handleArchiveCourse(course)}
                      className="p-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                      title="Archive Course"
                    >
                      <FiArchive className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {course.courseStatus !== 'Published' && course.approvalStatus !== 'Pending Approval' && (
                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="p-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-xl hover:bg-rose-100"
                      title="Delete Draft Course"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>


                {/* Sub-module Integration Buttons */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  <button
                    onClick={() => navigate(`/instructor/curriculum?courseId=${course.id}`)}
                    className="p-1.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center"
                    title="Manage Curriculum"
                  >
                    <FiLayers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/content?courseId=${course.id}`)}
                    className="p-1.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center"
                    title="Manage Content"
                  >
                    <FiFolder className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/assignments?courseId=${course.id}`)}
                    className="p-1.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center"
                    title="Manage Assignments"
                  >
                    <FiFileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/quizzes?courseId=${course.id}`)}
                    className="p-1.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center"
                    title="Manage Quizzes"
                  >
                    <FiHelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFutureModuleNotice({ moduleName: 'Schedule Live Class', courseTitle: course.title })}
                    className="p-1.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center"
                    title="Schedule Live Class"
                  >
                    <FiVideo className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Course Info</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Students</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="relative z-10 max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-xs">{course.title}</h4>
                          <span className="text-[11px] text-slate-400">Updated: {course.updatedAt}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{course.category}</div>
                      <span className="text-[11px] text-slate-400">{course.difficulty} • {course.language}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      {course.price === 0 ? (
                        <span className="text-emerald-500">Free</span>
                      ) : (
                        <span>
                          ₹{course.discountPrice || course.price}
                          {course.discountPrice ? (
                            <span className="block text-[10px] line-through text-slate-400 font-normal">₹{course.price}</span>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">{course.studentsEnrolled}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                        <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {course.rating > 0 ? course.rating : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1">{renderStatusBadge(course.courseStatus)}</div>
                      <div className="flex items-center gap-1">{renderApprovalBadge(course.approvalStatus)}</div>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => setPreviewCourse(course)}
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 inline-flex items-center"
                        title="View Preview"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      {course.courseStatus === 'Published' || course.approvalStatus === 'Pending Approval' ? (
                        <span
                          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 inline-flex items-center cursor-not-allowed"
                          title={
                            course.approvalStatus === 'Pending Approval'
                              ? 'Under Admin Review: Editing is locked'
                              : 'Published Course: Editing is locked to protect active students & certificates'
                          }
                        >
                          <FiLock className="w-4 h-4" />
                        </span>
                      ) : (
                        <button
                          onClick={() => openEditForm(course)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 inline-flex items-center"
                          title="Edit Course"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateCourse(course)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center"
                        title="Duplicate"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                      {course.courseStatus !== 'Published' && course.approvalStatus !== 'Pending Approval' && (
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 inline-flex items-center"
                          title="Delete Draft Course"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Bar */}
      {sortedCourses.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, sortedCourses.length)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{sortedCourses.length}</strong> courses
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiChevronLeft className="w-4 h-4" /> Prev
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-8 h-8 rounded-xl font-bold transition-all ${
                    currentPage === pNum
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: Create / Edit Course Modal Side Drawer */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isCreateDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {editingCourse ? 'Edit Course Details' : 'Create New Course'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fill in course metadata, pricing in ₹ (INR), category, and requirements.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateDrawerOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedCat = dbCategories.find((c) => c.id === selectedId);
                        const firstSub = (selectedCat?.subcategories || [])[0];
                        setFormData({
                          ...formData,
                          categoryId: selectedId,
                          category: selectedCat?.name || '',
                          subcategory: (typeof firstSub === 'string' ? firstSub : firstSub?.name) || '',
                        });
                      }}
                      disabled={isCategoriesLoading}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 font-semibold"
                    >
                      {isCategoriesLoading ? (
                        <option value="">Loading categories...</option>
                      ) : dbCategories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        dbCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none font-semibold"
                    >
                      {(dbCategories.find((c) => c.id === formData.categoryId)?.subcategories || []).map(
                        (sub) => {
                          const subName = typeof sub === 'string' ? sub : sub.name;
                          return (
                            <option key={subName} value={subName}>
                              {subName}
                            </option>
                          );
                        }
                      )}
                      {(dbCategories.find((c) => c.id === formData.categoryId)?.subcategories || []).length === 0 && (
                        <option value="">No subcategories</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Course Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master React & Next.js 14 Web Development"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Concise overview of the course highlights..."
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Detailed explanation of topics covered, target audience, and structure..."
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as CourseDifficultyType })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none font-semibold"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                {/* Flexible Course Thumbnail Selector (Option 1: Upload / Option 2: Image URL) */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Course Thumbnail <span className="text-rose-500">*</span>
                    </label>

                    {/* Mode Switcher Tabs */}
                    <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailMode('upload');
                          setThumbnailError('');
                        }}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          thumbnailMode === 'upload'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Option 1 – Upload (Recommended)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailMode('url');
                          setThumbnailError('');
                        }}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          thumbnailMode === 'url'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Option 2 – Image URL
                      </button>
                    </div>
                  </div>

                  {/* Option 1: File Upload */}
                  {thumbnailMode === 'upload' && (
                    <div className="space-y-2">
                      <div className={`border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center transition-colors relative ${
                        isUploadingThumbnail ? 'bg-slate-100 dark:bg-slate-800 opacity-70 cursor-wait' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/80 cursor-pointer'
                      }`}>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleImageUpload}
                          disabled={isUploadingThumbnail}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                          {isUploadingThumbnail ? (
                            <>
                              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                Uploading thumbnail...
                              </p>
                            </>
                          ) : (
                            <>
                              <FiUploadCloud className="w-6 h-6 text-indigo-500" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Click to upload image or drag & drop
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Supported Formats: JPG, JPEG, PNG, WEBP (Max 5MB)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 2: Image URL Input */}
                  {thumbnailMode === 'url' && (
                    <div>
                      <input
                        type="text"
                        placeholder="https://example.com/course-thumbnail.jpg"
                        value={formData.thumbnail}
                        onChange={(e) => {
                          setFormData({ ...formData, thumbnail: e.target.value });
                          setThumbnailError('');
                        }}
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Paste a direct public image URL to load the preview automatically.
                      </p>
                    </div>
                  )}

                  {/* Validation Error Message */}
                  {thumbnailError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                      <FiAlertCircle className="w-4 h-4 shrink-0" />
                      <span>{thumbnailError}</span>
                    </div>
                  )}

                  {/* Instant Image Preview Box */}
                  {formData.thumbnail && formData.thumbnail.trim() !== '' && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Thumbnail Preview
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-md text-[10px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setThumbnailFitMode('contain')}
                              className={`px-2 py-0.5 rounded transition-all ${
                                thumbnailFitMode === 'contain'
                                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              Fit Full
                            </button>
                            <button
                              type="button"
                              onClick={() => setThumbnailFitMode('cover')}
                              className={`px-2 py-0.5 rounded transition-all ${
                                thumbnailFitMode === 'cover'
                                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              Fill Card
                            </button>
                          </div>
                          <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                            Replace
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveThumbnail}
                            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center">
                        {/* Ambient Blurred Backdrop */}
                        <img
                          src={formData.thumbnail}
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-lg opacity-35 scale-110 pointer-events-none"
                        />
                        {/* 100% Complete Image */}
                        <img
                          src={formData.thumbnail}
                          alt="Thumbnail Preview"
                          onError={() => setThumbnailError('Failed to load image preview. Please check the URL.')}
                          className={`relative z-10 w-full h-full ${
                            thumbnailFitMode === 'contain' ? 'object-contain' : 'object-cover'
                          } transition-all duration-300 drop-shadow-md`}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Promotional Video URL <span className="font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/embed/... (Optional)"
                      value={formData.promoVideoUrl}
                      onChange={(e) => setFormData({ ...formData, promoVideoUrl: e.target.value })}
                      className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pricing in INR ₹ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Regular Price (₹ INR)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 4999"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Discounted Offer Price (₹ INR)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1499"
                      value={formData.discountPrice}
                      onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>



                {/* Course Requirements */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Prerequisites / Requirements (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Basic HTML & CSS knowledge&#10;Laptop with VS Code installed"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Learning Outcomes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    What Students Will Learn / Outcomes (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Build modern full-stack web applications&#10;Deploy projects on Vercel and Cloudflare"
                    value={formData.learningOutcomes}
                    onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={() => setIsCreateDrawerOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={() => handleSaveCourse(false)} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: Course Preview Modal */}
      {/* ======================================================== */}
      <AnimatePresence>
        {previewCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">Course Preview</Badge>
                  <span className="text-xs text-slate-500 font-semibold">{previewCourse.category}</span>
                </div>
                <button
                  onClick={() => setPreviewCourse(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100">
                {/* Hero / Cover */}
                <div className="relative aspect-video max-h-72 w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={previewCourse.thumbnail}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                  />
                  <img
                    src={previewCourse.thumbnail}
                    alt={previewCourse.title}
                    className="relative z-10 max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-6 flex flex-col justify-end z-20 pointer-events-none">
                    <h2 className="text-xl font-extrabold text-white leading-snug">{previewCourse.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-2">
                      <span>{previewCourse.difficulty}</span> • <span>{previewCourse.language}</span> •{' '}
                      <span>{previewCourse.durationHours} Total Hours</span>
                    </div>
                  </div>
                </div>

                {/* Price & Approval Status Overview */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Course Pricing</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      {previewCourse.price === 0 ? (
                        <span className="text-emerald-500">Free Course</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          ₹{previewCourse.discountPrice || previewCourse.price}
                          {previewCourse.discountPrice ? (
                            <span className="line-through text-slate-400 text-sm font-normal">₹{previewCourse.price}</span>
                          ) : null}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStatusBadge(previewCourse.courseStatus)}
                    {renderApprovalBadge(previewCourse.approvalStatus)}
                  </div>
                </div>

                {/* Full Description */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">Course Overview</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {previewCourse.fullDescription}
                  </p>
                </div>

                {/* Outcomes */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">What You Will Learn</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    {previewCourse.learningOutcomes.map((out, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <Button variant="primary" size="md" onClick={() => setPreviewCourse(null)}>
                  Close Preview
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: Delete Confirmation Modal */}
      {/* ======================================================== */}
      <AnimatePresence>
        {deletingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <FiTrash2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Course</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{deletingCourse.title}"</strong>? This action will permanently remove the course draft and cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="md" onClick={() => setDeletingCourse(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="md" onClick={() => deletingCourse && handleDeleteCourse(deletingCourse)}>
                  Yes, Delete Course
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: Future Module Notification */}
      {/* ======================================================== */}
      <AnimatePresence>
        {futureModuleNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                <FiInfo className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {futureModuleNotice.moduleName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Target course: <strong className="text-brand-600">{futureModuleNotice.courseTitle}</strong>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This dedicated sub-module workspace is scheduled for implementation in a subsequent phase of EduSphere LMS.
              </p>
              <div className="pt-2">
                <Button variant="primary" size="md" className="w-full" onClick={() => setFutureModuleNotice(null)}>
                  Got it
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
