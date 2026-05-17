import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TestSession } from './test-session.entity';

@Entity('distracted_eye_events_summaries')
export class DistractedEyeEventsSummary {
  @PrimaryColumn()
  id: string;

  @OneToOne(() => TestSession, (testSession: TestSession) => testSession.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_session_id' })
  testSession: TestSession;

  @Column({ type: 'float' })
  totalSessionDurationSec: number;

  @Column({ type: 'float' })
  timeBreakdownFocus: number;

  @Column({ type: 'float' })
  timeBreakdownTurning: number;

  @Column({ type: 'float' })
  timeBreakdownGlance: number;

  @Column({ type: 'float' })
  timeBreakdownNotDetected: number;

  @Column({ type: 'int' })
  turningTriggersCount: number;

  @Column({ type: 'int' })
  glanceTriggersCount: number;

  @Column({ type: 'float' })
  avgPoseVariance: number;

  @Column({ type: 'int' })
  longFixationCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
