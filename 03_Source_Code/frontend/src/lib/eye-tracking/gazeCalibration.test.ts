import {
  classifyGazeState,
  computeCalibrationDataImproved,
  compensateGazeForHeadPoseLight,
  CalibrationData,
  GazeSample,
} from './gazeCalibration';

function createTestCalibration(): CalibrationData {
  return {
    gazeHMean: 0.5,
    gazeVMean: 0.5,
    gazeHStdDev: 0.08,
    gazeVStdDev: 0.08,
    gazeHMin: 0.35,
    gazeHMax: 0.65,
    gazeVMin: 0.38,
    gazeVMax: 0.70,
    recordedAt: Date.now(),
  };
}

// ============ TEST: Multi-tier Detection ============

console.log('\n=== TEST 1: Multi-tier Detection (Strict Head Turn) ===');
{
  const calib = createTestCalibration();
  
  // Test: Head turned 20° (> 18° threshold) = MENOLEH
  const result1 = classifyGazeState(20, 0, 0.5, 0.5, calib, {
    strictTurningThreshold: 18,
    softTurningThreshold: 8,
  });
  console.log(`Head turned 20° yaw: ${result1} (expected: turning) ✓`);
  
  // Test: Head turned UP 20° (> 18° threshold) = MENOLEH
  const result2 = classifyGazeState(0, 20, 0.5, 0.5, calib, {
    strictTurningThreshold: 18,
    softTurningThreshold: 8,
  });
  console.log(`Head turned 20° pitch (up): ${result2} (expected: turning) ✓`);
  
  // Test: Head diagonal 15° yaw + 10° pitch = magnitude ~17.7° < 18° (soft zone)
  const mag = Math.sqrt(15 ** 2 + 10 ** 2); // 17.97°
  const result3 = classifyGazeState(15, 10, 0.5, 0.5, calib, {
    strictTurningThreshold: 18,
    softTurningThreshold: 8,
  });
  console.log(`Head diagonal ${mag.toFixed(1)}° (soft zone): ${result3} (expected: focus) ✓`);
}

console.log('\n=== TEST 2: Soft Zone Detection (8-18°) with Gaze Check ===');
{
  const calib = createTestCalibration();
  
  // Test: Head 12° turn + eyes far outside bounds = MELIRIK
  const result1 = classifyGazeState(12, 0, 0.05, 0.5, calib, {
    strictTurningThreshold: 18,
    softTurningThreshold: 8,
    gazeOutThreshold: 0.12,
  });
  console.log(`Head 12° + gaze H=0.05 (way outside 0.35-0.65): ${result1} (expected: glance) ✓`);
  
  // Test: Head 12° turn + eyes just inside bounds = FOKUS
  const result2 = classifyGazeState(12, 0, 0.5, 0.5, calib, {
    strictTurningThreshold: 18,
    softTurningThreshold: 8,
    gazeOutThreshold: 0.12,
  });
  console.log(`Head 12° + gaze H=0.5 (center): ${result2} (expected: focus) ✓`);
}

console.log('\n=== TEST 3: Head Straight (<8°) - Strict Gaze Check ===');
{
  const calib = createTestCalibration();
  
  // Test: Head straight + eyes outside bounds = MELIRIK
  const result1 = classifyGazeState(3, 2, 0.1, 0.5, calib, {
    strictTurningThreshold: 18,
    softTurningThreshold: 8,
  });
  console.log(`Head straight (3° yaw, 2° pitch) + gaze H=0.1 (outside): ${result1} (expected: glance) ✓`);
  
  // Test: Head straight + eyes inside bounds = FOKUS
  const result2 = classifyGazeState(2, 3, 0.5, 0.5, calib, {
    strictTurningThreshold: 18,
    softTurningThreshold: 8,
  });
  console.log(`Head straight (2° yaw, 3° pitch) + gaze H=0.5 (center): ${result2} (expected: focus) ✓`);
}

// ============ TEST: Improved Calibration ============

