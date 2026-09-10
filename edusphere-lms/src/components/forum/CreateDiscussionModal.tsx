import React, { useState, useEffect } from 'react';
import {
  FiBold,
  FiItalic,
  FiCode,
  FiPaperclip,
  FiSend,
  FiFileText,
  FiTrash2,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { forumCategories } from '../../data/forumData';
import type { StudentForumDiscussion } from '../../types';

export interface CourseOption {
  id: string;
  title: string;
}

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: (CourseOption | string)[];
  onCreateDiscussion: (discussion: {
    courseId: string;
    courseTitle: string;
    category: StudentForumDiscussion['category'];
    title: string;
    content: string;
    attachments?: Array<{ name: string; size: string; type: any; url: string }>;
  }) => Promise<void> | void;
}

export const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({
  isOpen,
  onClose,
  courses,
  onCreateDiscussion,
}) => {
  const [title, setTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [category, setCategory] = useState<StudentForumDiscussion['category']>('General Discussion');
  const [content, setContent] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<{ name: string; size: string; type: any; url: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize courses list into { id, title } array
  const normalizedCourses: CourseOption[] = React.useMemo(() => {
    return courses.map((c) => {
      if (typeof c === 'string') {
        return { id: c, title: c };
      }
      return c;
    });
  }, [courses]);

  useEffect(() => {
    if (normalizedCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(normalizedCourses[0].id);
    }
  }, [normalizedCourses, selectedCourseId]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType: any = 'other';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type === 'application/pdf') fileType = 'pdf';
    else if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) fileType = 'zip';
    else if (/\.(ts|tsx|js|jsx|py|java|cpp|c|cs|html|css|json|sql)$/i.test(file.name)) fileType = 'code';
    else if (/\.(doc|docx|txt|md)$/i.test(file.name)) fileType = 'doc';

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    setSelectedAttachment({
      name: file.name,
      size: formattedSize,
      type: fileType,
      url: URL.createObjectURL(file),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedCourseId) return;

    const chosenCourse = normalizedCourses.find((c) => c.id === selectedCourseId) || normalizedCourses[0];

    setIsSubmitting(true);
    try {
      await onCreateDiscussion({
        courseId: chosenCourse.id,
        courseTitle: chosenCourse.title,
        category,
        title: title.trim(),
        content: content.trim(),
        attachments: selectedAttachment ? [selectedAttachment] : [],
      });

      // Reset & close
      setTitle('');
      setContent('');
      setSelectedAttachment(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Ask New Community Question">
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
        {/* Title Field */}
        <div className="space-y-1">
          <label className="font-bold text-slate-900 dark:text-slate-100 block">
            Discussion Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How do I optimize custom hook re-renders in React 19?"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Course & Category Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-900 dark:text-slate-100 block">
              Related Course <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {normalizedCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-900 dark:text-slate-100 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as StudentForumDiscussion['category'])}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {forumCategories
                .filter((cat) => cat !== 'All Categories')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Question Details */}
        <div className="space-y-1">
          <label className="font-bold text-slate-900 dark:text-slate-100 block">
            Question Details <span className="text-red-500">*</span>
          </label>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
            {/* Toolbar */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 bg-white dark:bg-slate-900">
              <button
                type="button"
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Bold"
              >
                <FiBold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Italic"
              >
                <FiItalic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Code Block"
              >
                <FiCode className="w-3.5 h-3.5" />
              </button>
              <span className="text-slate-300 dark:text-slate-700 font-mono">|</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-brand-600 dark:text-brand-400 hover:bg-brand-50 rounded"
              >
                <FiPaperclip className="w-3.5 h-3.5" />
                <span>Attach File</span>
              </button>
            </div>

            {/* Textarea */}
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your issue or topic in detail. Include any code snippets or error tracebacks..."
              className="w-full h-32 p-3 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Attachment preview box if added */}
        {selectedAttachment && (
          <div className="p-3 bg-brand-50/80 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-brand-600" />
              <span>{selectedAttachment.name} ({selectedAttachment.size})</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAttachment(null)}
              className="text-slate-400 hover:text-red-500"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={!title.trim() || !content.trim() || isSubmitting}
            className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5"
          >
            <FiSend className="w-4 h-4" />
            <span>{isSubmitting ? 'Posting...' : 'Post Discussion'}</span>
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
