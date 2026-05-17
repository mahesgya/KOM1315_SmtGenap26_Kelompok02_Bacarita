import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';

export class StoryForApprovalDTO {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  passage: string;
  sentences: string[];
  status: StoryStatus;
  levelId?: number;
  levelName?: string;
  levelFullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StoriesForApprovalListDTO {
  stories: StoryForApprovalDTO[];
  totalWaiting: number;
}

export class ApprovalLogDTO {
  id: number;
  storyId: number;
  fromStatus: StoryStatus;
  toStatus: StoryStatus;
  reason?: string | null;
  curatorId?: string | null;
  curatorName?: string | null;
  createdAt: Date;
}

export class StoryWithApprovalLogsDTO extends StoryForApprovalDTO {
  approvalLogs: ApprovalLogDTO[];
}
