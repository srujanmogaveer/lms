import React, { useState } from 'react';
import {
  FiVideo,
  FiPaperclip,
  FiDownload,
  FiCopy,
  FiCheck,
  FiPlayCircle,
  FiLock,
  FiAlertCircle,
  FiEye,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { StudentLiveClass } from '../../types';

interface LiveClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveClass: StudentLiveClass | null;
  onJoinClass: (liveClass: StudentLiveClass) => void;
}

export const LiveClassDetailsModal: React.FC<LiveClassDetailsModalProps> = ({
  isOpen,
  onClose,
  liveClass,
  onJoinClass,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!liveClass) return null;

  const {
    title,
    description,
    instructorName,
    instructorAvatar,
    courseTitle,
    date,
    time,
    durationMinutes,
    platform,
    meetingId,
    passcode,
    status,
    instructions,
    resources,
    recordingUrl,
    isRecordingAvailable,
  } = liveClass;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Class Session Details"
    >
      <div className="space-y-6 py-2">
        {/* Header Hero Box */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/60 dark:border-slate-700 pb-3">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {courseTitle}
            </span>

            <div className="flex items-center gap-2">
              {status === 'live_now' ? (
                <Badge variant="success" className="bg-emerald-500 text-white animate-pulse">
                  Live Stream Active
                </Badge>
              ) : status === 'completed' ? (
                <Badge variant="neutral">Completed</Badge>
              ) : (
                <Badge variant="primary">Upcoming Session</Badge>
              )}
              <Badge variant="neutral">{platform}</Badge>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {title}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Instructor</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="truncate">{instructorName}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Date</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{date}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Schedule</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{time}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Duration</span>
              <span className="font-bold text-brand-600">{durationMinutes} Mins</span>
            </div>
          </div>
        </div>

        {/* Meeting Room Access Credentials */}
        {status !== 'completed' && (meetingId || passcode) && (
          <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-brand-900 dark:text-brand-300 block">
              Direct Meeting Room Credentials ({platform}):
            </span>

            <div className="flex flex-wrap items-center gap-3">
              {meetingId && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-brand-200 font-mono">
                  <span className="text-slate-400">ID:</span>
                  <strong className="text-slate-900 dark:text-slate-100">{meetingId}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(meetingId, 'id')}
                    className="ml-1 text-brand-600 hover:text-brand-700"
                    title="Copy Meeting ID"
                  >
                    {copiedField === 'id' ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {passcode && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-brand-200 font-mono">
                  <FiLock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-slate-400">Passcode:</span>
                  <strong className="text-slate-900 dark:text-slate-100">{passcode}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(passcode, 'pass')}
                    className="ml-1 text-brand-600 hover:text-brand-700"
                    title="Copy Passcode"
                  >
                    {copiedField === 'pass' ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recording Preview Box if completed */}
        {status === 'completed' && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
              <FiPlayCircle className="w-4 h-4 text-purple-600" />
              <span>Session Video Recording</span>
            </span>

            {isRecordingAvailable && recordingUrl ? (
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                <video
                  controls
                  poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
                  className="w-full h-56 object-cover"
                >
                  <source src={recordingUrl} type="video/mp4" />
                  Your browser does not support HTML5 video playback.
                </video>
              </div>
            ) : (
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Recording Processing In Progress
                </p>
                <p className="text-[11px] text-slate-500">
                  The session recording will be published here automatically within 24 hours of completion.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Content Description */}
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            Class Overview & Agenda
          </span>
          <p className="leading-relaxed">{description}</p>
        </div>

        {/* Instructions */}
        {instructions && (
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <FiAlertCircle className="w-4 h-4 text-amber-600" />
              <span>Session Instructions:</span>
            </div>
            <p className="pl-5 leading-relaxed">{instructions}</p>
          </div>
        )}

        {/* Course Resources */}
        {resources && resources.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Class Materials & Files ({resources.length})
            </span>

            <div className="space-y-2">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiPaperclip className="w-4 h-4 text-brand-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold block text-slate-900 dark:text-slate-100 truncate">
                        {res.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{res.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Previewing ${res.name}`)}
                      className="text-xs flex items-center gap-1 py-1"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => alert(`Downloading ${res.name}`)}
                      className="text-xs flex items-center gap-1 bg-brand-600 text-white py-1"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="md" onClick={onClose} className="text-xs">
            Close Details
          </Button>

          {status !== 'completed' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onJoinClass(liveClass);
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center gap-2 text-xs"
            >
              <FiVideo className="w-4 h-4" />
              <span>
                {platform === 'Jitsi Meet'
                  ? 'Join In-App Class'
                  : platform === 'Google Meet'
                  ? 'Join Google Meet'
                  : platform === 'Microsoft Teams'
                  ? 'Join MS Teams'
                  : platform === 'Zoom'
                  ? 'Join Zoom'
                  : 'Join Class'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
