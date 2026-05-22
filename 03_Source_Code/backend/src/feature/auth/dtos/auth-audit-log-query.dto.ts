import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AuditEvent, AuditRole } from '../entities/auth-audit-log.entity';

export const AUDIT_WINDOWS = ['24h', '7d', '30d', '90d'] as const;
export type AuditWindow = (typeof AUDIT_WINDOWS)[number];

export class AuthAuditLogQueryDTO {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsEnum(AuditEvent)
  event?: AuditEvent;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsEnum(AuditRole)
  role?: AuditRole;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsIn(AUDIT_WINDOWS)
  window?: AuditWindow;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
