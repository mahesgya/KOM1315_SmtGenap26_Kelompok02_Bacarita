import { SetMetadata } from '@nestjs/common';
import { AuthDecorator } from '../enums/auth.enum';

export const Auth = (...roles: string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(AuthDecorator.ROLES_KEY, roles);
