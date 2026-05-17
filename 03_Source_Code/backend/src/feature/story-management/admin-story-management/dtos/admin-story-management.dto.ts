import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';
import { ApprovalLogDTO } from '../../curator-story-approval/dtos/curator-story-approval.dto';

export class LevelsOverviewDTO {
  levels: LevelDTO[];
  levelsCount: number;
  storiesCount: number;
}

export class LevelDTO {
  id: number;
  no: number;
  name: string;
  fullName: string;
  storyCount?: number | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class LevelWithStoriesDTO {
  id: number;
  no: number;
  name: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  stories: StoryDTO[];
}

export class StoryDTO {
  id: number;
  title: string;
  description?: string | null | undefined;
  image?: string | null | undefined;
  imageUrl?: string | null | undefined;
  passage: string;
  sentences: string[];
  status: StoryStatus;
  createdAt: Date;
  updatedAt: Date;
  approvalLogs?: ApprovalLogDTO[] | null | undefined;
}
