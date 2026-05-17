import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AUTH_REQUEST_USER_KEY, AuthDecorator, AuthRole } from '../enums/auth.enum';
import { ICurrentUser } from '../interfaces/current-user.interfaces';

const makeContext = (
  authHeader: string | undefined,
  handlerRoles?: string[],
  classRoles?: string[],
): ExecutionContext => {
  const request: Record<string, unknown> = {
    headers: { authorization: authHeader },
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    _request: request,
  } as unknown as ExecutionContext;
};

describe('Unit Test: AuthGuard — AAA Authorization Layer', () => {
  let guard: AuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let authService: {
    verifyJwtToken: jest.Mock;
    verifyTokenHash: jest.Mock;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    authService = {
      verifyJwtToken: jest.fn(),
      verifyTokenHash: jest.fn(),
    };

    guard = new AuthGuard(reflector, authService as any);
  });

  // -------------------------------------------------------------------------
  // Authentication failures (no / invalid token → 401)
  // -------------------------------------------------------------------------

  it('must throw 401 when Authorization header is absent', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('must throw 401 when Authorization header has no token part', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeContext('Bearer ');
    authService.verifyJwtToken.mockReturnValue(null);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('must throw 401 when JWT is invalid or expired', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeContext('Bearer invalid.jwt.token');
    authService.verifyJwtToken.mockReturnValue(null);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('must throw 401 when token hash does not match DB record (revoked token)', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const user: ICurrentUser = {
      id: 'u-001',
      email: 'test@example.com',
      username: 'testuser',
      role: AuthRole.STUDENT,
    };
    authService.verifyJwtToken.mockReturnValue(user);
    authService.verifyTokenHash.mockResolvedValue(false);

    const ctx = makeContext('Bearer valid.but.revoked');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  // -------------------------------------------------------------------------
  // Authorization failures (wrong role → 403)
  // -------------------------------------------------------------------------

  it('must throw 403 when authenticated user has insufficient role (student accessing teacher route)', async () => {
    reflector.getAllAndOverride.mockReturnValue([AuthRole.TEACHER]);
    const user: ICurrentUser = {
      id: 'u-002',
      email: '',
      username: 'student01',
      role: AuthRole.STUDENT,
    };
    authService.verifyJwtToken.mockReturnValue(user);
    authService.verifyTokenHash.mockResolvedValue(true);

    const ctx = makeContext('Bearer valid.teacher.only.route');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('must throw 403 when authenticated user has insufficient role (parent accessing admin route)', async () => {
    reflector.getAllAndOverride.mockReturnValue([AuthRole.ADMIN]);
    const user: ICurrentUser = {
      id: 'u-003',
      email: 'parent@example.com',
      username: 'parent01',
      role: AuthRole.PARENT,
    };
    authService.verifyJwtToken.mockReturnValue(user);
    authService.verifyTokenHash.mockResolvedValue(true);

    const ctx = makeContext('Bearer valid.admin.only.route');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  // -------------------------------------------------------------------------
  // Happy paths
  // -------------------------------------------------------------------------

  it('must allow access when role matches required role', async () => {
    reflector.getAllAndOverride.mockReturnValue([AuthRole.TEACHER]);
    const user: ICurrentUser = {
      id: 'u-004',
      email: 'teacher@example.com',
      username: 'teacher01',
      role: AuthRole.TEACHER,
    };
    authService.verifyJwtToken.mockReturnValue(user);
    authService.verifyTokenHash.mockResolvedValue(true);

    const ctx = makeContext('Bearer valid.teacher.token');
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect((ctx.switchToHttp().getRequest() as Record<string, unknown>)[AUTH_REQUEST_USER_KEY]).toEqual(user);
  });

  it('must allow access when ANY role is accepted', async () => {
    reflector.getAllAndOverride.mockReturnValue([AuthRole.ANY]);
    const user: ICurrentUser = {
      id: 'u-005',
      email: '',
      username: 'siswa99',
      role: AuthRole.STUDENT,
    };
    authService.verifyJwtToken.mockReturnValue(user);
    authService.verifyTokenHash.mockResolvedValue(true);

    const ctx = makeContext('Bearer valid.any.role.token');
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('must allow access when no roles are required (public-ish guarded route)', async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const user: ICurrentUser = {
      id: 'u-006',
      email: 'admin@example.com',
      username: 'admin01',
      role: AuthRole.ADMIN,
    };
    authService.verifyJwtToken.mockReturnValue(user);
    authService.verifyTokenHash.mockResolvedValue(true);

    const ctx = makeContext('Bearer valid.no.role.constraint');
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
