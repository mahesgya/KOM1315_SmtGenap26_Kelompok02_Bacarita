/**
 * Representing DTO objects that student will receive when requesting level data in their dashboard
 */
export class StudentLevelResponseDTO {
  id: number;
  no: number;
  name: string;
  fullName: string;
  isUnlocked: boolean;
  isSkipped: boolean;
  isBonusLevel: boolean;
  maxPoints: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  isCompleted: boolean;
  requiredPoints: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  stories: StudentStoryResponseDTO[];
}

export class StudentStoryResponseDTO {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  isGoldMedal: boolean;
  isSilverMedal: boolean;
  isBronzeMedal: boolean;
  createdAt: Date;
  updatedAt: Date;
}
