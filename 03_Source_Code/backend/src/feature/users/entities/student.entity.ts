import { Exclude } from 'class-transformer';
import { LevelProgress } from 'src/feature/levels/entities/level-progress.entity';
import { TestSession } from 'src/feature/test-session/entities/test-session.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Parent } from './parent.entity';
import { Teacher } from './teacher.entity';

@Entity('students')
export class Student {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 90, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  token: string | null;

  @ManyToOne(() => Teacher, (teacher: Teacher) => teacher.students)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ManyToOne(() => Parent, (parent: Parent) => parent.students)
  @JoinColumn({ name: 'parent_id' })
  parent: Parent;

  @OneToMany(
    () => TestSession,
    (testSession: TestSession) => testSession.student,
  )
  testSessions: TestSession[];

  @OneToMany(
    () => LevelProgress,
    (levelProgress: LevelProgress) => levelProgress.student,
  )
  levelProgresses: LevelProgress[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
