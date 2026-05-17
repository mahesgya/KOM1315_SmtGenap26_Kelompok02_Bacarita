"use client";

import CelebrationPopup from "@/components/ui/celebrate.effect";
import { calculateAccuracy } from "@/components/utils/levenshtein.utils";
import { showToastError, showToastSuccess } from "@/components/utils/toast.utils";
import { useGoogleTts } from "@/hooks/use.google.tts";
import { AppDispatch, RootState } from "@/redux/store";
import TestSessionServices from "@/services/test-session.services";
import { QuestionState, QuestionWithNumber, SpeechRecognitionInterface } from "@/types/question.types";
import { AlertCircle, CheckCircle, ChevronRight, Loader, Mic, MicOff, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const QuestionPage = () => {
  const router = useRouter();
  const { speak } = useGoogleTts();
  const dispatch: AppDispatch = useDispatch();
  const SessionData = useSelector((state: RootState) => state.testSession.activeSession);
  const QuestionsDataFromRedux = useSelector((state: RootState) => state.questionsData.activeQuestions);
  const params = useParams<{ id: string; no: string }>();

  const SessionId = SessionData?.data.id;
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [questionsData, setQuestionsData] = useState<QuestionWithNumber[]>([]);

  const [questionState, setQuestionState] = useState<QuestionState>({
    isRecording: false,
    spokenText: "",
    accuracy: null,
    isSubmitting: false,
  });

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInterface;
      webkitSpeechRecognition?: new () => SpeechRecognitionInterface;
    };

    const SpeechRecognitionConstructor = SpeechRecognitionAPI.SpeechRecognition || SpeechRecognitionAPI.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setQuestionState((prev) => ({
        ...prev,
        error: "Speech Recognition tidak didukung di browser Anda",
      }));
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "id-ID";

    recognition.onstart = () => {
      setQuestionState((prev) => ({
        ...prev,
        isRecording: true,
        spokenText: "",
        error: null,
      }));
    };

    recognition.onresult = (event: Event) => {
      const speechEvent = event as unknown as {
        resultIndex: number;
        results: Array<Array<{ transcript: string }>> & { isFinal: boolean }[];
      };

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
        const transcript = speechEvent.results[i][0].transcript;
        if (speechEvent.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setQuestionState((prev) => ({
        ...prev,
        spokenText: finalTranscript || interimTranscript,
      }));
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as unknown as { error: string };
      setQuestionState((prev) => ({
        ...prev,
        error: `Error: ${errorEvent.error}`,
        isRecording: false,
      }));
    };

    recognition.onend = () => {
      setQuestionState((prev) => ({
        ...prev,
        isRecording: false,
      }));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!QuestionsDataFromRedux || QuestionsDataFromRedux.length === 0) {
        return;
      }
      setQuestionsData(QuestionsDataFromRedux);
    };

    fetchQuestion();
  }, [QuestionsDataFromRedux]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      setQuestionState((prev) => ({
        ...prev,
        error: "Speech Recognition belum diinisialisasi",
      }));
      return;
    }
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakExpectedWord = () => {
    const currentQuestion = questionsData[Number(params.no) - 1];
    if (!currentQuestion) return;

    speak(currentQuestion.expectedWord)
  };

  const handleSubmitAnswer = async () => {
    if (!questionState.spokenText.trim()) {
      setQuestionState((prev) => ({
        ...prev,
      }));
      return;
    }

    const currentQuestion = questionsData[Number(params.no) - 1];
    if (!currentQuestion) return;

    setQuestionState((prev) => ({
      ...prev,
      isSubmitting: true,
    }));

    const accuracy = calculateAccuracy(questionState.spokenText, currentQuestion.expectedWord);

    if (!SessionId) {
      showToastError("SessionId tidak ditemukan");
      return;
    }

    const response = await TestSessionServices.AnswerQuestion(dispatch, SessionId, currentQuestion.id, {
      spokenWord: questionState.spokenText,
      accuracy: accuracy,
    });

    if (response.success === false) {
      showToastError(response.error);
      return;
    }

    showToastSuccess("Jawaban berhasil dikirim!");
    setShowCelebration(true);
    setQuestionState((prev) => ({
      ...prev,
      accuracy,
      isSubmitting: false,
      error: null,
    }));
  };

  const handleCompleteCelebration = () => {
    setShowCelebration(false);
  };

  const handleNext = () => {
    if (Number(params.no) < questionsData.length) {
      const nextIndex = Number(params.no) + 1;

      setQuestionState({
        isRecording: false,
        spokenText: "",
        accuracy: null,
        isSubmitting: false,
      });

      router.push(`/siswa/test/stt/${SessionId}/${nextIndex}`);
    } else {
      showToastSuccess("Semua pertanyaan selesai!");

      if (!SessionId) {
        showToastError("SessionId tidak ditemukan");
        router.push("/siswa/beranda");
        return;
      }
      TestSessionServices.FinishTest(dispatch, SessionId);
      router.push("/siswa/beranda");
    }
  };

  if (!questionsData || questionsData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F2E3D1] to-[#EDD1B0]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#DE954F] mx-auto mb-4" />
          <p className="text-[#3b2a1a]/80">Pertanyaan tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questionsData[Number(params.no) - 1];
  const isAnswered = questionState.accuracy !== null;
  const progress = ((Number(params.no) + 1) / questionsData.length) * 100;

  return (
    <div className="verdana min-h-screen bg-[#EDD1B0] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 bg-[#Fff8ec] rounded-2xl shadow-lg p-8 border border-[#DE954F]">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#5a4631]">Sesi Tes Pengucapan</h1>
            <div className="text-sm font-semibold text-[#5a4631] px-4 py-2 rounded-xl border border-[#DE954F] shadow-md">
              Pertanyaan {currentQuestion.number} / {questionsData.length}
            </div>
          </div>
          <div className="w-full bg-[#EDD1B0] rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#DE954F] to-[#EDD1B0] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-[#Fff8ec] rounded-2xl shadow-lg p-8 mb-6 border border-[#DE954F]">
          <div className="mb-6 inline-block">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#DE954F] text-white font-bold text-xl">{currentQuestion.number}</span>
          </div>

          <div className="mb-8">
            <p className="text-sm text-[#5a4631] mb-3 font-medium tracking-wide">Coba baca dengan lantang ya:</p>
            <div className="shadow-sm rounded-xl p-8 border-2 border-[#DE954F] mb-4">
              <p className="text-3xl font-bold text-[#5a4631] text-center leading-relaxed">{currentQuestion.expectedWord}</p>
            </div>
            <button onClick={speakExpectedWord} className="shadow-sm w-full flex items-center justify-center gap-2 px-4 py-3 text-[#5a4631] rounded-lg font-semibold transition-colors border-2 border-[#DE954F]">
              <Volume2 className="w-5 h-5" />
              Dengarkan bacaannya
            </button>
          </div>

          <div className="mb-8 border-t border-[#DE954F] pt-8">
            <p className="text-sm text-[#5a4631] mb-4 font-medium tracking-wide">Rekam bacaan kamu:</p>

            <div className="flex gap-3 mb-6">
              {!questionState.isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isAnswered}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#DE954F] to-[#DE954F] hover:from-[#DE954F]/90 hover:to-[#DE954F]/90 text-white rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <Mic className="w-6 h-6" />
                  Mulai Rekam
                </button>
              ) : (
                <button onClick={stopRecording} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#DE954F] hover:bg-[#DE954F]/90 text-white rounded-lg font-bold text-lg transition-all animate-pulse shadow-md">
                  <MicOff className="w-6 h-6" />
                  Berhenti
                </button>
              )}
            </div>

            {questionState.spokenText && (
              <div className="bg-[#F9F5F1] rounded-lg p-4 mb-6 border border-[#DE954F] shadow-sm">
                <p className="text-sm text-[#5a4631] mb-2">Hasil Rekam:</p>
                <input
                  type="text"
                  value={questionState.spokenText}
                  onChange={(e) => setQuestionState((prev) => ({ ...prev, spokenText: e.target.value }))}
                  className="text-lg text-[#5a4631] w-full bg-transparent border-none outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={isAnswered}
                />
              </div>
            )}
          </div>

          {isAnswered && (
            <div className="mb-8 p-4 shadow-sm border border-[#DE954F] rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#3b2a1a] mb-1">Hasil bacaan kamu:</p>
                  <p className="text-4xl font-extrabold text-[#3b2a1a]">{questionState.accuracy}%</p>
                </div>
                <CheckCircle className="w-16 h-16 text-[#DE954F]" />
              </div>
              <div className="w-full bg-[#F2E3D1] rounded-full h-3 overflow-hidden">
                <div className="h-full bg-[#DE954F] transition-all duration-300" style={{ width: `${questionState.accuracy}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!isAnswered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!questionState.spokenText.trim() || questionState.isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DE954F] to-[#DE954F] hover:from-[#DE954F]/90 hover:to-[#DE954F]/90 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {questionState.isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Kirim Jawaban
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={questionState.isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DE954F] to-[#DE954F] hover:from-[#DE954F]/90 hover:to-[#DE954F]/90 text-white rounded-lg font-semibold transition-all disabled:opacity-50 shadow-lg"
            >
              {Number(params.no) < questionsData.length ? (
                <>
                  Pertanyaan Berikutnya
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Selesai
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <CelebrationPopup show={showCelebration} onComplete={handleCompleteCelebration} accuracy={questionState?.accuracy} />
    </div>
  );
};

export default QuestionPage;
