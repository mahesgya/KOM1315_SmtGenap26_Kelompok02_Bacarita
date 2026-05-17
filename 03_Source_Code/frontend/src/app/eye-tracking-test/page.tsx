"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RotateCcw } from "lucide-react";
import { useFocusDetection, FocusStatus, type DebugInfo, type CalibrationData } from "@/hooks/useFocusDetection";

export default function EyeTrackingTest() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | undefined>(undefined);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationData | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<FocusStatus | null>(null);

  const handleDistraction = useCallback((status: FocusStatus) => {
    setShowWarning(true);
    setWarningType(status);
    setTimeout(() => setShowWarning(false), 3000);
  }, []);

  const handleCalibrationComplete = useCallback((cal: CalibrationData) => {
    setCalibrationResult(cal);
  }, []);

  const { status, debug, startCalibration, calibrationCountdown, isCalibrating } = useFocusDetection({
    videoElementRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasElementRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    onDistraction: handleDistraction,
    onCalibrationComplete: handleCalibrationComplete,
    config: { enableOpenCV: false },
  });

  useEffect(() => {
    if (debug) setDebugInfo(debug);
  }, [debug]);

  const initializeWebcam = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch (e) {
      console.error(e);
      alert("Could not access webcam");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current!.srcObject = null;
    }
    setIsWebcamActive(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Eye Tracking Test</h1>
          <p className="text-slate-300">Quick test page (status display removed)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <div className="relative bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: isWebcamActive ? 'block' : 'none' }} />
              </div>
            </div>

            <div className="min-h-24 bg-slate-800 rounded-lg border border-slate-700 p-4 flex items-center justify-center">
              {showWarning ? (
                <div className="text-center text-white">Warning: {String(warningType)}</div>
              ) : (
                <div className="text-slate-400">{isWebcamActive ? 'Monitoring...' : 'Start webcam to begin'}</div>
              )}
            </div>

            <div className="flex gap-2">
              {!isWebcamActive ? (
                <button onClick={initializeWebcam} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
                  <Camera className="w-5 h-5 inline-block mr-2" />Start Webcam
                </button>
              ) : (
                <button onClick={stopWebcam} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
                  <CameraOff className="w-5 h-5 inline-block mr-2" />Stop Webcam
                </button>
              )}

              <button onClick={() => startCalibration()} disabled={!isWebcamActive || isCalibrating} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
                <RotateCcw className="w-5 h-5 inline-block mr-2" />{isCalibrating ? `Calibrating (${calibrationCountdown}s)` : 'Calibrate'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-3">Debug Info</h2>
              <div className="space-y-2 text-sm text-slate-300">
                {debugInfo ? (
                  <>
                    <div>Head Pose: {debugInfo.headPose ? `${debugInfo.headPose.yaw.toFixed(1)}, ${debugInfo.headPose.pitch.toFixed(1)}` : '-'}</div>
                    <div>Gaze Point: {debugInfo.gazePoint ? `${Math.round(debugInfo.gazePoint.x)}, ${Math.round(debugInfo.gazePoint.y)}` : '-'}</div>
                    <div>Classification: {debugInfo.classification || '-'}</div>
                  </>
                ) : (
                  <div>No debug info yet.</div>
                )}
              </div>
            </div>

            {calibrationResult && (
              <div className="bg-slate-800 rounded-lg border border-green-700 p-4 bg-opacity-50">
                <h2 className="text-lg font-semibold text-green-400 mb-2">Calibration Complete</h2>
                <div className="text-slate-300 text-sm">
                  <p>Gaze H Mean: {calibrationResult.gazeHMean.toFixed(2)}</p>
                  <p>Gaze V Mean: {calibrationResult.gazeVMean.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
