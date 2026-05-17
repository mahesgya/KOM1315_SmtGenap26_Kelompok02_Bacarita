/**
 * Gaze Calibration & Detection Utilities
 * Implementasi classifier yang robust untuk focus/glance/turning
 */

export interface CalibrationData {
  gazeHMean: number;
  gazeVMean: number;
  gazeHStdDev: number;
  gazeVStdDev: number;
  gazeHMin: number;
  gazeHMax: number;
  gazeVMin: number;
  gazeVMax: number;
  recordedAt: number;
}

export interface GazeSample {
  h: number;
  v: number;
  headYaw: number;
  headPitch: number;
  pupilLeftX?: number;
  pupilLeftY?: number;
  pupilRightX?: number;
  pupilRightY?: number;
}

/**
 * Classifier utama untuk menentukan status focus/glance/turning
 * Menggunakan kombinasi head pose, gaze position, dan pupil offset
 * 
 * LOGIC:
 * - TURNING: Significant head rotation (looking away with head)
 * - GLANCE: Eyes looking away without major head movement  
 * - FOCUS: Eyes and head both looking at screen/content
 */
export function classifyGazeState(
  headYawDeg: number,
  headPitchDeg: number,
  gazeH: number,
  gazeV: number,
  calibration: CalibrationData,
  options?: {
    strictTurningThreshold?: number;
    softTurningThreshold?: number;
    gazeOutThreshold?: number;
    pupilMag?: number;
    pupilMagThreshold?: number;
    gazeDist?: number;
    gazeConfidence?: number;
    minConfidence?: number;
  }
): 'focus' | 'glance' | 'turning' {
  const {
    strictTurningThreshold = 20, // Head turn > 20° = definitely turning
    softTurningThreshold = 12,   // Head turn 12-20° = mild turning (consider with gaze)
    gazeOutThreshold = 0.12,     // Gaze outside bounds by this much = looking away
    pupilMag = 0,
    pupilMagThreshold = 0.15,    // Iris offset threshold for glance detection
    gazeConfidence = 1,
    minConfidence = 0.3,
  } = options ?? {};

  // 1. Check confidence - if too low, fallback to head pose only
  if (gazeConfidence < minConfidence) {
    const headRotMag = Math.sqrt(headYawDeg ** 2 + headPitchDeg ** 2);
    if (headRotMag > strictTurningThreshold) return 'turning';
    if (headRotMag > softTurningThreshold) return 'glance';
    return 'focus';
  }

  const headRotMag = Math.sqrt(headYawDeg ** 2 + headPitchDeg ** 2);

  // 2. TURNING: Strong head rotation (>20°) - definitely turning away
  if (headRotMag > strictTurningThreshold) {
    return 'turning';
  }

  // 3. Compensate gaze for head pose (when head turns slightly, eyes compensate)
  // This allows detecting when someone turns head but keeps eyes on screen
  const compensationH = (headYawDeg / 45) * 0.08;
  const compensationV = (headPitchDeg / 30) * 0.06;
  const compH = gazeH - compensationH;
  const compV = gazeV - compensationV;

  // 4. Calculate gaze center and distance from center
  const centerH = (calibration.gazeHMin + calibration.gazeHMax) / 2;
  const centerV = (calibration.gazeVMin + calibration.gazeVMax) / 2;
  const gazeDistFromCenter = Math.sqrt(
    Math.pow(compH - centerH, 2) + Math.pow(compV - centerV, 2)
  );

  // 5. Check if gaze is outside calibration bounds
  const gazeOutH = compH < calibration.gazeHMin - gazeOutThreshold || 
                   compH > calibration.gazeHMax + gazeOutThreshold;
  const gazeOutV = compV < calibration.gazeVMin - gazeOutThreshold || 
                   compV > calibration.gazeVMax + gazeOutThreshold;
  const isGazeSignificantlyOut = gazeOutH || gazeOutV;

  // 6. Check for significant iris offset (eyes looking to side)
  const isIrisOffCenter = pupilMag >= pupilMagThreshold;

  // 7. GLANCE detection - eyes looking away WITHOUT major head turn
  // This is the KEY fix - detect eye movement, not just head movement
  
  // Case A: Eyes significantly looking outside bounds
  if (isGazeSignificantlyOut) {
    // If head is also turning somewhat, upgrade to turning
    if (headRotMag > softTurningThreshold) {
      return 'turning';
    }
    return 'glance';
  }

  // Case B: Iris is significantly off-center (looking left/right/up/down with eyes)
  if (isIrisOffCenter) {
    return 'glance';
  }

  // Case C: Gaze distance from center is large
  if (gazeDistFromCenter > gazeOutThreshold * 1.5) {
    return 'glance';
  }

  // Case D: Moderate head turn with gaze also drifting
  if (headRotMag > softTurningThreshold && gazeDistFromCenter > gazeOutThreshold * 0.8) {
    return 'glance';
  }

  // 8. FOCUS: Eyes and head are both within acceptable range
  return 'focus';
}

