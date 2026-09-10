import React, { useState } from 'react';
import {
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiClock,
  FiCheck,
  FiX,
  FiMessageSquare,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import type { PlayerPersonalNote } from '../../types';

interface PersonalNotesPanelProps {
  notes: PlayerPersonalNote[];
  activeLessonTitle: string;
  activeLessonId: string;
  onAddNote: (note: Omit<PlayerPersonalNote, 'id' | 'createdAt'>) => void;
  onEditNote: (id: string, newContent: string) => void;
  onDeleteNote: (id: string) => void;
}

export const PersonalNotesPanel: React.FC<PersonalNotesPanelProps> = ({
  notes,
  activeLessonTitle,
  activeLessonId,
  onAddNote,
  onEditNote,
  onDeleteNote,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTimestamp, setNewTimestamp] = useState('02:15');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleSaveAdd = () => {
    if (!newContent.trim()) return;
    onAddNote({
      lessonId: activeLessonId,
      lessonTitle: activeLessonTitle,
      timestamp: newTimestamp,
      content: newContent.trim(),
    });
    setNewContent('');
    setIsAdding(false);
  };

  const handleStartEdit = (note: PlayerPersonalNote) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingContent.trim()) return;
    onEditNote(id, editingContent.trim());
    setEditingId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
          <FiEdit3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Personal Notes</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
            {notes.length}
          </span>
        </h3>

        {!isAdding && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="p-4 bg-brand-50/50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-brand-700 dark:text-brand-300">
            <span>Adding Note for: "{activeLessonTitle}"</span>
            <div className="flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              <input
                type="text"
                value={newTimestamp}
                onChange={(e) => setNewTimestamp(e.target.value)}
                className="w-14 px-1.5 py-0.5 text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              />
            </div>
          </div>

          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Type your personal lesson note or code reminder here..."
            className="w-full h-20 p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="flex justify-end gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-1"
            >
              <FiX className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAdd}
              className="flex items-center gap-1"
            >
              <FiCheck className="w-3.5 h-3.5" /> Save Note
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs space-y-1">
            <FiMessageSquare className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700" />
            <p>No personal notes recorded yet.</p>
            <p className="text-[11px] text-slate-400">Click "Add Note" to write down important takeaways.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {note.lessonTitle}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {note.timestamp}
                  </span>
                  <span>{note.createdAt}</span>
                </div>
              </div>

              {editingId === note.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full h-16 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="px-2.5 py-1 bg-brand-600 text-white rounded-lg text-[11px] font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {note.content}
                </p>
              )}

              <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => handleStartEdit(note)}
                  className="text-slate-400 hover:text-brand-600 text-[11px] flex items-center gap-1"
                >
                  <FiEdit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="text-slate-400 hover:text-red-500 text-[11px] flex items-center gap-1"
                >
                  <FiTrash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
