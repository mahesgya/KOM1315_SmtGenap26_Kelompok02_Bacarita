export class DistractionSummaryResponseDTO {
  id: string;
  totalSessionDurationSec: number;
  timeBreakdownFocus: number;
  timeBreakdownTurning: number;
  timeBreakdownGlance: number;
  timeBreakdownNotDetected: number;
  turningTriggersCount: number;
  glanceTriggersCount: number;
  avgPoseVariance: number;
  longFixationCount: number;
  createdAt: Date;
  updatedAt: Date;
}
