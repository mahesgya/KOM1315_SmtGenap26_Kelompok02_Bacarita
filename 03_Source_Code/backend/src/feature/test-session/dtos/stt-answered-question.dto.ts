export class STTAnsweredQuestionDTO {
  id: string;
  instruction?: string | null | undefined;
  expectedWord: string;
  spokenWord: string;
  accuracy: number;
  createdAt: Date;
  updatedAt: Date;
}
