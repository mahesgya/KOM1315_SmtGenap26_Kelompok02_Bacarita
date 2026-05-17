export class STTQuestionResponseDTO {
  id: string;
  instruction?: string | null | undefined;
  expectedWord: string;
  createdAt: Date;
  updatedAt: Date;
}
