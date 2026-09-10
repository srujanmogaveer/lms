import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiInfo } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Announcement } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  bodyClassName?: string;
  className?: string;
}

export const BaseModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  maxHeight = 'max-h-[75vh]',
  bodyClassName = 'p-6',
  className = '',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className={`${bodyClassName} ${maxHeight} overflow-y-auto`}>{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface AnnouncementModalProps {
  announcement: Announcement | null;
  onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onClose }) => {
  if (!announcement) return null;

  return (
    <BaseModal isOpen={!!announcement} onClose={onClose} title="Course Announcement">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <img
              src={announcement.authorAvatar}
              alt={announcement.authorName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{announcement.authorName}</h4>
              <span className="text-xs text-slate-400">{announcement.authorRole} • {announcement.date}</span>
            </div>
          </div>
          {announcement.isImportant && <Badge variant="danger">Important Notice</Badge>}
        </div>

        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-snug">{announcement.title}</h3>

        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          {announcement.content}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Got it, thanks!
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

interface ActionNoticeModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ActionNoticeModal: React.FC<ActionNoticeModalProps> = ({ title, message, isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 text-center py-2">
        <div className="w-14 h-14 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-full flex items-center justify-center mx-auto">
          <FiInfo className="w-7 h-7" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="pt-2">
          <Button variant="primary" size="md" className="w-full justify-center" onClick={onClose}>
            Continue Dashboard Browsing
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
