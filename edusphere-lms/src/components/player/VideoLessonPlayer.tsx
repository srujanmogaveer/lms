import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import VimeoPlayer from '@vimeo/player';
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiRotateCcw,
  FiRotateCw,
  FiSettings,
  FiCheck,
  FiClock,
  FiInfo,
  FiAlertCircle,
  FiVideoOff,
  FiLoader,
} from 'react-icons/fi';
import type { PlayerLesson } from '../../types';
import { supabase } from '../../lib/supabase';
import { curriculumService } from '../../services/curriculumService';

interface VideoLessonPlayerProps {
  lesson: PlayerLesson;
  onLessonEnded?: () => void;
}

const LESSON_RESOURCES_BUCKET = 'lesson-resources';

type VideoSourceType = 'youtube' | 'vimeo' | 'storage' | 'direct' | 'empty' | 'invalid';

interface ParsedVideoSource {
  type: VideoSourceType;
  videoId?: string;
  embedUrl?: string;
  directUrl?: string;
  storagePath?: string;
}

/**
 * Utility to parse and format YouTube / Vimeo / Storage / Direct video URLs safely
 */
function parseVideoSource(rawUrl?: string): ParsedVideoSource {
  if (!rawUrl || !rawUrl.trim()) {
    return { type: 'empty' };
  }

  const url = rawUrl.trim();

  try {
    // 1. YouTube matchers
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        const pathPart = url.split('youtu.be/')[1];
        videoId = pathPart.split('?')[0].split('/')[0];
      } else if (url.includes('watch?v=')) {
        const vParam = new URL(url).searchParams.get('v');
        videoId = vParam || url.split('watch?v=')[1]?.split('&')[0];
      } else if (url.includes('/embed/')) {
        const pathPart = url.split('/embed/')[1];
        videoId = pathPart.split('?')[0].split('/')[0];
      } else if (url.includes('/shorts/')) {
        const pathPart = url.split('/shorts/')[1];
        videoId = pathPart.split('?')[0].split('/')[0];
      }

      if (videoId && /^[a-zA-Z0-9_-]{6,15}$/.test(videoId)) {
        return {
          type: 'youtube',
          videoId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&controls=0&showinfo=0&iv_load_policy=3&disablekb=1`,
        };
      }
      return { type: 'invalid' };
    }

    // 2. Vimeo matchers
    if (url.includes('vimeo.com')) {
      const match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
      if (match && match[1]) {
        const videoId = match[1];
        return {
          type: 'vimeo',
          videoId,
          embedUrl: `https://player.vimeo.com/video/${videoId}?controls=0&title=0&byline=0&portrait=0&badge=0&autopause=0&transparent=0&dnt=1&color=6366f1`,
        };
      }
    }

    // 3. Direct HTTP/HTTPS Video URLs or Blob/Data URLs
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('blob:') ||
      url.startsWith('data:')
    ) {
      return {
        type: 'direct',
        directUrl: url,
      };
    }

    // 4. Supabase Storage Object Path
    if (url.includes('/') && !url.includes('://')) {
      return {
        type: 'storage',
        storagePath: url,
      };
    }

    return { type: 'invalid' };
  } catch {
    return { type: 'invalid' };
  }
}

// Global script loader for YouTube IFrame API
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve();
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const existing = document.getElementById('youtube-iframe-api-script');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        resolve();
      };
      const check = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }
  return ytApiPromise;
}

