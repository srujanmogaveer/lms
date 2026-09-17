import React from 'react';
import {
  FiVideo,
  FiCalendar,
  FiPlayCircle,
  FiCheckCircle,
  FiPaperclip,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { StudentLiveClass } from '../../types';

interface LiveClassCardProps {
  liveClass: StudentLiveClass;
  onOpenDetails: (liveClass: StudentLiveClass) => void;
  onJoinClass: (liveClass: StudentLiveClass) => void;
  onWatchRecording: (liveClass: StudentLiveClass) => void;
}

export const LiveClassCard: React.FC<LiveClassCardProps> = ({
  liveClass,
  onOpenDetails,
  onJoinClass,
  onWatchRecording,
}) => {
  const {
    title,
    courseTitle,
    instructorName,
    instructorAvatar,
    instructorRole,
    date,
    time,
    durationMinutes,
    platform,
    status,
    description,
    resources,
    isRecordingAvailable,
  } = liveClass;

  const getStatusBadge = () => {
    switch (status) {
      case 'live_now':
      case 'Live':
        return (
          <Badge variant="success" className="flex items-center gap-1.5 bg-emerald-500 text-white font-extrabold shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Live Streaming Now
          </Badge>
        );
      case 'completed':
      case 'Completed':
        return (
          <Badge variant="neutral" className="flex items-center gap-1">
            <FiCheckCircle className="w-3.5 h-3.5" /> Session Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="primary" className="flex items-center gap-1">
            <FiCalendar className="w-3.5 h-3.5" /> Upcoming Session
          </Badge>
        );
    }
  };

  const getPlatformBadge = () => {
    return (
      <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
        In-App Live (LiveKit)
      </span>
    );
  };

  const getJoinButtonLabel = () => {
    if (status === 'live_now' || status === 'Live') return 'Join Live Now';
    return 'Enter Classroom';
  };

  return (
    <Card
      hoverEffect
      className={`flex flex-col justify-between h-full space-y-4 p-5 border transition-all ${
        status === 'live_now' || status === 'Live'
          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800 shadow-md ring-2 ring-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="space-y-3">
        {/* Badges Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {getStatusBadge()}
          {getPlatformBadge()}
        </div>

        {/* Class Title */}
        <h3
          onClick={() => onOpenDetails(liveClass)}
          className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer leading-snug"
        >
          {title}
        </h3>

        {/* Course Title */}
        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 line-clamp-1">
          {courseTitle}
        </p>

        {/* Instructor */}
        <div className="flex items-center gap-2 text-xs">
          <img
            src={instructorAvatar}
            alt={instructorName}
            className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
          />
          <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
            {instructorName} ({instructorRole})
          </span>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Metrics Grid Box */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl grid grid-cols-3 gap-2 text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Date</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px]">{date}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Schedule</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate">{time}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Duration</span>
            <span className="font-bold text-brand-600">{durationMinutes} Mins</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          {resources && resources.length > 0 ? (
            <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold">
              <FiPaperclip className="w-3.5 h-3.5" />
              <span>{resources.length} Class Materials</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">No resources</span>
          )}

          <span className="font-mono text-[11px] text-slate-500">{platform}</span>
        </div>

        <div className={`grid ${status === 'completed' || status === 'Completed' ? (isRecordingAvailable && liveClass.recordingUrl ? 'grid-cols-2' : 'grid-cols-1') : 'grid-cols-2'} gap-2`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDetails(liveClass)}
            className="w-full justify-center text-xs flex items-center gap-1"
          >
            <span>Details</span>
          </Button>

          {status === 'completed' || status === 'Completed' ? (
            isRecordingAvailable && liveClass.recordingUrl ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onWatchRecording(liveClass)}
                className="w-full justify-center text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <FiPlayCircle className="w-3.5 h-3.5" />
                <span>Watch Recording</span>
              </Button>
            ) : null
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onJoinClass(liveClass)}
              className={`w-full justify-center text-xs flex items-center gap-1 text-white ${
                status === 'live_now' || status === 'Live'
                  ? 'bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-600/20'
                  : 'bg-purple-600 hover:bg-purple-700 font-bold shadow-md shadow-purple-600/20'
              }`}
            >
              <FiVideo className="w-3.5 h-3.5" />
              <span>{getJoinButtonLabel()}</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
