import { SuccessPayload, ErrorPayload, BadRequestErrorPayload } from "./general.types";

export interface Question {
  id: string;
  instruction: string;
  expectedWord: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionListSuccessPayload extends SuccessPayload {
  data: Question[];
}

export interface QuestionWithNumber extends Question {
  number: number;
}

export type QuestionListResponse = QuestionListSuccessPayload | ErrorPayload;

export interface QuestionAnswer {
  id: string;
  instruction: string;
  expectedWord: string;
  spokenWord: string;
  accuracy: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionAnswerSuccessPayload extends SuccessPayload {
  data: QuestionAnswer;
}

export type QuestionAnswerResponse = QuestionAnswerSuccessPayload | ErrorPayload | BadRequestErrorPayload;

export interface QuestionState {
  isRecording: boolean;
  spokenText: string;
  accuracy: number | null;
  isSubmitting: boolean;
}

export interface SpeechRecognitionInterface {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
