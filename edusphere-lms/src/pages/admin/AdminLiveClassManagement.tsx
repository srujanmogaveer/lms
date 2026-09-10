import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FiVideo,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiX,
  FiClock,
  FiCalendar,
  FiExternalLink,
  FiSlash,
  FiCopy,
  FiCheck,
  FiRadio,
  FiTrash2,
  FiMessageSquare,
  FiRefreshCw,
  FiUser,
  FiBookOpen,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  showSuccessAlert,
  showConfirmAlert,
  showErrorAlert
} from '../../utils/swalAlerts';
import {
  liveClassService,
  type BackendLiveClass,
  type BackendLiveClassQA,
  type LiveClassStatus,
  type AdminLiveClassPage,
} from '../../services/liveClassService';

export const AdminLiveClassManagement: React.FC = () => {
  // Data State
  const [liveClasses, setLiveClasses] = useState<BackendLiveClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pageData, setPageData] = useState<AdminLiveClassPage>({
    liveClasses: [], total: 0, page: 1, limit: 20, totalPages: 1,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_LIMIT = 20;

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>('All');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modals State
  const [viewingClass, setViewingClass] = useState<BackendLiveClass | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<BackendLiveClassQA[]>([]);
  const [cancellingClass, setCancellingClass] = useState<BackendLiveClass | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch live classes with server-side filters and pagination
  const fetchAllLiveClasses = useCallback(async (page = currentPage) => {
    setIsLoading(true);
    try {
      const result = await liveClassService.getAdminLiveClasses({
        instructorId: selectedInstructorFilter !== 'All' ? selectedInstructorFilter : undefined,
        courseId: selectedCourseFilter !== 'All' ? selectedCourseFilter : undefined,
        status: selectedStatusFilter !== 'All' ? selectedStatusFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: PAGE_LIMIT,
      });
      setLiveClasses(result.liveClasses);
      setPageData(result);
    } catch (err: any) {
      showErrorAlert('Error Loading Live Classes', err.message || 'Failed to load system live classes');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, selectedInstructorFilter, selectedCourseFilter, selectedStatusFilter]);

  useEffect(() => {
    fetchAllLiveClasses(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);


  useEffect(() => {
    setCurrentPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedInstructorFilter, selectedCourseFilter, selectedStatusFilter]);

  useEffect(() => {
    fetchAllLiveClasses(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, selectedInstructorFilter, selectedCourseFilter, selectedStatusFilter]);

  // Unique Instructor & Course Lists (derived from current page for dropdown hints)
  const instructorList = useMemo(() => {
    const set = new Set<string>();
    liveClasses.forEach((c) => { if (c.instructorName) set.add(c.instructorName); });
    return Array.from(set);
  }, [liveClasses]);

  const courseList = useMemo(() => {
    const set = new Set<string>();
    liveClasses.forEach((c) => { if (c.courseTitle) set.add(c.courseTitle); });
    return Array.from(set);
  }, [liveClasses]);

  // Metrics (across current page — page-level counts)
  const stats = useMemo(() => {
    const total = pageData.total;
    const scheduled = liveClasses.filter((c) => c.status === 'Scheduled').length;
    const liveNow = liveClasses.filter((c) => c.status === 'Live').length;
    const completed = liveClasses.filter((c) => c.status === 'Completed').length;
    const cancelled = liveClasses.filter((c) => c.status === 'Cancelled').length;
    return { total, scheduled, liveNow, completed, cancelled };
  }, [liveClasses, pageData.total]);

  // Format Helper
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

  // The table now shows server-filtered results directly (filteredClasses = liveClasses)
  const filteredClasses = liveClasses;

  // Open Details Modal
  const openViewingModal = async (item: BackendLiveClass) => {
    setViewingClass(item);
    try {
      const qs = await liveClassService.getQuestions(item.id);
      setViewingQuestions(qs);
    } catch {
      setViewingQuestions([]);
    }
  };

  // Cancel Live Class (Admin)
  const handleConfirmCancelClass = async () => {
    if (!cancellingClass) return;
    setIsSubmitting(true);
    try {
      const updated = await liveClassService.adminCancelLiveClass(cancellingClass.id);
      setLiveClasses(liveClasses.map((c) => (c.id === updated.id ? updated : c)));
      showSuccessAlert('Class Cancelled', `Live class "${cancellingClass.title}" has been cancelled.`);
      setCancellingClass(null);
    } catch (err: any) {
      showErrorAlert('Action Failed', err.message || 'Failed to cancel live class');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Live Class (Admin)
  const handleConfirmDeleteClass = async (item: BackendLiveClass) => {
    const confirmed = await showConfirmAlert(
      'Delete Live Class',
      `Are you sure you want to permanently delete "${item.title}" across the entire LMS platform? This action cannot be undone.`,
      'Delete Class',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        await liveClassService.adminDeleteLiveClass(item.id);
        setLiveClasses(liveClasses.filter((c) => c.id !== item.id));
        setPageData((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        showSuccessAlert('Deleted', `Live class "${item.title}" was permanently removed.`);
      } catch (err: any) {
        showErrorAlert('Delete Failed', err.message || 'Failed to delete live class');
      }
    }
  };

  // Copy Meeting Link
  const handleCopyMeetingUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2500);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <FiVideo className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Live Classes Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Platform-wide live video workshops, webinars, and masterclass sessions oversight.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllLiveClasses(currentPage)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs"
            title="Refresh List"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Classes
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block">
              Scheduled
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {stats.scheduled}
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
            <FiCalendar className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
              Live Now
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.liveNow}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
            <FiRadio className="w-5 h-5 animate-pulse" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
              Completed
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
              Cancelled
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

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Class Title, Course, or Instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedInstructorFilter}
            onChange={(e) => setSelectedInstructorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
          >
            <option value="All">All Instructors</option>
            {instructorList.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
          >
            <option value="All">All Courses</option>
            {courseList.map((c) => (
              <option key={c} value={c}>
                {c}
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
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading live classes...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 bg-white dark:bg-slate-900">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
            <FiVideo className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No live classes match criteria
          </h3>
          <p className="text-xs text-slate-500">Try broadening filters or clearing search terms.</p>
        </Card>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">Class Title & Audience</th>
                <th className="p-4">Instructor</th>
                <th className="p-4">Course</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClasses.map((item) => {
                const { dateStr, timeStr } = formatDateTimeDisplay(item.startTime, item.endTime);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Title & Audience */}
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                        {item.title}
                      </div>
                      <div className="mt-0.5">
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

                    {/* Instructor */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.instructorAvatar}
                          alt={item.instructorName}
                          className="w-6 h-6 rounded-full object-cover border"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.instructorName}
                        </span>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="p-4 max-w-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium line-clamp-1">
                        {item.courseTitle}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{dateStr}</div>
                      <div className="text-[11px] text-slate-400">{timeStr}</div>
                    </td>

                    {/* Platform */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {item.platform}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openViewingModal(item)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-[11px] flex items-center gap-1"
                          title="View Details"
                        >
                          <FiEye className="w-3.5 h-3.5" /> View
                        </button>

                        {item.status !== 'Cancelled' && item.status !== 'Completed' && (
                          <button
                            onClick={() => setCancellingClass(item)}
                            className="px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 font-bold text-[11px] flex items-center gap-1"
                            title="Cancel Class"
                          >
                            <FiSlash className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}

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

      {/* Pagination Controls */}
      {!isLoading && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-500 font-medium">
            Showing {((pageData.page - 1) * pageData.limit) + 1}–{Math.min(pageData.page * pageData.limit, pageData.total)} of {pageData.total} live classes
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: pageData.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pageData.totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc: (number | '...')[], p, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    disabled={isLoading}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                      currentPage === p
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            }
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageData.totalPages, p + 1))}
              disabled={currentPage >= pageData.totalPages || isLoading}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* VIEW DETAILS MODAL */}
      {viewingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FiVideo className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Live Class Administration
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                    Instructor
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <FiUser className="w-3.5 h-3.5 text-rose-500" />
                    <span>{viewingClass.instructorName}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                    Course Name
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <FiBookOpen className="w-3.5 h-3.5 text-rose-500" />
                    <span className="truncate">{viewingClass.courseTitle}</span>
                  </p>
                </div>
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

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Meeting Link
                </span>
                <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold truncate flex-1">
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
                  <a
                    href={viewingClass.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                    title="Open Link"
                  >
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {viewingClass.instructions && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                    Class Instructions:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{viewingClass.instructions}</p>
                </div>
              )}

              {/* Q&A Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block flex items-center gap-1.5">
                  <FiMessageSquare className="w-4 h-4 text-rose-500" />
                  <span>Q&A Thread ({viewingQuestions.length} Questions)</span>
                </span>

                {viewingQuestions.length === 0 ? (
                  <p className="text-slate-400 italic">No questions posted yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {viewingQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{q.studentName}</span>
                          {q.isAnswered && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              Answered
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{q.questionText}</p>
                        {q.instructorReply && (
                          <div className="text-purple-600 dark:text-purple-400 pl-3 border-l-2 border-purple-500 mt-1 font-medium">
                            <strong>Instructor:</strong> {q.instructorReply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingClass(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancellingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2 text-rose-600">
                <FiSlash className="w-4 h-4" /> Cancel Live Class
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
              ?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCancellingClass(null)} disabled={isSubmitting}>
                Keep Active
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
