/**
 * Shared gaze math utilities
 * Used by: useFocusDetection hook, utils, and tests
 * Keep logic independent of React/Worker APIs
 */

// ===== Iris & Pupil Detection =====

/**
 * Compute weighted iris centroid from 5 iris landmark points.
 * More robust to outliers than simple average.
 *
 * Algorithm:
 * 1. Compute simple centroid for reference
 * 2. Weight points by inverse distance to centroid (closer = higher weight)
 * 3. Recompute centroid using weights
 *
 * @param landmarks Array of normalized landmarks {x,y}
 * @param irisIndices 5 indices for iris points
 * @returns {x, y, radius, valid}
 */
export function computeIrisCentroid(
  landmarks: Array<{ x: number; y: number } | undefined>,
  irisIndices: number[]
): { x: number; y: number; radius: number; valid: boolean } {
  if (!landmarks || irisIndices.length === 0) {
    return { x: 0.5, y: 0.5, radius: 0, valid: false };
  }

  // Collect valid iris points
  const pts: Array<{ x: number; y: number }> = [];
  for (const idx of irisIndices) {
    if (idx < landmarks.length && landmarks[idx]) {
      const p = landmarks[idx]!;
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        pts.push(p);
      }
    }
  }

  if (pts.length === 0) {
    return { x: 0.5, y: 0.5, radius: 0, valid: false };
  }

  // Step 1: Simple centroid
  let cx0 = 0,
    cy0 = 0;
  for (const p of pts) {
    cx0 += p.x;
    cy0 += p.y;
  }
  cx0 /= pts.length;
  cy0 /= pts.length;

  // Step 2-3: Weight by inverse distance and recompute
  const dists = pts.map((p) => Math.hypot(p.x - cx0, p.y - cy0));
  const maxDist = Math.max(...dists) || 0.0001;
  const weights = dists.map((d) => 1 - d / maxDist);

  const sumW = weights.reduce((s, w) => s + w, 0) || 1;
  let cx = 0,
    cy = 0;
  for (let i = 0; i < pts.length; i++) {
    cx += pts[i].x * weights[i];
    cy += pts[i].y * weights[i];
  }
  cx /= sumW;
  cy /= sumW;

  return { x: cx, y: cy, radius: maxDist / 2, valid: true };
}

// ===== Iris Validation =====

/**
 * Check if iris centroid is within eye outline bounds.
 * Detects blinks/occlusions by checking if iris is inside eye region.
 *
 * Uses bounding box check with margin for robustness.
 *
 * @param iris Iris centroid {x,y}
 * @param eyeOutlineIndices Indices for eye outline points (16 per eye)
 * @param landmarks Normalized landmarks
 * @returns true if iris is within bounds
 */
export function validateIrisInEye(
  iris: { x: number; y: number },
  eyeOutlineIndices: number[],
  landmarks: Array<{ x: number; y: number } | undefined>
): boolean {
  if (!eyeOutlineIndices || eyeOutlineIndices.length === 0) {
    return true; // can't validate, assume ok
  }

  // Collect eye outline points
  const eyePts: Array<{ x: number; y: number }> = [];
  for (const idx of eyeOutlineIndices) {
    if (idx < landmarks.length && landmarks[idx]) {
      const p = landmarks[idx]!;
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        eyePts.push(p);
      }
    }
  }

  if (eyePts.length === 0) return true;

  // Compute bounding box
  let minX = eyePts[0].x,
    maxX = eyePts[0].x,
    minY = eyePts[0].y,
    maxY = eyePts[0].y;
  for (const p of eyePts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  // Validate with 15% margin
  const marginX = (maxX - minX) * 0.15;
  const marginY = (maxY - minY) * 0.15;

  return (
    iris.x >= minX - marginX &&
    iris.x <= maxX + marginX &&
    iris.y >= minY - marginY &&
    iris.y <= maxY + marginY
  );
}

// ===== 3D Projection =====

/**
 * Project 3D point (in model/head coords) to 2D screen using pose (rvec/tvec).
 * Requires cv.Mat and OpenCV context (typically used in worker).
 *
 * Formula:
 * 1. Transform 3D point: p_cam = R * p_model + t (where R from rvec)
 * 2. Project to 2D: u = fx * x/z + cx, v = fy * y/z + cy
 *
 * @param point3D 3D point [x,y,z] in model coords
 * @param rvec Rotation vector (OpenCV Mat)
 * @param tvec Translation vector (OpenCV Mat)
 * @param cameraMatrix [fx, 0, cx, 0, fy, cy, 0, 0, 1]
 * @param cv OpenCV module
 * @returns {u, v, pCam} where u,v in pixels and pCam in 3D camera coords
 */
export function project3DTo2D(
  point3D: [number, number, number],
  rvec: Record<string, unknown>,
  tvec: Record<string, unknown>,
  cameraMatrix: number[],
  cv: Record<string, unknown>
): { u: number; v: number; pCam: [number, number, number] } {
  // Rotate + translate to camera coords
  const R = new (cv.Mat as {new(): unknown})();
  (cv.Rodrigues as (rvec: unknown, R: unknown) => void)(rvec, R);

  const rData = (R as Record<string, unknown>).data64F as Float64Array;
  const tvData = (tvec as Record<string, unknown>).data64F as Float64Array;

  const pCam: [number, number, number] = [
    rData[0] * point3D[0] + rData[1] * point3D[1] + rData[2] * point3D[2] + tvData[0],
    rData[3] * point3D[0] + rData[4] * point3D[1] + rData[5] * point3D[2] + tvData[1],
    rData[6] * point3D[0] + rData[7] * point3D[1] + rData[8] * point3D[2] + tvData[2],
  ];

  if (typeof (R as any).delete === 'function') {
    (R as any).delete();
  }

  // Project to 2D
  const f = cameraMatrix[0];
  const cx = cameraMatrix[2];
  const cy = cameraMatrix[5];

  const u = f * pCam[0] / (pCam[2] || 1) + cx;
  const v = f * pCam[1] / (pCam[2] || 1) + cy;

  return { u, v, pCam };
}

// ===== Smoothing Utilities =====

/**
 * Exponential moving average: newValue = old * (1 - alpha) + new * alpha
 * Higher alpha = more responsive, lower = more stable
 */
export function exponentialSmoothing(
  oldValue: number,
  newValue: number,
  alpha: number
): number {
  return oldValue * (1 - alpha) + newValue * alpha;
}

/**
 * Apply exponential smoothing to a vector [x,y,z]
 */
export function exponentialSmoothingVec3(
  old: [number, number, number],
  neu: [number, number, number],
  alpha: number
): [number, number, number] {
  return [
    exponentialSmoothing(old[0], neu[0], alpha),
    exponentialSmoothing(old[1], neu[1], alpha),
    exponentialSmoothing(old[2], neu[2], alpha),
  ];
}

/**
 * Moving average over a window of values (FIFO buffer)
 * Returns average and keeps buffer updated
 */
export function movingAverage(
  buffer: number[],
  newValue: number,
  windowSize: number
): number {
  buffer.push(newValue);
  if (buffer.length > windowSize) {
    buffer.shift();
  }
  return buffer.reduce((s, v) => s + v, 0) / buffer.length;
}

// ===== Clamp & Math Helpers =====

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

export function normalizeVector(v: [number, number, number]): [number, number, number] {
  const mag = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / mag, v[1] / mag, v[2] / mag];
}

export default {
  computeIrisCentroid,
  validateIrisInEye,
  project3DTo2D,
  exponentialSmoothing,
  exponentialSmoothingVec3,
  movingAverage,
  clamp,
  distance,
  normalizeVector,
};
