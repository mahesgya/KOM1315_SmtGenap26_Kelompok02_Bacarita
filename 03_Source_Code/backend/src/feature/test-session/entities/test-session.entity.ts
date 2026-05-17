import { Expose } from 'class-transformer';
import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryMedal } from 'src/feature/levels/enum/story-medal.enum';
import { Student } from 'src/feature/users/entities/student.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DistractedEyeEvent } from './distracted-eye-event.entity';
import { DistractedEyeEventsSummary } from './distracted-eye-events-summary.entity';
import { STTWordResult } from './stt-word-result.entity';
import { DistractionType } from '../enums/distraction-type.enum';

@Entity('test_sessions')
export class TestSession {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Student, (student: Student) => student.testSessions, {
    onDelete: 'CASCADE',
  })
  student: Student;

  @ManyToOne(() => Story, (story: Story) => story.testSessions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  story?: Story;

  @OneToMany(
    () => STTWordResult,
    (sttWordResult: STTWordResult) => sttWordResult.testSession,
  )
  sttWordResults: STTWordResult[];

  @OneToMany(
    () => DistractedEyeEvent,
    (distractedEyeEvent: DistractedEyeEvent) => distractedEyeEvent.testSession,
  )
  distractedEyeEvents: DistractedEyeEvent[];

  @OneToOne(
    () => DistractedEyeEventsSummary,
    (summary: DistractedEyeEventsSummary) => summary.testSession,
  )
  distractedEyeEventsSummary?: DistractedEyeEventsSummary;

  @Column()
  titleAtTaken: string;

  @Column({ nullable: true })
  imageAtTaken?: string;

  @Column({ nullable: true, type: 'longtext' })
  descriptionAtTaken: string;

  @Column({ type: 'longtext' })
  passageAtTaken: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  finishedAt?: Date;

  @Column({
    type: 'enum',
    enum: StoryMedal,
    default: null,
    nullable: true,
  })
  medal?: StoryMedal;

  @Column({ type: 'float', nullable: true })
  score: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Expose()
  get imageAtTakenUrl(): string | null {
    if (this.imageAtTaken) {
      return `${process.env.APP_URL}${this.imageAtTaken}`;
    }
    return null;
  }

  @Expose()
  get remainingTimeInSeconds(): number {
    const TEST_SESSION_TEST_DURATION_IN_SECONDS = 120 * 60;
    if (this.startedAt && !this.finishedAt) {
      const now = new Date();
      const elapsedTimeInSeconds = Math.floor(
        (now.getTime() - this.startedAt.getTime()) / 1000,
      );
      const remainingTime =
        TEST_SESSION_TEST_DURATION_IN_SECONDS - elapsedTimeInSeconds;
      return remainingTime > 0 ? remainingTime : 0;
    }

    return 0;
  }

  public calculateScore(
    sttWordResults: STTWordResult[],
    distractedEyeEvents: DistractedEyeEvent[],
    textLength: number,
    isPreOrPostTest: boolean,
  ): number {
    let amsScore: number = 0;
    let adScore: number = 0;
    let avgScore: number = 0;
    if (sttWordResults.length === 0) {
      return 0;
    } // first to be implemented is STT, so if no result, score is 0

    for (const result of sttWordResults) {
      if (result.testSession.id === this.id) {
        amsScore += result.accuracy ?? 0;
      }
    }

    let distractedCount: number = 0;
    for (const eyeEvent of distractedEyeEvents) {
      if (eyeEvent.testSession.id === this.id) {
        if (
          eyeEvent.distractionType !== DistractionType.FOCUS &&
          eyeEvent.distractionType !== DistractionType.NOT_DETECTED
        ) {
          distractedCount += 1;
        }
      }
    }

    if (isPreOrPostTest) {
      // only AMS score matters
      amsScore = amsScore / sttWordResults.length;
      avgScore = amsScore;
    } else {
      adScore = 100 - distractedCount / (textLength * 0.15);
      amsScore = amsScore / sttWordResults.length;
      avgScore = amsScore * 0.6 + adScore * 0.4;
    }

    return avgScore;
  }

  public determineMedal(): StoryMedal {
    if (this.score >= 75) {
      return StoryMedal.GOLD;
    } else if (this.score >= 50) {
      return StoryMedal.SILVER;
    } else {
      return StoryMedal.BRONZE;
    }
  }
}
