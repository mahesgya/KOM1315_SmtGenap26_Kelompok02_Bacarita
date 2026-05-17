import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TestSession } from './test-session.entity';

@Entity('stt_word_results')
export class STTWordResult {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => TestSession, (testSession: TestSession) => testSession.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_session_id' })
  testSession: TestSession;

  @Column({ type: 'longtext', nullable: true })
  instruction?: string;

  @Column({ type: 'varchar', length: 255 })
  expectedWord: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  spokenWord?: string;

  @Column({ type: 'float', nullable: true })
  accuracy?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  public canBeAnswered(): boolean {
    return this.spokenWord == null || this.accuracy == null;
  }
}
