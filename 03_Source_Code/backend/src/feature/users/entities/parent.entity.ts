import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Exclude } from 'class-transformer';

@Entity('parents')
export class Parent {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

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

  @OneToMany(() => Student, (student: Student) => student.parent)
  students: Student[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
