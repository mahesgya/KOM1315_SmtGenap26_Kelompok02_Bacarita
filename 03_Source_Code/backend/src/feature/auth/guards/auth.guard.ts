import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';
import {
  AUTH_REQUEST_USER_KEY,
  AuthDecorator,
  AuthRole,
} from '../enums/auth.enum';
import { ICurrentUser } from '../interfaces/current-user.interfaces';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles: string[] = this.reflector.getAllAndOverride<string[]>(
      AuthDecorator.ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request: Request = context.switchToHttp().getRequest<Request>();

    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException();
    const token: string = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException();

    const user: ICurrentUser | null = this.authService.verifyJwtToken(token);
    if (!user) throw new UnauthorizedException();

    if (user) {
      // Attach user to request
      request[AUTH_REQUEST_USER_KEY] = user;
      // No roles required → allow anyone
      if (!requiredRoles || requiredRoles.length === 0) return true;

      // Allow ANY
      if (requiredRoles.includes(AuthRole.ANY)) return true;

      // Check role from JWT payload
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException();
      }
    }

    // user is good
    return true;
  }
}
