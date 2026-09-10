import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiVolume2,
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiSend,
  FiCheckCircle,
  FiUsers,
  FiClock,
  FiRefreshCw,
  FiLayers,
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../../utils/swalAlerts';
import { announcementService } from '../../services/announcementService';
import type {
  AnnouncementItem,
  AnnouncementAudience,
  AnnouncementStatus,
  CreateAnnouncementDto,
} from '../../types';

export const AdminAnnouncementManagement: React.FC = () => {
  // Main Data State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [audienceFilter, setAudienceFilter] = useState<string>('All');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);

  // Form Fields State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string>('');
  const [formAudience, setFormAudience] = useState<AnnouncementAudience>('Students');
  const [formStatus, setFormStatus] = useState<AnnouncementStatus>('Published');

  // Fetch Announcements from Backend API
  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await announcementService.getAnnouncements();
      setAnnouncements(list);
    } catch (err: any) {
      showErrorAlert('Load Failed', err.message || 'Unable to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Computed Metrics
  const totalCount = announcements.length;
  const publishedCount = announcements.filter((a) => a.status === 'Published').length;
  const draftCount = announcements.filter((a) => a.status === 'Draft').length;

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        a.title.toLowerCase().includes(q) ||
        (a.message ? a.message.toLowerCase().includes(q) : false) ||
        (a.courseTitle && a.courseTitle.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchesAudience = audienceFilter === 'All' || a.audience === audienceFilter;

      return matchesSearch && matchesStatus && matchesAudience;
    });
  }, [announcements, searchQuery, statusFilter, audienceFilter]);

  // Open Create Form Modal
  const handleOpenCreateForm = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormMessage('');
    setFormAudience('Students');
    setFormStatus('Published');
    setIsFormOpen(true);
  };

  // Open Edit Form Modal
  const handleOpenEditForm = (anc: AnnouncementItem) => {
    setEditingAnnouncement(anc);
    setFormTitle(anc.title);
    setFormMessage(anc.message || anc.content || '');
    setFormAudience(
      anc.audience && ['Students', 'Instructors', 'Both Students & Instructors'].includes(anc.audience)
        ? anc.audience
        : 'Students'
    );
    setFormStatus(anc.status || 'Published');
    setIsFormOpen(true);
  };

  // Open Details Modal
  const handleOpenDetails = (anc: AnnouncementItem) => {
    setSelectedAnnouncement(anc);
    setIsDetailsOpen(true);
  };

  // Save Announcement (Create or Edit)
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showErrorAlert('Validation Error', 'Please enter an announcement title.');
      return;
    }
    if (!formMessage.trim()) {
      showErrorAlert('Validation Error', 'Please enter the message content.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingAnnouncement) {
        // Edit existing announcement
        await announcementService.updateAnnouncement(editingAnnouncement.id, {
          title: formTitle.trim(),
          message: formMessage.trim(),
          audience: formAudience,
          status: formStatus,
        });

        showSuccessAlert(
          'Updated!',
          formStatus === 'Published'
            ? 'Announcement updated & published to targeted recipients.'
            : 'Announcement draft saved successfully.'
        );
      } else {
        // Create new announcement
        const payload: CreateAnnouncementDto = {
          title: formTitle.trim(),
          message: formMessage.trim(),
          audience: formAudience,
          status: formStatus,
        };

        await announcementService.createAnnouncement(payload);

        showSuccessAlert(
          'Published!',
          formStatus === 'Published'
            ? `Announcement broadcasted to ${formAudience}. Notifications dispatched.`
            : 'Announcement draft saved successfully.'
        );
      }

      setIsFormOpen(false);
      await loadAnnouncements();
    } catch (err: any) {
      showErrorAlert('Operation Failed', err.message || 'Could not save announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Status Toggle (Draft <-> Published)
  const handleTogglePublish = async (anc: AnnouncementItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextStatus: AnnouncementStatus = anc.status === 'Published' ? 'Draft' : 'Published';

    try {
      await announcementService.updateAnnouncement(anc.id, { status: nextStatus });
      showSuccessAlert(
        nextStatus === 'Published' ? 'Published!' : 'Saved to Drafts',
        nextStatus === 'Published'
          ? `Announcement is now live. Notifications sent to ${anc.audience}.`
          : 'Announcement is now hidden from user dashboards.'
      );
      await loadAnnouncements();
    } catch (err: any) {
      showErrorAlert('Action Failed', err.message || 'Could not update status.');
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await showConfirmAlert(
      'Delete Announcement',
      'Are you sure you want to permanently delete this announcement?'
    );

    if (confirmed) {
      try {
        await announcementService.deleteAnnouncement(id);
        showSuccessAlert('Deleted', 'Announcement permanently removed.');
        if (selectedAnnouncement?.id === id) {
          setIsDetailsOpen(false);
        }
        await loadAnnouncements();
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
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
              <FiVolume2 className="w-6 h-6" />
            </div>
            Platform Announcements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Broadcast platform-wide notices, exam schedules, and alerts to students and instructors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadAnnouncements}
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
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Announcement</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <FiLayers className="w-6 h-6" />
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
            <span className="text-xs text-slate-500 font-semibold block">Published Broadcasts</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{publishedCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Draft Notices</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{draftCount}</span>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <FiSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements by keyword, title, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Draft Only</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="All">All Audiences</option>
              <option value="Students">Students Only</option>
              <option value="Instructors">Instructors Only</option>
              <option value="Both Students & Instructors">Both Students & Instructors</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Announcements List Content */}
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
            description="Create a new platform announcement or adjust your active search filters."
            actionLabel="Create Announcement"
            onAction={handleOpenCreateForm}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((anc) => (
            <Card
              key={anc.id}
              className="p-5 border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all space-y-4 shadow-xs"
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
                      Audience: {anc.audience}
                    </Badge>
                    {anc.courseTitle && (
                      <Badge variant="neutral" size="sm">
                        Course: {anc.courseTitle}
                      </Badge>
                    )}
                  </div>

                  <h3
                    onClick={() => handleOpenDetails(anc)}
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 transition-colors cursor-pointer"
                  >
                    {anc.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {anc.message}
                  </p>
                </div>

                {/* Actions Toolbar */}
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
                    <FiEdit3 className="w-3.5 h-3.5" />
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

              {/* Card Footer Info */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <FiUsers className="w-3.5 h-3.5 text-brand-500" /> By {anc.creatorName || 'EduSphere Admin'}
                </span>
                <span>
                  {anc.publishedAt ? `Published: ${new Date(anc.publishedAt).toLocaleDateString()}` : `Created: ${new Date(anc.createdAt || Date.now()).toLocaleDateString()}`}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <BaseModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAnnouncement ? 'Edit Platform Announcement' : 'Create Platform Announcement'}
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Announcement Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Infrastructure Maintenance & Upgrade"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Audience <span className="text-rose-500">*</span>
              </label>
              <select
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value as AnnouncementAudience)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
              >
                <option value="Students">Students (All Students)</option>
                <option value="Instructors">Instructors (All Instructors)</option>
                <option value="Both Students & Instructors">Both Students & Instructors</option>
              </select>
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
                <option value="Published">Publish Immediately (Dispatch Notifications)</option>
                <option value="Draft">Save as Draft (No Notifications)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Message Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              placeholder="Write your announcement details and instructions here..."
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden leading-relaxed"
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
              disabled={isSubmitting}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              {isSubmitting ? 'Saving...' : formStatus === 'Published' ? 'Publish Announcement' : 'Save Draft'}
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
                  Audience: {selectedAnnouncement.audience}
                </Badge>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {selectedAnnouncement.publishedAt ? `Published ${new Date(selectedAnnouncement.publishedAt).toLocaleDateString()}` : 'Draft'}
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
                Posted by {selectedAnnouncement.creatorName || 'EduSphere Admin'}
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
