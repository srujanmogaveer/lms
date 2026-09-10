/**
 * JitsiIframe
 *
 * Embeds a Jitsi Meet room using a plain <iframe> — no JitsiMeetExternalAPI,
 * no external script loading, no JS lifecycle to manage.
 *
 * WHY PLAIN IFRAME:
 * The JitsiMeetExternalAPI approach was causing:
 *   1. React StrictMode double-invoke disposing the active WebRTC session.
 *   2. Config key mismatches (e.g. `prejoinPageEnabled` vs `prejoinConfig.enabled`)
 *      silently failing, causing unexpected Jitsi behavior on connect.
 *   3. Race conditions between script loading and React effect cleanup.
 *
 * A plain <iframe src="https://meet.jit.si/room#config.xxx=yyy"> loads the
 * full Jitsi Meet web app directly. Configuration is passed via URL hash params
 * which are processed internally by Jitsi — no version mismatches possible.
 *
 * React.memo with a stable `src` (frozen at mount time) ensures the iframe
 * is never remounted by parent state changes (Q&A polling, panel toggle, etc.).
 *
 * For the "leave room" flow, Jitsi sends window.postMessage events that we
 * listen to. The EduSphere header "Leave" button always works as a fallback.
 */

import { memo, useEffect, useMemo, useRef } from 'react';

interface JitsiIframeProps {
  roomName: string;
  displayName: string;
  email: string;
  isHost: boolean;
  onLeft: () => void;
}

export const JitsiIframe = memo(function JitsiIframe({
  roomName,
  displayName,
  isHost,
  onLeft,
}: JitsiIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onLeftRef = useRef(onLeft);
  onLeftRef.current = onLeft; // keep ref current without re-running effects

  // Build the Jitsi Meet URL with hash-based config.
  // Config options are processed internally by Jitsi — no External API version
  // mismatches possible. Keep params simple: complex nested values (like arrays)
  // can silently fail to parse in the URL hash.
  const src = useMemo(() => {
    const params: string[] = [
      // ── Pre-join ──────────────────────────────────────────────────────────
      'config.prejoinPageEnabled=false',
      'config.prejoinConfig.enabled=false',

      // ── Audio / Video ─────────────────────────────────────────────────────
      `config.startWithAudioMuted=${!isHost}`,
      'config.startWithVideoMuted=false',

      // ── Connectivity ──────────────────────────────────────────────────────
      // CRITICAL: force TURN relay from the first attempt.
      // Without this, Jitsi tries direct STUN/UDP first. If the local network
      // blocks UDP (common behind NAT/corporate firewalls), ICE fails after
      // ~30 seconds → "You have been disconnected". On Rejoin, Jitsi falls back
      // to TURN/TCP which succeeds. Setting 'relay' skips the failing STUN
      // candidates entirely and goes straight to TURN → stable first connect.
      'config.iceTransportPolicy=relay',

      // Disable P2P — with relay forced, P2P (direct browser-to-browser) is
      // not useful and adds complexity. Always use the Jitsi media bridge.
      'config.p2p.enabled=false',

      // ── UX ────────────────────────────────────────────────────────────────
      'config.disableDeepLinking=true',
      'config.enableWelcomePage=false',
      'config.enableClosePage=false',
      'config.disableInviteFunctions=true',

      // ── Identity ──────────────────────────────────────────────────────────
      `config.defaultLocalDisplayName=${encodeURIComponent(displayName)}`,

      // ── Branding ──────────────────────────────────────────────────────────
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
    ];

    return `https://meet.jit.si/${encodeURIComponent(roomName)}#${params.join('&')}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Frozen at mount — room/user never changes mid-session

  // Listen for Jitsi's postMessage events from inside the iframe.
  // When the user presses the hangup button in Jitsi, navigate back to Live Classes.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only trust messages from meet.jit.si
      if (event.origin !== 'https://meet.jit.si') return;

      // Jitsi sends events as plain objects or JSON strings
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return; }
      }

      // videoConferenceLeft fires when the local user leaves the conference
      if (
        data?.action === 'video-conference-left' ||
        data?.action === 'hang-up' ||
        data?.event === 'video-conference-left'
      ) {
        onLeftRef.current();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Stable: onLeftRef always current

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="EduSphere Live Classroom"
      allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen; picture-in-picture"
      allowFullScreen
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        backgroundColor: '#000',
      }}
    />
  );
});
