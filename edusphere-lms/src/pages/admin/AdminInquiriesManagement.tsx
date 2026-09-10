import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiMail,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSend,
  FiMessageSquare,
  FiTrash2,
  FiExternalLink,
  FiUser,
  FiPhone,
  FiTag,
  FiCalendar,
  FiFilter
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { contactService, type ContactInquiryItem } from '../../services/contactService';
import { showSuccessToast, showErrorAlert, showConfirmAlert } from '../../utils/swalAlerts';

export const AdminInquiriesManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<'new' | 'in_progress' | 'resolved' | 'closed'>('new');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch Inquiries
  const { data: inquiriesData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-contact-inquiries', statusFilter, categoryFilter, searchQuery],
    queryFn: async () => {
      const res = await contactService.getInquiries({
        status: statusFilter,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      return res.data || [];
    },
    staleTime: 15 * 1000,
  });

  const inquiries = inquiriesData || [];

  // Metrics
  const totalCount = inquiries.length;
  const newCount = useMemo(() => inquiries.filter((i) => i.status === 'new').length, [inquiries]);
  const inProgressCount = useMemo(() => inquiries.filter((i) => i.status === 'in_progress').length, [inquiries]);
  const resolvedCount = useMemo(() => inquiries.filter((i) => i.status === 'resolved' || i.status === 'closed').length, [inquiries]);

  // Status update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'new' | 'in_progress' | 'resolved' | 'closed'; notes?: string }) => {
      return contactService.updateInquiryStatus(id, { status, adminNotes: notes });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sidebar-stats'] });
      showSuccessToast('Inquiry status updated successfully.');
      if (res.data) {
        setSelectedInquiry(res.data);
      }
    },
    onError: (err: any) => {
      showErrorAlert('Update Failed', err?.message || 'Could not update inquiry status.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return contactService.deleteInquiry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-inquiries'] });
      showSuccessToast('Inquiry deleted successfully.');
      setIsModalOpen(false);
      setSelectedInquiry(null);
    },
    onError: (err: any) => {
      showErrorAlert('Delete Failed', err?.message || 'Could not delete inquiry.');
    },
  });

  const handleOpenDetails = (inquiry: ContactInquiryItem) => {
    setSelectedInquiry(inquiry);
    setEditStatus(inquiry.status);
    setAdminNotes(inquiry.adminNotes || '');
    setIsModalOpen(true);

    // Auto mark as in_progress if currently 'new'
    if (inquiry.status === 'new') {
      updateMutation.mutate({ id: inquiry.id, status: 'in_progress', notes: inquiry.adminNotes });
    }
  };

  const handleSaveNotesAndStatus = () => {
    if (!selectedInquiry) return;
    updateMutation.mutate({
      id: selectedInquiry.id,
      status: editStatus,
      notes: adminNotes,
    });
  };

  const handleReplyByEmail = (inquiry: ContactInquiryItem) => {
    const subject = encodeURIComponent(`Re: [EduSphere Support] ${inquiry.subject || inquiry.category + ' Inquiry'}`);
    const body = encodeURIComponent(
      `Hi ${inquiry.name},\n\nThank you for reaching out to EduSphere Support regarding your inquiry about ${inquiry.category}.\n\n` +
      `Original Inquiry:\n"${inquiry.message}"\n\n--\nBest regards,\nEduSphere Administration Team\nsupport@edusphere.com`
    );
    window.open(`mailto:${inquiry.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDelete = (inquiry: ContactInquiryItem) => {
    showConfirmAlert({
      title: 'Delete Inquiry?',
      text: `Are you sure you want to delete the message from ${inquiry.name}? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      onConfirm: () => {
        deleteMutation.mutate(inquiry.id);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="danger" className="animate-pulse">New Inquiry</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'closed':
        return <Badge variant="neutral">Closed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FiMail className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            Support Inquiries & Messages
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, triage, and respond to incoming contact messages and help requests.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          <FiRefreshCw className={`w-4 h-4 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
            <FiMail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Messages</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{totalCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-rose-500 font-semibold uppercase">New / Unhandled</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{newCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-amber-500 font-semibold uppercase">In Progress</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{inProgressCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-emerald-500 font-semibold uppercase">Resolved</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FiFilter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            {(['all', 'new', 'in_progress', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st === 'all' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 ml-2"
            >
              <option value="all">All Categories</option>
              <option value="General">General Inquiry</option>
              <option value="Courses">Course Support</option>
              <option value="Technical">Technical Issue</option>
              <option value="Billing">Billing & Invoices</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Inquiries List Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <SkeletonLoader className="h-12 w-full" />
            <SkeletonLoader className="h-12 w-full" />
            <SkeletonLoader className="h-12 w-full" />
          </div>
        ) : inquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3.5 px-4">Sender & Contact</th>
                  <th className="py-3.5 px-4">Category & Subject</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(inquiry)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{inquiry.name}</div>
                      <div className="text-slate-400">{inquiry.email}</div>
                      {inquiry.phone && <div className="text-[10px] text-slate-400">{inquiry.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="primary" size="sm">{inquiry.category}</Badge>
                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                        {inquiry.subject || 'Direct Inquiry'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {inquiry.message}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(inquiry.status)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(inquiry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReplyByEmail(inquiry)}
                          title="Reply via Email"
                        >
                          <FiSend className="w-3.5 h-3.5 text-brand-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetails(inquiry)}
                          title="View Details"
                        >
                          <FiExternalLink className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:text-rose-600 hover:border-rose-300"
                          onClick={() => handleDelete(inquiry)}
                          title="Delete"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              type="data"
              title="No Inquiries Found"
              description="There are currently no support messages matching your filters."
              actionLabel="Clear Filters"
              onAction={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
            />
          </div>
        )}
      </Card>

      {/* Inquiry Detail & Response Modal */}
      {selectedInquiry && (
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Inquiry Details & Response Triage"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Sender Details Header */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <FiUser className="w-3.5 h-3.5" /> Sender Name
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedInquiry.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <FiMail className="w-3.5 h-3.5" /> Email Address
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedInquiry.email}</p>
              </div>

              {selectedInquiry.phone && (
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <FiPhone className="w-3.5 h-3.5" /> Phone Number
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedInquiry.phone}</p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <FiCalendar className="w-3.5 h-3.5" /> Date Submitted
                </span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Subject & Category */}
            <div className="flex items-center gap-2">
              <Badge variant="primary">{selectedInquiry.category}</Badge>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {selectedInquiry.subject || 'Support Inquiry'}
              </h3>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Message Content</label>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Direct Action Response Buttons */}
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-3">
              <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Direct Response Channels
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => handleReplyByEmail(selectedInquiry)}
                >
                  <FiSend className="w-4 h-4 mr-1.5" /> 1-Click Email Reply
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('/admin/chat');
                  }}
                >
                  <FiMessageSquare className="w-4 h-4 mr-1.5" /> Open In-App Chat
                </Button>
              </div>
            </div>

            {/* Status & Internal Notes Triage */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Update Ticket Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 font-semibold"
                  >
                    <option value="new">New Inquiry</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed / Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Staff Internal Notes (Private)
                </label>
                <textarea
                  rows={3}
                  placeholder="Record internal resolution notes, action items, or followup instructions..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={handleSaveNotesAndStatus}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};
