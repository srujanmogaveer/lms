import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiArrowLeft,
  FiBookmark,
  FiCheck,
  FiSend,
  FiCornerDownRight,
  FiHelpCircle,
  FiCheckSquare,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/common/Avatar';
import { forumService } from '../../services/forumService';
import { courseService } from '../../services/courseService';
import type { StudentForumDiscussion, ForumReply } from '../../types';

type SortOption = 'newest' | 'oldest' | 'replies';
type FilterStatusTab = 'All' | 'Unanswered' | 'Answered' | 'Solved' | 'Pinned';

export const InstructorDiscussionForum: React.FC = () => {
  // Data State
  const [discussions, setDiscussions] = useState<StudentForumDiscussion[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Selected Discussion Details View
  const [selectedDiscussion, setSelectedDiscussion] = useState<StudentForumDiscussion | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [activeStatusTab, setActiveStatusTab] = useState<FilterStatusTab>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Instructor Reply Editor State
  const [replyInputText, setReplyInputText] = useState<string>('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState<string>('');

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch Instructor Courses
  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        const res = await courseService.getInstructorCourses();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const list = res.data.map((c) => ({
            id: c.id,
            title: c.title,
          }));
          setInstructorCourses(list);
        }
      } catch {
        // Safe fallback
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Discussions for Instructor
  const fetchDiscussions = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await forumService.getDiscussions({
        courseId: selectedCourseFilter !== 'All' ? selectedCourseFilter : undefined,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        sortBy: sortBy === 'replies' ? 'popular' : sortBy,
      });
      setDiscussions(res.discussions);
    } catch {
      // Retain existing data
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [selectedCourseFilter, searchQuery, sortBy]);

  useEffect(() => {
    fetchDiscussions(true);
  }, [fetchDiscussions]);

  // 3. Realtime Subscription
  useEffect(() => {
    const courseFilterId = selectedCourseFilter !== 'All' ? selectedCourseFilter : null;
    const unsubscribe = forumService.subscribeToForumChanges(
      courseFilterId,
      () => {
        fetchDiscussions(false);
      },
      (payload) => {
        if (payload?.new?.discussion_id) {
          const discId = payload.new.discussion_id;
          if (selectedDiscussion?.id === discId) {
            forumService.getDiscussionDetails(discId).then((updated) => {
              setSelectedDiscussion(updated);
              setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
            }).catch(() => null);
          } else {
            fetchDiscussions(false);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedCourseFilter, fetchDiscussions, selectedDiscussion]);

  // Dashboard Overview Metrics
  const stats = useMemo(() => {
    const total = discussions.length;
    const unanswered = discussions.filter((d) => d.repliesCount === 0).length;
    const answered = discussions.filter((d) => d.repliesCount > 0).length;
    const pinned = discussions.filter((d) => d.isPinned).length;
    const solved = discussions.filter((d) => d.isSolved).length;

    return { total, unanswered, answered, pinned, solved };
  }, [discussions]);

  // Filtered & Sorted Discussions List (Pinned discussions appear at top automatically)
  const filteredDiscussions = useMemo(() => {
    return discussions
      .filter((d) => {
        // Search Query: Title, Student Name, or Course Name
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          q === '' ||
          d.title.toLowerCase().includes(q) ||
          d.authorName.toLowerCase().includes(q) ||
          d.courseTitle.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q);

        // Course Filter
        const matchesCourse =
          selectedCourseFilter === 'All' ||
          d.courseId === selectedCourseFilter ||
          d.courseTitle === selectedCourseFilter;

        // Status Tabs Filter: 'All' | 'Unanswered' | 'Answered' | 'Solved' | 'Pinned'
        let matchesStatusTab = true;
        if (activeStatusTab === 'Unanswered') matchesStatusTab = d.repliesCount === 0;
        if (activeStatusTab === 'Answered') matchesStatusTab = d.repliesCount > 0;
        if (activeStatusTab === 'Solved') matchesStatusTab = Boolean(d.isSolved);
        if (activeStatusTab === 'Pinned') matchesStatusTab = Boolean(d.isPinned);

        return matchesSearch && matchesCourse && matchesStatusTab;
      })
      .sort((a, b) => {
        // Rule: Pinned discussions always appear at the top
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortBy === 'oldest') return a.id.localeCompare(b.id);
        if (sortBy === 'replies') return b.repliesCount - a.repliesCount;
        return b.id.localeCompare(a.id); // Default newest
      });
  }, [discussions, searchQuery, selectedCourseFilter, activeStatusTab, sortBy]);

  // Select Active Discussion Handler
  const handleOpenDiscussionDetails = async (item: StudentForumDiscussion) => {
    setSelectedDiscussion(item);
    setReplyInputText('');
    setEditingReplyId(null);

    // Fetch live details with complete replies
    try {
      const detailed = await forumService.getDiscussionDetails(item.id);
      setSelectedDiscussion(detailed);
      setDiscussions((prev) => prev.map((d) => (d.id === item.id ? detailed : d)));
    } catch {
      // Keep selected
    }
  };

  // Toggle Discussion Pin Status
  const handleTogglePinDiscussion = async (discId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = discussions.find((d) => d.id === discId);
    const newPinned = !current?.isPinned;

    // Optimistic UI update
    setDiscussions((prev) =>
      prev.map((d) => (d.id === discId ? { ...d, isPinned: newPinned } : d))
    );
    if (selectedDiscussion && selectedDiscussion.id === discId) {
      setSelectedDiscussion({ ...selectedDiscussion, isPinned: newPinned });
    }

    try {
      const updated = await forumService.moderateDiscussion(discId, { isPinned: newPinned });
      setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
      if (selectedDiscussion && selectedDiscussion.id === discId) {
        setSelectedDiscussion(updated);
      }
      showToast('Discussion pin status updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update pin status', 'warning');
    }
  };

  // Mark Discussion as Solved / Open
  const handleMarkAsSolved = async (discId: string) => {
    const current = discussions.find((d) => d.id === discId);
    const newSolved = !current?.isSolved;

    // Optimistic UI update
    setDiscussions((prev) =>
      prev.map((d) => (d.id === discId ? { ...d, isSolved: newSolved } : d))
    );
    if (selectedDiscussion && selectedDiscussion.id === discId) {
      setSelectedDiscussion({ ...selectedDiscussion, isSolved: newSolved });
    }

    try {
      const updated = await forumService.moderateDiscussion(discId, { isSolved: newSolved });
      setDiscussions((prev) => prev.map((d) => (d.id === discId ? updated : d)));
      if (selectedDiscussion && selectedDiscussion.id === discId) {
        setSelectedDiscussion(updated);
      }
      showToast('Discussion solved status updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update solved status', 'warning');
    }
  };

  // Post New Instructor Reply
  const handlePostReply = async () => {
    if (!selectedDiscussion) return;
    if (!replyInputText.trim()) {
      showToast('Reply message cannot be empty.', 'warning');
      return;
    }

    try {
      const newReply = await forumService.createReply(selectedDiscussion.id, {
        content: replyInputText.trim(),
      });

      const updatedReplies = [...(selectedDiscussion.replies || []), newReply];
      const updatedDisc: StudentForumDiscussion = {
        ...selectedDiscussion,
        replies: updatedReplies,
        repliesCount: updatedReplies.length,
      };

      setSelectedDiscussion(updatedDisc);
      setDiscussions((prev) => prev.map((d) => (d.id === selectedDiscussion.id ? updatedDisc : d)));
      setReplyInputText('');
      showToast('Instructor reply posted successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to post reply', 'warning');
    }
  };

  // Start Editing Reply
  const handleStartEditReply = (reply: ForumReply) => {
    setEditingReplyId(reply.id);
    setEditReplyText(reply.content);
  };

  // Save Edited Reply
  const handleSaveEditedReply = async (replyId: string) => {
    if (!selectedDiscussion) return;
    if (!editReplyText.trim()) {
      showToast('Reply message cannot be empty.', 'warning');
      return;
    }

    try {
      const updated = await forumService.updateReply(replyId, { content: editReplyText.trim() });
      const updatedReplies = selectedDiscussion.replies.map((r) =>
        r.id === replyId ? updated : r
      );

      const updatedDisc = { ...selectedDiscussion, replies: updatedReplies };
      setSelectedDiscussion(updatedDisc);
      setDiscussions((prev) => prev.map((d) => (d.id === selectedDiscussion.id ? updatedDisc : d)));
      setEditingReplyId(null);
      setEditReplyText('');
      showToast('Reply updated successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update reply', 'warning');
    }
  };

  // Delete Reply
  const handleDeleteReply = async (replyId: string) => {
    if (!selectedDiscussion) return;
    try {
      await forumService.deleteReply(replyId);
      const updatedReplies = selectedDiscussion.replies.filter((r) => r.id !== replyId);
      const updatedDisc = {
        ...selectedDiscussion,
        replies: updatedReplies,
        repliesCount: Math.max(0, updatedReplies.length),
      };
      setSelectedDiscussion(updatedDisc);
      setDiscussions((prev) => prev.map((d) => (d.id === selectedDiscussion.id ? updatedDisc : d)));
      showToast('Reply deleted.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete reply', 'warning');
    }
  };

  // Toggle Pin Reply
  const handleTogglePinReply = async (replyId: string) => {
    if (!selectedDiscussion) return;
    const current = selectedDiscussion.replies.find((r) => r.id === replyId);
    const newPinned = !current?.isPinnedReply;

    try {
      const updated = await forumService.moderateReply(replyId, { isPinned: newPinned });
      const updatedReplies = selectedDiscussion.replies.map((r) =>
        r.id === replyId ? updated : r
      );
      const updatedDisc = { ...selectedDiscussion, replies: updatedReplies };
      setSelectedDiscussion(updatedDisc);
      setDiscussions((prev) => prev.map((d) => (d.id === selectedDiscussion.id ? updatedDisc : d)));
      showToast('Reply pinned status updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update pin status', 'warning');
    }
  };

  // Status Badge Renderer
  const renderStatusBadge = (isSolved?: boolean, isPinned?: boolean, repliesCount?: number) => {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {isPinned && (
          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-extrabold text-[10px] border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <FiBookmark className="w-3 h-3 text-amber-600" /> Pinned
          </span>
        )}
        {isSolved ? (
          <Badge variant="success" className="flex items-center gap-1 font-bold">
            <FiCheckCircle className="w-3 h-3 text-emerald-500" /> Solved
          </Badge>
        ) : (repliesCount || 0) > 0 ? (
          <Badge variant="primary" className="flex items-center gap-1 font-bold">
            <FiCheck className="w-3 h-3" /> Answered
          </Badge>
        ) : (
          <Badge variant="warning" className="flex items-center gap-1 font-bold">
            <FiHelpCircle className="w-3 h-3" /> Open (Unanswered)
          </Badge>
        )}
      </div>
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
            <FiMessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Instructor Discussion Forum
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review student questions, post authoritative instructor replies, pin important threads, and mark solutions.
            </p>
          </div>
        </div>

        {selectedDiscussion && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDiscussion(null)}
            className="flex items-center gap-1.5 text-xs"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Discussions List
          </Button>
        )}
      </div>

      {/* KPI Dashboard Overview Cards */}
      {!selectedDiscussion && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Discussions
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
                Unanswered
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats.unanswered}
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600">
              <FiHelpCircle className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block">
                Answered
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {stats.answered}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <FiCheck className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
                Solved
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.solved}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <FiCheckSquare className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
                Pinned
              </span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {stats.pinned}
              </div>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
              <FiBookmark className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* VIEW 1: DISCUSSIONS LIST & FILTER DASHBOARD */}
      {!selectedDiscussion && (
        <div className="space-y-4">
          {/* Search & Filters Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Discussion Title, Student Name, or Course Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Course & Sort Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="All">All Courses</option>
                {instructorCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="newest">Sort Newest First</option>
                <option value="oldest">Sort Oldest First</option>
                <option value="replies">Sort Most Replies</option>
              </select>
            </div>
          </div>

          {/* Status Tabs Filter Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            {(['All', 'Unanswered', 'Answered', 'Solved', 'Pinned'] as FilterStatusTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveStatusTab(tab)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${
                    activeStatusTab === tab
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab === 'All' && `All Discussions (${stats.total})`}
                  {tab === 'Unanswered' && `Unanswered (${stats.unanswered})`}
                  {tab === 'Answered' && `Answered (${stats.answered})`}
                  {tab === 'Solved' && `Solved (${stats.solved})`}
                  {tab === 'Pinned' && `Pinned (${stats.pinned})`}
                </button>
              )
            )}
          </div>

          {/* Loading / Empty State */}
          {isLoading ? (
            <Card className="p-12 text-center border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 text-xs text-slate-400">
              Loading instructor discussions...
            </Card>
          ) : filteredDiscussions.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 bg-white dark:bg-slate-900">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FiMessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No discussions available.
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  There are no student questions matching your selected filters or search parameters.
                </p>
              </div>
            </Card>
          ) : (
            /* Discussion List Cards */
            <div className="space-y-3">
              {filteredDiscussions.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    onClick={() => handleOpenDiscussionDetails(item)}
                    className={`p-5 bg-white dark:bg-slate-900 border rounded-3xl cursor-pointer hover:shadow-md transition-all space-y-3 ${
                      item.isPinned
                        ? 'border-amber-300 dark:border-amber-900/80 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm hover:text-purple-600 transition-colors">
                            {item.title}
                          </h3>
                          {renderStatusBadge(item.isSolved, item.isPinned, item.repliesCount)}
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                          {item.courseTitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => handleTogglePinDiscussion(item.id, e)}
                          className={`p-2 rounded-xl border transition-colors ${
                            item.isPinned
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-600 border-slate-200 dark:border-slate-700'
                          }`}
                          title={item.isPinned ? 'Unpin Discussion' : 'Pin Discussion'}
                        >
                          <FiBookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={item.authorAvatar}
                          name={item.authorName}
                          role="student"
                          size="xs"
                          shape="circle"
                          className="w-6 h-6"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.authorName}
                        </span>
                        <span className="text-[11px] text-slate-400">• {item.createdAt}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <FiMessageSquare className="w-3.5 h-3.5 text-purple-500" />
                          {item.repliesCount} Replies
                        </span>
                        <Button variant="outline" size="sm" className="text-[11px] font-bold py-1">
                          View Discussion
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DISCUSSION DETAILS & INSTRUCTOR REPLIES */}
      {selectedDiscussion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Discussion Thread Card */}
          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {selectedDiscussion.title}
                  </h2>
                  {renderStatusBadge(selectedDiscussion.isSolved, selectedDiscussion.isPinned, selectedDiscussion.repliesCount)}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                  {selectedDiscussion.courseTitle}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePinDiscussion(selectedDiscussion.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
                    selectedDiscussion.isPinned
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <FiBookmark className="w-3.5 h-3.5" />
                  {selectedDiscussion.isPinned ? 'Unpin Discussion' : 'Pin Discussion'}
                </button>

                <button
                  onClick={() => handleMarkAsSolved(selectedDiscussion.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
                    selectedDiscussion.isSolved
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  {selectedDiscussion.isSolved ? 'Solved' : 'Mark as Solved'}
                </button>
              </div>
            </div>

            {/* Student Question Card Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={selectedDiscussion.authorAvatar}
                  name={selectedDiscussion.authorName}
                  role="student"
                  size="sm"
                  shape="circle"
                  className="w-7 h-7"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                    {selectedDiscussion.authorName} (Student)
                  </span>
                  <span className="text-[10px] text-slate-400">{selectedDiscussion.createdAt}</span>
                </div>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                {selectedDiscussion.content}
              </p>
            </div>

            {/* Replies Header */}
            <div className="pt-2">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-purple-600" />
                Replies & Answers ({selectedDiscussion.replies.length})
              </h3>
            </div>

            {/* Existing Replies Feed */}
            {selectedDiscussion.replies.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl text-xs">
                No replies yet. Be the first instructor to post an answer!
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDiscussion.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-2xl border space-y-2.5 text-xs transition-colors ${
                      reply.authorRole === 'instructor' || reply.authorRole === 'admin'
                        ? reply.isPinnedReply
                          ? 'bg-purple-50/80 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800'
                          : 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Reply Author Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={reply.authorAvatar}
                          name={reply.authorName}
                          role={reply.authorRole}
                          size="xs"
                          shape="circle"
                          className="w-6.5 h-6.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {reply.authorName}
                            </span>
                            {reply.authorRole === 'instructor' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-600 text-white font-extrabold uppercase">
                                Instructor
                              </span>
                            )}
                            {reply.isPinnedReply && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-extrabold flex items-center gap-0.5">
                                <FiBookmark className="w-2.5 h-2.5" /> Pinned Reply
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{reply.createdAt}</span>
                        </div>
                      </div>

                      {/* Reply Instructor Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditReply(reply)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-[10px] flex items-center gap-1"
                          title="Edit Reply"
                        >
                          <FiEdit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleTogglePinReply(reply.id)}
                          className="px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 font-bold text-[10px] flex items-center gap-1"
                          title={reply.isPinnedReply ? 'Unpin Reply' : 'Pin Reply'}
                        >
                          <FiBookmark className="w-3 h-3" /> {reply.isPinnedReply ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-[10px] flex items-center gap-1"
                          title="Delete Reply"
                        >
                          <FiTrash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Inline Reply Editor Mode */}
                    {editingReplyId === reply.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={editReplyText}
                          onChange={(e) => setEditReplyText(e.target.value)}
                          className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingReplyId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveEditedReply(reply.id)}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Displayed Reply Content */
                      <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                        {reply.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* INSTRUCTOR REPLY EDITOR BOX */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <FiCornerDownRight className="w-4 h-4 text-purple-600" />
                Post Instructor Reply
              </h4>

              <textarea
                rows={4}
                placeholder="Write your detailed instructor response or solution here..."
                value={replyInputText}
                onChange={(e) => setReplyInputText(e.target.value)}
                className="w-full p-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setReplyInputText('')}
                  className="text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePostReply}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-1.5"
                >
                  <FiSend className="w-4 h-4" /> Post Reply
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
