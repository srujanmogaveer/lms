import React, { useState, useRef, useCallback } from 'react';
import { FiSend, FiPaperclip, FiSmile, FiX } from 'react-icons/fi';
import { uploadChatAttachment } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';

// Simple emoji set (no external lib required)
const EMOJIS = [
  '😀','😄','😂','🤣','😊','😇','🙂','😉','😍','🥰','😘','😜','🤔','😎','🥳',
  '👍','👏','🙌','🤝','💪','❤️','💯','🔥','✨','🎉','✅','⚡','🚀','👀','🙏',
];

interface ChatAttachmentPreview {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'file';
  localUrl: string;
  file: File;
}

interface ChatComposerProps {
  conversationId: string;
  onSend: (content: string, attachments?: any[]) => Promise<void>;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  conversationId,
  onSend,
  disabled = false,
}) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? 'anon';
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !sending && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setShowEmoji(false);

    try {
      // Upload all pending attachments
      const uploadedAtts: any[] = [];
      for (const att of attachments) {
        try {
          const result = await uploadChatAttachment(userId, conversationId, att.file);
          uploadedAtts.push({
            name: result.name,
            size: result.size,
            type: result.type,
            url: result.url,
            previewUrl: result.previewUrl,
          });
        } catch {
          uploadedAtts.push({
            name: att.name,
            size: att.size,
            type: att.type,
            url: att.localUrl,
            previewUrl: att.type === 'image' ? att.localUrl : undefined,
          });
        }
      }

      await onSend(text.trim(), uploadedAtts.length > 0 ? uploadedAtts : undefined);
      setText('');
      setAttachments([]);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      // Error handled by parent
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const sizeStr =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / 1024 / 1024).toFixed(1)} MB`;

      const preview: ChatAttachmentPreview = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: sizeStr,
        type: isImage ? 'image' : 'file',
        localUrl: isImage ? URL.createObjectURL(file) : '',
        file,
      };
      setAttachments((prev) => [...prev, preview]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.localUrl) URL.revokeObjectURL(att.localUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const autoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 max-w-xs"
            >
              {att.type === 'image' && att.localUrl ? (
                <img
                  src={att.localUrl}
                  alt={att.name}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                  <FiPaperclip className="w-4 h-4 text-amber-600" />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-medium block truncate max-w-[120px]">{att.name}</span>
                <span className="text-[10px] text-slate-400">{att.size}</span>
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="text-slate-400 hover:text-red-500 transition-colors ml-1"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-4 pt-3">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg">
            <div className="grid grid-cols-10 gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => insertEmoji(e)}
                  className="w-7 h-7 text-base flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          disabled={disabled}
          className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-40"
        >
          <FiPaperclip className="w-4.5 h-4.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Emoji */}
        <button
          onClick={() => setShowEmoji((v) => !v)}
          title="Emoji"
          disabled={disabled}
          className={`p-2.5 rounded-xl transition-colors shrink-0 disabled:opacity-40 ${
            showEmoji
              ? 'text-brand-600 bg-brand-50 dark:bg-brand-950'
              : 'text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiSmile className="w-4.5 h-4.5" />
        </button>

        {/* Text */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm rounded-xl px-4 py-2.5 border border-transparent focus:outline-none focus:border-brand-400 dark:focus:border-brand-600 focus:bg-white dark:focus:bg-slate-900 transition-colors disabled:opacity-60"
          style={{ maxHeight: '120px' }}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          title="Send (Enter)"
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-brand-500/20"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiSend className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