/**
 * Hitung kalibrasi dengan outlier removal
 */
export function computeCalibrationDataImproved(
  samples: GazeSample[],
  kStdDev: number = 1.5,
  outlierThreshold: number = 2.0
): CalibrationData {
  if (samples.length === 0) {
    return {
      gazeHMean: 0.5,
      gazeVMean: 0.5,
      gazeHStdDev: 0.1,
      gazeVStdDev: 0.1,
      gazeHMin: 0.3,
      gazeHMax: 0.7,
      gazeVMin: 0.35,
      gazeVMax: 0.75,
      recordedAt: Date.now(),
    };
  }

  const hVals = samples.map(s => s.h);
  const vVals = samples.map(s => s.v);

  // Hitung mean awal
  const hMean = hVals.reduce((sum, v) => sum + v, 0) / hVals.length;
  const vMean = vVals.reduce((sum, v) => sum + v, 0) / vVals.length;

  // Hitung standard deviation
  const hStdDev = Math.sqrt(
    hVals.reduce((sum, v) => sum + (v - hMean) ** 2, 0) / hVals.length
  );
  const vStdDev = Math.sqrt(
    vVals.reduce((sum, v) => sum + (v - vMean) ** 2, 0) / vVals.length
  );

  // Filter outliers
  const filteredH = hVals.filter(v => Math.abs(v - hMean) < outlierThreshold * hStdDev);
  const filteredV = vVals.filter(v => Math.abs(v - vMean) < outlierThreshold * vStdDev);

  // Recalculate dengan data yang sudah difilter
  const hMeanFinal = filteredH.reduce((sum, v) => sum + v, 0) / (filteredH.length || 1);
  const vMeanFinal = filteredV.reduce((sum, v) => sum + v, 0) / (filteredV.length || 1);

  const hStdDevFinal = Math.sqrt(
    filteredH.reduce((sum, v) => sum + (v - hMeanFinal) ** 2, 0) / (filteredH.length || 1)
  );
  const vStdDevFinal = Math.sqrt(
    filteredV.reduce((sum, v) => sum + (v - vMeanFinal) ** 2, 0) / (filteredV.length || 1)
  );

  // Buat bounds dengan margin yang cukup untuk membaca normal
  const hMin = Math.max(0, hMeanFinal - kStdDev * hStdDevFinal);
  const hMax = Math.min(1, hMeanFinal + kStdDev * hStdDevFinal);
  const vMin = Math.max(0, vMeanFinal - kStdDev * vStdDevFinal);
  const vMax = Math.min(1, vMeanFinal + kStdDev * vStdDevFinal);

  return {
    gazeHMean: hMeanFinal,
    gazeVMean: vMeanFinal,
    gazeHStdDev: hStdDevFinal,
    gazeVStdDev: vStdDevFinal,
    gazeHMin: hMin,
    gazeHMax: hMax,
    gazeVMin: vMin,
    gazeVMax: vMax,
    recordedAt: Date.now(),
  };
}

/**
 * Hitung offset pupil relatif terhadap center mata
 */
