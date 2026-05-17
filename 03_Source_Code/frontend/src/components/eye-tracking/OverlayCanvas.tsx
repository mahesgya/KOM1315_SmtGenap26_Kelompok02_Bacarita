import React, { useEffect, useRef } from 'react';
import drawFacePoints from '@/lib/eye-tracking/drawFacePoints';

type Point = { x: number; y: number };
type DistractState = { distracted: boolean; type: string | null };
type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  readingAreaRef?: React.RefObject<HTMLDivElement | null>;
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  gaze: Point | null;
  fixations: Point[];
  pupil?: { x: number; y: number; r: number } | null;
  headYaw?: number;
  distractState?: DistractState;
  debug?: { avgYaw: number; avgPitch?: number; validCount: number; outRatio: number; pupilR?: number };
  skipGazeDrawing?: boolean;
  flipHorizontally?: boolean;
};

export default function OverlayCanvas({ 
  videoRef, 
  canvasRef: externalCanvasRef,
  readingAreaRef, 
  landmarks,
  gaze, 
  fixations, 
  pupil, 
  headYaw = 0, 
  distractState, 
  debug, 
  skipGazeDrawing = false,
  flipHorizontally = true 
}: Props) {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) { raf = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { raf = requestAnimationFrame(draw); return; }

      const vw = video?.videoWidth ?? 640;
      const vh = video?.videoHeight ?? 480;
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (flipHorizontally) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      if (readingAreaRef && readingAreaRef.current && video) {
        const r = readingAreaRef.current.getBoundingClientRect();
        const v = video.getBoundingClientRect();
        const rx = (r.left - v.left) / v.width;
        const ry = (r.top - v.top) / v.height;
        const rw = r.width / v.width;
        const rh = r.height / v.height;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,255,0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(rx * canvas.width, ry * canvas.height, rw * canvas.width, rh * canvas.height);
        ctx.restore();
      }

      ctx.strokeStyle = 'rgba(0,200,0,0.9)';
      ctx.lineWidth = 2;
      fixations.forEach(f => {
        const cx = f.x * canvas.width;
        const cy = f.y * canvas.height;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();
      });

      if (landmarks && landmarks.length > 0) {
        try {
          drawFacePoints(canvas, landmarks, {
            mirror: flipHorizontally,
            showLabels: false,
            pointRadius: 2,
            color: 'rgba(0,200,255,0.95)',
          });
        } catch (e) {
          console.debug('Error drawing face points:', e);
        }
      }

  if (!skipGazeDrawing) {
        if (pupil) {
          const px = pupil.x * canvas.width;
          const py = pupil.y * canvas.height;
          const pr = Math.max(2, pupil.r * Math.max(canvas.width, canvas.height));
          ctx.fillStyle = 'rgba(255,0,0,0.22)';
          ctx.beginPath();
          ctx.arc(px, py, pr * 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,0,0,0.95)';
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2, pr), 0, Math.PI * 2);
          ctx.fill();
        } else if (gaze) {
          const gx = gaze.x * canvas.width;
          const gy = gaze.y * canvas.height;
          ctx.fillStyle = 'rgba(255,0,0,0.85)';
          ctx.beginPath();
          ctx.arc(gx, gy, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const hy = headYaw ?? 0;
      const hyAbs = Math.abs(hy);
      if (hyAbs > 0.02) {
        ctx.save();
        const cx = 40, cy = 24;
        ctx.translate(cx, cy);
        ctx.rotate(hy * 2);
        ctx.fillStyle = 'rgba(255,165,0,0.95)';
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(0, -12);
        ctx.lineTo(10, -6);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = '12px system-ui, Arial';
        ctx.fillText(`yaw ${hy.toFixed(3)}`, 60, 30);
      }

      const hp = Number((window as unknown as Record<string, unknown>).__debugHeadPitch ?? (distractState && (distractState as Record<string, unknown>).headPitch) ?? 0);
  
      const pitchVal = (headYaw && typeof headYaw === 'number' && false) ? 0 : (distractState && (distractState as Record<string, unknown>).headPitch ? (distractState as Record<string, unknown>).headPitch : 0);
      
      if ((distractState as Record<string, unknown>)?.headPitch !== undefined) {
        const hpv = (distractState as Record<string, unknown>).headPitch as number;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = '12px system-ui, Arial';
        ctx.fillText(`pitch ${hpv.toFixed(3)}`, 60, 46);
      }

      if (debug) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = '12px system-ui, Arial';
        const lines = [
          `yaw ${debug.avgYaw?.toFixed(3) ?? '0'}`,
          `pitch ${debug.avgPitch?.toFixed(3) ?? hp.toFixed(3) ?? '0'}`,
          `valid ${debug.validCount}`,
          `outR ${debug.outRatio?.toFixed(2)}`,
          `pR ${debug.pupilR?.toFixed(4)}`,
        ];
        const px = canvas.width - 140;
        let py = 18;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(px - 6, 2, 140, lines.length * 16 + 8);
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        lines.forEach((ln) => {
          ctx.fillText(ln, px, py);
          py += 16;
        });
        ctx.restore();
      }

      if (distractState?.distracted) {
        ctx.fillStyle = 'rgba(239,68,68,0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (flipHorizontally) {
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, readingAreaRef, landmarks, gaze, fixations, pupil, headYaw, distractState, debug, flipHorizontally]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', left: 0, top: 0, width: 640, height: 480, pointerEvents: 'none' }} />;
}