import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryMedal } from 'src/feature/levels/enum/story-medal.enum';
import { Student } from 'src/feature/users/entities/student.entity';

export class TestSessionResponseDTO {
  id: string;
  student: Student;
  story?: Story | undefined | null;
  levelFullName?: string | undefined | null;
  titleAtTaken: string;
  imageAtTaken?: string | undefined | null;
  imageAtTakenUrl?: string | undefined | null;
  descriptionAtTaken: string;
  passageAtTaken: string;
  passagesAtTaken: string[];
  startedAt: Date;
  finishedAt?: Date | undefined | null;
  remainingTimeInSeconds: number;
  medal?: StoryMedal | undefined | null;
  score: number;
  isCompleted?: boolean | undefined | null;
  createdAt: Date;
  updatedAt: Date;
}
