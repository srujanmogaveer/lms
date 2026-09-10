import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

import { ForumHeader } from '../../components/forum/ForumHeader';
import { ForumCategoriesBar } from '../../components/forum/ForumCategoriesBar';
import { ForumFilterBar, type ForumFilterState } from '../../components/forum/ForumFilterBar';
import { DiscussionCard } from '../../components/forum/DiscussionCard';
import { ForumSidebarWidgets } from '../../components/forum/ForumSidebarWidgets';
import { CreateDiscussionModal, type CourseOption } from '../../components/forum/CreateDiscussionModal';
import { DiscussionDetailWorkspace } from '../../components/forum/DiscussionDetailWorkspace';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';

import { forumService } from '../../services/forumService';
import { enrollmentService } from '../../services/enrollmentService';
import { useAuth } from '../../contexts/AuthContext';
import type { StudentForumDiscussion } from '../../types';

export const StudentForum: React.FC = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || '';

  // Core Datasets State
  const [discussions, setDiscussions] = useState<StudentForumDiscussion[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Category Filter State
  const [activeCategory, setActiveCategory] = useState<string>('All Categories');

  // Filters State
  const [filters, setFilters] = useState<ForumFilterState>({
    searchQuery: '',
    course: 'all',
    status: 'all',
    sortBy: 'latest',
  });

  // Active View Mode: 'list' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);

  // Modal Control
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch student enrolled courses (with fallback to catalog courses if none)
  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        const res = await enrollmentService.getStudentEnrollments();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const list: CourseOption[] = res.data.map((e) => ({
            id: e.courseId,
            title: e.courseTitle || 'Enrolled Course',
          }));
          setEnrolledCourses(list);
        } else if (isMounted) {
          // If no enrollments, load published courses so student can still select genuine courses
          const { courseService } = await import('../../services/courseService');
          const catRes = await courseService.getPublicCourses();
          if (isMounted && catRes.success && Array.isArray(catRes.data)) {
            const list: CourseOption[] = catRes.data.map((c: any) => ({
              id: c.id,
              title: c.title,
            }));
            setEnrolledCourses(list);
          }
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

  // Fetch discussions from backend
  const fetchDiscussions = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await forumService.getDiscussions({
        category: activeCategory !== 'All Categories' ? activeCategory : undefined,
        courseId: filters.course !== 'all' ? filters.course : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.searchQuery.trim() ? filters.searchQuery.trim() : undefined,
        sortBy: filters.sortBy,
      });
      setDiscussions(res.discussions);
    } catch {
      // Retain existing state
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [activeCategory, filters]);

  useEffect(() => {
    fetchDiscussions(true);
  }, [fetchDiscussions]);

  // Realtime subscription setup
  useEffect(() => {
    const activeCourseId = filters.course !== 'all' ? filters.course : null;
    const unsubscribe = forumService.subscribeToForumChanges(
      activeCourseId,
      () => {
        // On discussion change, re-fetch smoothly
        fetchDiscussions(false);
      },
      (payload) => {
        // On reply change, if currently viewing detail, refresh detail
        if (payload?.new?.discussion_id) {
          const discId = payload.new.discussion_id;
          if (selectedDiscussionId === discId) {
            forumService.getDiscussionDetails(discId).then((updated) => {
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
  }, [filters.course, fetchDiscussions, selectedDiscussionId]);

  // Unique Courses List for UI Filter
  const coursesFilterList = useMemo<CourseOption[]>(() => {
    if (enrolledCourses.length > 0) {
      return enrolledCourses;
    }
    const map = new Map<string, string>();
    discussions.forEach((d) => {
      if (d.courseId && !map.has(d.courseId)) {
        map.set(d.courseId, d.courseTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [discussions, enrolledCourses]);

  // Statistics Metrics
  const totalDiscussions = discussions.length;
  const activeDiscussions = useMemo(() => discussions.filter((d) => d.repliesCount > 0).length, [discussions]);
  const myDiscussionsCount = useMemo(() => discussions.filter((d) => d.authorId === currentUserId).length, [discussions, currentUserId]);

  // Category counts dictionary
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    discussions.forEach((d) => {
      map[d.category] = (map[d.category] || 0) + 1;
    });
    return map;
  }, [discussions]);

  // Active selected discussion object
  const selectedDiscussion = useMemo(() => {
    return discussions.find((d) => d.id === selectedDiscussionId) || null;
  }, [discussions, selectedDiscussionId]);

  // Filter & Sort Logic
  const filteredDiscussions = useMemo(() => {
    return discussions
      .filter((disc) => {
        // 1. Category Filter
        if (activeCategory !== 'All Categories' && disc.category !== activeCategory) return false;

        // 2. Search Query
        if (filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase();
          const matchesTitle = disc.title.toLowerCase().includes(q);
          const matchesCourse = disc.courseTitle.toLowerCase().includes(q);
          const matchesAuthor = disc.authorName.toLowerCase().includes(q);
          const matchesContent = disc.content.toLowerCase().includes(q);
          if (!matchesTitle && !matchesCourse && !matchesAuthor && !matchesContent) return false;
        }

        // 3. Course Filter
        if (filters.course !== 'all' && disc.courseId !== filters.course) return false;

        // 4. Status Filter
        if (filters.status === 'solved' && !disc.isSolved) return false;
        if (filters.status === 'unanswered' && disc.repliesCount > 0) return false;
        if (filters.status === 'pinned' && !disc.isPinned) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'popular') {
          return b.viewsCount - a.viewsCount;
        }
        if (filters.sortBy === 'oldest') {
          return a.id.localeCompare(b.id);
        }
        // Default latest (pinned first)
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.id.localeCompare(a.id);
      });
  }, [discussions, activeCategory, filters]);

  // Handlers
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      course: 'all',
      status: 'all',
      sortBy: 'latest',
    });
    setActiveCategory('All Categories');
  };

  const handleRefresh = () => {
    fetchDiscussions(true);
  };

  const handleOpenDetails = async (disc: StudentForumDiscussion) => {
    setSelectedDiscussionId(disc.id);
    setViewMode('detail');

    // Fetch full details with replies from backend
    try {
      const detailed = await forumService.getDiscussionDetails(disc.id);
      setDiscussions((prev) => prev.map((d) => (d.id === disc.id ? detailed : d)));
    } catch {
      // Keep existing data
    }
  };

  const handleToggleLikeDiscussion = async (discussionId: string) => {
    // Optimistic UI update
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discussionId) {
          const isLikedNow = !d.isLiked;
          return {
            ...d,
            isLiked: isLikedNow,
            likesCount: isLikedNow ? d.likesCount + 1 : Math.max(0, d.likesCount - 1),
          };
        }
        return d;
      })
    );

    try {
      const res = await forumService.toggleReaction('discussion', discussionId);
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === discussionId) {
            return {
              ...d,
              isLiked: res.isLiked,
              likesCount: res.likesCount,
            };
          }
          return d;
        })
      );
    } catch {
      // Revert if failed
    }
  };

  const handleToggleLikeReply = async (replyId: string) => {
    if (!selectedDiscussionId) return;

    // Optimistic UI update
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === selectedDiscussionId) {
          const updatedReplies = d.replies.map((r) => {
            if (r.id === replyId) {
              const isLikedNow = !r.isLiked;
              return {
                ...r,
                isLiked: isLikedNow,
                likesCount: isLikedNow ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
              };
            }
            return r;
          });
          return { ...d, replies: updatedReplies };
        }
        return d;
      })
    );

    try {
      const res = await forumService.toggleReaction('reply', replyId);
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === selectedDiscussionId) {
            const updatedReplies = d.replies.map((r) => {
              if (r.id === replyId) {
                return {
                  ...r,
                  isLiked: res.isLiked,
                  likesCount: res.likesCount,
                };
              }
              return r;
            });
            return { ...d, replies: updatedReplies };
          }
          return d;
        })
      );
    } catch {
      // Revert if failed
    }
  };

  const handleAddReply = async (discussionId: string, replyContent: string) => {
    try {
      const newReply = await forumService.createReply(discussionId, { content: replyContent });
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === discussionId) {
            return {
              ...d,
              repliesCount: d.repliesCount + 1,
              replies: [...d.replies, newReply],
            };
          }
          return d;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Failed to post reply');
    }
  };

  const handleUpdateReply = async (replyId: string, content: string) => {
    if (!selectedDiscussionId) return;
    try {
      const updated = await forumService.updateReply(replyId, { content });
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === selectedDiscussionId) {
            return {
              ...d,
              replies: d.replies.map((r) => (r.id === replyId ? updated : r)),
            };
          }
          return d;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update reply');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!selectedDiscussionId) return;
    try {
      await forumService.deleteReply(replyId);
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === selectedDiscussionId) {
            return {
              ...d,
              repliesCount: Math.max(0, d.repliesCount - 1),
              replies: d.replies.filter((r) => r.id !== replyId),
            };
          }
          return d;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Failed to delete reply');
    }
  };

  const handleCreateDiscussion = async (newDiscData: {
    courseId: string;
    courseTitle: string;
    category: StudentForumDiscussion['category'];
    title: string;
    content: string;
    attachments?: Array<{ name: string; size: string; type: any; url: string }>;
  }) => {
    try {
      const created = await forumService.createDiscussion({
        courseId: newDiscData.courseId,
        category: newDiscData.category,
        title: newDiscData.title,
        content: newDiscData.content,
        attachments: newDiscData.attachments,
      });

      setDiscussions((prev) => [created, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to create discussion');
    }
  };

  const handleReportContent = async (targetType: 'discussion' | 'reply', targetId: string, reason: string) => {
    try {
      await forumService.createReport({ targetType, targetId, reason });
      alert('Content reported to moderators. Thank you for keeping EduSphere safe.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Detail Workspace View Mode */}
      {viewMode === 'detail' && selectedDiscussion ? (
        <DiscussionDetailWorkspace
          discussion={selectedDiscussion}
          currentUserId={currentUserId}
          currentUserRole="student"
          onBackToList={() => setViewMode('list')}
          onAddReply={handleAddReply}
          onToggleLikeDiscussion={handleToggleLikeDiscussion}
          onToggleLikeReply={handleToggleLikeReply}
          onUpdateReply={handleUpdateReply}
          onDeleteReply={handleDeleteReply}
          onReport={handleReportContent}
        />
      ) : (
        /* List View Mode */
        <div className="space-y-8">
          {/* Header */}
          <ForumHeader
            totalDiscussions={totalDiscussions}
            activeDiscussions={activeDiscussions}
            myDiscussionsCount={myDiscussionsCount}
            onRefresh={handleRefresh}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            isLoading={isLoading}
          />

          {/* Skeleton Loading State */}
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonLoader className="h-16 w-full rounded-2xl" />
              <SkeletonLoader className="h-20 w-full rounded-2xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : discussions.length === 0 ? (
            /* Empty State View */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-6"
            >
              <EmptyState
                type="courses"
                title="No discussions available."
                description="Be the first to start a conversation, ask a coursework question, or share code solutions with your peers and instructors."
                actionLabel="Ask New Question"
                onAction={() => setIsCreateModalOpen(true)}
              />
            </motion.div>
          ) : (
            /* Populated Forum Listing View */
            <div className="space-y-6">
              {/* Category Navigation Bar */}
              <ForumCategoriesBar
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                categoryCounts={categoryCounts}
              />

              {/* Filter & Search Bar */}
              <ForumFilterBar
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={handleResetFilters}
                courses={coursesFilterList}
                totalFilteredCount={filteredDiscussions.length}
              />

              {/* Main Grid: Discussion Cards + Sidebar Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Discussion Cards Grid */}
                <div className="lg:col-span-8">
                  {filteredDiscussions.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                      <EmptyState
                        type="courses"
                        title="No discussions match your filters"
                        description="Try resetting search keywords or selecting 'All Categories'."
                        actionLabel="Reset Search Filters"
                        onAction={handleResetFilters}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredDiscussions.map((discussion) => (
                        <motion.div key={discussion.id} layout>
                          <DiscussionCard
                            discussion={discussion}
                            onOpenDetails={handleOpenDetails}
                            onToggleLike={handleToggleLikeDiscussion}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Sidebar Widgets */}
                <div className="lg:col-span-4 space-y-6">
                  <ForumSidebarWidgets
                    discussions={discussions}
                    onOpenDetails={handleOpenDetails}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ask New Question Modal */}
      <CreateDiscussionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        courses={enrolledCourses.length > 0 ? enrolledCourses : coursesFilterList}
        onCreateDiscussion={handleCreateDiscussion}
      />
    </motion.div>
  );
};