export function computePupilOffset(
  pupilX: number,
  pupilY: number,
  eyeCenterX: number,
  eyeCenterY: number,
  eyeWidth: number,
  eyeHeight: number
): { offsetX: number; offsetY: number; magnitude: number } {
  const dx = (pupilX - eyeCenterX) / Math.max(eyeWidth, 1e-6);
  const dy = (pupilY - eyeCenterY) / Math.max(eyeHeight, 1e-6);
  const magnitude = Math.sqrt(dx ** 2 + dy ** 2);
  return { offsetX: dx, offsetY: dy, magnitude };
}

/**
 * Kompensasi gaze untuk head pose (ringan)
 */
export function compensateGazeForHeadPoseLight(
  gazeH: number,
  gazeV: number,
  headYawDeg: number,
  headPitchDeg: number
): { h: number; v: number } {
  const compensationH = (headYawDeg / 45) * 0.04; // Lebih konservatif
  const compensationV = (headPitchDeg / 30) * 0.03;

  return {
    h: gazeH - compensationH,
    v: gazeV - compensationV,
  };
}

/**
 * Hitung variance pose untuk session metrics
 */
export function calculatePoseVariance(poseHistory: Array<{ yaw: number; pitch: number }>): number {
  if (poseHistory.length < 2) return 0;

  const yaws = poseHistory.map(p => p.yaw);
  const pitches = poseHistory.map(p => p.pitch);

  const yawVariance = variance(yaws);
  const pitchVariance = variance(pitches);

  return Number(((yawVariance + pitchVariance) / 2).toFixed(2));
}

function variance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  return squareDiffs.reduce((a, b) => a + b) / values.length;
}

/**
 * Hitung long fixations untuk session metrics
 */
export function calculateLongFixations(
  gazeHistory: Array<{ x: number; y: number; timestamp: number }>,
  fixationThreshold: number = 40,
  fixationDuration: number = 1500
): number {
  let count = 0;
  let fixationStart = 0;
  let lastX = 0;
  let lastY = 0;

  for (const gaze of gazeHistory) {
    const distance = Math.sqrt(
      Math.pow(gaze.x - lastX, 2) + Math.pow(gaze.y - lastY, 2)
    );

    if (distance < fixationThreshold) {
      if (fixationStart === 0) {
        fixationStart = gaze.timestamp;
      } else if (gaze.timestamp - fixationStart > fixationDuration) {
        count++;
        fixationStart = gaze.timestamp; // Reset untuk fixation berikutnya
      }
    } else {
      fixationStart = 0;
    }

    lastX = gaze.x;
    lastY = gaze.y;
  }

  return count;
}

// Compatibility exports
export function computeCalibrationData(
  samples: GazeSample[],
  kStdDev: number = 1.5,
  outlierThreshold: number = 2.0
): CalibrationData {
  return computeCalibrationDataImproved(samples, kStdDev, outlierThreshold);
}

/**
 * Save/load calibration dari localStorage
 */
export function saveCalibration(calibration: CalibrationData): void {
  try {
    localStorage.setItem('focus_detection_calibration', JSON.stringify(calibration));
  } catch (e) {
    console.warn('Failed to save calibration:', e);
  }
}

export function loadCalibration(): CalibrationData | null {
  try {
    const stored = localStorage.getItem('focus_detection_calibration');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('Failed to load calibration:', e);
    return null;
  }
}

/**
 * Classify gaze state change (untuk tracking)
 */
export function classifyGazeChange(
  prevState: 'focus' | 'glance' | 'turning',
  newState: 'focus' | 'glance' | 'turning'
): 'stable' | 'improving' | 'worsening' {
  if (prevState === newState) return 'stable';
  
  const stateRank = { focus: 0, glance: 1, turning: 2 };
  
  if (stateRank[newState] < stateRank[prevState]) {
    return 'improving';
  }
  return 'worsening';
}

/**
 * Average gaze dari kedua mata
 */
export function averageEyeGaze(
  leftGaze: { h: number; v: number } | null,
  rightGaze: { h: number; v: number } | null
): { h: number; v: number } | null {
  if (leftGaze && rightGaze) {
    return {
      h: (leftGaze.h + rightGaze.h) / 2,
      v: (leftGaze.v + rightGaze.v) / 2,
    };
  }
  return leftGaze || rightGaze;
}
