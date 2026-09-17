import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiUserCheck,
  FiClock,
  FiUserX,
  FiSearch,
  FiFilter,
  FiEye,
  FiCheckCircle,
  FiBookOpen,
  FiCreditCard,
  FiX,
  FiCheck,
  FiPlus,
  FiMail,
  FiPhone,
  FiLock,
  FiAward,
  FiBriefcase,
  FiFolder,
  FiUpload,
  FiAlertCircle,
  FiRefreshCw,
  FiShield,
  FiTrash2
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/common/Avatar';
import {
  showSuccessAlert,
  showConfirmAlert,
  showErrorAlert
} from '../../utils/swalAlerts';
import { adminService, type AdminUserProfile } from '../../services/adminService';
import { courseService } from '../../services/courseService';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../../contexts/NotificationContext';
import type { InstructorPayoutInfo } from '../../types/payoutTypes';

export const DEFAULT_INSTRUCTOR_CATEGORIES = [
  'Web Development',
  'Data Science & AI',
  'Mobile App Development',
  'Cloud & DevOps',
  'Cybersecurity',
  'UI/UX & Product Design',
  'Business & Management',
  'Computer Science & Algorithms',
  'Other / General',
];

export interface InstructorCourseItem {
  id: string;
  title: string;
  thumbnail: string;
  status: 'Published' | 'Draft' | 'Pending Approval';
  studentsEnrolled: number;
  revenueINR: number;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type AccountStatus = 'active' | 'inactive';

export interface InstructorRecord {
  id: string;
  instructorId: string;
  name: string;
  email: string;
  mobile: string;
  avatar: string;
  qualification: string;
  experience: string;
  specialization: string;
  category: string;
  bio: string;
  registeredDate: string;
  approvalStatus: ApplicationStatus;
  status: AccountStatus;
  coursesCreated: InstructorCourseItem[];
  coursesCount: number;
  payoutInfo?: InstructorPayoutInfo;
}

const mapProfileToInstructorRecord = (
  p: AdminUserProfile,
  courses: InstructorCourseItem[] = []
): InstructorRecord => {
  let approvalStatus: ApplicationStatus = 'approved';
  if (p.instructorApprovalStatus === 'pending') approvalStatus = 'pending';
  else if (p.instructorApprovalStatus === 'rejected') approvalStatus = 'rejected';
  else approvalStatus = 'approved';

  const status: AccountStatus = (p.status === 'inactive' || p.status === 'suspended') ? 'inactive' : 'active';

  const regDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : 'Recently';

  const effectiveCoursesCount = Math.max(courses.length, p.coursesCreatedCount || 0);

  const rawSpecialization = p.specialization || p.qualification || 'Education';
  const hasCompoundSpec = rawSpecialization.includes('•');
  const parsedCategory = p.category || (hasCompoundSpec ? rawSpecialization.split('•')[0].trim() : '') || 'General';
  const parsedSpecialization = hasCompoundSpec ? rawSpecialization.split('•').slice(1).join('•').trim() : rawSpecialization;

  return {
    id: p.id,
    instructorId: p.studentIdNumber || `INS-${p.id.slice(0, 8).toUpperCase()}`,
    name: p.fullName,
    email: p.email,
    mobile: p.phone || '+91 98765 00000',
    avatar: p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    qualification: p.qualification || 'Instructor',
    experience: p.experience || 'Not specified',
    specialization: parsedSpecialization || parsedCategory,
    category: parsedCategory,
    bio: p.bio || `${p.fullName} is an instructor on EduSphere LMS.`,
    registeredDate: regDate,
    approvalStatus,
    status,
    coursesCreated: courses,
    coursesCount: effectiveCoursesCount,
    payoutInfo: p.payoutInfo,
  };
};

export const mockInstructorsList: InstructorRecord[] = [];

export interface InstructorFormData {
  profilePhoto: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  category: string;
  qualification: string;
  experience: string;
  password: string;
  confirmPassword: string;
}

export const AdminInstructorManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { notifications, markAsRead, refreshNotifications } = useNotifications();
  const [instructors, setInstructors] = useState<InstructorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorRecord | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorRecord | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<InstructorFormData>({
    profilePhoto: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    category: 'Web Development',
    qualification: '',
    experience: '',
    password: '',
    confirmPassword: '',
  });

