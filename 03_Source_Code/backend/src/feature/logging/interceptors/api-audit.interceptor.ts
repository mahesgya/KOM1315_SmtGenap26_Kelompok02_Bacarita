import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { LoggingService } from '../logging.service';
import { AuditRole } from '../entities/auth-audit-log.entity';
import { ICurrentUser } from '../../auth/interfaces/current-user.interfaces';

type AuthedRequest = Request & { user?: ICurrentUser };

@Injectable()
export class ApiAuditInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthedRequest>();
    const response = http.getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.capture(request, response.statusCode, Date.now() - startTime);
      }),
      catchError((err: unknown) => {
        const status =
          err != null &&
          typeof err === 'object' &&
          'status' in err &&
          typeof (err as { status: unknown }).status === 'number'
            ? (err as { status: number }).status
            : 500;
        this.capture(request, status, Date.now() - startTime);
        return throwError(() => err);
      }),
    );
  }

  private capture(
    request: AuthedRequest,
    statusCode: number,
    durationMs: number,
  ): void {
    const user = request.user;
    const route = request.route as { path?: string } | undefined;
    const endpoint = route?.path ?? request.path;

    this.loggingService.saveApiLog({
      userId: user?.id ?? null,
      role: (user?.role as AuditRole | undefined) ?? null,
      method: request.method,
      endpoint,
      statusCode,
      durationMs,
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    });
  }
}
