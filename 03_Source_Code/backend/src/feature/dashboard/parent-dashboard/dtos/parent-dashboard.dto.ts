import { StoryMedal } from 'src/feature/levels/enum/story-medal.enum';
import { DistractionEventResponseDTO } from 'src/feature/test-session/dtos/distraction-event-response.dto';
import { DistractionSummaryResponseDTO } from 'src/feature/test-session/dtos/distraction-summary-response.dto';

export class STTWordResultDTO {
  id: string;
  instruction?: string;
  expectedWord: string;
  spokenWord?: string;
  accuracy?: number;
  createdAt: Date;
}

export class LevelProgressDTO {
  levelId: number;
  levelNo: number;
  levelName: string;
  levelFullName: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  currentPoints: number;
  maxPoints: number;
  progress: number;
  requiredPoints: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ParentDashboardStudentDTO {
  id: string;
  username: string;
  fullName: string;
  teacher: {
    id: string;
    username: string;
    fullName: string;
  };
  totalTestSessions: number;
  completedTestSessions: number;
  inProgressTestSessions: number;
  averageScore: number;
  lastTestSessionAt?: Date;
  levelProgresses: LevelProgressDTO[];
  createdAt: Date;
}

export class ParentDashboardTestSessionDTO {
  id: string;
  student: {
    id: string;
    username: string;
    fullName: string;
  };
  levelFullName: string;
  titleAtTaken: string;
  startedAt: Date;
  finishedAt?: Date;
  medal?: StoryMedal;
  score: number;
  isCompleted: boolean;
  sttWordResults: STTWordResultDTO[];
  distractedEyeEvents: DistractionEventResponseDTO[];
  distractedEyeEventsSummary?: DistractionSummaryResponseDTO;
}

export class ParentDashboardOverviewDTO {
  totalStudents: number;
  totalTestSessions: number;
  completedTestSessions: number;
  inProgressTestSessions: number;
  averageScore: number;
  testSessions: ParentDashboardTestSessionDTO[];
}
