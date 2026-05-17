import React, { useEffect, useRef, useState, useCallback } from 'react';
import OverlayCanvas from './OverlayCanvas';
import { useFocusDetection, FocusStatus, type DebugInfo, type CalibrationData } from '@/hooks/useFocusDetection';

type Props = {
  readingAreaRef: React.RefObject<HTMLDivElement | null>;
};

export const VideoFeed: React.FC<Props> = ({ readingAreaRef }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [distracted, setDistracted] = useState(false);
  const [distractType, setDistractType] = useState<string | null>(null);
  const [calibrationCountdown, setCalibrationCountdown] = useState(0);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationData | null>(null);
  const lastTriggerRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const CFG = {
    recoveryHold: 3000,
  };

  const playAlert = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as {webkitAudioContext: {new(): AudioContext}}).webkitAudioContext)();
      }
      const ac = audioContextRef.current;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = 720;
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.15);
      o.connect(g);
      g.connect(ac.destination);
      o.start(ac.currentTime);
      o.stop(ac.currentTime + 0.16);
    } catch {}
  }, []);

  const handleDistraction = useCallback((status: FocusStatus) => {
    const now = Date.now();
    if (now - lastTriggerRef.current < CFG.recoveryHold) return;
    lastTriggerRef.current = now;

    const type = status === FocusStatus.turning ? 'menoleh' : status === FocusStatus.glance ? 'melirik' : 'distracted';
    setDistracted(true);
    setDistractType(type);
    playAlert();

    (async () => {
      try {
        await fetch('/api/distract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: FocusStatus[status], type, t: now }),
        });
      } catch {}
    })();

    try { readingAreaRef.current?.classList.add('distracted'); } catch {}

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const body = type === 'menoleh' ? 'Anda menoleh ke samping' : type === 'melirik' ? 'Mata keluar dari area bacaan' : 'Perhatian menurun';
        new Notification('Ayo fokus!', { body, icon: '/icon-focus.webp' });
      } catch {}
    }

    setTimeout(() => {
      setDistracted(false);
      setDistractType(null);
      try { readingAreaRef.current?.classList.remove('distracted'); } catch {}
    }, 2000);
  }, [playAlert, readingAreaRef, CFG.recoveryHold]);

  const { status: focusStatus, debug, startCalibration: hookStartCalibration, calibrationCountdown: hookCalibrationCountdown, isCalibrating } = useFocusDetection({
    videoElementRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasElementRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    onDistraction: handleDistraction,
    onCalibrationComplete: (cal) => {
      setCalibrationResult(cal);
      setCalibrationCountdown(0);
    },
    config: {
      yawThresholdDeg: 18,
      pitchThresholdDeg: 14,
      enableOpenCV: true,
    },
  });

  useEffect(() => {
    setCalibrationCountdown(hookCalibrationCountdown);
  }, [hookCalibrationCountdown]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch {}
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: 640, height: 480 }}>
      <video
        ref={videoRef}
        style={{ width: 640, height: 480, transform: 'scaleX(-1)' }}
        playsInline
        muted
        autoPlay
      />
      <div style={{ position: 'absolute', left: 8, top: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500 }} aria-label="Focus status">
        {focusStatus}
      </div>
      <button
        onClick={() => hookStartCalibration()}
        disabled={isCalibrating}
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          background: isCalibrating ? '#ff9800' : '#4CAF50',
          color: '#fff',
          border: 'none',
          padding: '8px 14px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: isCalibrating ? 'not-allowed' : 'pointer',
          opacity: isCalibrating ? 0.7 : 1,
          transition: 'all 0.3s ease',
        }}
        title="Start 5-second calibration session"
      >
        {isCalibrating ? `🔄 Calibrating ${calibrationCountdown}s` : '📐 Calibrate'}
      </button>
      {calibrationResult && !isCalibrating && (
        <div style={{ position: 'absolute', right: 8, top: 50, background: 'rgba(76, 175, 80, 0.9)', color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, maxWidth: 200 }}>
          ✓ Calibration saved!
          <br />
          <small>H: {calibrationResult.gazeHMin.toFixed(2)}-{calibrationResult.gazeHMax.toFixed(2)}</small>
          <br />
          <small>V: {calibrationResult.gazeVMin.toFixed(2)}-{calibrationResult.gazeVMax.toFixed(2)}</small>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', left: 0, top: 0, width: 640, height: 480, pointerEvents: 'none' }}
      />
      {debug && (
        <DebugOverlay debug={debug} videoWidth={640} videoHeight={480} />
      )}
      {distracted && distractType && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#ff5252', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} role="alert" aria-live="assertive">
          {distractType === 'menoleh' ? '⚠️ Anda menoleh' : distractType === 'melirik' ? '👀 Mata keluar area' : '⚠️ Perhatian menurun'}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        <small>💡 Pastikan wajah terlihat jelas di kamera</small>
      </div>
    </div>
  );
};

const DebugOverlay: React.FC<{ debug: DebugInfo; videoWidth: number; videoHeight: number }> = ({ debug, videoWidth, videoHeight }) => {
  if (!debug) return null;

  const gazeArrow = debug.gazeDirection && debug.leftPupil ? (
    <svg style={{ position: 'absolute', left: 0, top: 0, width: videoWidth, height: videoHeight, pointerEvents: 'none' }} viewBox={`0 0 ${videoWidth} ${videoHeight}`}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#00ff00" />
        </marker>
      </defs>
      <line
        x1={debug.leftPupil.x * videoWidth}
        y1={debug.leftPupil.y * videoHeight}
        x2={(debug.leftPupil.x + debug.gazeDirection.x * 0.15) * videoWidth}
        y2={(debug.leftPupil.y + debug.gazeDirection.y * 0.15) * videoHeight}
        stroke="#00ff00"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    </svg>
  ) : null;

  const gazePointMarker = debug.gazePoint ? (
    <div
      style={{
        position: 'absolute',
        left: debug.gazePoint.x,
        top: debug.gazePoint.y,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'rgba(0,255,0,0.6)',
        border: '2px solid #fff',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
      title="Estimated gaze point"
    />
  ) : null;

  const headPoseInfo = debug.headPose ? (
    <div style={{ position: 'absolute', right: 8, top: 8, background: 'rgba(0,0,0,0.7)', color: '#0f0', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace' }}>
      Yaw: {debug.headPose.yaw.toFixed(1)}° | Pitch: {debug.headPose.pitch.toFixed(1)}°
      {debug.usedSolvePnP && <span style={{ color: '#ff0' }}> [3D]</span>}
    </div>
  ) : null;

  return (
    <>
      {gazeArrow}
      {gazePointMarker}
      {headPoseInfo}
    </>
  );
};