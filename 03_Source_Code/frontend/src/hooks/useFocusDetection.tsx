import { useEffect, useRef, useState } from 'react';

let computeCalibrationData: any;
let computeCalibrationDataImproved: any;
let saveCalibration: any;
let loadCalibration: any;
let compensateGazeForHeadPoseLight: any;
let computePupilOffset: any;
let classifyGazeState: any;
let classifyGazeChange: any;
let averageEyeGaze: any;

export type CalibrationData = any;
export type GazeSample = any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gazeMod: any = require('@/lib/eye-tracking/gazeCalibration');
  computeCalibrationData = gazeMod.computeCalibrationData ?? gazeMod.default?.computeCalibrationData;
  computeCalibrationDataImproved = gazeMod.computeCalibrationDataImproved ?? gazeMod.default?.computeCalibrationDataImproved;
  saveCalibration = gazeMod.saveCalibration ?? gazeMod.default?.saveCalibration;
  loadCalibration = gazeMod.loadCalibration ?? gazeMod.default?.loadCalibration;
  compensateGazeForHeadPoseLight = gazeMod.compensateGazeForHeadPoseLight ?? gazeMod.default?.compensateGazeForHeadPoseLight;
  computePupilOffset = gazeMod.computePupilOffset ?? gazeMod.default?.computePupilOffset;
  classifyGazeState = gazeMod.classifyGazeState ?? gazeMod.default?.classifyGazeState;
  classifyGazeChange = gazeMod.classifyGazeChange ?? gazeMod.default?.classifyGazeChange;
  averageEyeGaze = gazeMod.averageEyeGaze ?? gazeMod.default?.averageEyeGaze;
} catch {
  // Module not available or not a module: provide safe no-op fallbacks so code remains runtime-safe.
  computeCalibrationData = computeCalibrationData || (() => null);
  computeCalibrationDataImproved = computeCalibrationDataImproved || (() => null);
  saveCalibration = saveCalibration || (() => {});
  loadCalibration = loadCalibration || (() => null);
  compensateGazeForHeadPoseLight = compensateGazeForHeadPoseLight || (() => null);
  computePupilOffset = computePupilOffset || (() => null);
  classifyGazeState = classifyGazeState || (() => 'focus');
  classifyGazeChange = classifyGazeChange || (() => null);
  averageEyeGaze = averageEyeGaze || (() => null);
}

import { CAMERA_CONFIG, MEDIAPIPE_INDICES, TEMPORAL_CONFIG, THRESHOLDS_DEFAULT } from '@/config/gazeConfig';
import { clamp, computeIrisCentroid } from '@/lib/eye-tracking/gazeMath';

// Use try-catch for optional import
let drawFacePoints: ((canvas: HTMLCanvasElement, landmarks: Array<{ x: number; y: number; z?: number }>, options: Record<string, unknown>) => void) | undefined;
try {
  const drawFacePointsModule = require('@/lib/eye-tracking/drawFacePoints');
  drawFacePoints = drawFacePointsModule.default || drawFacePointsModule;
} catch {
  // drawFacePoints not available, will skip drawing
}

// simplified statuses (lowercase English strings via string-valued enum)
export enum FocusStatus {
  focus = 'focus',
  turning = 'turning',
  glance = 'glance',
  not_detected = 'not_detected',
}

// Interfaces are imported from @/lib/eye-tracking/gazeCalibration

// debug info returned from hook
export interface DebugInfo {
  landmarks?: Array<{ x: number; y: number; z?: number }>; // normalized face landmarks
  leftPupil?: { x: number; y: number }; // normalized pupil center
  rightPupil?: { x: number; y: number };
  gazeDirection?: { x: number; y: number }; // normalized gaze direction vector
  gazePoint?: { x: number; y: number }; // estimated gaze point on screen (px)
  headPose?: { yaw: number; pitch: number; roll?: number }; // degrees
  usedSolvePnP?: boolean; // whether OpenCV solvePnP was used
  rawGaze?: { h: number; v: number }; // before head compensation
  compensatedGaze?: { h: number; v: number }; // after head compensation (or undefined if not computed)
  pupilOffset?: { offsetX: number; offsetY: number }; // pupil relative to face
  classification?: 'turning' | 'glancing' | 'focused'; // high-level classification
  calibrationBounds?: { gazeHMin: number; gazeHMax: number; gazeVMin: number; gazeVMax: number }; // current bounds
}

