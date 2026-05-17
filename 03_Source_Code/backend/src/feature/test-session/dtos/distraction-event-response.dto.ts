import { DistractionType } from '../enums/distraction-type.enum';

export class DistractionEventResponseDTO {
  id: string;
  distractionType: DistractionType;
  triggerDurationMs: number;
  occurredAtWord: string;
  createdAt: Date;
  updatedAt: Date;
}
