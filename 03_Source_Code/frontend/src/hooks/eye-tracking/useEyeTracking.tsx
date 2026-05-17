"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export enum FocusStatus {
  focus = 'focus',
  turning = 'turning',
  glance = 'glance',
  not_detected = 'not_detected',
}

export interface EyeTrackingData {
  x: number;
  y: number;
  looking: boolean;
  confidence: number;
}

export interface GazeEvent {
  type: 'distraction' | 'regression' | 'saccade' | 'fixation';
  timestamp: number;
  duration?: number;
  details?: Record<string, unknown>;
}

interface UseEyeTrackingProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  readingAreaRef?: React.RefObject<HTMLDivElement>;
  onDistraction?: (type: 'turning' | 'glancing') => void;
  onGazeEvent?: (event: GazeEvent) => void;
  isActive?: boolean;
}

export function useEyeTracking({
  videoRef,
  readingAreaRef,
  onDistraction,
  onGazeEvent,
  isActive = false
}: UseEyeTrackingProps) {
  const [status, setStatus] = useState<FocusStatus>(FocusStatus.not_detected);
  const [eyeData, setEyeData] = useState<EyeTrackingData>({ x: 0, y: 0, looking: false, confidence: 0 });
  const [gazeHistory, setGazeHistory] = useState<Array<{ x: number; y: number; t: number }>>([]);

  const animationFrameRef = useRef<number | null>(null);
  const lastGazeEventRef = useRef<number>(0);
  const fixationStartRef = useRef<number | null>(null);
  const lastGazePositionRef = useRef<{ x: number; y: number } | null>(null);

  const detectEyeMovement = useCallback(() => {
    if (!videoRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectEyeMovement);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const sampleSize = 60;

      let centerBrightness = 0;
      let samples = 0;
      let darkestX = centerX;
      let darkestY = centerY;
      let minBrightness = 255;

      for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
        for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
          const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          if (i >= 0 && i < data.length - 3) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            centerBrightness += brightness;
            samples++;
            
            if (brightness < minBrightness) {
              minBrightness = brightness;
              darkestX = x;
              darkestY = y;
            }
          }
        }
      }

      centerBrightness /= samples;
      const isFaceDetected = centerBrightness > 40 && centerBrightness < 200;
      const confidence = isFaceDetected ? Math.max(0, Math.min(1, (200 - centerBrightness) / 160)) : 0;

      const estimatedX = darkestX + (Math.random() - 0.5) * 20;
      const estimatedY = darkestY + (Math.random() - 0.5) * 20;

      const newEyeData: EyeTrackingData = {
        x: estimatedX,
        y: estimatedY,
        looking: isFaceDetected,
        confidence
      };

      setEyeData(newEyeData);

      const now = Date.now();
      const newGazePoint = { x: estimatedX, y: estimatedY, t: now };

      setGazeHistory(prev => {
        const updated = [...prev, newGazePoint];
        return updated.slice(-50);
      });

      if (!isFaceDetected) {
        setStatus(FocusStatus.not_detected);
        return;
      }

      let newStatus = FocusStatus.focus;
      const centerDistance = Math.sqrt((estimatedX - centerX) ** 2 + (estimatedY - centerY) ** 2);

      if (centerDistance > 150) {
        newStatus = FocusStatus.turning;
      }

      if (readingAreaRef?.current) {
        const readingRect = readingAreaRef.current.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();
        
        const relativeX = (estimatedX / canvas.width) * videoRect.width;
        const relativeY = (estimatedY / canvas.height) * videoRect.height;
        
        const screenX = videoRect.left + relativeX;
        const screenY = videoRect.top + relativeY;
        
        const isInReadingArea = 
          screenX >= readingRect.left && 
          screenX <= readingRect.right && 
          screenY >= readingRect.top && 
          screenY <= readingRect.bottom;

        if (!isInReadingArea && newStatus === FocusStatus.focus) {
          newStatus = FocusStatus.glance;
        }
      }

      const prevStatus = status;
      setStatus(newStatus);

      if ((newStatus === FocusStatus.turning || newStatus === FocusStatus.glance) && 
          prevStatus === FocusStatus.focus && 
          now - lastGazeEventRef.current > 1000) {
        
        lastGazeEventRef.current = now;
        const distractionType = newStatus === FocusStatus.turning ? 'turning' : 'glancing';
        
        onDistraction?.(distractionType);
        onGazeEvent?.({
          type: 'distraction',
          timestamp: now,
          details: { type: distractionType }
        });
      }

      if (lastGazePositionRef.current) {
        const distance = Math.sqrt(
          (estimatedX - lastGazePositionRef.current.x) ** 2 + 
          (estimatedY - lastGazePositionRef.current.y) ** 2
        );

        if (distance < 30) {
          if (!fixationStartRef.current) {
            fixationStartRef.current = now;
          } else if (now - fixationStartRef.current > 300) {
            onGazeEvent?.({
              type: 'fixation',
              timestamp: now,
              duration: now - fixationStartRef.current,
              details: { x: estimatedX, y: estimatedY }
            });
            fixationStartRef.current = null;
          }
        } else {
          if (distance > 100) {
            onGazeEvent?.({
              type: 'saccade',
              timestamp: now,
              details: { distance, speed: distance / 16.67 }
            });
          }
          fixationStartRef.current = null;
        }
      }

      lastGazePositionRef.current = { x: estimatedX, y: estimatedY };

    } catch (error) {
      console.error('Error in eye tracking:', error);
    }

    animationFrameRef.current = requestAnimationFrame(detectEyeMovement);
  }, [videoRef, readingAreaRef, onDistraction, onGazeEvent, isActive, status]);

  useEffect(() => {
    if (isActive) {
      detectEyeMovement();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detectEyeMovement, isActive]);

  const startTracking = useCallback(() => {
    if (!animationFrameRef.current) {
      detectEyeMovement();
    }
  }, [detectEyeMovement]);

  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resetTracking = useCallback(() => {
    setGazeHistory([]);
    setStatus(FocusStatus.not_detected);
    setEyeData({ x: 0, y: 0, looking: false, confidence: 0 });
    lastGazeEventRef.current = 0;
    fixationStartRef.current = null;
    lastGazePositionRef.current = null;
  }, []);

  return {
    status,
    eyeData,
    gazeHistory,
    startTracking,
    stopTracking,
    resetTracking
  };
}