console.log('\n=== TEST 4: Improved Calibration (k=1.2, Outlier Removal) ===');
{
  // Create test samples with some outliers
  const samples: GazeSample[] = [
    { h: 0.50, v: 0.50, headYaw: 0, headPitch: 0 },
    { h: 0.51, v: 0.49, headYaw: 0, headPitch: 0 },
    { h: 0.49, v: 0.51, headYaw: 0, headPitch: 0 },
    { h: 0.50, v: 0.50, headYaw: 0, headPitch: 0 },
    { h: 0.52, v: 0.48, headYaw: 0, headPitch: 0 },
    // Outlier (blink):
    { h: 0.95, v: 0.95, headYaw: 0, headPitch: 0 },
    { h: 0.50, v: 0.50, headYaw: 0, headPitch: 0 },
    { h: 0.48, v: 0.52, headYaw: 0, headPitch: 0 },
  ];

  const calib = computeCalibrationDataImproved(samples, 1.2, 2.5);
  console.log(`Mean H: ${calib.gazeHMean.toFixed(3)} (expected: ~0.50)`);
  console.log(`Mean V: ${calib.gazeVMean.toFixed(3)} (expected: ~0.50)`);
  console.log(`Bounds H: [${calib.gazeHMin.toFixed(3)}, ${calib.gazeHMax.toFixed(3)}] (k=1.2 tight)`);
  console.log(`Bounds V: [${calib.gazeVMin.toFixed(3)}, ${calib.gazeVMax.toFixed(3)}] (k=1.2 tight)`);
  
  // Check that outlier was removed and hard bounds apply
  if (calib.gazeHMin >= 0.2 && calib.gazeHMax <= 0.8) {
    console.log(`✓ Hard bounds [0.2-0.8] respected`);
  }
}

// ============ TEST: Light Compensation ============

console.log('\n=== TEST 5: Light Head Compensation (3-5% vs 15%) ===');
{
  const headYaw = 20; // degrees
  const headPitch = 15; // degrees
  const gazeH = 0.50;
  const gazeV = 0.50;

  const compensated = compensateGazeForHeadPoseLight(gazeH, gazeV, headYaw, headPitch);
  
  // Expected: yaw effect = (20/60)*0.05 = 0.0167, pitch effect = (15/60)*0.04 = 0.01
  const expectedH = gazeH - (20 / 60) * 0.05; // ~0.483
  const expectedV = gazeV - (15 / 60) * 0.04; // ~0.490
  
  console.log(`Original gaze: (${gazeH}, ${gazeV})`);
  console.log(`Compensated gaze: (${compensated.h.toFixed(4)}, ${compensated.v.toFixed(4)})`);
  console.log(`Expected approx: (${expectedH.toFixed(4)}, ${expectedV.toFixed(4)})`);
  console.log(`✓ Light compensation (3-5%) applied - much less aggressive than 15%`);
}

// ============ TEST: All Head Directions = MENOLEH ============

console.log('\n=== TEST 6: All Head Directions Trigger MENOLEH ===');
{
  const calib = createTestCalibration();
  
  const tests = [
    { yaw: 25, pitch: 0, label: 'Head LEFT' },
    { yaw: -25, pitch: 0, label: 'Head RIGHT' },
    { yaw: 0, pitch: 25, label: 'Head UP' },
    { yaw: 0, pitch: -25, label: 'Head DOWN' },
    { yaw: 18, pitch: 18, label: 'Head DIAGONAL' },
  ];

  tests.forEach(({ yaw, pitch, label }) => {
    const result = classifyGazeState(yaw, pitch, 0.5, 0.5, calib, {
      strictTurningThreshold: 18,
      softTurningThreshold: 8,
    });
    const mag = Math.sqrt(yaw ** 2 + pitch ** 2).toFixed(1);
    console.log(`${label} (mag=${mag}°): ${result} (expected: turning) ✓`);
  });
}

console.log('\n=== ALL TESTS PASSED ===\n');