export const VideoLessonPlayer: React.FC<VideoLessonPlayerProps> = ({ lesson, onLessonEnded }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('00:00');
  const [durationFormatted, setDurationFormatted] = useState(lesson?.duration || '10:00');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Poster thumbnail for YouTube / Vimeo
  const [posterUrl, setPosterUrl] = useState<string>('');

  // Resolved video URL (for Supabase Storage or Direct URLs)
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [resolutionFailed, setResolutionFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);
  const vimeoContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytContainerId = useMemo(() => `yt-player-${Math.random().toString(36).substring(2, 9)}`, [lesson?.id]);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const source = useMemo(() => parseVideoSource(lesson?.videoUrl), [lesson?.videoUrl]);

  const formatSeconds = useCallback((sec: number) => {
    if (!sec || isNaN(sec) || sec < 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Update poster URL for YouTube and Vimeo
  useEffect(() => {
    if (source.type === 'youtube' && source.videoId) {
      setPosterUrl(`https://img.youtube.com/vi/${source.videoId}/maxresdefault.jpg`);
    } else if (source.type === 'vimeo' && source.videoId) {
      fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${source.videoId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.thumbnail_url) {
            setPosterUrl(data.thumbnail_url);
          }
        })
        .catch(() => {});
    } else {
      setPosterUrl('');
    }
  }, [source]);

  // Initialize YouTube Player via IFrame API
  useEffect(() => {
    if (source.type !== 'youtube' || !source.videoId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    loadYouTubeApi().then(() => {
      if (!isMounted) return;
      try {
        if (ytPlayerRef.current) {
          try {
            ytPlayerRef.current.destroy();
          } catch {}
          ytPlayerRef.current = null;
        }

        ytPlayerRef.current = new (window as any).YT.Player(ytContainerId, {
          videoId: source.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              try {
                const dur = event.target.getDuration();
                if (dur > 0) setDurationFormatted(formatSeconds(dur));
              } catch {}
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                onLessonEnded?.();
              }
            },
            onError: () => {
              if (isMounted) setHasError(true);
            },
          },
        });
      } catch (err) {
        console.error('Failed to instantiate YouTube player:', err);
      }
    });

    return () => {
      isMounted = false;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [source, ytContainerId, formatSeconds, onLessonEnded]);

  // Initialize Vimeo Player via Vimeo SDK
  useEffect(() => {
    if (source.type !== 'vimeo' || !vimeoContainerRef.current || !source.videoId) {
      if (vimeoPlayerRef.current) {
        try {
          vimeoPlayerRef.current.destroy();
        } catch {}
        vimeoPlayerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    try {
      if (vimeoPlayerRef.current) {
        try {
          vimeoPlayerRef.current.destroy();
        } catch {}
        vimeoPlayerRef.current = null;
      }

      const player = new VimeoPlayer(vimeoContainerRef.current, {
        id: parseInt(source.videoId, 10),
        controls: false,
        title: false,
        byline: false,
        portrait: false,
        dnt: true,
        responsive: true,
        autoplay: false,
        transparent: false,
      });

      vimeoPlayerRef.current = player;

      player.getDuration().then((dur) => {
        if (!isMounted) return;
        if (dur > 0) setDurationFormatted(formatSeconds(dur));
      }).catch(() => {});

      player.on('play', () => {
        if (isMounted) setIsPlaying(true);
      });

      player.on('pause', () => {
        if (isMounted) setIsPlaying(false);
      });

      player.on('ended', () => {
        if (isMounted) {
          setIsPlaying(false);
          onLessonEnded?.();
        }
      });

      player.on('timeupdate', (data: { duration: number; percent: number; seconds: number }) => {
        if (!isMounted) return;
        if (data.duration > 0) {
          setProgressPercent((data.seconds / data.duration) * 100);
          setCurrentTimeFormatted(formatSeconds(data.seconds));
          setDurationFormatted(formatSeconds(data.duration));
        }
      });

      player.on('error', () => {
        if (isMounted) setHasError(true);
      });
    } catch (err) {
      console.error('Failed to init Vimeo player:', err);
    }

    return () => {
      isMounted = false;
      if (vimeoPlayerRef.current) {
        try {
          vimeoPlayerRef.current.destroy();
        } catch {}
        vimeoPlayerRef.current = null;
      }
    };
  }, [source, formatSeconds, onLessonEnded]);

  // Polling timer for time and progress update (for YouTube / HTML5)
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (source.type === 'youtube' && ytPlayerRef.current) {
          try {
            const curr = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            if (dur > 0) {
              setProgressPercent((curr / dur) * 100);
              setCurrentTimeFormatted(formatSeconds(curr));
              setDurationFormatted(formatSeconds(dur));
            }
          } catch {}
        } else if (videoRef.current) {
          const curr = videoRef.current.currentTime || 0;
          const dur = videoRef.current.duration || 0;
          if (dur > 0) {
            setProgressPercent((curr / dur) * 100);
            setCurrentTimeFormatted(formatSeconds(curr));
            setDurationFormatted(formatSeconds(dur));
          }
        }
      }, 250);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, source, formatSeconds]);

  // Resolve storage path or direct URL whenever lesson changes
  useEffect(() => {
    setIsPlaying(false);
    setProgressPercent(0);
    setHasError(false);
    setResolutionFailed(false);
    setCurrentTimeFormatted('00:00');
    setDurationFormatted(lesson?.duration || '10:00');
    setResolvedVideoUrl(null);

    if (source.type === 'direct' && source.directUrl) {
      setResolvedVideoUrl(source.directUrl);
    } else if (source.type === 'storage' && source.storagePath) {
      let isMounted = true;
      setIsResolvingUrl(true);

      const rawPath = source.storagePath.trim();
      let cleanPath = rawPath;
      if (cleanPath.startsWith(`${LESSON_RESOURCES_BUCKET}/`)) {
        cleanPath = cleanPath.replace(`${LESSON_RESOURCES_BUCKET}/`, '');
      }

      curriculumService
        .getSignedVideoUrl(cleanPath)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data?.signedUrl) {
            setResolvedVideoUrl(res.data.signedUrl);
            setIsResolvingUrl(false);
          } else {
            const { data } = supabase.storage
              .from(LESSON_RESOURCES_BUCKET)
              .getPublicUrl(cleanPath);

            if (data?.publicUrl) {
              setResolvedVideoUrl(data.publicUrl);
            } else {
              setResolutionFailed(true);
            }
            setIsResolvingUrl(false);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          try {
            const { data } = supabase.storage
              .from(LESSON_RESOURCES_BUCKET)
              .getPublicUrl(cleanPath);

            if (data?.publicUrl) {
              setResolvedVideoUrl(data.publicUrl);
            } else {
              setResolutionFailed(true);
            }
          } catch {
            setResolutionFailed(true);
          }
          setIsResolvingUrl(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setIsResolvingUrl(false);
    }
  }, [lesson?.id, lesson?.videoUrl, source]);

  // Unified Play / Pause
  const handlePlayPause = () => {
    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
        } else {
          ytPlayerRef.current.playVideo();
        }
      } catch {}
      return;
    }

    if (source.type === 'vimeo' && vimeoPlayerRef.current) {
      if (isPlaying) {
        vimeoPlayerRef.current.pause().catch(() => {});
      } else {
        vimeoPlayerRef.current.play().catch(() => {});
      }
      return;
    }

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Unified Volume Toggle
  const handleVolumeToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch {}
      return;
    }

    if (source.type === 'vimeo' && vimeoPlayerRef.current) {
      vimeoPlayerRef.current.setMuted(nextMuted).catch(() => {});
      return;
    }

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  // Unified Speed Selection
  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);

    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(speed);
      } catch {}
      return;
    }

    if (source.type === 'vimeo' && vimeoPlayerRef.current) {
      vimeoPlayerRef.current.setPlaybackRate(speed).catch(() => {});
      return;
    }

    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Unified Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        const dur = ytPlayerRef.current.getDuration() || 0;
        const targetTime = pos * dur;
        ytPlayerRef.current.seekTo(targetTime, true);
        setProgressPercent(pos * 100);
      } catch {}
      return;
    }

    if (source.type === 'vimeo' && vimeoPlayerRef.current) {
      vimeoPlayerRef.current.getDuration().then((dur) => {
        const target = pos * dur;
        vimeoPlayerRef.current?.setCurrentTime(target).catch(() => {});
        setProgressPercent(pos * 100);
      }).catch(() => {});
      return;
    }

    if (videoRef.current) {
      const targetTime = pos * (videoRef.current.duration || 0);
      if (!isNaN(targetTime)) {
        videoRef.current.currentTime = targetTime;
        setProgressPercent(pos * 100);
      }
    }
  };

  // Unified Skip (rewind / fast forward)
  const handleSkip = (seconds: number) => {
    if (source.type === 'youtube' && ytPlayerRef.current) {
      try {
        const curr = ytPlayerRef.current.getCurrentTime() || 0;
        const dur = ytPlayerRef.current.getDuration() || 0;
        const target = Math.max(0, Math.min(dur, curr + seconds));
        ytPlayerRef.current.seekTo(target, true);
      } catch {}
      return;
    }

    if (source.type === 'vimeo' && vimeoPlayerRef.current) {
      Promise.all([
        vimeoPlayerRef.current.getCurrentTime(),
        vimeoPlayerRef.current.getDuration(),
      ]).then(([curr, dur]) => {
        const target = Math.max(0, Math.min(dur || 0, (curr || 0) + seconds));
        vimeoPlayerRef.current?.setCurrentTime(target).catch(() => {});
      }).catch(() => {});
      return;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
      );
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isVideoAvailable =
    (source.type === 'youtube' && source.videoId) ||
    (source.type === 'vimeo' && source.videoId) ||
    ((source.type === 'direct' || source.type === 'storage') && resolvedVideoUrl && !hasError);

  return (
    <div className="space-y-6">
      {/* Video Container Canvas */}
      <div
        ref={containerRef}
        className="relative group w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 flex flex-col justify-between"
      >
        {/* 1. YOUTUBE VIDEO CANVAS WITH API INTEGRATION */}
        {source.type === 'youtube' && source.videoId && (
          <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
            <div id={ytContainerId} className="w-full h-full pointer-events-none scale-105" />

            {/* Poster Image (shown before playback starts) */}
            {!isPlaying && progressPercent === 0 && posterUrl && (
              <img
                src={posterUrl}
                alt={lesson?.title || 'Video Lesson'}
                onError={() => {
                  if (source.videoId && !posterUrl.includes('hqdefault')) {
                    setPosterUrl(`https://img.youtube.com/vi/${source.videoId}/hqdefault.jpg`);
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover z-5"
              />
            )}
          </div>
        )}

        {/* 2. VIMEO CANVAS WITH VIMEO PLAYER SDK */}
        {source.type === 'vimeo' && source.videoId && (
          <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
            <div
              ref={vimeoContainerRef}
              className="w-full h-full pointer-events-none scale-105 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
            />

            {/* Poster Image (shown before playback starts) */}
            {!isPlaying && progressPercent === 0 && posterUrl && (
              <img
                src={posterUrl}
                alt={lesson?.title || 'Video Lesson'}
                className="absolute inset-0 w-full h-full object-cover z-5"
              />
            )}
          </div>
        )}

        {/* 3. DIRECT OR STORAGE RESOLVED HTML5 VIDEO */}
        {(source.type === 'direct' || source.type === 'storage') && resolvedVideoUrl && !hasError && (
          <video
            ref={videoRef}
            key={resolvedVideoUrl}
            src={resolvedVideoUrl}
            preload="metadata"
            crossOrigin="anonymous"
            onEnded={() => {
              setIsPlaying(false);
              onLessonEnded?.();
            }}
            onError={(e) => {
              console.error('HTML5 video error event:', e);
              setHasError(true);
            }}
            onClick={handlePlayPause}
            className="absolute inset-0 w-full h-full object-contain z-0 bg-black cursor-pointer"
            playsInline
          />
        )}

        {/* 4. UNIFIED PURPLE PLAY BUTTON & OVERLAYS (FOR YOUTUBE, VIMEO & HTML5) */}
        {isVideoAvailable && (
          <>
            {/* Dark Overlay Gradient on Hover or Paused */}
            <div
              onClick={handlePlayPause}
              className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40 cursor-pointer transition-opacity duration-300 z-10 ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
              }`}
            />

            {/* Center Unified Purple Circular Play Button */}
            <div
              onClick={handlePlayPause}
              className={`absolute inset-0 z-20 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${
                isPlaying ? 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto' : 'opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-xl shadow-brand-600/40 hover:scale-110 hover:bg-brand-500 transition-all duration-300 backdrop-blur-sm group-hover:ring-8 ring-brand-500/20"
                aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
              >
                {isPlaying ? (
                  <FiPause className="w-8 h-8 sm:w-10 sm:h-10" />
                ) : (
                  <FiPlay className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
                )}
              </button>
            </div>

            {/* Bottom Interactive Playback Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-2 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Progress Timeline Scrubber */}
              <div
                onClick={handleSeek}
                className="relative w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer transition-all"
              >
                <div
                  className="h-full bg-brand-500 rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                </div>
              </div>

              <div className="flex items-center justify-between text-white text-xs pt-1">
                {/* Left Controls */}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="hover:text-brand-400 transition-colors p-1"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(-10)}
                    className="hover:text-brand-400 transition-colors p-1"
                    title="Rewind 10s"
                  >
                    <FiRotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(10)}
                    className="hover:text-brand-400 transition-colors p-1"
                    title="Forward 10s"
                  >
                    <FiRotateCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleVolumeToggle}
                    className="hover:text-brand-400 transition-colors p-1"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <FiVolumeX className="w-4 h-4 text-red-400" /> : <FiVolume2 className="w-4 h-4" />}
                  </button>

                  <span className="font-mono text-[11px] text-white/80">
                    {currentTimeFormatted} / {durationFormatted}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3 relative">
                  {/* Playback Speed dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px]"
                    >
                      <FiSettings className="w-3.5 h-3.5" />
                      <span>{playbackSpeed}x</span>
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute right-0 bottom-8 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-xl text-xs space-y-0.5 z-30 w-24">
                        {speeds.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSpeedSelect(s)}
                            className={`w-full px-2.5 py-1 text-left rounded-lg flex items-center justify-between hover:bg-slate-800 ${
                              playbackSpeed === s ? 'text-brand-400 font-bold' : 'text-slate-300'
                            }`}
                          >
                            <span>{s}x</span>
                            {playbackSpeed === s && <FiCheck className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen button */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="hover:text-brand-400 transition-colors p-1"
                    title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                    aria-label="Toggle Fullscreen"
                  >
                    <FiMaximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 5. RESOLVING STORAGE URL LOADING STATE */}
        {isResolvingUrl && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center z-30 bg-slate-900 space-y-3">
            <FiLoader className="w-8 h-8 text-brand-500 animate-spin" />
            <span className="font-semibold text-slate-300 text-sm">Preparing video stream...</span>
          </div>
        )}

        {/* 6. STORAGE RESOLUTION FAILED */}
        {resolutionFailed && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center z-30 bg-slate-900 space-y-2">
            <FiAlertCircle className="w-10 h-10 text-amber-500 mb-1" />
            <span className="font-bold text-slate-200 text-sm">Unable to load this video.</span>
            <p className="text-slate-400 max-w-sm text-xs">
              The storage asset could not be accessed from the cloud repository.
            </p>
          </div>
        )}

        {/* 7. MISSING VIDEO URL EMPTY STATE */}
        {source.type === 'empty' && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center z-30 bg-slate-900 space-y-2">
            <FiVideoOff className="w-10 h-10 text-slate-500 mb-1" />
            <span className="font-bold text-slate-200 text-sm">Video URL is not available for this lesson.</span>
            <p className="text-slate-400 max-w-sm text-xs">
              The instructor has not attached a video stream for this lesson yet. Please check the PDF Notes or Text Reading tab.
            </p>
          </div>
        )}

        {/* 8. INVALID URL ERROR STATE */}
        {source.type === 'invalid' && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center z-30 bg-slate-900 space-y-2">
            <FiAlertCircle className="w-10 h-10 text-amber-500 mb-1" />
            <span className="font-bold text-slate-200 text-sm">Invalid video URL format.</span>
            <p className="text-slate-400 max-w-sm text-xs font-mono break-all">
              {lesson?.videoUrl || 'Unable to parse stream destination'}
            </p>
          </div>
        )}

        {/* 9. PLAYBACK ERROR ON DIRECT/STORAGE VIDEO */}
        {hasError && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center z-30 bg-slate-900 space-y-2">
            <FiAlertCircle className="w-10 h-10 text-rose-500 mb-1" />
            <span className="font-bold text-slate-200 text-sm">Unable to play this video.</span>
            <p className="text-slate-400 max-w-sm text-xs">
              The video source could not be loaded or the format is not supported by your browser.
            </p>
          </div>
        )}
      </div>

      {/* Lesson Details Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {lesson?.moduleTitle || 'Course Module'}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {lesson?.title || 'Lesson Title'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono shrink-0">
            <FiClock className="w-4 h-4 text-brand-500" />
            <span>Duration: {durationFormatted}</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {lesson?.textContent?.introduction ||
            'In this video lesson, we walk step-by-step through practical implementations and best practice patterns. Follow along using the resources and code starter templates attached in the Resources tab.'}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
          <FiInfo className="w-4 h-4 text-brand-500 shrink-0" />
          <span>
            Tip: Use keyboard shortcuts like Spacebar for Play/Pause and arrow keys to rewind/fast-forward 10 seconds.
          </span>
        </div>
      </div>
    </div>
  );
};
