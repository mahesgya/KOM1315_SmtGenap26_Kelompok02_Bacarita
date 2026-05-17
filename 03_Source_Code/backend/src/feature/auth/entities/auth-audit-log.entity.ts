import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditEvent {
  LOGIN_OK = 'LOGIN_OK',
  LOGIN_FAIL = 'LOGIN_FAIL',
  LOGOUT = 'LOGOUT',
  LOCKED = 'LOCKED',
}

export enum AuditRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  CURATOR = 'curator',
}

@Entity('auth_audit_logs')
export class AuthAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId: string | null;

  @Column({
    type: 'enum',
    enum: AuditRole,
    nullable: true,
  })
  role: AuditRole | null;

  @Column({
    type: 'enum',
    enum: AuditEvent,
  })
  event: AuditEvent;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;
}
