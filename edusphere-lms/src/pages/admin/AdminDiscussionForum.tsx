import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiMessageSquare,
  FiSearch,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiLock,
  FiTrash2,
  FiStar,
  FiEye,
  FiRefreshCw,
  FiArrowLeft,
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { forumService } from '../../services/forumService';
import type { StudentForumDiscussion, ForumModerationReport } from '../../types';

export const AdminDiscussionForum: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discussions' | 'reports'>('discussions');

  // Discussions State
  const [discussions, setDiscussions] = useState<StudentForumDiscussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<StudentForumDiscussion | null>(null);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Reports State
  const [reports, setReports] = useState<ForumModerationReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportFilterStatus, setReportFilterStatus] = useState('all');

  // Resolve Report Modal State
  const [resolvingReport, setResolvingReport] = useState<ForumModerationReport | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'Reviewed' | 'Dismissed' | 'Actioned'>('Reviewed');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // 1. Fetch Platform Discussions
  const fetchDiscussions = useCallback(async () => {
    setIsLoadingDiscussions(true);
    try {
      const res = await forumService.getDiscussions({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
      });
      setDiscussions(res.discussions);
    } catch {
      // Retain existing state
    } finally {
      setIsLoadingDiscussions(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery]);

  // 2. Fetch Moderation Reports
  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const res = await forumService.getReports(reportFilterStatus !== 'all' ? reportFilterStatus : undefined);
      setReports(res);
    } catch {
      // Retain existing state
    } finally {
      setIsLoadingReports(false);
    }
  }, [reportFilterStatus]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, fetchReports]);

  // Realtime synchronization
  useEffect(() => {
    const unsubscribe = forumService.subscribeToForumChanges(
      null,
      () => fetchDiscussions(),
      (payload) => {
        if (payload?.new?.discussion_id && selectedDiscussion?.id === payload.new.discussion_id) {
          forumService.getDiscussionDetails(payload.new.discussion_id).then((d) => {
            setSelectedDiscussion(d);
            setDiscussions((prev) => prev.map((item) => (item.id === d.id ? d : item)));
          }).catch(() => null);
        }
      }
    );
    return () => unsubscribe();
  }, [fetchDiscussions, selectedDiscussion]);

  // Metrics
  const stats = useMemo(() => {
    const total = discussions.length;
    const locked = discussions.filter((d) => d.isLocked).length;
    const pinned = discussions.filter((d) => d.isPinned).length;
    const pendingReports = reports.filter((r) => r.status === 'Pending').length;
    return { total, locked, pinned, pendingReports };
  }, [discussions, reports]);

  // Handlers

  const handleTogglePin = async (discId: string, isPinned: boolean) => {
    try {
      const updated = await forumService.moderateDiscussion(discId, { isPinned: !isPinned });
      setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
      if (selectedDiscussion && selectedDiscussion.id === discId) {
        setSelectedDiscussion(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update pin status');
    }
  };

  const handleDeleteDiscussion = async (discId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this discussion thread and all replies?')) return;
    try {
      await forumService.deleteDiscussion(discId);
      setDiscussions((prev) => prev.filter((d) => d.id !== discId));
      if (selectedDiscussion && selectedDiscussion.id === discId) {
        setSelectedDiscussion(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete discussion');
    }
  };

  const handleOpenDiscussionDetails = async (disc: StudentForumDiscussion) => {
    setSelectedDiscussion(disc);
    try {
      const detailed = await forumService.getDiscussionDetails(disc.id);
      setSelectedDiscussion(detailed);
      setDiscussions((prev) => prev.map((d) => (d.id === disc.id ? detailed : d)));
    } catch {}
  };

  const handleOpenResolveModal = (report: ForumModerationReport) => {
    setResolvingReport(report);
    setResolutionStatus('Reviewed');
    setResolutionNotes('');
  };

  const handleSubmitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReport) return;

    try {
      await forumService.resolveReport(resolvingReport.id, {
        status: resolutionStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
      });

      setReports((prev) =>
        prev.map((r) =>
          r.id === resolvingReport.id
            ? { ...r, status: resolutionStatus, resolutionNotes: resolutionNotes.trim() }
            : r
        )
      );
      setResolvingReport(null);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <FiShield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Forum Moderation & Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Platform-wide moderation controls, content reports, thread locking, and safety enforcement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedDiscussion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDiscussion(null)}
              className="flex items-center gap-1.5 text-xs"
            >
              <FiArrowLeft className="w-4 h-4" /> Back to Threads
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => (activeTab === 'discussions' ? fetchDiscussions() : fetchReports())}
            className="flex items-center gap-1.5 text-xs"
          >
            <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {!selectedDiscussion && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Threads
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {stats.total}
              </div>
            </div>
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600">
              <FiMessageSquare className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">
                Pinned Threads
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats.pinned}
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600">
              <FiStar className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block">
                Locked Threads
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {stats.locked}
              </div>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600">
              <FiLock className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
                Pending Reports
              </span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {stats.pendingReports}
              </div>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* Main Tabs Selection */}
      {!selectedDiscussion && (
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 ${
              activeTab === 'discussions'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiMessageSquare className="w-4 h-4" />
            <span>All Platform Discussions ({discussions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiAlertTriangle className="w-4 h-4" />
            <span>Moderation Reports Queue ({reports.filter((r) => r.status === 'Pending').length} Pending)</span>
          </button>
        </div>
      )}

      {/* TAB 1: ALL DISCUSSIONS */}
      {!selectedDiscussion && activeTab === 'discussions' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search across all discussions, authors, or course titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="All">All Categories</option>
                <option value="General Discussion">General Discussion</option>
                <option value="Assignments">Assignments</option>
                <option value="Quizzes">Quizzes</option>
                <option value="Course Content">Course Content</option>
                <option value="Technical Issues">Technical Issues</option>
                <option value="Announcements">Announcements</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="all">All Statuses</option>
                <option value="solved">Solved</option>
                <option value="unanswered">Unanswered</option>
                <option value="pinned">Pinned</option>
              </select>
            </div>
          </div>

          {/* Discussions Table / Cards */}
          {isLoadingDiscussions ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading platform discussions...</div>
          ) : discussions.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              No discussions match your filter criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {discussions.map((disc) => (
                <Card
                  key={disc.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary">{disc.category}</Badge>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-rose-600 cursor-pointer" onClick={() => handleOpenDiscussionDetails(disc)}>
                        {disc.title}
                      </span>
                      {disc.isPinned && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-extrabold flex items-center gap-0.5">
                          <FiStar className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      {disc.isLocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-extrabold flex items-center gap-0.5">
                          <FiLock className="w-3 h-3" /> Locked
                        </span>
                      )}
                      {disc.isSolved && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-extrabold flex items-center gap-0.5">
                          <FiCheckCircle className="w-3 h-3" /> Solved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{disc.courseTitle}</span>
                      <span>•</span>
                      <span>By {disc.authorName} ({disc.authorRole})</span>
                      <span>•</span>
                      <span>{disc.repliesCount} Replies</span>
                      <span>•</span>
                      <span>{disc.viewsCount} Views</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDiscussionDetails(disc)}
                      className="text-xs"
                    >
                      <FiEye className="w-3.5 h-3.5 mr-1" /> View Thread
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePin(disc.id, Boolean(disc.isPinned))}
                      className={`text-xs ${disc.isPinned ? 'text-amber-600 border-amber-300' : ''}`}
                      title={disc.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <FiStar className="w-3.5 h-3.5" />
                    </Button>


                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDiscussion(disc.id)}
                      className="text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="Delete Thread"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODERATION REPORTS */}
      {!selectedDiscussion && activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiAlertTriangle className="w-4 h-4 text-rose-500" />
              Flagged Community Content
            </h3>

            <div className="flex items-center gap-2 text-xs">
              {(['all', 'Pending', 'Reviewed', 'Dismissed', 'Actioned'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReportFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize ${
                    reportFilterStatus === st
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {isLoadingReports ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading reports queue...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              No reports found in this category. The forum is clean!
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <Card
                  key={rep.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800">
                        {rep.targetType}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Reason: {rep.reason}
                      </span>
                      <Badge
                        variant={
                          rep.status === 'Pending'
                            ? 'warning'
                            : rep.status === 'Actioned'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {rep.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-500">
                      <span>Reported by {rep.reporterName || 'Anonymous'}</span>
                      <span> • {rep.createdAt}</span>
                      {rep.resolutionNotes && (
                        <span className="text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          Resolution: {rep.resolutionNotes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenResolveModal(rep)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
                    >
                      Resolve Report
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SELECTED DISCUSSION DETAILS WORKSPACE */}
      {selectedDiscussion && (
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {selectedDiscussion.title}
              </h2>
              <span className="text-xs font-semibold text-rose-600">{selectedDiscussion.courseTitle}</span>
            </div>

            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDiscussion(selectedDiscussion.id)}
                className="text-xs text-rose-500"
              >
                <FiTrash2 className="w-3.5 h-3.5 mr-1" /> Delete Thread
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2">
            <span className="font-bold block text-slate-700 dark:text-slate-300">
              Author: {selectedDiscussion.authorName} ({selectedDiscussion.authorRole}) • Posted {selectedDiscussion.createdAt}
            </span>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {selectedDiscussion.content}
            </p>
          </div>

          {/* Replies Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Replies ({selectedDiscussion.replies.length})
            </h4>

            {selectedDiscussion.replies.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No replies in this thread.</div>
            ) : (
              selectedDiscussion.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {reply.authorName} ({reply.authorRole}) • {reply.createdAt}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {reply.content}
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      if (window.confirm('Delete this reply?')) {
                        await forumService.deleteReply(reply.id);
                        setSelectedDiscussion({
                          ...selectedDiscussion,
                          replies: selectedDiscussion.replies.filter((r) => r.id !== reply.id),
                          repliesCount: Math.max(0, selectedDiscussion.repliesCount - 1),
                        });
                      }
                    }}
                    className="text-slate-400 hover:text-red-500 p-1"
                    title="Delete reply"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Resolve Report Modal */}
      {resolvingReport && (
        <BaseModal
          isOpen={Boolean(resolvingReport)}
          onClose={() => setResolvingReport(null)}
          title="Resolve Content Report"
        >
          <form onSubmit={handleSubmitResolve} className="space-y-4 py-2 text-xs">
            <div>
              <span className="font-bold block text-slate-700 dark:text-slate-300">
                Reported Reason:
              </span>
              <p className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 mt-1">
                "{resolvingReport.reason}"
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-900 dark:text-slate-100 block">
                Resolution Action <span className="text-red-500">*</span>
              </label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Reviewed">Reviewed (No Violation)</option>
                <option value="Dismissed">Dismissed (False Report)</option>
                <option value="Actioned">Actioned (Moderated Content)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-900 dark:text-slate-100 block">
                Resolution Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Warning sent to author or content approved..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setResolvingReport(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                Save Resolution
              </Button>
            </div>
          </form>
        </BaseModal>
      )}
    </div>
  );
};
