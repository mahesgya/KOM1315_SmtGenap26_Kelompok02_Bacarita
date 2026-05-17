import { Expose } from 'class-transformer';
import { TestSession } from 'src/feature/test-session/entities/test-session.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoryStatus } from '../enum/story-status.enum';
import { Level } from './level.entity';
import { LevelProgress } from './level-progress.entity';
import { StoryMedal } from '../enum/story-medal.enum';
import { StoryApprovalLog } from './story-approval-log.entity';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Level, (level) => level.stories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'longtext' })
  description: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ type: 'longtext' })
  passage: string;

  @Column({
    type: 'enum',
    enum: StoryStatus,
    default: StoryStatus.WAITING_NEWLY,
  })
  status: StoryStatus = StoryStatus.WAITING_NEWLY;

  @OneToMany(
    () => StoryApprovalLog,
    (storyApprovalLog: StoryApprovalLog) => storyApprovalLog.story,
  )
  approvalLogs: StoryApprovalLog[];

  @OneToMany(() => TestSession, (testSession: TestSession) => testSession.story)
  testSessions: TestSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Expose()
  get imageUrl(): string | null {
    if (this.image) {
      return `${process.env.APP_URL}${this.image}`;
    }
    return null;
  }

  get passageSentences(): string[] {
    return Story.passageToSentences(this.passage);
  }

  public getHighestMedal(studentId: string): StoryMedal | null {
    if (!this.testSessions || this.testSessions.length === 0) {
      return null;
    }

    const studentTestSessions = this.testSessions.filter(
      (ts) => ts.student?.id === studentId,
    );

    if (studentTestSessions.length === 0) {
      return null;
    }

    let hasGold = false;
    let hasSilver = false;
    let hasBronze = false;

    for (const session of studentTestSessions) {
      if (session.medal === StoryMedal.GOLD) {
        hasGold = true;
        break; // Gold is the highest, no need to continue
      } else if (session.medal === StoryMedal.SILVER) {
        hasSilver = true;
      } else if (session.medal === StoryMedal.BRONZE) {
        hasBronze = true;
      }
    }

    if (hasGold) {
      return StoryMedal.GOLD;
    } else if (hasSilver) {
      return StoryMedal.SILVER;
    } else if (hasBronze) {
      return StoryMedal.BRONZE;
    }

    return null;
  }

  public isCurrentStudentValidForStory(studentId: string): boolean {
    return (
      this.level?.levelProgresses?.some(
        (lp: LevelProgress) => lp.student.id === studentId && lp.isUnlocked,
      ) ?? false
    );
  }

  public static passageToSentences(passage: string): string[] {
    return passage
      .split(/[.\n]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }
}
