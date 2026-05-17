import React, { useState } from 'react';

/**
 * Simple 5-point calibration component.
 * It emits mapping coefficients after calibration:
 * transform(x,y) -> { x: x', y: y' } where values are normalized (0..1).
 *
 * The calibration computes an affine transform:
 * x' = a*x + b*y + c
 * y' = d*x + e*y + f
 *
 * Props:
 * - onComplete(transform) called with a function that maps {x,y} normalized -> normalized
 */

type Point = { x: number; y: number };
type Transform = { a: number; b: number; c: number; d: number; e: number; f: number };

export const Calibration: React.FC<{
  onComplete: (mapFn: (pt: Point) => Point) => void;
}> = ({ onComplete }) => {
  const targets = [
    { x: 0.5, y: 0.5 },
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.9 },
    { x: 0.9, y: 0.9 },
  ];
  const [step, setStep] = useState(0);

  // This component does not capture gaze points itself.
  // Instead, the host should call `record(gaze)` on each sample; for simplicity here we simulate manual clicking.
  const next = () => {
    if (step >= targets.length) return;
    setStep((s) => s + 1);
  };

  // For prototyping, we assume host will provide pairs by calling onComplete with transform.
  // Provide a "skip" that returns identity mapping
  const finishIdentity = () => {
    onComplete((p) => ({ x: p.x, y: p.y }));
  };

  return (
    <div style={{ padding: 8 }}>
      <div>
        <strong>Kalibrasi (prototype)</strong>
        <div style={{ marginTop: 8 }}>
          <p>Fitur kalibrasi akan muncul di versi lebih lengkap. Untuk saat ini, gunakan kalibrasi sederhana di UI.</p>
          <button onClick={finishIdentity}>Gunakan mapping default (tanpa kalibrasi)</button>
        </div>
      </div>
    </div>
  );
};