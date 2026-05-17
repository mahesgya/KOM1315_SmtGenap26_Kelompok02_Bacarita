"use client";

import React from 'react';
import { EyeTrackingData, FocusStatus } from '@/hooks/eye-tracking/useEyeTracking';

interface GazeOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  eyeData: EyeTrackingData;
  status: FocusStatus;
  gazeHistory: Array<{ x: number; y: number; t: number }>;
  className?: string;
}

export const GazeOverlay: React.FC<GazeOverlayProps> = ({
  videoRef,
  eyeData,
  status,
  gazeHistory,
  className = ""
}) => {
  if (!videoRef.current || !eyeData.looking) {
    return null;
  }

  const video = videoRef.current;
  const videoRect = video.getBoundingClientRect();
  const videoWidth = video.videoWidth || 640;
  const videoHeight = video.videoHeight || 480;

  const scaleX = videoRect.width / videoWidth;
  const scaleY = videoRect.height / videoHeight;

  const gazeX = eyeData.x * scaleX;
  const gazeY = eyeData.y * scaleY;

  const statusColor = {
    [FocusStatus.focus]: '#4ade80',
    [FocusStatus.turning]: '#f97316', 
    [FocusStatus.glance]: '#eab308',
    [FocusStatus.not_detected]: '#6b7280'
  }[status];

  const recentHistory = gazeHistory.slice(-10);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        width: videoRect.width, 
        height: videoRect.height 
      }}
    >
      {recentHistory.map((point, index) => {
        const pointX = point.x * scaleX;
        const pointY = point.y * scaleY;
        const opacity = (index + 1) / recentHistory.length * 0.3;
        
        return (
          <div
            key={`${point.t}-${index}`}
            className="absolute w-2 h-2 rounded-full bg-blue-400"
            style={{
              left: pointX - 4,
              top: pointY - 4,
              opacity
            }}
          />
        );
      })}

      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg"
        style={{
          left: gazeX - 8,
          top: gazeY - 8,
          backgroundColor: statusColor,
          boxShadow: `0 0 10px ${statusColor}`,
        }}
      />

      <div
        className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold text-white"
        style={{ backgroundColor: statusColor }}
      >
        {status}
      </div>

      <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
        Confidence: {(eyeData.confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
};