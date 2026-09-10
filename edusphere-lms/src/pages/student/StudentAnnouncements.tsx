import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiVolume2,
  FiSearch,
  FiCheckCircle,
  FiMail,
  FiRefreshCw,
  FiBookOpen,
  FiEye,
  FiLayers,
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { showErrorAlert } from '../../utils/swalAlerts';
import { announcementService } from '../../services/announcementService';
import type { AnnouncementItem } from '../../types';

export const StudentAnnouncements: React.FC = () => {
  const navigate = useNavigate();

  // Core Data State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Details Modal Control
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedReadFilter, setSelectedReadFilter] = useState<string>('all');

  // Load announcements from live backend
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

  // Unique Courses List from actual announcements
  const coursesList = useMemo(() => {
    const set = new Set<string>();
    announcements.forEach((a) => {
      if (a.courseTitle) {
        set.add(a.courseTitle);
      }
    });
    return Array.from(set);
  }, [announcements]);

  // Statistics Metrics
  const totalCount = announcements.length;
  const unreadCount = useMemo(() => announcements.filter((a) => !a.isRead).length, [announcements]);
  const readCount = useMemo(() => announcements.filter((a) => a.isRead).length, [announcements]);
  const courseCount = useMemo(() => announcements.filter((a) => Boolean(a.courseId)).length, [announcements]);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((anc) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = anc.title.toLowerCase().includes(q);
        const matchesMessage = anc.message ? anc.message.toLowerCase().includes(q) : (anc.content ? anc.content.toLowerCase().includes(q) : false);
        const matchesCourse = anc.courseTitle?.toLowerCase().includes(q);
        const matchesAuthor = anc.creatorName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage && !matchesCourse && !matchesAuthor) return false;
      }

      // 2. Course Filter
      if (selectedCourseFilter !== 'all') {
        if (selectedCourseFilter === 'Platform Announcements') {
          if (anc.courseId) return false;
        } else if (anc.courseTitle !== selectedCourseFilter) {
          return false;
        }
      }

      // 3. Read Status Filter
      if (selectedReadFilter === 'unread' && anc.isRead) return false;
      if (selectedReadFilter === 'read' && !anc.isRead) return false;

      return true;
    });
  }, [announcements, searchQuery, selectedCourseFilter, selectedReadFilter]);

  // Open Details Modal & automatically mark as read
  const handleOpenDetails = async (anc: AnnouncementItem) => {
    setSelectedAnnouncement(anc);
    setIsDetailsOpen(true);

    if (!anc.isRead) {
      await handleToggleRead(anc.id, true);
    }
  };

  // Toggle Read/Unread State with Backend Sync
  const handleToggleRead = async (id: string, forceRead?: boolean) => {
    try {
      // Optimistic update
      setAnnouncements((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            const nextRead = forceRead !== undefined ? forceRead : !a.isRead;
            return { ...a, isRead: nextRead };
          }
          return a;
        })
      );

      await announcementService.markAsRead(id);
    } catch {
      // Background sync on error
      loadAnnouncements();
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
            Announcements & Notices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with course announcements from your instructors and platform-wide notices.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={loadAnnouncements}
          disabled={isLoading}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
            <FiLayers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Notices</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{totalCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiMail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Unread</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{unreadCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Course Updates</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{courseCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Read</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{readCount}</span>
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
              placeholder="Search announcements by keywords, course, or sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="all">All Channels</option>
              <option value="Platform Announcements">Platform Notices Only</option>
              {coursesList.map((courseTitle) => (
                <option key={courseTitle} value={courseTitle}>
                  {courseTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedReadFilter}
              onChange={(e) => setSelectedReadFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="all">All Read Statuses</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Announcements Feed Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="p-12 text-center border border-slate-200 dark:border-slate-800">
          <EmptyState
            type="courses"
            title="No announcements available"
            description="You are all caught up with your courses and platform notifications."
            actionLabel="Back to Dashboard"
            onAction={() => navigate('/student')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((anc) => (
            <Card
              key={anc.id}
              className={`flex flex-col justify-between h-full space-y-4 p-5 border transition-all ${
                !anc.isRead
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700'
              }`}
            >
              <div className="space-y-3">
                {/* Badges & Read Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={anc.courseTitle ? 'primary' : 'neutral'} size="sm">
                      {anc.courseTitle || 'Platform Notice'}
                    </Badge>
                    {!anc.isRead && (
                      <Badge variant="warning" size="sm">
                        New
                      </Badge>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleRead(anc.id)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      anc.isRead
                        ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        : 'border-amber-300 dark:border-amber-700 text-amber-600 bg-amber-50 dark:bg-amber-950'
                    }`}
                    title={anc.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {anc.isRead ? (
                      <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FiMail className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                </div>

                {/* Title */}
                <h3
                  onClick={() => handleOpenDetails(anc)}
                  className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer leading-snug"
                >
                  {anc.title}
                </h3>

                {/* Message Snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {anc.message}
                </p>

                {/* Author Info */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={anc.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={anc.creatorName || 'Sender'}
                      className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {anc.creatorName || (anc.creatorRole === 'admin' ? 'EduSphere Admin' : 'Instructor')}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {anc.publishedAt ? new Date(anc.publishedAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDetails(anc)}
                  className="w-full justify-center text-xs flex items-center gap-1.5"
                >
                  <FiEye className="w-3.5 h-3.5" />
                  <span>Read Announcement</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details View Modal */}
      <BaseModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Announcement Details"
      >
        {selectedAnnouncement && (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Badge variant={selectedAnnouncement.courseTitle ? 'primary' : 'neutral'}>
                {selectedAnnouncement.courseTitle || 'Platform Notice'}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                {selectedAnnouncement.publishedAt
                  ? new Date(selectedAnnouncement.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Published'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
              {selectedAnnouncement.title}
            </h2>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto custom-scrollbar p-1">
              {selectedAnnouncement.message}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <img
                  src={
                    selectedAnnouncement.creatorAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt="Author"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  {selectedAnnouncement.creatorName || 'EduSphere'} (
                  {selectedAnnouncement.creatorRole === 'admin' ? 'Administrator' : 'Instructor'})
                </span>
              </div>

              <Button variant="primary" size="sm" onClick={() => setIsDetailsOpen(false)} className="bg-brand-600 text-white">
                Close
              </Button>
            </div>
          </div>
        )}
      </BaseModal>
    </motion.div>
  );
};