export interface UseFocusDetectionProps {
  videoElementRef: React.RefObject<HTMLVideoElement>;
  canvasElementRef?: React.RefObject<HTMLCanvasElement>;
  onDistraction?: (status: FocusStatus) => void; // callback when turning/glance detected
  onCalibrationComplete?: (calibration: CalibrationData) => void; // callback when calibration done
  // simple optional configuration
  config?: Partial<{
    yawThresholdDeg: number;
    pitchThresholdDeg: number;
    gazeHMin: number;
    gazeHMax: number;
    gazeVMin: number;
    gazeVMax: number;
    minValidGazeSamples: number;
    poseSmoothWindow: number; // frames
    gazeSmoothWindow: number; // frames
    enableOpenCV: boolean; // try to load opencv.js for better pose estimation
    autoLoadCalibration: boolean; // load from localStorage if available
  }>;
}

export function useFocusDetection({ videoElementRef, canvasElementRef, config, onDistraction, onCalibrationComplete }: UseFocusDetectionProps) {
  const [status, setStatus] = useState<FocusStatus>(FocusStatus.not_detected);
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [readyMessage, setReadyMessage] = useState('Initializing...');

  // refs
  const faceMeshRef = useRef<Record<string, unknown> | null>(null);
  const cameraRef = useRef<Record<string, unknown> | null>(null);
  const cvReadyRef = useRef<boolean>(false);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef<boolean>(false);
  const lastWorkerPoseRef = useRef<Record<string, unknown> | null>(null);
  const lastWorkerPostTsRef = useRef<number>(0);
  const prevStatusRef = useRef<FocusStatus>(FocusStatus.not_detected);
  const _statusDebounceRef = useRef<number>(0); // frames of consecutive new state seen
  
  // calibration refs
  const calibrationRef = useRef<CalibrationData | null>(null);
  const calibrationSamplesRef = useRef<GazeSample[]>([]);
  const calibrationStartRef = useRef<number>(0);
  const calibrationDurationRef = useRef<number>(5000); // ms, default 5s for backward compatibility
  // autotune refs
  const isAutoTuningRef = useRef<boolean>(false);
  const autoTuneSamplesRef = useRef<Array<{ headYaw: number; headPitch: number; pupilMag: number; gazeH?: number; gazeV?: number }>>([]);
  const autoTuneTimerRef = useRef<NodeJS.Timeout | null>(null);

  // simple histories for smoothing
  const poseHistoryRef = useRef<Array<{ yaw: number; pitch: number }>>([]);
  const gazeHistoryRef = useRef<Array<{ h: number; v: number }>>([]);
  // Track timestamp of last frame successfully sent to MediaPipe to avoid flooding
  const _lastFrameSentTsRef = useRef<number>(0);
  // For iris validation: store last valid gaze when current iris is invalid
  const lastValidGazeRef = useRef<{ x: number; y: number } | null>(null);
  // improved debounce/hysteresis
  const lastProposedRef = useRef<FocusStatus | null>(null);
  const proposedCountRef = useRef<number>(0);

  const CFG = {
    yawThresholdDeg: THRESHOLDS_DEFAULT.yaw,
    pitchThresholdDeg: THRESHOLDS_DEFAULT.pitch,
    gazeHMin: THRESHOLDS_DEFAULT.gazeHMin,
    gazeHMax: THRESHOLDS_DEFAULT.gazeHMax,
    gazeVMin: THRESHOLDS_DEFAULT.gazeVMin,
    gazeVMax: THRESHOLDS_DEFAULT.gazeVMax,
    minValidGazeSamples: 3,
    poseSmoothWindow: TEMPORAL_CONFIG.poseSmoothWindow,
    gazeSmoothWindow: TEMPORAL_CONFIG.gazeSmoothWindow,
    enableOpenCV: true,
    autoLoadCalibration: true,
    ...config,
  };

  // MediaPipe indices for iris/eye landmarks (refined model)
  const LEFT_IRIS = MEDIAPIPE_INDICES.LEFT_IRIS;
  const RIGHT_IRIS = MEDIAPIPE_INDICES.RIGHT_IRIS;
  const LEFT_EYE_OUTER = MEDIAPIPE_INDICES.LEFT_EYE_OUTER;
  const LEFT_EYE_INNER = MEDIAPIPE_INDICES.LEFT_EYE_INNER;
  const RIGHT_EYE_OUTER = MEDIAPIPE_INDICES.RIGHT_EYE_OUTER;
  const RIGHT_EYE_INNER = MEDIAPIPE_INDICES.RIGHT_EYE_INNER;
  const LEFT_V_TOP = MEDIAPIPE_INDICES.LEFT_EYE_TOP;
  const LEFT_V_BOTTOM = MEDIAPIPE_INDICES.LEFT_EYE_BOTTOM;
  const RIGHT_V_TOP = MEDIAPIPE_INDICES.RIGHT_EYE_TOP;
  const RIGHT_V_BOTTOM = MEDIAPIPE_INDICES.RIGHT_EYE_BOTTOM;
  const LEFT_EYE_OUTLINE = MEDIAPIPE_INDICES.LEFT_EYE_OUTLINE;
  const RIGHT_EYE_OUTLINE = MEDIAPIPE_INDICES.RIGHT_EYE_OUTLINE;
  const SOLVEPNP_IDX = MEDIAPIPE_INDICES.SOLVEPNP_IDX;
  // 3D model points (in mm, nose tip as origin) for generic face
  const MODEL_POINTS_3D = [
    [0.0, 0.0, 0.0],       // nose tip
    [-30.0, -65.0, -5.0],  // left eye left corner
    [30.0, -65.0, -5.0],   // right eye right corner
    [-20.0, -20.0, -30.0], // left mouth corner
    [20.0, -20.0, -30.0],  // right mouth corner
    [0.0, 50.0, -45.0],    // chin
  ];
  // eye center 3D model points (rough)
  const _LEFT_EYE_CENTER_3D = [-20.0, -65.0, 5.0];
  const _RIGHT_EYE_CENTER_3D = [20.0, -65.0, 5.0];

  // helpers
  const clampVal = (v: number, a = 0, b = 1) => clamp(v, a, b);

  const irisCentroid = (lm: Array<{ x: number; y: number; z?: number }>, idxs: number[]) => {
    const result = computeIrisCentroid(lm, idxs);
    return { x: result.x, y: result.y, r: result.radius };
  };

  /**
   * Compute eye gaze ratio - where the iris is positioned within the eye bounds
   * Returns h (horizontal) and v (vertical) in range [0,1]:
   * - h: 0 = looking left, 0.5 = center, 1 = looking right
   * - v: 0 = looking up, 0.5 = center, 1 = looking down
   * - r: iris radius (for confidence/validation)
   */
  const computeEyeRatio = (lm: Array<{ x: number; y: number; z?: number }>, leftIdx: number, rightIdx: number, vTop: number, vBottom: number, irisIdxs: number[]) => {
    const left = lm[leftIdx], right = lm[rightIdx];
    const top = lm[vTop], bottom = lm[vBottom];
    if (!left || !right || !top || !bottom) return null;
    
    const iris = irisCentroid(lm, irisIdxs);
    if (!iris.x || !iris.y) return null;
    
    // Eye dimensions
    const eyeWidth = Math.max(1e-6, right.x - left.x);
    const eyeHeight = Math.max(1e-6, bottom.y - top.y);
    
    // Eye center (not same as iris center when looking away)
    const eyeCenterX = (left.x + right.x) / 2;
    const eyeCenterY = (top.y + bottom.y) / 2;
    
    // Compute iris offset from eye center (this is the actual gaze direction)
    // Positive = looking right/down, Negative = looking left/up
    const irisOffsetX = iris.x - eyeCenterX;
    const irisOffsetY = iris.y - eyeCenterY;
    
    // Normalize to eye dimensions and map to [0,1] range
    // The iris can move roughly ±30% of eye width when looking to sides
    const maxHorizontalOffset = eyeWidth * 0.35;
    const maxVerticalOffset = eyeHeight * 0.30;
    
    // Calculate normalized position (0.5 = center)
    const rawH = 0.5 + (irisOffsetX / maxHorizontalOffset) * 0.5;
    const rawV = 0.5 + (irisOffsetY / maxVerticalOffset) * 0.5;
    
    // Clamp and validate
    const h = Number.isFinite(rawH) ? clampVal(rawH) : 0.5;
    const v = Number.isFinite(rawV) ? clampVal(rawV) : 0.5;
    const r = Number.isFinite(iris.r) ? iris.r : 0;
    
    return { h, v, r };
  };

  // simplified head-pose proxy using nose vs eye corners and face bbox center
  const estimatePose = (lm: Array<{ x: number; y: number; z?: number }>) => {
    try {
      const nose = lm[1];
      const _leftEye = lm[33];
      const _rightEye = lm[263];
      const xs = lm.map((p: { x: number; y: number; z?: number }) => p.x);
      const ys = lm.map((p: { x: number; y: number; z?: number }) => p.y);
      const faceCenterX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const faceCenterY = (Math.min(...ys) + Math.max(...ys)) / 2;
      const faceW = Math.max(1e-6, Math.max(...xs) - Math.min(...xs));
      const faceH = Math.max(1e-6, Math.max(...ys) - Math.min(...ys));
      const yawProxy = (nose.x - faceCenterX) / faceW; // -0.5..0.5
      const pitchProxy = (nose.y - faceCenterY) / faceH;
      const yaw = yawProxy * 60; // rough degrees
      const pitch = pitchProxy * 40;
      return { yaw, pitch, usedSolvePnP: false };
    } catch (_e) {
      return { yaw: 0, pitch: 0, usedSolvePnP: false };
    }
  };

  // moving-average smoothing utilities
  const pushAndSmoothPose = (v: { yaw: number; pitch: number }) => {
    const h = poseHistoryRef.current;
    h.push(v);
    if (h.length > CFG.poseSmoothWindow) h.shift();
    const avgYaw = h.reduce((s, x) => s + x.yaw, 0) / h.length;
    const avgPitch = h.reduce((s, x) => s + x.pitch, 0) / h.length;
    return { yaw: avgYaw, pitch: avgPitch };
  };

  const pushAndSmoothGaze = (v: { h: number; v: number; r?: number; confidence?: number }): { h: number; v: number; r: number; confidence: number; validCount: number } => {
    const h = gazeHistoryRef.current as Array<{ h: number; v: number; r?: number; confidence?: number }>;
    h.push(v);
    if (h.length > CFG.gazeSmoothWindow) h.shift();
    const avgH = h.reduce((s, x) => s + x.h, 0) / h.length;
    const avgV = h.reduce((s, x) => s + x.v, 0) / h.length;
    const avgR = h.reduce((s, x) => s + (x.r ?? 0), 0) / h.length;
    const avgConfidence = h.reduce((s, x) => s + (x.confidence ?? 1), 0) / h.length;
    return { h: avgH, v: avgV, r: avgR, confidence: avgConfidence, validCount: h.length };
  };  // ===== Calibration Methods =====
  const startCalibration = (durationSec: number = 8) => {
    // Allow caller to specify duration; default to 8s for a more robust calibration
    const durMs = Math.max(2000, Math.round(durationSec * 1000));
    calibrationDurationRef.current = durMs;
    setIsCalibrating(true);
    setCalibrationCountdown(Math.ceil(durMs / 1000));
    calibrationSamplesRef.current = [];
    calibrationStartRef.current = Date.now();
  };

  const stopCalibration = () => {
    const samples = calibrationSamplesRef.current;
    if (samples.length > 0) {
      const newCalibration = computeCalibrationDataImproved(samples, 1.2, 2.5);
      calibrationRef.current = newCalibration;
      saveCalibration(newCalibration);
      onCalibrationComplete?.(newCalibration);
    }
    setIsCalibrating(false);
    calibrationSamplesRef.current = [];
  };

  // Reset/clear saved calibration data (callable from UI)
  const resetCalibration = () => {
    calibrationRef.current = null;
    try {
      localStorage.removeItem('focus_detection_calibration');
    } catch {}
    // also clear samples/state
    calibrationSamplesRef.current = [];
    setCalibrationCountdown(0);
    setIsCalibrating(false);
  };

  // Smooth countdown update during calibration
  useEffect(() => {
    if (!isCalibrating) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - calibrationStartRef.current;
      const targetMs = calibrationDurationRef.current || 5000;
      if (elapsedMs >= targetMs) {
        stopCalibration();
      } else {
        const remainingSecs = Math.ceil((targetMs - elapsedMs) / 1000);
        setCalibrationCountdown(remainingSecs);
      }
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [isCalibrating]);

  // main onResults callback
  const onResults = (results: Record<string, unknown>) => {
    try {
      if (!results || !(results as Record<string, unknown>).multiFaceLandmarks || ((results as Record<string, unknown>).multiFaceLandmarks as Array<unknown>).length === 0) {
        setStatus(FocusStatus.not_detected);
        setDebug(null);
        poseHistoryRef.current = [];
        gazeHistoryRef.current = [];
        if (prevStatusRef.current !== FocusStatus.not_detected) {
          prevStatusRef.current = FocusStatus.not_detected;
          try { onDistraction?.(FocusStatus.not_detected); } catch {}
        }
        return;
      }

      const lm = ((results as Record<string, unknown>).multiFaceLandmarks as Array<Array<{ x: number; y: number; z?: number }>>)[0];
      const videoWidth = videoElementRef.current?.videoWidth || 640;
      const videoHeight = videoElementRef.current?.videoHeight || 480;

      // 1) estimate pose (use solvePnP if available, else fallback)
      const rawPose = estimatePose(lm);
      const pose = pushAndSmoothPose({ yaw: rawPose.yaw, pitch: rawPose.pitch });

      // 2) compute gaze for both eyes (prefer larger iris radius)
      const left = computeEyeRatio(lm, LEFT_EYE_OUTER, LEFT_EYE_INNER, LEFT_V_TOP, LEFT_V_BOTTOM, LEFT_IRIS);
      const right = computeEyeRatio(lm, RIGHT_EYE_OUTER, RIGHT_EYE_INNER, RIGHT_V_TOP, RIGHT_V_BOTTOM, RIGHT_IRIS);
      let gazeSmoothed: { h: number; v: number; validCount: number } | null = null;
      let leftPupilPos: { x: number; y: number } | undefined;
      let rightPupilPos: { x: number; y: number } | undefined;
      let pupilMag = 0; // How far iris has moved from center (key metric for glance detection)

      if (left || right) {
        // pick the eye with larger iris radius when available, else average
        if (left && right) {
          const chosen = left.r >= right.r ? left : right;
          const confidence = Math.min(left.r, right.r) / Math.max(left.r, right.r, 1e-6); // confidence based on iris consistency
          gazeSmoothed = pushAndSmoothGaze({ h: chosen.h, v: chosen.v, r: chosen.r, confidence });
          leftPupilPos = irisCentroid(lm, LEFT_IRIS);
          rightPupilPos = irisCentroid(lm, RIGHT_IRIS);
          
          // Calculate how far the iris has moved from center (0.5, 0.5)
          // This is the key metric for detecting eye glances
          const avgH = (left.h + right.h) / 2;
          const avgV = (left.v + right.v) / 2;
          pupilMag = Math.sqrt(Math.pow(avgH - 0.5, 2) + Math.pow(avgV - 0.5, 2));
        } else if (left) {
          gazeSmoothed = pushAndSmoothGaze({ h: left.h, v: left.v, r: left.r, confidence: 0.8 });
          leftPupilPos = irisCentroid(lm, LEFT_IRIS);
          pupilMag = Math.sqrt(Math.pow(left.h - 0.5, 2) + Math.pow(left.v - 0.5, 2));
        } else if (right) {
          gazeSmoothed = pushAndSmoothGaze({ h: right.h, v: right.v, r: right.r, confidence: 0.8 });
          rightPupilPos = irisCentroid(lm, RIGHT_IRIS);
          pupilMag = Math.sqrt(Math.pow(right.h - 0.5, 2) + Math.pow(right.v - 0.5, 2));
        }
      }

      // 5) draw face landmarks on debug canvas if provided
      if (canvasElementRef?.current && lm && drawFacePoints) {
        try {
          const canvas = canvasElementRef.current;
          const displayW = videoWidth || 640;
          const displayH = videoHeight || 480;
          canvas.style.width = `${displayW}px`;
          canvas.style.height = `${displayH}px`;
          drawFacePoints(canvas, lm, { mirror: true, showLabels: false, pointRadius: 2, color: 'rgba(0,200,255,0.7)' });
        } catch {}
      }

      // ==== Calibration Recording ====
      if (isCalibrating) {
        if (gazeSmoothed && leftPupilPos && rightPupilPos) {
          const sample: GazeSample = {
            h: gazeSmoothed.h,
            v: gazeSmoothed.v,
            headYaw: pose.yaw,
            headPitch: pose.pitch,
            pupilLeftX: leftPupilPos.x,
            pupilLeftY: leftPupilPos.y,
            pupilRightX: rightPupilPos.x,
            pupilRightY: rightPupilPos.y,
          };
          calibrationSamplesRef.current.push(sample);
        }

        const elapsedMs = Date.now() - calibrationStartRef.current;
        const targetMs = calibrationDurationRef.current || 5000;
        if (elapsedMs >= targetMs) {
          stopCalibration();
        } else {
          // Countdown is now handled by useEffect for smoother updates
          setStatus(FocusStatus.not_detected); // show calibrating state
        }
        return;
      }

      // ==== Load calibration on first run (if available) ====
      if (!calibrationRef.current && CFG.autoLoadCalibration) {
        const saved = loadCalibration();
        if (saved) {
          calibrationRef.current = saved;
        }
      }

      // prepare calibration/fallback
      const calib: CalibrationData = calibrationRef.current ?? {
        gazeHMean: 0.5,
        gazeVMean: 0.5,
        gazeHStdDev: 0.08,
        gazeVStdDev: 0.08,
        gazeHMin: CFG.gazeHMin,
        gazeHMax: CFG.gazeHMax,
        gazeVMin: CFG.gazeVMin,
        gazeVMax: CFG.gazeVMax,
        recordedAt: Date.now(),
      };

      // Determine gazeState using multi-tier classifier (takes head yaw+pitch into account)
      let gazeState: 'focus' | 'glance' | 'turning' = 'focus';
      let gazeDist = 0;
      let gazeConfidence = 0;
      
      if (gazeSmoothed) {
        // ensure numeric and valid before use
        const gazeWithExtras = gazeSmoothed as { h: number; v: number; r: number; confidence: number; validCount: number };
        const validH = typeof gazeWithExtras.h === 'number' && Number.isFinite(gazeWithExtras.h);
        const validV = typeof gazeWithExtras.v === 'number' && Number.isFinite(gazeWithExtras.v);

        if (!validH || !validV) {
          // fallback to last valid gaze if available
          if (lastValidGazeRef.current) {
            gazeSmoothed.h = lastValidGazeRef.current.x;
            gazeSmoothed.v = lastValidGazeRef.current.y;
          } else {
            // skip classification this frame
            setStatus(prevStatusRef.current);
            return;
          }
        }

        // compute center and distance (safe)
        const centerH = (calib.gazeHMin + calib.gazeHMax) / 2;
        const centerV = (calib.gazeVMin + calib.gazeVMax) / 2;
        gazeDist = Math.sqrt(
          Math.pow(gazeSmoothed.h - centerH, 2) + 
          Math.pow(gazeSmoothed.v - centerV, 2)
        );
        
        gazeConfidence = gazeWithExtras.confidence ?? 0;

        // store last valid gaze for fallback
        lastValidGazeRef.current = { x: gazeSmoothed.h, y: gazeSmoothed.v };



        gazeState = classifyGazeState(pose.yaw, pose.pitch, gazeSmoothed.h, gazeSmoothed.v, calib, {
          strictTurningThreshold: CFG.yawThresholdDeg,
          softTurningThreshold: Math.max(2, Math.floor(CFG.yawThresholdDeg / 2)),
          gazeOutThreshold: THRESHOLDS_DEFAULT.gazePointDist,
          pupilMag,
          pupilMagThreshold: THRESHOLDS_DEFAULT.pupilMag,
          gazeDist,
          gazeConfidence,
          minConfidence: CAMERA_CONFIG.minDetectionConfidence ?? 0.5,
        });
      } else {
        // if no gaze reading but head rotation large, classify turning
        const headMag = Math.hypot(pose.yaw, pose.pitch);
        if (headMag > CFG.yawThresholdDeg + 5) gazeState = 'turning'; 
      }

      // Update debug info dengan pupil magnitude dan gaze distance
      setDebug({
        landmarks: lm.map((p: { x: number; y: number; z?: number }) => ({ x: p.x, y: p.y, z: p.z })),
        leftPupil: leftPupilPos,
        rightPupil: rightPupilPos,
        gazeDirection: undefined,
        gazePoint: undefined,
        headPose: { yaw: pose.yaw, pitch: pose.pitch, roll: undefined },
        usedSolvePnP: rawPose.usedSolvePnP,
        rawGaze: gazeSmoothed ? { h: gazeSmoothed.h, v: gazeSmoothed.v } : undefined,
        pupilOffset: { offsetX: pupilMag * 10, offsetY: gazeDist * 10 }, // Scale for visibility
        classification: gazeState === 'focus' ? 'focused' : gazeState === 'glance' ? 'glancing' : 'turning',
        calibrationBounds: {
          gazeHMin: calib.gazeHMin,
          gazeHMax: calib.gazeHMax,
          gazeVMin: calib.gazeVMin,
          gazeVMax: calib.gazeVMax,
        },
      });

      // Map to FocusStatus
      let proposedStatus: FocusStatus = FocusStatus.not_detected;
      if (gazeState === 'turning') proposedStatus = FocusStatus.turning;
      else if (gazeState === 'glance') proposedStatus = FocusStatus.glance;
      else proposedStatus = FocusStatus.focus;

      // Improved hysteresis/debounce: require 4 consistent proposed frames to switch
      if (lastProposedRef.current === proposedStatus) {
        proposedCountRef.current += 1;
      } else {
        lastProposedRef.current = proposedStatus;
        proposedCountRef.current = 1;
      }

      if (proposedCountRef.current >= TEMPORAL_CONFIG.confirmFrames && proposedStatus !== prevStatusRef.current) {
        prevStatusRef.current = proposedStatus;
        if (proposedStatus === FocusStatus.turning || proposedStatus === FocusStatus.glance) {
          onDistraction?.(proposedStatus);
        }
        proposedCountRef.current = 0;
      }

      // reflect committed status in hook state
      setStatus(prevStatusRef.current);
    } catch (_err) {
      // on unexpected error, mark as not_detected to be safe
      setStatus(FocusStatus.not_detected);
      setDebug(null);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const _mounted = true;

    (async () => {
      try {
        // ESM imports from npm-installed @mediapipe packages (only method, no fallback)
        let FaceMesh: Record<string, unknown> | null = null;
        let CameraLib: Record<string, unknown> | null = null;

        try {
          const mp = await import('@mediapipe/face_mesh');
          const camMod = await import('@mediapipe/camera_utils');
          FaceMesh = (mp as Record<string, unknown>).FaceMesh as Record<string, unknown> ?? (mp as Record<string, unknown>).FaceMeshSolution as Record<string, unknown> ?? (mp as Record<string, unknown>).default as Record<string, unknown> ?? null;
          CameraLib = (camMod as Record<string, unknown>).Camera as Record<string, unknown> ?? (camMod as Record<string, unknown>).default as Record<string, unknown> ?? camMod as Record<string, unknown>;
        } catch (importError) {
          console.error('Failed to import MediaPipe ESM modules from npm. Ensure @mediapipe/face_mesh and @mediapipe/camera_utils are installed:', importError);
          return;
        }

        if (!FaceMesh || !CameraLib) {
          console.error('MediaPipe ESM imports did not expose expected classes (FaceMesh or Camera)');
          return;
        }

        console.info('✓ Loaded MediaPipe from npm ESM imports');

        // Create FaceMesh with locateFile pointing to local public/mediapipe/face_mesh/ assets
        const fm = new (FaceMesh as unknown as new (options: Record<string, unknown>) => Record<string, unknown>)({
          locateFile: (file: string) => {
            // Serve all assets (wasm, data, js) from public/mediapipe/face_mesh/
            // This directory is populated by copy-mediapipe-assets.js script
            const path = `/mediapipe/face_mesh/${file}`;
            console.debug(`MediaPipe locateFile: ${file} → ${path}`);
            return path;
          },
        }) as Record<string, unknown>;

        (fm as Record<string, (options: Record<string, unknown>) => void>).setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        (fm as Record<string, (callback: (results: Record<string, unknown>) => void) => void>).onResults(onResults);
        faceMeshRef.current = fm;

        // Skip OpenCV entirely to avoid WASM Module conflicts with MediaPipe
        cvReadyRef.current = false;
        console.info('OpenCV disabled (to avoid WASM module conflicts with MediaPipe). Using 2D pose heuristic.');

        // Start camera using Camera utility from npm package
        if (videoElementRef.current) {
          const Camera = CameraLib as unknown as new (element: HTMLVideoElement, options: Record<string, unknown>) => Record<string, unknown>;

          // Throttle frames sent to MediaPipe to reduce CPU/GPU overhead.
          const minInterval = TEMPORAL_CONFIG.workerMinIntervalMs ?? 40; // ms (default ~25fps)

          const camera = new Camera(videoElementRef.current, {
            onFrame: async () => {
              if (!videoElementRef.current) return;
              try {
                const now = performance?.now ? performance.now() : Date.now();
                const last = _lastFrameSentTsRef.current || 0;
                if (now - last < minInterval) {
                  // skip this frame to reduce load
                  return;
                }
                _lastFrameSentTsRef.current = now;

                // send current video frame to MediaPipe FaceMesh
                await (fm as Record<string, (data: Record<string, unknown>) => Promise<void>>).send({ image: videoElementRef.current });
              } catch (frameError: unknown) {
                // Log but don't crash on per-frame errors
                if (frameError instanceof Error && frameError.message?.includes('input_frames_gpu')) {
                  // This is a known MediaPipe graph error; usually recovers next frame
                  console.debug('MediaPipe frame processing (will retry next frame):', frameError.message);
                } else {
                  console.debug('MediaPipe frame error (throttled):', frameError);
                }
              }
            },
            width: CAMERA_CONFIG.width,
            height: CAMERA_CONFIG.height,
          });
          (camera as Record<string, () => void>).start();
          cameraRef.current = camera;
          // Mark UI as ready once camera has started and FaceMesh is configured
          setIsReady(true);
          setReadyMessage('Camera & FaceMesh ready');
          console.info('✓ Camera started (frame throttling enabled)');
        }
      } catch (_e) {
        // initialization failure — remain safe: no crash, hook will fallback to not_detected
        console.error('useFocusDetection init error:', _e);
      }
    })();

    return () => {
      try {
        const camera = cameraRef.current as Record<string, () => void> | null;
        camera?.stop();
      } catch {}
      try {
        const faceMesh = faceMeshRef.current as Record<string, () => void> | null;
        faceMesh?.close();
      } catch {}
      // Also ensure underlying MediaStream tracks are stopped (safety)
      try {
        const v = videoElementRef.current as HTMLVideoElement | null;
        const stream = v && (v.srcObject as MediaStream | null);
        if (stream) {
          stream.getTracks().forEach((t) => {
            try { t.stop(); } catch {}
          });
          if (v) v.srcObject = null;
        }
      } catch {}
      try {
        workerRef.current?.terminate();
        workerRef.current = null;
      } catch {}
    };
  }, [videoElementRef]);

  return { status, debug, startCalibration, calibrationCountdown, isCalibrating, resetCalibration, isReady, readyMessage };
}

if (typeof window !== 'undefined') {
  (window as any).Module = (window as any).Module || {};
  (window as any).Module.locateFile = (path: string) => {
    return `/mediapipe/face_mesh/${path}`;
  };
}