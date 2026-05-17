import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DistractionType } from '../enums/distraction-type.enum';
import { TestSession } from './test-session.entity';

@Entity('distracted_eye_events')
export class DistractedEyeEvent {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => TestSession, (testSession: TestSession) => testSession.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_session_id' })
  testSession: TestSession;

  @Column({
    type: 'enum',
    enum: DistractionType,
  })
  distractionType: DistractionType;

  @Column({ type: 'int' })
  triggerDurationMs: number;

  @Column({ type: 'varchar', length: 255 })
  occurredAtWord: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
