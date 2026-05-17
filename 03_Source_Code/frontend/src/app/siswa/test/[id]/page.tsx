"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Play, Pause, Volume2, VolumeX, Camera, CameraOff, Loader, RotateCcw, Settings, ChevronUp, ChevronDown } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import TestSessionServices from "@/services/test-session.services";
import { useDispatch } from "react-redux";
import { showToastError } from "@/components/utils/toast.utils";
import { useFocusDetection, FocusStatus, type CalibrationData } from "@/hooks/useFocusDetection";
import { playWarningSound, WARNING_MESSAGES, WarningType, setAudioEnabled } from "@/lib/eye-tracking/audioWarnings";
import { useSessionDataCollector } from "@/hooks/useSessionDataCollector";
import { useGoogleTts } from "@/hooks/use.google.tts";

const BacaPage = () => {
  const router = useRouter();
  const { speak } = useGoogleTts();
  const dispatch = useDispatch();
  const [isQuestionLoading, setQuestionLoading] = useState(false);
  const sessionFull = useSelector((state: RootState) => state.testSession.activeSession);

  const storyId = sessionFull?.data.story.id;
  const sessionId = sessionFull?.data.id;
  const session = sessionFull?.data;
  const storyTitle = session?.titleAtTaken;
  const storyDesc = session?.descriptionAtTaken;
  const storyPassages: string[] =
    session?.passagesAtTaken && session.passagesAtTaken.length > 0 ? session.passagesAtTaken : (session?.passageAtTaken || session?.story?.passage || "").split("\n").filter((line: string) => line.trim() !== "");

  const allWords = useMemo(
    () =>
      storyPassages.flatMap((passage, passageIndex) =>
        passage.split(" ").map((word, wordIndex) => ({
          word,
          passageIndex,
          wordIndex,
        }))
      ),
    [storyPassages]
  );

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(70);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationData | null>(null);
  const [warningType, setWarningType] = useState<WarningType | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const readingAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordsRef = useRef<HTMLElement[]>([]);
  const previousStatusRef = useRef<string | null>(null);

  const distractionTimerRef = useRef<{ [key: string]: number | null }>({
    turning: null,
    glance: null,
    not_detected: null,
  });
  const distractionThresholdRef = useRef<{ [key: string]: number }>({
    turning: 3000,
    glance: 2000,
    not_detected: 1000,
  });

  const { recordPoseData, recordGazeData, recordStatusChange, recordDistractionEvent, generateAndSendSummary } = useSessionDataCollector();

  const allWordsRef = useRef(allWords);
  const currentWordIndexRef = useRef(currentWordIndex);

  useEffect(() => {
    allWordsRef.current = allWords;
  }, [allWords]);

  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  const handleDistraction = useCallback(
    (status: FocusStatus) => {
      const message = status === FocusStatus.turning ? "Anda menoleh!" : "Mata keluar dari area bacaan!";
      console.log("Distraction detected:", message);

      setFocusHistory((prev) => [...prev.slice(-99), 0]);

      let warnType: WarningType | null = null;
      let statusKey: "turning" | "glance" | "not_detected" | null = null;

      if (status === FocusStatus.not_detected) {
        warnType = WarningType.not_detected;
        statusKey = "not_detected";
      } else if (status === FocusStatus.turning) {
        warnType = WarningType.turning;
        statusKey = "turning";
      } else if (status === FocusStatus.glance) {
        warnType = WarningType.glance;
        statusKey = "glance";
      }

      if (warnType && statusKey) {
        const now = Date.now();
        const start = distractionTimerRef.current[statusKey];
        const threshold = distractionThresholdRef.current[statusKey];

        if (start == null) {
          distractionTimerRef.current[statusKey] = now;
        } else {
          const duration = now - start;
          if (duration >= threshold) {
            const currentIndex = currentWordIndexRef.current;
            const currentAllWords = allWordsRef.current;
            const distractedWord = currentAllWords[currentIndex]?.word || "";
            if(!sessionId){
              return;
            }
            recordDistractionEvent(statusKey, duration, distractedWord, sessionId, dispatch);
            distractionTimerRef.current[statusKey] = now;
          }
        }

        setWarningType(warnType);
        setShowWarning(true);
        if (isSoundEnabled) playWarningSound(warnType);
      }
    },
    [isSoundEnabled, allWords, currentWordIndex, sessionId, recordDistractionEvent]
  );

  const handleCalibrationComplete = useCallback((calibration: CalibrationData) => {
    setCalibrationResult(calibration);
    console.log("Calibration completed:", calibration);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("focus_detection_calibration");
      if (stored) {
        const calib = JSON.parse(stored);
        setCalibrationResult(calib);
        console.log("Loaded calibration from storage:", calib);
      }
    } catch (e) {}
  }, []);

  const handleDistractionRef = useRef(handleDistraction);

  useEffect(() => {
    handleDistractionRef.current = handleDistraction;
  }, [handleDistraction]);

  const handleDistractionStable = useCallback((status: FocusStatus) => {
    handleDistractionRef.current(status);
  }, []);

  const {
    status: eyeTrackingStatus,
    startCalibration,
    calibrationCountdown,
    isCalibrating,
  } = useFocusDetection({
    videoElementRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasElementRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    onDistraction: handleDistractionStable,
    onCalibrationComplete: handleCalibrationComplete,
    config: {
      yawThresholdDeg: 15,
      pitchThresholdDeg: 12,
      enableOpenCV: false,
      autoLoadCalibration: true,
      minValidGazeSamples: 2,
      poseSmoothWindow: 3,
      gazeSmoothWindow: 2,
    },
  });

  const msPerWord = useMemo(() => (60 / readingSpeed) * 1000, [readingSpeed]);

  useEffect(() => {
    if (eyeTrackingStatus && previousStatusRef.current && previousStatusRef.current !== eyeTrackingStatus) {
      recordStatusChange(previousStatusRef.current, eyeTrackingStatus);
    }
    previousStatusRef.current = eyeTrackingStatus;
  }, [eyeTrackingStatus, recordStatusChange]);

  useEffect(() => {
    if (showWarning && eyeTrackingStatus === FocusStatus.focus) {
      setShowWarning(false);
      setWarningType(null);
    }
  }, [eyeTrackingStatus, showWarning]);

  useEffect(() => {
    try {
      setAudioEnabled(isSoundEnabled);
    } catch {}
  }, [isSoundEnabled]);

  const initializeWebcam = useCallback(async () => {
    try {
      console.log("Initializing webcam...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      console.log("Stream obtained:", stream);

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (videoRef.current) {
        console.log("Setting video srcObject");
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Video playing, setting isWebcamActive to true");
        setIsWebcamActive(true);
      } else {
        console.log("videoRef.current is still null after delay");
      }
    } catch (err) {
      console.error("Webcam access denied:", err);
      alert("Tidak dapat mengakses webcam. Pastikan izin kamera diberikan.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeWebcam();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  }, []);

  const mapReadingSpeedToSpeakingRate = (readingSpeed: number) => {
    const minWpm = 40;
    const maxWpm = 200;

    const t = (readingSpeed - minWpm) / (maxWpm - minWpm);

    const outputMin = 0.9;
    const outputRange = 2.5 - 0.9;
    return outputMin + t * outputRange;
  };

  const speakWord = useCallback(
    async (word: string) => {
      if (!isSpeechEnabled) return;

      const rate = mapReadingSpeedToSpeakingRate(readingSpeed);
      await speak(word.toLowerCase(), rate);
    },
    [isSpeechEnabled, speak, readingSpeed]
  );

  useEffect(() => {
    if (!isPlaying) return;
    if (!allWords.length) return;

    if (currentWordIndex >= allWords.length) {
      setIsPlaying(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const word = allWords[currentWordIndex].word;

      try {
        if (isSpeechEnabled) {
          await speakWord(word);
        } else {
          await new Promise<void>((resolve) => setTimeout(resolve, msPerWord));
        }
        if (!cancelled) {
          setCurrentWordIndex((prev) => prev + 1);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setIsPlaying(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPlaying, currentWordIndex, allWords, speakWord, isSpeechEnabled, msPerWord]);

  useEffect(() => {
    if (isPlaying) return;

    const currentElement = wordsRef.current[currentWordIndex];
    if (currentElement) {
      currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentWordIndex, isPlaying]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const resetReading = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setFocusHistory([]);
  };

  const handleNextQuestion = async () => {
    if (isWebcamActive) {
      stopWebcam();
    }

    setQuestionLoading(true);

    if (!sessionId || !storyId) {
      showToastError("SessionId atau StoryId tidak ditemukan.");
      setQuestionLoading(false);
      return;
    }

    const response = await TestSessionServices.StartQuestion(dispatch, sessionId, storyId);
    setQuestionLoading(false);

    if (response.success) {
      router.push("/siswa/test/stt/" + session?.id + "/1");
    }

    generateAndSendSummary(sessionId, dispatch);
    return;
  };

  const progress = Math.min((currentWordIndex + 1) / allWords.length, 1);
  const isFinished = progress >= 1;

  if (isQuestionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F2E3D1] to-[#EDD1B0]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#DE954F] mx-auto mb-4" />
          <p className="text-[#3b2a1a]/80">Memuat pertanyaan...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#EDD1B0] p-4 verdana">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#Fff8ec] border border-[#DE954F] rounded-xl shadow-md p-6 my-4">
          <h1 className="text-3xl font-bold text-[#5a4631] mb-2">{storyTitle}</h1> {storyDesc && <p className="text-[#5a4631] text-sm">{storyDesc}</p>}
        </div>
        <div className="bg-[#Fff8ec] border border-[#DE954F] rounded-xl shadow-md p-6 mb-4 w-[100%]">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button onClick={togglePlay} className="flex items-center gap-2 bg-[#DE954F] hover:[#DE954F]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />} {isPlaying ? "Jeda" : "Mulai"}
              </button>
              <button onClick={resetReading} className="flex items-center gap-2 bg-[#EDD1B0] hover:bg-[#DE954F] hover:text-white text-[#5a4631] px-4 py-3 rounded-lg transition-colors">
                <RotateCcw size={20} />
              </button>
              <button onClick={() => startCalibration(3)} disabled={isCalibrating} className="flex items-center gap-2 bg-[#EF8A3A] disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
                <Settings size={20} /> {isCalibrating ? `Kalibrasi... ${calibrationCountdown}s` : "Kalibrasi"}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSpeechEnabled((prev) => !prev)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${isSpeechEnabled ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-300 text-gray-700"}`}
              >
                {isSpeechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button
                onClick={() => (isWebcamActive ? stopWebcam() : initializeWebcam())}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${isWebcamActive ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-300 text-gray-700"}`}
              >
                {isWebcamActive ? <Camera size={20} /> : <CameraOff size={20} />}
              </button>
              <button onClick={() => setIsControlsExpanded((prev) => !prev)} className="flex items-center gap-2 bg-[#DE954F] hover:bg-[#DE954F]/90 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
                {isControlsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
          {isControlsExpanded && (
            <>
              <div className="mt-4 pt-2 border-t border-[#DE954F]/50">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[14px] block mb-1 font-semibold text-[#5a4631]">Progress</span> <span className="font-semibold">{Math.round((currentWordIndex / allWords.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#EDD1B0] rounded-lg">
                  <div className="bg-[#DE954F] h-2 rounded-full transition-all duration-300" style={{ width: `${(currentWordIndex / allWords.length) * 100}%` }} />
                </div>
              </div>
              <div className="mt-2 pt-2">
                <label className="text-[14px] block mb-1 font-semibold text-[#5a4631]">Kecepatan Membaca: {readingSpeed} WPM</label>
                <input type="range" min="50" max="200" step="5" value={readingSpeed} onChange={(e) => setReadingSpeed(Number(e.target.value))} className="w-full h-2 bg-[#DE954F]/60 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between text-xs text-[#5a4631]/80 mt-1">
                  <span>Lambat</span> <span>Sedang</span> <span>Cepat</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-[#Fff8ec] border border-[#DE954F] rounded-xl shadow-md p-8">
              <div className="space-y-4 text-lg leading-relaxed">
                {storyPassages.map((passage, pIdx) => (
                  <p key={pIdx} className="flex flex-wrap gap-1">
                    {passage.split(" ").map((word, wIdx) => {
                      const globalIndex = allWords.findIndex((w) => w.passageIndex === pIdx && w.wordIndex === wIdx);
                      const isCurrentWord = globalIndex === currentWordIndex;
                      const isPastWord = globalIndex < currentWordIndex;
                      return (
                        <span
                          key={wIdx}
                          ref={(el) => {
                            if (el) wordsRef.current[globalIndex] = el;
                          }}
                          className={`transition-all duration-200 px-1.5 py-0.5 rounded ${isCurrentWord ? "bg-[#DE954F] text-white font-bold scale-100 shadow-md" : isPastWord ? "text-[#5a4631]/30" : "text-[#5a4631]"}`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[#Fff8ec] border border-[#DE954F] rounded-xl shadow-md p-4">
              <div className="relative w-full h-48 rounded-lg overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className={`w-full h-full object-cover transform scale-x-[-1] ${isWebcamActive ? "block" : "hidden"}`} playsInline muted width={640} height={480} />
                {!isWebcamActive && <p className="text-[#DE954F] font-semibold text-center">Mohon aktifkan kamera ya!</p>}
              </div>
              <div className="min-h-12 bg-gradient-to-r from-[#FFF8EC] to-[#FFE8CC] rounded-lg border border-[#DE954F]/30 p-3 mt-3 flex items-center justify-center">
                {showWarning && warningType && (
                  <div
                    className={`text-center w-full animate-pulse ${
                      warningType === WarningType.not_detected ? "border-l-4 border-yellow-500" : warningType === WarningType.turning ? "border-l-4 border-red-500" : "border-l-4 border-orange-500"
                    } pl-3`}
                  >
                    <h3
                      className={`text-base font-bold mb-1 flex items-center justify-center gap-2 ${warningType === WarningType.not_detected ? "text-yellow-600" : warningType === WarningType.turning ? "text-red-600" : "text-orange-600"}`}
                    >
                      {WARNING_MESSAGES[warningType].title}
                    </h3>
                    <p className="text-[#5a4631] text-[12px]">{WARNING_MESSAGES[warningType].message}</p>
                  </div>
                )}
                {!showWarning && isWebcamActive && <p className="text-green-600 text-sm font-semibold">Fokusnya bagus, teruskan ya!</p>}
              </div>
            </div>
          </div>
        </div>
        <div
          className={`mt-6 w-[100%] border border-[#DE954F] rounded-xl shadow-md p-4 flex justify-center ${
            isFinished ? "bg-[#DE954F] text-white shadow-md hover:bg-[#C98342] hover:shadow-lg active:scale-95" : "bg-[#DE954F]/60 text-white cursor-not-allowed opacity-60"
          }`}
        >
          <button onClick={handleNextQuestion} disabled={!isFinished} className={`w-full sm:w-auto px-3 py-2 rounded-xl font-bold text-xl transition-all duration-300`}>
            {isFinished ? "Lanjut ke Sesi Pertanyaan" : "Selesaikan Membaca Dulu Yaa"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default BacaPage;
