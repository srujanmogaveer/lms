import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { LiveClassesHeader } from '../../components/live/LiveClassesHeader';
import { LiveClassesStatsCards } from '../../components/live/LiveClassesStatsCards';
import { LiveClassesFilterBar, type LiveClassesFilterState } from '../../components/live/LiveClassesFilterBar';
import { LiveClassCard } from '../../components/live/LiveClassCard';
import { LiveClassDetailsModal } from '../../components/live/LiveClassDetailsModal';
import { LiveClassesCalendar } from '../../components/live/LiveClassesCalendar';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { showErrorAlert } from '../../utils/swalAlerts';

import { liveClassService, type BackendLiveClass } from '../../services/liveClassService';
import type { StudentLiveClass } from '../../types';

export const StudentLiveClasses: React.FC = () => {
  const navigate = useNavigate();

  // Core Datasets State
  const [liveClasses, setLiveClasses] = useState<StudentLiveClass[]>([]);
  const [isEmptyState, setIsEmptyState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // View Mode State: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Active Live Class Modal Control
  const [selectedLiveClass, setSelectedLiveClass] = useState<StudentLiveClass | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<LiveClassesFilterState>({
    searchQuery: '',
    course: 'all',
    instructor: 'all',
    status: 'all',
    sortBy: 'nearest',
  });

  // Convert BackendLiveClass into StudentLiveClass
  const formatBackendClass = (b: BackendLiveClass): StudentLiveClass => {
    const d = new Date(b.startTime);
    const dateStr = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const isoDateOnly = d.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local timezone
    const startTimeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = new Date(b.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    let frontendStatus: 'live_now' | 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
    if (b.status === 'Live') frontendStatus = 'live_now';
    else if (b.status === 'Completed') frontendStatus = 'completed';
    else if (b.status === 'Cancelled') frontendStatus = 'cancelled';

    return {
      id: b.id,
      courseId: b.courseId,
      courseTitle: b.courseTitle || 'Enrolled Course',
      title: b.title,
      description: b.description || '',
      instructorName: b.instructorName || 'Instructor',
      instructorAvatar: b.instructorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      instructorRole: b.instructorRole || 'Lead Instructor',
      date: dateStr,
      time: `${startTimeStr} - ${endTimeStr}`,
      startTime: b.startTime,
      endTime: b.endTime,
      durationMinutes: b.durationMinutes,
      platform: b.platform,
      meetingUrl: b.meetingUrl,
      meetingId: b.meetingId,
      passcode: b.passcode,
      status: frontendStatus,
      instructions: b.instructions,
      resources: (b.resources as any) || [],
      recordingUrl: b.recordingUrl,
      isRecordingAvailable: b.isRecordingAvailable,
      isoDate: isoDateOnly,
    } as any;
  };

  // Fetch real enrolled live classes from API
  const fetchLiveClasses = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await liveClassService.getStudentLiveClasses();
      const formatted = data
        .map(formatBackendClass)
        .filter((lc) => (lc as any).status !== 'cancelled'); // Safety: never show cancelled to students
      setLiveClasses(formatted);
    } catch {
      // Retain existing state
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveClasses(false);
  }, [fetchLiveClasses]);

  // Unique Courses & Instructors Lists
  const coursesList = useMemo(() => {
    const set = new Set<string>();
    liveClasses.forEach((lc) => set.add(lc.courseTitle));
    return Array.from(set);
  }, [liveClasses]);

  const instructorsList = useMemo(() => {
    const set = new Set<string>();
    liveClasses.forEach((lc) => set.add(lc.instructorName));
    return Array.from(set);
  }, [liveClasses]);

  // Today's Date String (Local 'YYYY-MM-DD')
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Statistics Metrics
  const totalCount = liveClasses.length;
  const liveNowCount = useMemo(() => liveClasses.filter((lc) => lc.status === 'live_now').length, [liveClasses]);
  const todayCount = useMemo(() => liveClasses.filter((lc) => (lc as any).isoDate === todayStr || lc.date === todayStr || lc.status === 'live_now').length, [liveClasses, todayStr]);
  const upcomingCount = useMemo(() => liveClasses.filter((lc) => lc.status === 'upcoming').length, [liveClasses]);
  const completedCount = useMemo(() => liveClasses.filter((lc) => lc.status === 'completed').length, [liveClasses]);

  // Filter & Sort Logic
  const filteredLiveClasses = useMemo(() => {
    return liveClasses
      .filter((lc) => {
        // 1. Search Query
        if (filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase();
          const matchesTitle = lc.title.toLowerCase().includes(q);
          const matchesCourse = lc.courseTitle.toLowerCase().includes(q);
          const matchesInstructor = lc.instructorName.toLowerCase().includes(q);
          const matchesDesc = lc.description.toLowerCase().includes(q);
          if (!matchesTitle && !matchesCourse && !matchesInstructor && !matchesDesc) return false;
        }

        // 2. Course Filter
        if (filters.course !== 'all' && lc.courseTitle !== filters.course) return false;

        // 3. Instructor Filter
        if (filters.instructor !== 'all' && lc.instructorName !== filters.instructor) return false;

        // 4. Status Filter
        if (filters.status !== 'all' && lc.status !== filters.status) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'nearest') {
          if (a.status === 'live_now' && b.status !== 'live_now') return -1;
          if (a.status !== 'live_now' && b.status === 'live_now') return 1;
          const aTime = a.startTime ? new Date(a.startTime).getTime() : new Date(a.date).getTime();
          const bTime = b.startTime ? new Date(b.startTime).getTime() : new Date(b.date).getTime();
          return aTime - bTime;
        }
        if (filters.sortBy === 'oldest') {
          return a.id.localeCompare(b.id);
        }
        return b.id.localeCompare(a.id);
      });
  }, [liveClasses, filters]);

  // Grouped Schedule Views (Today's, Upcoming, Completed)
  const todayClasses = useMemo(
    () => filteredLiveClasses.filter((lc) => (lc as any).isoDate === todayStr || lc.date === todayStr || lc.status === 'live_now'),
    [filteredLiveClasses, todayStr]
  );
  const upcomingClasses = useMemo(
    () => filteredLiveClasses.filter((lc) => lc.status === 'upcoming' && (lc as any).isoDate !== todayStr && lc.date !== todayStr),
    [filteredLiveClasses, todayStr]
  );
  const pastClasses = useMemo(
    () => filteredLiveClasses.filter((lc) => lc.status === 'completed'),
    [filteredLiveClasses]
  );

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      course: 'all',
      instructor: 'all',
      status: 'all',
      sortBy: 'nearest',
    });
  };

  // Handlers for Details & External Join / Recording triggers
  const handleOpenDetails = (lc: StudentLiveClass) => {
    setSelectedLiveClass(lc);
    setIsDetailsModalOpen(true);
  };

  const handleJoinClass = async (lc: StudentLiveClass) => {
    try {
      // Backend verifies active enrollment before entering
      await liveClassService.getStudentLiveClassDetails(lc.id);
      navigate(`/student/live/room/${lc.id}`);
    } catch (err: any) {
      showErrorAlert('Cannot Join Session', err.message || 'You do not have access to this session');
    }
  };

  const handleWatchRecording = (lc: StudentLiveClass) => {
    setSelectedLiveClass(lc);
    setIsDetailsModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <LiveClassesHeader
        totalCount={totalCount}
        liveNowCount={liveNowCount}
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        completedCount={completedCount}
        isEmptyState={isEmptyState}
        onToggleEmptyState={() => setIsEmptyState(!isEmptyState)}
        onRefresh={() => fetchLiveClasses(true)}
        isLoading={isLoading}
      />

      {/* Skeleton Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <SkeletonLoader className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonLoader key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : isEmptyState || liveClasses.length === 0 ? (
        /* Empty State View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-6"
        >
          <EmptyState
            type="courses"
            title="No live classes scheduled."
            description="You currently have no active live workshops or video lectures scheduled for your enrolled courses."
            actionLabel="Back to My Courses"
            onAction={() => navigate('/student/courses')}
          />
        </motion.div>
      ) : (
        /* Populated Live Classes View */
        <div className="space-y-8">
          {/* Statistics Cards */}
          <LiveClassesStatsCards
            totalCount={totalCount}
            liveNowCount={liveNowCount}
            todayCount={todayCount}
            completedCount={completedCount}
            activeStatusFilter={filters.status}
            onSelectStatusFilter={(st) => setFilters({ ...filters, status: st })}
          />

          {/* Filter Bar & View Switcher */}
          <LiveClassesFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            courses={coursesList}
            instructors={instructorsList}
            totalFilteredCount={filteredLiveClasses.length}
            viewMode={viewMode}
            onSelectViewMode={setViewMode}
          />

          {/* Calendar View */}
          {viewMode === 'calendar' ? (
            <LiveClassesCalendar
              liveClasses={liveClasses}
              onOpenDetails={handleOpenDetails}
            />
          ) : (
            /* List Schedule View */
            <div className="space-y-10">
              {filteredLiveClasses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                  <EmptyState
                    type="courses"
                    title="No live sessions match your filter criteria"
                    description="Try resetting search keywords or expanding date filters."
                    actionLabel="Reset Search Filters"
                    onAction={handleResetFilters}
                  />
                </div>
              ) : (
                <>
                  {/* 1. Today's & Live Streaming Sessions */}
                  {todayClasses.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                          <span>Today's Sessions & Live Stream ({todayClasses.length})</span>
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {todayClasses.map((lc) => (
                          <motion.div key={lc.id} layout>
                            <LiveClassCard
                              liveClass={lc}
                              onOpenDetails={handleOpenDetails}
                              onJoinClass={handleJoinClass}
                              onWatchRecording={handleWatchRecording}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Upcoming Future Sessions */}
                  {upcomingClasses.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          Upcoming Scheduled Sessions ({upcomingClasses.length})
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingClasses.map((lc) => (
                          <motion.div key={lc.id} layout>
                            <LiveClassCard
                              liveClass={lc}
                              onOpenDetails={handleOpenDetails}
                              onJoinClass={handleJoinClass}
                              onWatchRecording={handleWatchRecording}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Completed Past Sessions */}
                  {pastClasses.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          Completed Sessions ({pastClasses.length})
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastClasses.map((lc) => (
                          <motion.div key={lc.id} layout>
                            <LiveClassCard
                              liveClass={lc}
                              onOpenDetails={handleOpenDetails}
                              onJoinClass={handleJoinClass}
                              onWatchRecording={handleWatchRecording}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Class Details Modal */}
      <LiveClassDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        liveClass={selectedLiveClass}
        onJoinClass={handleJoinClass}
      />
    </motion.div>
  );
};
