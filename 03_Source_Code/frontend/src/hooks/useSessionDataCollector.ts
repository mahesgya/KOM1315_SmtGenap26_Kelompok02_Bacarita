import { showToastError } from "@/components/utils/toast.utils";
import { AppDispatch } from "@/redux/store";
import EyeTrackingServices from "@/services/eye.tracking.services";
import { useCallback, useRef } from "react";

export interface DistractionEvent {
  distractionType: string;
  triggerDurationMs: number;
  occurAtWord: string;
}

export interface SessionSummary {
  totalSessionDurationSec: number;
  timeBreakdownFocus: number;
  timeBreakdownTurning: number;
  timeBreakdownGlance: number;
  timeBreakdownNotDetected: number;
  turningTriggersCount: number;
  glanceTriggersCount: number;
  avgPoseVariance: number;
  longFixationCount: number;
}

interface SessionDataState {
  sessionStartTime: Date;
  statusChangeTime: number;
  totalFocusTime: number;
  totalTurningTime: number;
  totalGlanceTime: number;
  totalNotDetectedTime: number;
  turningTriggersCount: number;
  glanceTriggersCount: number;
  notDetectedTriggersCount: number;
  poseHistory: Array<{ yaw: number; pitch: number; timestamp: number }>;
  gazeHistory: Array<{ x: number; y: number; timestamp: number }>;
  fixationStartTime: number;
  fixationThreshold: number;
  fixationDuration: number;
  events: DistractionEvent[];
}

export function useSessionDataCollector() {
  const dataRef = useRef<SessionDataState>({
    sessionStartTime: new Date(),
    statusChangeTime: Date.now(),
    totalFocusTime: 0,
    totalTurningTime: 0,
    totalGlanceTime: 0,
    totalNotDetectedTime: 0,
    turningTriggersCount: 0,
    glanceTriggersCount: 0,
    notDetectedTriggersCount: 0,
    poseHistory: [],
    gazeHistory: [],
    fixationStartTime: Date.now(),
    fixationThreshold: 30,
    fixationDuration: 2000,
    events: [],
  });

  const recordPoseData = useCallback((yaw: number, pitch: number) => {
    const now = Date.now();
    dataRef.current.poseHistory = dataRef.current.poseHistory.filter((item) => now - item.timestamp < 60000);
    dataRef.current.poseHistory.push({ yaw, pitch, timestamp: now });
  }, []);

  const recordGazeData = useCallback((gazeX: number, gazeY: number) => {
    const now = Date.now();
    const lastGaze = dataRef.current.gazeHistory[dataRef.current.gazeHistory.length - 1];

    if (lastGaze) {
      const distance = Math.sqrt(Math.pow(gazeX - lastGaze.x, 2) + Math.pow(gazeY - lastGaze.y, 2));

      if (distance < dataRef.current.fixationThreshold) {
        const fixationDur = now - dataRef.current.fixationStartTime;
        if (fixationDur > dataRef.current.fixationDuration) {
          // Long fixation detected
        }
      } else {
        dataRef.current.fixationStartTime = now;
      }
    }

    dataRef.current.gazeHistory = dataRef.current.gazeHistory.filter((item) => now - item.timestamp < 60000);
    dataRef.current.gazeHistory.push({ x: gazeX, y: gazeY, timestamp: now });
  }, []);

  const recordStatusChange = useCallback((previousStatus: string | null, newStatus: "focus" | "turning" | "glance" | "not_detected") => {
    const now = Date.now();
    const timeSinceLastChange = now - dataRef.current.statusChangeTime;

    if (previousStatus === "focus") {
      dataRef.current.totalFocusTime += timeSinceLastChange;
    } else if (previousStatus === "turning") {
      dataRef.current.totalTurningTime += timeSinceLastChange;
    } else if (previousStatus === "glance") {
      dataRef.current.totalGlanceTime += timeSinceLastChange;
    } else if (previousStatus === "not_detected") {
      dataRef.current.totalNotDetectedTime += timeSinceLastChange;
    }

    dataRef.current.statusChangeTime = now;
  }, []);

  const recordDistractionEvent = async (distractionType: "turning" | "glance" | "not_detected", triggerDurationMs: number, currentWord: string, testSessionId: string, dispatch: AppDispatch) => {
    const event: DistractionEvent = {
      distractionType,
      triggerDurationMs,
      occurAtWord: currentWord,
    };

    dataRef.current.events.push(event);

    if (distractionType === "turning") {
      dataRef.current.turningTriggersCount++;
    } else if (distractionType === "glance") {
      dataRef.current.glanceTriggersCount++;
    } else if (distractionType === "not_detected") {
      dataRef.current.notDetectedTriggersCount++;
    }

    const response = await EyeTrackingServices.PostDistractedEvent(dispatch, testSessionId, event);
    if (response.success === false) {
      showToastError(response.error);
    }
  };

  const generateAndSendSummary = async (testSessionId: string, dispatch: AppDispatch) => {
    const now = new Date();
    const totalSessionDurationSec = (now.getTime() - dataRef.current.sessionStartTime.getTime()) / 1000;
    const avgPoseVariance = calculatePoseVariance(dataRef.current.poseHistory);
    const longFixationCount = calculateLongFixations(dataRef.current.gazeHistory);

    const summary: SessionSummary = {
      totalSessionDurationSec,
      timeBreakdownFocus: dataRef.current.totalFocusTime / 1000,
      timeBreakdownTurning: dataRef.current.totalTurningTime / 1000,
      timeBreakdownGlance: dataRef.current.totalGlanceTime / 1000,
      timeBreakdownNotDetected: dataRef.current.totalNotDetectedTime / 1000,
      turningTriggersCount: dataRef.current.turningTriggersCount,
      glanceTriggersCount: dataRef.current.glanceTriggersCount,
      avgPoseVariance,
      longFixationCount,
    };

    const response = await EyeTrackingServices.PostDistractedEventSummary(dispatch, testSessionId, summary);
    if (response.success === false) {
      showToastError(response.error);
    }

    return summary;
  };

  return {
    recordPoseData,
    recordGazeData,
    recordStatusChange,
    recordDistractionEvent,
    generateAndSendSummary,
    getSessionData: () => dataRef.current,
  };
}

function calculatePoseVariance(poseHistory: Array<{ yaw: number; pitch: number }>): number {
  if (poseHistory.length < 2) return 0;

  const yaws = poseHistory.map((p) => p.yaw);
  const pitches = poseHistory.map((p) => p.pitch);

  const yawVariance = variance(yaws);
  const pitchVariance = variance(pitches);

  return Number(((yawVariance + pitchVariance) / 2).toFixed(2));
}

function variance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
  return squareDiffs.reduce((a, b) => a + b) / values.length;
}

function calculateLongFixations(gazeHistory: Array<{ x: number; y: number; timestamp: number }>, fixationThreshold: number = 30, fixationDuration: number = 2000): number {
  let count = 0;
  let fixationStart = 0;
  let lastX = 0;
  let lastY = 0;

  for (const gaze of gazeHistory) {
    const distance = Math.sqrt(Math.pow(gaze.x - lastX, 2) + Math.pow(gaze.y - lastY, 2));

    if (distance < fixationThreshold) {
      if (fixationStart === 0) {
        fixationStart = gaze.timestamp;
      } else if (gaze.timestamp - fixationStart > fixationDuration) {
        count++;
        fixationStart = gaze.timestamp;
      }
    } else {
      fixationStart = 0;
    }

    lastX = gaze.x;
    lastY = gaze.y;
  }

  return count;
}
