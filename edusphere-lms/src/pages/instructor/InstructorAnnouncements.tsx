import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiVolume2,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiRefreshCw,
  FiEye,
  FiSend,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../../utils/swalAlerts';
import { announcementService } from '../../services/announcementService';
import { courseService } from '../../services/courseService';
import type {
  AnnouncementItem,
  AnnouncementStatus,
  CreateAnnouncementDto,
} from '../../types';
import type { InstructorCourseItem } from '../../data/instructorCoursesData';

export const InstructorAnnouncements: React.FC = () => {
  // Main Data State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<InstructorCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string>('');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<AnnouncementStatus>('Published');

  // Load Instructor Courses & Announcements
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [coursesRes, announcementsList] = await Promise.all([
        courseService.getInstructorCourses(),
        announcementService.getAnnouncements(),
      ]);

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setInstructorCourses(coursesRes.data);
      }
      setAnnouncements(announcementsList);
    } catch (err: any) {
      showErrorAlert('Load Failed', err.message || 'Unable to load instructor announcements.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed Metrics
  const totalCount = announcements.length;
  const publishedCount = announcements.filter((a) => a.status === 'Published').length;
  const draftCount = announcements.filter((a) => a.status === 'Draft').length;

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        (item.message ? item.message.toLowerCase().includes(q) : false) ||
        (item.courseTitle && item.courseTitle.toLowerCase().includes(q));

      const matchesCourse =
        selectedCourseFilter === 'All' || item.courseId === selectedCourseFilter;
      const matchesStatus =
        selectedStatusFilter === 'All' || item.status === selectedStatusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [announcements, searchQuery, selectedCourseFilter, selectedStatusFilter]);

  // Open Create Form Modal
  const handleOpenCreateForm = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormMessage('');
    setFormCourseId(instructorCourses.length > 0 ? instructorCourses[0].id : '');
    setFormStatus('Published');
    setIsFormOpen(true);
  };

  // Open Edit Form Modal
  const handleOpenEditForm = (item: AnnouncementItem) => {
    setEditingAnnouncement(item);
    setFormTitle(item.title);
    setFormMessage(item.message || item.content || '');
    setFormCourseId(item.courseId || (instructorCourses.length > 0 ? instructorCourses[0].id : ''));
    setFormStatus(item.status || 'Published');
    setIsFormOpen(true);
  };

  // Open Details Modal
  const handleOpenDetails = (item: AnnouncementItem) => {
    setSelectedAnnouncement(item);
    setIsDetailsOpen(true);
  };

  // Save Announcement (Create or Edit)
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showErrorAlert('Validation Error', 'Announcement title is required.');
      return;
    }
    if (!formMessage.trim()) {
      showErrorAlert('Validation Error', 'Announcement message is required.');
      return;
    }
    if (!formCourseId) {
      showErrorAlert('Validation Error', 'Please select a course for this announcement.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingAnnouncement) {
        // Edit existing announcement
        await announcementService.updateAnnouncement(editingAnnouncement.id, {
          title: formTitle.trim(),
          message: formMessage.trim(),
          courseId: formCourseId,
          status: formStatus,
        });

        showSuccessAlert(
          'Updated!',
          formStatus === 'Published'
            ? 'Announcement updated & broadcasted to enrolled students.'
            : 'Announcement draft saved successfully.'
        );
      } else {
        // Create new announcement
        const payload: CreateAnnouncementDto = {
          title: formTitle.trim(),
          message: formMessage.trim(),
          courseId: formCourseId,
          status: formStatus,
        };

        await announcementService.createAnnouncement(payload);

        showSuccessAlert(
          'Broadcasted!',
          formStatus === 'Published'
            ? 'Announcement published to enrolled students. Notifications dispatched.'
            : 'Announcement draft saved successfully.'
        );
      }

      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      showErrorAlert('Error', err.message || 'Failed to save announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Publish Toggle
  const handleTogglePublish = async (item: AnnouncementItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextStatus: AnnouncementStatus = item.status === 'Published' ? 'Draft' : 'Published';

    try {
      await announcementService.updateAnnouncement(item.id, { status: nextStatus });
      showSuccessAlert(
        nextStatus === 'Published' ? 'Published!' : 'Saved as Draft',
        nextStatus === 'Published'
          ? 'Course announcement is now live for all enrolled students.'
          : 'Course announcement is now saved as Draft.'
      );
      await loadData();
    } catch (err: any) {
      showErrorAlert('Action Failed', err.message || 'Could not update status.');
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await showConfirmAlert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement permanently?'
    );

    if (confirmed) {
      try {
        await announcementService.deleteAnnouncement(id);
        showSuccessAlert('Deleted', 'Announcement removed successfully.');
        if (selectedAnnouncement?.id === id) {
          setIsDetailsOpen(false);
        }
        await loadData();
      } catch (err: any) {
        showErrorAlert('Delete Failed', err.message || 'Could not delete announcement.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <FiVolume2 className="w-6 h-6" />
            </div>
            Course Announcements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Broadcast updates, deadlines, and notifications exclusively to students enrolled in your courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateForm}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Announcement</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Announcements</span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Published Posts</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{publishedCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Active Drafts</span>
            <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{draftCount}</span>
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <FiSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="All">All Courses</option>
              {instructorCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Draft Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="p-12 text-center border border-slate-200 dark:border-slate-800">
          <EmptyState
            type="courses"
            title="No announcements found"
            description="Broadcast a new course update or clear your search filters."
            actionLabel="Create Course Announcement"
            onAction={handleOpenCreateForm}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((anc) => (
            <Card
              key={anc.id}
              className="p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={anc.status === 'Published' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {anc.status}
                    </Badge>
                    <Badge variant="primary" size="sm">
                      {anc.courseTitle || 'Course Announcement'}
                    </Badge>
                  </div>

                  <h3
                    onClick={() => handleOpenDetails(anc)}
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    {anc.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {anc.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePublish(anc)}
                    className="text-xs flex items-center gap-1"
                    title={anc.status === 'Published' ? 'Revert to Draft' : 'Publish Announcement'}
                  >
                    <FiSend className="w-3.5 h-3.5" />
                    <span>{anc.status === 'Published' ? 'Draft' : 'Publish'}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDetails(anc)}
                    className="text-xs p-2"
                    title="View Announcement"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditForm(anc)}
                    className="text-xs p-2"
                    title="Edit Announcement"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleDeleteAnnouncement(anc.id, e)}
                    className="text-xs p-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                    title="Delete Announcement"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Audience: Enrolled Students</span>
                <span>
                  {anc.publishedAt
                    ? `Published: ${new Date(anc.publishedAt).toLocaleDateString()}`
                    : `Created: ${new Date(anc.createdAt || Date.now()).toLocaleDateString()}`}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <BaseModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAnnouncement ? 'Edit Course Announcement' : 'New Course Announcement'}
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Target Course <span className="text-rose-500">*</span>
            </label>
            {instructorCourses.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl">
                You have no courses yet. Please create a course first before posting announcements.
              </p>
            ) : (
              <select
                required
                value={formCourseId}
                onChange={(e) => setFormCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {instructorCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Announcement Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm Project Guidelines & Due Date Reminder"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Publish Status
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as AnnouncementStatus)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="Published">Publish Now (Notifies Active Enrolled Students)</option>
              <option value="Draft">Save as Draft (No Notifications)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Announcement Message Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              placeholder="Write the full announcement text for your enrolled students..."
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || instructorCourses.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isSubmitting
                ? 'Saving...'
                : formStatus === 'Published'
                ? 'Broadcast Announcement'
                : 'Save Draft'}
            </Button>
          </div>
        </form>
      </BaseModal>

      {/* Details View Modal */}
      <BaseModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Announcement Details"
      >
        {selectedAnnouncement && (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={selectedAnnouncement.status === 'Published' ? 'success' : 'warning'}>
                  {selectedAnnouncement.status}
                </Badge>
                <Badge variant="primary">
                  {selectedAnnouncement.courseTitle || 'Course'}
                </Badge>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {selectedAnnouncement.publishedAt
                  ? `Published ${new Date(selectedAnnouncement.publishedAt).toLocaleDateString()}`
                  : 'Draft'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {selectedAnnouncement.title}
            </h2>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto custom-scrollbar p-1">
              {selectedAnnouncement.message}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">
                Target: Active Enrolled Students
              </span>
              <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </BaseModal>
    </motion.div>
  );
};
