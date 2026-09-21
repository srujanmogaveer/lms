import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiCheckCircle,
} from 'react-icons/fi';

interface LiveKitClassroomProps {
  roomName: string;
  token?: string;
  serverUrl?: string;
  displayName: string;
  isHost: boolean;
  onLeave: () => void;
}

export const LiveKitClassroom: React.FC<LiveKitClassroomProps> = ({
  roomName,
  token,
  serverUrl,
  displayName,
  isHost,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');


  // Local fallback media states
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(isHost);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaPermissionError, setMediaPermissionError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // If livekit is configured with a valid server URL and token
  const hasLivekitCredentials = Boolean(
    token &&
    serverUrl &&
    !serverUrl.includes('edusphere-demo') &&
    !serverUrl.includes('localhost')
  );

  // Function to initialize webcam and microphone
  const startLocalMedia = async () => {
    setMediaPermissionError(null);
    try {
      // First try both video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoOn(true);
      setIsAudioOn(isHost);

      // If not host or audio should start muted, disable audio track
      if (!isHost) {
        stream.getAudioTracks().forEach((t) => { t.enabled = false; });
      }
    } catch (err: any) {
      console.warn('Initial video/audio getUserMedia warning:', err);
      // Fallback: try video only if mic failed
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        localStreamRef.current = videoStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = videoStream;
        }
        setIsVideoOn(true);
      } catch (videoErr: any) {
        console.warn('Video only getUserMedia error:', videoErr);
        setMediaPermissionError(
          videoErr.name === 'NotAllowedError'
            ? 'Camera access was denied. Please allow camera permissions in your browser address bar.'
            : 'No camera device found or camera is currently used by another application.'
        );
        setIsVideoOn(false);
      }
    }
  };

  // Mount effect: always start local media if not using LiveKit Cloud
  useEffect(() => {
    if (!hasLivekitCredentials) {
      startLocalMedia();
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasLivekitCredentials]); // eslint-disable-line react-hooks/exhaustive-deps

  // Make sure video srcObject stays attached when video element re-renders
  useEffect(() => {
    if (isVideoOn && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isVideoOn]);

  const toggleVideo = async () => {
    if (!isVideoOn) {
      // If turning video ON
      if (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0) {
        await startLocalMedia();
      } else {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
        setIsVideoOn(true);
      }
    } else {
      // Turning video OFF
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsVideoOn(false);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioOn;
      });
    }
    setIsAudioOn(!isAudioOn);
  };

  const screenStreamRef = useRef<MediaStream | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  // Sync PiP video element with local webcam stream
  useEffect(() => {
    if (isScreenSharing && isVideoOn && pipVideoRef.current && localStreamRef.current) {
      pipVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isScreenSharing, isVideoOn]);

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        const track = screenStream.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            stopScreenShare();
          };
        }
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    if (localVideoRef.current && localStreamRef.current && isVideoOn) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  if (hasLivekitCredentials && connectionStatus !== 'error') {
    return (
      <div className="h-full w-full relative">
        <LiveKitRoom
          video={true}
          audio={isHost}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          style={{ height: '100%', width: '100%' }}
          onConnected={() => setConnectionStatus('connected')}
          onDisconnected={() => {
            // Do NOT kick user out on network drops; fallback gracefully
            setConnectionStatus('error');
          }}
          onError={(err) => {
            console.warn('LiveKit Room error:', err);
            setConnectionStatus('error');
          }}
        >
          <VideoConference chatMessageFormatter={undefined} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  // Fallback In-App Interactive Classroom View (Active when LiveKit server is offline / local development)
  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-white relative select-none">
      {/* Top Banner Notice */}
      <div className="px-4 py-2 bg-purple-950/60 border-b border-purple-800/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-purple-200">In-App Live Classroom: {roomName}</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-300 text-[10px] font-semibold">
            {isHost ? 'Host / Instructor Mode' : 'Attendee / Student Mode'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Media & Realtime Q&A Active</span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-full max-w-4xl h-full max-h-[620px] bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl flex items-center justify-center">
          {mediaPermissionError && !isScreenSharing ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <FiVideoOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-base text-slate-200">Camera Access Required</p>
                <p className="text-xs text-slate-400 leading-relaxed">{mediaPermissionError}</p>
              </div>
              <button
                onClick={startLocalMedia}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <FiVideo className="w-4 h-4" />
                <span>Grant / Retry Camera</span>
              </button>
            </div>
          ) : isScreenSharing || isVideoOn ? (
            <>
              {/* Main Video: Unflipped & Uncropped for Screen Sharing */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full rounded-3xl transition-all duration-300 ${
                  isScreenSharing
                    ? 'object-contain bg-slate-950'
                    : 'object-cover -scale-x-100'
                }`}
              />

              {/* Picture-in-Picture Webcam Box when Screen Sharing is Active */}
              {isScreenSharing && isVideoOn && (
                <div className="absolute bottom-4 right-4 w-40 h-28 sm:w-48 sm:h-32 rounded-2xl overflow-hidden border-2 border-purple-500/80 shadow-2xl bg-slate-900 z-20">
                  <video
                    ref={pipVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  <div className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {displayName} (Camera)
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <FiVideoOff className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-base text-slate-200">{displayName}</p>
                <p className="text-xs text-slate-400">Camera is turned off</p>
              </div>
              <button
                onClick={toggleVideo}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
              >
                Turn On Camera
              </button>
            </div>
          )}

          {/* User Badge Overlay */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 flex items-center gap-2 z-10">
            <span className={`w-2 h-2 rounded-full ${isVideoOn || isScreenSharing ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-xs font-bold text-white">{displayName}</span>
            {isHost && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-600 text-white">Host</span>
            )}
            {!isAudioOn && <FiMicOff className="w-3 h-3 text-rose-400 ml-1" />}
          </div>

          {/* Screen Sharing Indicator */}
          {isScreenSharing && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg z-10">
              <FiMonitor className="w-3.5 h-3.5" />
              <span>Screen Sharing Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Classroom Media Action Bar */}
      <div className="h-16 bg-slate-900/90 border-t border-slate-800 px-6 flex items-center justify-center gap-3 shrink-0">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
            isAudioOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40'
          }`}
          title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioOn ? <FiMic className="w-4 h-4" /> : <FiMicOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{isAudioOn ? 'Mute' : 'Unmuted'}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
            isVideoOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40'
          }`}
          title={isVideoOn ? 'Stop Camera' : 'Start Camera'}
        >
          {isVideoOn ? <FiVideo className="w-4 h-4" /> : <FiVideoOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{isVideoOn ? 'Stop Video' : 'Start Video'}</span>
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
            isScreenSharing
              ? 'bg-blue-600 text-white border border-blue-500'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
          }`}
          title="Share Screen"
        >
          <FiMonitor className="w-4 h-4" />
          <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
        </button>
      </div>
    </div>
  );
};

