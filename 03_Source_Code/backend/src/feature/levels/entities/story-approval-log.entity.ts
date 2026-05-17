import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StoryStatus } from '../enum/story-status.enum';
import { Story } from './story.entity';
import { Curator } from 'src/feature/users/entities/curator.entity';

@Entity('story_approval_logs')
export class StoryApprovalLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Story, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  @Column({
    type: 'enum',
    enum: StoryStatus,
    name: 'from_status',
  })
  fromStatus: StoryStatus;

  @Column({
    type: 'enum',
    enum: StoryStatus,
    name: 'to_status',
  })
  toStatus: StoryStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ManyToOne(() => Curator, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'curator_id' })
  curator: Curator | null;

  @CreateDateColumn()
  createdAt: Date;
}
