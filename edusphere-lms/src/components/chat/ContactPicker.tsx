import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiMessageCircle, FiUser } from 'react-icons/fi';
import { chatService } from '../../services/chatService';
import type { ChatContactItem, ChatConversation } from '../../types';

interface ContactPickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the resolved conversation to open */
  onConversationReady: (conv: ChatConversation) => void;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  isOpen,
  onClose,
  onConversationReady,
}) => {
  const [contacts, setContacts] = useState<ChatContactItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setError(null);
    setLoading(true);
    chatService
      .getEligibleContacts()
      .then(setContacts)
      .catch(() => setError('Could not load contacts.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.courseTitle ?? '').toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q)
    );
  });

  const handleSelect = async (contact: ChatContactItem) => {
    setOpening(contact.id);
    setError(null);
    try {
      // If conversation already exists, open it directly
      if (contact.existingConversationId) {
        const conversations = await chatService.getConversations();
        const found = conversations.find(
          (c) => c.id === contact.existingConversationId
        );
        if (found) {
          onConversationReady(found);
          onClose();
          return;
        }
      }

      // Otherwise create/get via API
      const dto: import('../../services/chatService').CreateConversationDto = {
        recipientId: contact.id,
        courseId: contact.courseId,
        type: contact.role === 'admin' || contact.role === 'instructor'
          ? 'admin_instructor'
          : 'student_instructor',
      };

      // Determine correct type based on roles
      if (contact.role === 'instructor' || contact.role === 'student') {
        dto.type = 'student_instructor';
      }
      if (contact.role === 'admin') {
        dto.type = 'admin_instructor';
      }

      const conv = await chatService.getOrCreateConversation(dto);
      onConversationReady(conv);
      onClose();
    } catch {
      setError('Could not open conversation. Please try again.');
    } finally {
      setOpening(null);
    }
  };

  const roleColor = (role: string) => {
    if (role === 'admin') return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
    if (role === 'instructor') return 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FiMessageCircle className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              New Conversation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or course…"
              autoFocus
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 border border-transparent focus:outline-none focus:border-brand-400 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <p className="text-center text-xs text-red-500 py-4">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <FiUser className="w-8 h-8 text-slate-300" />
              <p className="text-xs text-slate-400">
                {search
                  ? 'No contacts match your search.'
                  : 'No eligible contacts available.'}
              </p>
            </div>
          )}

          {!loading &&
            filtered.map((contact, idx) => (
              <button
                key={`${contact.id}-${contact.courseId ?? idx}`}
                onClick={() => handleSelect(contact)}
                disabled={opening !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left disabled:opacity-60"
              >
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {contact.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${roleColor(
                        contact.role
                      )}`}
                    >
                      {contact.role}
                    </span>
                  </div>
                  {contact.courseTitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {contact.courseTitle}
                    </p>
                  )}
                  {contact.existingConversationId && (
                    <p className="text-[10px] text-brand-500 dark:text-brand-400 font-medium">
                      Existing conversation
                    </p>
                  )}
                </div>
                {opening === contact.id && (
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