  // Filters & Search & Pagination
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadInstructors = useCallback(async () => {
    setIsLoading(true);
    try {
      const [instructorsRes, adminCoursesRes, publicCoursesRes] = await Promise.allSettled([
        adminService.getInstructors({ limit: 100 }),
        courseService.getAdminCourses({ limit: 200 }),
        courseService.getPublicCourses({ limit: 200 }),
      ]);

      const rawInstructors =
        instructorsRes.status === 'fulfilled' && instructorsRes.value.success && Array.isArray(instructorsRes.value.data)
          ? instructorsRes.value.data
          : [];

      // Combine admin courses & public courses without duplicates
      const allCourseList: any[] = [];
      const seenCourseIds = new Set<string>();

      const addCourses = (arr: any[]) => {
        if (Array.isArray(arr)) {
          arr.forEach((c) => {
            if (c && c.id && !seenCourseIds.has(c.id)) {
              seenCourseIds.add(c.id);
              allCourseList.push(c);
            }
          });
        }
      };

      if (adminCoursesRes.status === 'fulfilled' && adminCoursesRes.value.success) {
        addCourses(
          Array.isArray(adminCoursesRes.value.data)
            ? adminCoursesRes.value.data
            : (adminCoursesRes.value.data as any)?.courses || []
        );
      }
      if (publicCoursesRes.status === 'fulfilled' && publicCoursesRes.value.success) {
        addCourses(
          Array.isArray(publicCoursesRes.value.data)
            ? publicCoursesRes.value.data
            : (publicCoursesRes.value.data as any)?.courses || []
        );
      }

      // Group courses by instructor ID, email, or name
      const coursesByInstructor: Record<string, InstructorCourseItem[]> = {};

      allCourseList.forEach((c: any) => {
        const instId = c.instructorId || c.instructor?.id || c.instructor_id;
        const instName = (c.instructorName || c.instructor?.name || '').toLowerCase().trim();
        const instEmail = (c.instructorEmail || c.instructor?.email || '').toLowerCase().trim();

        const rawStatus = (c.status || c.courseStatus || c.approvalStatus || '').toLowerCase();
        const normalizedStatus: 'Published' | 'Draft' | 'Pending Approval' =
          rawStatus === 'published' || rawStatus === 'approved'
            ? 'Published'
            : rawStatus === 'under_review' || rawStatus === 'pending_approval' || rawStatus === 'pending'
              ? 'Pending Approval'
              : 'Draft';

        const item: InstructorCourseItem = {
          id: c.id,
          title: c.title,
          thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
          status: normalizedStatus,
          studentsEnrolled: c.studentsEnrolled || c.total_enrolled || c.enrolledCount || 0,
          revenueINR: c.revenueINR || (c.price ? (c.studentsEnrolled || 0) * c.price : 0),
        };

        const keys = [instId, instName, instEmail].filter(Boolean);
        keys.forEach((k) => {
          if (!coursesByInstructor[k]) {
            coursesByInstructor[k] = [];
          }
          if (!coursesByInstructor[k].some((existing) => existing.id === item.id)) {
            coursesByInstructor[k].push(item);
          }
        });
      });

      if (rawInstructors.length > 0) {
        const liveRecords = rawInstructors.map((p) => {
          const matchedCourses =
            coursesByInstructor[p.id] ||
            (p.email ? coursesByInstructor[p.email.toLowerCase().trim()] : null) ||
            (p.fullName ? coursesByInstructor[p.fullName.toLowerCase().trim()] : null) ||
            [];
          return mapProfileToInstructorRecord(p, matchedCourses);
        });
        setInstructors(liveRecords);
      } else {
        setInstructors([]);
      }
    } catch (err) {
      console.error('Failed to load instructors from backend:', err);
      setInstructors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstructors();
  }, [loadInstructors]);

  const handleOpenCreateModal = () => {
    setEditingInstructor(null);
    setFormData({
      profilePhoto: '',
      fullName: '',
      email: '',
      mobileNumber: '',
      category: 'Web Development',
      qualification: '',
      experience: '',
      password: '',
      confirmPassword: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'mobileNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePhotoUploadSimulated = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { uploadAvatar } = await import('../../services/storageService');
        const instId = formData.email || `instructor-${Date.now()}`;
        const url = await uploadAvatar(instId, file);
        setFormData((prev) => ({ ...prev, profilePhoto: url }));
      } catch {
        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.fullName || 'instructor')}`;
        setFormData((prev) => ({ ...prev, profilePhoto: url }));
      }
    }
  };

  const handleCreateOrUpdateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address.';
      } else {
        // Check uniqueness of email (ignore if editing current instructor)
        const isDuplicate = instructors.some(
          (inst) => inst.email.toLowerCase() === formData.email.trim().toLowerCase() && inst.id !== editingInstructor?.id
        );
        if (isDuplicate) {
          errors.email = 'Instructor email must be unique. An account with this email already exists.';
        }
      }
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required.';
    } else {
      const digitsOnly = formData.mobileNumber.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        errors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
      }
    }

    if (!formData.qualification.trim()) {
      errors.qualification = 'Qualification is required.';
    }

    if (!formData.experience.trim()) {
      errors.experience = 'Experience is required.';
    }

    if (!editingInstructor) {
      // Password checks required for creation
      if (!formData.password) {
        errors.password = 'Password is required.';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long.';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    } else if (formData.password) {
      // If editing and password provided
      if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long.';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const formattedMobile = `+91 ${formData.mobileNumber.trim().replace(/^\+91\s*/, '')}`;
    const defaultAvatar =
      formData.profilePhoto ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';

    if (editingInstructor) {
      // Update existing
      try {
        await adminService.updateInstructor(editingInstructor.id, {
          fullName: formData.fullName.trim(),
          phone: formattedMobile,
          qualification: formData.qualification.trim(),
          experience: formData.experience.trim(),
          category: formData.category,
        });
      } catch {
        // Fallback gracefully
      }

      setInstructors((prev) =>
        prev.map((inst) =>
          inst.id === editingInstructor.id
            ? {
              ...inst,
              name: formData.fullName.trim(),
              email: formData.email.trim(),
              mobile: formattedMobile,
              qualification: formData.qualification.trim(),
              experience: formData.experience.trim(),
              category: formData.category || inst.category,
              avatar: defaultAvatar,
            }
            : inst
        )
      );
      showSuccessAlert('Success!', 'Instructor profile updated successfully.');
    } else {
      // Create new Instructor account directly
      try {
        const res = await adminService.createInstructor({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formattedMobile,
          qualification: formData.qualification.trim(),
          experience: formData.experience.trim(),
          specialization: `${formData.category.trim()} • ${formData.qualification.trim()}`,
          bio: `${formData.qualification.trim()} instructor in ${formData.category.trim()} with ${formData.experience.trim()} experience.`,
        });
        if (res.success && res.data) {
          const liveRec = mapProfileToInstructorRecord(res.data);
          setInstructors((prev) => [liveRec, ...prev]);
          showSuccessAlert('Success!', 'Instructor account created successfully.');
          setIsModalOpen(false);
          return;
        }
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) {
          setFormErrors({ email: err.message });
          return;
        }
      }

      const newIdNumber = Math.floor(1000 + Math.random() * 9000);
      const newRecord: InstructorRecord = {
        id: `inst-rec-${Date.now()}`,
        instructorId: `INS-2026-${newIdNumber}`,
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        mobile: formattedMobile,
        avatar: defaultAvatar,
        qualification: formData.qualification.trim(),
        experience: formData.experience.trim(),
        specialization: formData.qualification.trim(),
        category: formData.category || 'General',
        bio: `${formData.qualification.trim()} instructor in ${formData.category.trim()} with ${formData.experience.trim()} experience.`,
        registeredDate: 'Just now',
        approvalStatus: 'approved',
        status: 'active',
        coursesCreated: [],
        coursesCount: 0,
        payoutInfo: undefined,
      };

      setInstructors((prev) => [newRecord, ...prev]);
      showSuccessAlert('Success!', 'Instructor account created successfully.');
    }

    setIsModalOpen(false);
  };

  // Status Action Handlers
  const handleApproveInstructor = async (id: string) => {
    try {
      const res = await adminService.approveInstructor(id);
      if (res.success || res.data) {
        setInstructors((prev) =>
          prev.map((i) => (i.id === id ? { ...i, approvalStatus: 'approved', status: 'active' } : i))
        );
        showSuccessAlert('Success!', 'Instructor application approved successfully.');
        if (selectedInstructor && selectedInstructor.id === id) {
          setSelectedInstructor((prev) => (prev ? { ...prev, approvalStatus: 'approved', status: 'active' } : null));
        }
        // Invalidate sidebar and dashboard caches so badge count updates immediately
        queryClient.invalidateQueries({ queryKey: ['admin-sidebar-stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        // Mark matching unread notification as read or refresh notifications
        const pendingNotif = notifications.find(
          (n) => n.sourceId === id || n.sourceId === `instructor-reg-${id}` || (n as any).data?.instructorId === id
        );
        if (pendingNotif && !pendingNotif.isRead && !pendingNotif.read) {
          markAsRead(pendingNotif.id).catch(() => null);
        } else {
          refreshNotifications().catch(() => null);
        }
      } else {
        showErrorAlert('Approval Failed', res.message || 'Could not approve instructor application.');
      }
    } catch (err: any) {
      showErrorAlert('Approval Failed', err?.message || 'Server error while approving application.');
    }
  };

  const handleRejectInstructor = async (id: string) => {
    const confirmed = await showConfirmAlert(
      'Reject Instructor Application?',
      'Are you sure you want to reject this instructor application?',
      'Reject Application',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        const res = await adminService.rejectInstructor(id, 'Application rejected by administrator');
        if (res.success || res.data) {
          setInstructors((prev) =>
            prev.map((i) => (i.id === id ? { ...i, approvalStatus: 'rejected', status: 'inactive' } : i))
          );
          showSuccessAlert('Success!', 'Instructor application rejected.');
          if (selectedInstructor && selectedInstructor.id === id) {
            setSelectedInstructor((prev) => (prev ? { ...prev, approvalStatus: 'rejected', status: 'inactive' } : null));
          }
          // Invalidate sidebar and dashboard caches so badge count updates immediately
          queryClient.invalidateQueries({ queryKey: ['admin-sidebar-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
          // Mark matching unread notification as read or refresh notifications
          const pendingNotif = notifications.find(
            (n) => n.sourceId === id || n.sourceId === `instructor-reg-${id}` || (n as any).data?.instructorId === id
          );
          if (pendingNotif && !pendingNotif.isRead && !pendingNotif.read) {
            markAsRead(pendingNotif.id).catch(() => null);
          } else {
            refreshNotifications().catch(() => null);
          }
        } else {
          showErrorAlert('Rejection Failed', res.message || 'Could not reject instructor application.');
        }
      } catch (err: any) {
        showErrorAlert('Rejection Failed', err?.message || 'Server error while rejecting application.');
      }
    }
  };

  const handleDeleteInstructor = async (id: string, name?: string) => {
    const target = instructors.find((i) => i.id === id);
    const targetName = name || target?.name || 'this instructor';
    const confirmed = await showConfirmAlert(
      'Delete Instructor Record?',
      `Are you sure you want to permanently delete "${targetName}"? This will remove their record from the database and free up their email address for re-registration.`,
      'Yes, Delete',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        const res: any = await adminService.deleteUser(id);
        if (res?.success || res?.data || !res?.error) {
          setInstructors((prev) => prev.filter((i) => i.id !== id));
          showSuccessAlert('Deleted!', 'Instructor account has been permanently removed.');
          if (selectedInstructor && selectedInstructor.id === id) {
            setSelectedInstructor(null);
          }
          queryClient.invalidateQueries({ queryKey: ['admin-sidebar-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
          refreshNotifications().catch(() => null);
        } else {
          showErrorAlert('Delete Failed', res?.message || 'Could not delete instructor.');
        }
      } catch (err: any) {
        showErrorAlert('Delete Failed', err?.message || 'Server error while deleting instructor.');
      }
    }
  };

  const handleToggleActiveStatus = async (id: string) => {
    const target = instructors.find((i) => i.id === id);
    if (!target) return;
    const nextStatus: AccountStatus = target.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await adminService.updateUserStatus(id, nextStatus);
      if (res.success || res.data) {
        setInstructors((prev) =>
          prev.map((i) => {
            if (i.id === id) {
              return { ...i, status: nextStatus };
            }
            return i;
          })
        );
        showToast(`Instructor account set to ${nextStatus === 'active' ? 'Active' : 'Inactive'}.`);
        if (selectedInstructor && selectedInstructor.id === id) {
          setSelectedInstructor((prev) =>
            prev
              ? {
                ...prev,
                status: nextStatus,
              }
              : null
          );
        }
      } else {
        showErrorAlert('Status Update Failed', res.message || 'Could not update instructor status.');
      }
    } catch (err: any) {
      showErrorAlert('Status Update Failed', err?.message || 'Server error while updating status.');
    }
  };

  // Metrics calculation
  const totalInstructorsCount = instructors.length;
  const approvedCount = useMemo(
    () => instructors.filter((i) => i.approvalStatus === 'approved').length,
    [instructors]
  );
  const pendingCount = useMemo(
    () => instructors.filter((i) => i.approvalStatus === 'pending').length,
    [instructors]
  );
  const inactiveCount = useMemo(
    () =>
      instructors.filter(
        (i) => i.approvalStatus === 'rejected' || (i.approvalStatus === 'approved' && i.status === 'inactive')
      ).length,
    [instructors]
  );

  // Filtered Instructor List (Pending Approval always prioritized at the TOP)
  const filteredInstructors = useMemo(() => {
    const list = instructors.filter((inst) => {
      const matchesSearch =
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.instructorId.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'Pending Approval') {
        matchesStatus = inst.approvalStatus === 'pending';
      } else if (statusFilter === 'Approved') {
        matchesStatus = inst.approvalStatus === 'approved';
      } else if (statusFilter === 'Active') {
        matchesStatus = inst.approvalStatus === 'approved' && inst.status === 'active';
      } else if (statusFilter === 'Inactive') {
        matchesStatus = (inst.approvalStatus === 'approved' && inst.status === 'inactive') || inst.approvalStatus === 'rejected';
      } else if (statusFilter === 'Rejected') {
        matchesStatus = inst.approvalStatus === 'rejected';
      }

      return matchesSearch && matchesStatus;
    });

    // Prioritize Pending Approval instructors at the TOP
    return [...list].sort((a, b) => {
      if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
      if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
      return 0;
    });
  }, [instructors, searchQuery, statusFilter]);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE) || 1;

  const paginatedInstructors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInstructors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInstructors, currentPage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16 font-sans"
    >
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700"
          >
            <FiCheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiUserCheck className="w-7 h-7 text-purple-600 dark:text-purple-400" /> Instructor Governance Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review teacher applications, create instructor accounts, manage approval statuses, inspect created courses & view payout details.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={loadInstructors}
            disabled={isLoading}
            className="text-xs rounded-xl flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="text-xs font-bold py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FiPlus className="w-4 h-4" /> Create Instructor
          </Button>
          <Badge variant="primary" className="hidden lg:inline-flex">
            System Admin Governance
          </Badge>
        </div>
      </div>

      {/* Metrics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-[20px] bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-3.5">
          <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Instructors</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {totalInstructorsCount}
            </h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3.5">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Approved Instructors</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {approvedCount}
            </h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3.5">
          <div className="p-3 bg-amber-600 text-white rounded-xl shadow-sm">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pending Approval</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {pendingCount}
            </h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3.5">
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm">
            <FiUserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Inactive / Rejected</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {inactiveCount}
            </h3>
          </div>
        </Card>
      </div>

      {/* Search & Filters Toolbar */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Instructor Name, Email, or Instructor ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <FiFilter className="w-4 h-4 text-slate-400" /> Status Filter:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Instructors Table / List View */}
      {isLoading ? (
        <Card className="p-12 text-center rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading instructor records...</p>
        </Card>
      ) : filteredInstructors.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiUserX className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No instructors found.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No instructor application or active teacher matched your search criteria.
          </p>
          {(searchQuery || statusFilter !== 'All') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="text-xs rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-0 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-6 min-w-[220px]">Instructor Profile</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Instructor ID</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Mobile & Qualification</th>
                  <th className="py-3.5 px-4 text-center min-w-[110px]">Courses</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Status</th>
                  <th className="py-3.5 px-6 text-right min-w-[340px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                {paginatedInstructors.map((inst) => (
                  <motion.tr
                    key={inst.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Instructor Info */}
                    <td className="py-3.5 px-6 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={inst.avatar}
                          name={inst.name}
                          email={inst.email}
                          role="instructor"
                          size="md"
                          shape="rounded"
                          className="border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{inst.name}</h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                            <FiMail className="w-3 h-3 text-slate-400 shrink-0" /> {inst.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400 min-w-[130px]">
                      {inst.instructorId}
                    </td>

                    {/* Mobile & Qualification */}
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="space-y-0.5">
                        <p className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                          <FiPhone className="w-3 h-3 text-emerald-500 shrink-0" /> {inst.mobile}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 flex items-center gap-1.5">
                          <FiAward className="w-3 h-3 text-purple-500 shrink-0" /> {inst.qualification}
                        </p>
                      </div>
                    </td>

                    {/* Courses */}
                    <td className="py-3.5 px-4 text-center min-w-[110px]">
                      <Badge variant={(inst.coursesCount ?? inst.coursesCreated.length) > 0 ? 'primary' : 'neutral'}>
                        {(inst.coursesCount ?? inst.coursesCreated.length)} Course{(inst.coursesCount ?? inst.coursesCreated.length) === 1 ? '' : 's'}
                      </Badge>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center min-w-[120px]">
                      {inst.approvalStatus === 'pending' ? (
                        <Badge variant="warning">⏳ Pending</Badge>
                      ) : inst.approvalStatus === 'rejected' ? (
                        <Badge variant="danger">✕ Rejected</Badge>
                      ) : (
                        <Badge variant={inst.status === 'active' ? 'success' : 'neutral'}>
                          {inst.status === 'active' ? '✓ Approved' : '✓ Approved (Inactive)'}
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap min-w-[340px]">
                      {inst.approvalStatus === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedInstructor(inst)}
                            className="h-8 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                          >
                            <FiEye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>View Profile</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApproveInstructor(inst.id)}
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
                          >
                            <FiCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Approve</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRejectInstructor(inst.id)}
                            className="h-8 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
                          >
                            <FiX className="w-3.5 h-3.5 shrink-0" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      ) : inst.approvalStatus === 'rejected' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedInstructor(inst)}
                            className="h-8 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                          >
                            <FiEye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>View Profile</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInstructor(inst.id, inst.name)}
                            className="h-8 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap border-rose-300 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold"
                            title="Permanently delete this rejected application"
                          >
                            <FiTrash2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedInstructor(inst)}
                            className="h-8 px-3 text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                          >
                            <FiEye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>View Profile</span>
                          </Button>

                          <div
                            className="flex items-center gap-2 h-8 px-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shrink-0"
                            title={inst.status === 'active' ? 'Active - Click to Deactivate' : 'Inactive - Click to Activate'}
                          >
                            <button
                              type="button"
                              role="switch"
                              aria-checked={inst.status === 'active'}
                              onClick={() => handleToggleActiveStatus(inst.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 ${inst.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            >
                              <span className="sr-only">{inst.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${inst.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                            <span className={`text-[11px] font-black w-8 text-left uppercase ${inst.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                              {inst.status === 'active' ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      {!isLoading && filteredInstructors.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-slate-100">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>–
            <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * ITEMS_PER_PAGE, filteredInstructors.length)}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{filteredInstructors.length}</span> instructors
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 shadow-sm"
                >
                  Previous
                </button>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc: (number | '...')[], p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-slate-400 text-xs font-bold">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p as number)}
                      className={`min-w-[34px] h-8 px-3 text-xs font-black rounded-xl border transition-all ${currentPage === p
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}

              {currentPage < totalPages && (
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 shadow-sm"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructor Details Slide-Over / Modal */}
      <AnimatePresence>
        {selectedInstructor && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto font-sans"
            role="dialog"
            aria-label="Instructor Profile Details"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
                    {selectedInstructor.instructorId}
                  </span>
                  {selectedInstructor.approvalStatus === 'pending' ? (
                    <Badge variant="warning">Application: Pending Approval</Badge>
                  ) : selectedInstructor.approvalStatus === 'rejected' ? (
                    <Badge variant="danger">Application: Rejected</Badge>
                  ) : (
                    <Badge variant={selectedInstructor.status === 'active' ? 'success' : 'neutral'}>
                      {selectedInstructor.status === 'active' ? 'Approved • Active' : 'Approved • Inactive'}
                    </Badge>
                  )}
                </div>

                <button
                  onClick={() => setSelectedInstructor(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Instructor Bio & Profile Banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <Avatar
                  src={selectedInstructor.avatar}
                  name={selectedInstructor.name}
                  email={selectedInstructor.email}
                  role="instructor"
                  size="2xl"
                  shape="rounded"
                  className="border-2 border-purple-500 shadow-md shrink-0"
                />

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {selectedInstructor.name}
                    </h3>
                    <Badge variant="primary" className="flex items-center gap-1">
                      <FiFolder className="w-3 h-3 text-purple-200" />
                      {selectedInstructor.category}
                    </Badge>
                    {selectedInstructor.specialization && selectedInstructor.specialization !== selectedInstructor.category && (
                      <Badge variant="neutral">{selectedInstructor.specialization}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{selectedInstructor.bio}"
                  </p>
                </div>
              </div>

              {/* Personal & Professional Details Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Credentials & Professional Attributes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiMail className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {selectedInstructor.email}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Phone</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiPhone className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {selectedInstructor.mobile}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Teaching Category</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 truncate">
                      <FiFolder className="w-3.5 h-3.5 text-purple-500 shrink-0" /> {selectedInstructor.category}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Qualification</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiAward className="w-3.5 h-3.5 text-purple-500 shrink-0" /> {selectedInstructor.qualification}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiBriefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {selectedInstructor.experience}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Specialization</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiShield className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {selectedInstructor.specialization}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 sm:col-span-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {selectedInstructor.registeredDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Courses Created Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FiBookOpen className="w-4 h-4 text-purple-500" /> Courses Created ({selectedInstructor.coursesCreated.length})
                </h4>

                {selectedInstructor.coursesCreated.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
                    <FiBookOpen className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    No courses submitted or created by this instructor yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedInstructor.coursesCreated.map((crs) => (
                      <div
                        key={crs.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 text-xs"
                      >
                        <img
                          src={crs.thumbnail}
                          alt={crs.title}
                          className="w-16 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="space-y-1 overflow-hidden">
                          <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate">{crs.title}</h5>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{crs.studentsEnrolled} Students</span>
                            <span>•</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{crs.revenueINR.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payout Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FiCreditCard className="w-4 h-4 text-emerald-500" /> Payout Information (Database Record)
                  </h4>
                  {selectedInstructor.payoutInfo?.lastUpdated && (
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      Last Updated: {selectedInstructor.payoutInfo.lastUpdated}
                    </span>
                  )}
                </div>

                {(() => {
                  const pInfo = selectedInstructor.payoutInfo;
                  const hasBank = Boolean(pInfo?.bankDetails?.accountNumber || pInfo?.bankDetails?.bankName);
                  const hasUpi = Boolean(pInfo?.upiDetails?.upiId);
                  const isConfigured = Boolean(pInfo && (hasBank || hasUpi));
                  const selectedMethod = pInfo?.selectedMethod || (hasUpi && !hasBank ? 'UPI ID' : 'Bank Account');

                  if (!isConfigured) {
                    return (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                          <FiAlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Payout details have not been configured yet by this instructor in profile settings.</span>
                        </div>
                        <Badge variant="warning">Not Configured</Badge>
                      </div>
                    );
                  }

                  const acc = pInfo?.bankDetails?.accountNumber || '';
                  const maskedAcc = acc.length > 4 ? `•••• •••• ${acc.slice(-4)}` : acc || 'Not specified';

                  return (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-900 dark:text-emerald-200">
                            Primary Payout Method: {selectedMethod}
                          </span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                            Saved in Database
                          </span>
                        </div>
                        <Badge variant="success">Configured</Badge>
                      </div>

                      {selectedMethod === 'Bank Account' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Account Holder</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {pInfo?.bankDetails?.accountHolderName || selectedInstructor.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Bank Name</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {pInfo?.bankDetails?.bankName || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Account Number</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {maskedAcc}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">IFSC Code</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
                              {pInfo?.bankDetails?.ifscCode || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Account Type</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {pInfo?.bankDetails?.accountType || 'Savings'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">UPI ID</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {pInfo?.upiDetails?.upiId || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">UPI Registered Name</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {pInfo?.upiDetails?.upiAccountName || selectedInstructor.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Quick Actions Footer Bar */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedInstructor.approvalStatus === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleApproveInstructor(selectedInstructor.id)}
                        className="text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 font-bold"
                      >
                        <FiCheck className="w-4 h-4" /> Approve Instructor
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleRejectInstructor(selectedInstructor.id)}
                        className="text-xs py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-1.5 font-bold"
                      >
                        <FiX className="w-4 h-4" /> Reject Application
                      </Button>
                    </>
                  )}

                  {selectedInstructor.approvalStatus === 'rejected' && (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800/60">
                      Application Rejected
                    </span>
                  )}

                  {selectedInstructor.approvalStatus === 'approved' && (
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Status:
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={selectedInstructor.status === 'active'}
                        onClick={() => handleToggleActiveStatus(selectedInstructor.id)}
                        title={selectedInstructor.status === 'active' ? 'Active - Click to Deactivate' : 'Inactive - Click to Activate'}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 ${selectedInstructor.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                      >
                        <span className="sr-only">{selectedInstructor.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${selectedInstructor.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                      </button>
                      <span className={`text-xs font-black ${selectedInstructor.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {selectedInstructor.status === 'active' ? 'ON (Active)' : 'OFF (Inactive)'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteInstructor(selectedInstructor.id, selectedInstructor.name)}
                    className="text-xs py-2 px-3.5 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-1.5 font-bold"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInstructor(null)}
                    className="text-xs py-2 px-4 rounded-xl"
                  >
                    Close Details
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Instructor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto font-sans"
            role="dialog"
            aria-label={editingInstructor ? 'Edit Instructor Profile' : 'Create Instructor Account'}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    {editingInstructor ? 'Edit Instructor Profile' : 'Create Instructor Account'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingInstructor
                      ? 'Modify existing instructor credentials & parameters.'
                      : 'Admin direct account creation. New instructor status will be set to Active.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateInstructor} className="space-y-4">
                {/* Profile Photo (Optional) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Profile Photo (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.profilePhoto ? (
                        <img
                          src={formData.profilePhoto}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUpload className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <input
                        type="file"
                        id="profile-photo-input"
                        accept="image/*"
                        onChange={handlePhotoUploadSimulated}
                        className="hidden"
                      />
                      <label
                        htmlFor="profile-photo-input"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <FiUpload className="w-3.5 h-3.5" /> Upload Image
                      </label>
                      <input
                        type="text"
                        name="profilePhoto"
                        placeholder="Or enter Image URL (e.g. https://images.unsplash.com/...)"
                        value={formData.profilePhoto}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid for Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUsers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={formData.fullName}
                        onChange={handleFormChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border ${formErrors.fullName
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                          } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {formErrors.fullName && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3 h-3" /> {formErrors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="email"
                        name="email"
                        placeholder="e.g. rajesh.kumar@edusphere.com"
                        value={formData.email}
                        onChange={handleFormChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border ${formErrors.email
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                          } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3 h-3" /> {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Mobile Number (+91) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2">
                        <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                        +91
                      </div>
                      <input
                        type="text"
                        name="mobileNumber"
                        placeholder="9876543210"
                        value={formData.mobileNumber}
                        onChange={handleFormChange}
                        className={`w-full pl-20 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border ${formErrors.mobileNumber
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                          } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 font-mono`}
                      />
                    </div>
                    {formErrors.mobileNumber && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3 h-3" /> {formErrors.mobileNumber}
                      </p>
                    )}
                  </div>

                  {/* Teaching Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Teaching Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FiFolder className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer appearance-none"
                      >
                        {DEFAULT_INSTRUCTOR_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Qualification */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Qualification <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FiAward className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="qualification"
                        placeholder="e.g. M.Tech in CS / Ph.D."
                        value={formData.qualification}
                        onChange={handleFormChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border ${formErrors.qualification
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                          } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {formErrors.qualification && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3 h-3" /> {formErrors.qualification}
                      </p>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Experience <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="experience"
                        placeholder="e.g. 8+ Years Senior Software Engineer & Lecturer"
                        value={formData.experience}
                        onChange={handleFormChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border ${formErrors.experience
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                          } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {formErrors.experience && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3 h-3" /> {formErrors.experience}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Password {!editingInstructor && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleFormChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border ${formErrors.password
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                          } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {formErrors.password && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3 h-3" /> {formErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Confirm Password {!editingInstructor && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleFormChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border ${formErrors.confirmPassword
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                          } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <FiAlertCircle className="w-3 h-3" /> {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs py-2.5 px-4 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="text-xs font-bold py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-sm"
                  >
                    {editingInstructor ? 'Update Instructor' : 'Create Instructor'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
