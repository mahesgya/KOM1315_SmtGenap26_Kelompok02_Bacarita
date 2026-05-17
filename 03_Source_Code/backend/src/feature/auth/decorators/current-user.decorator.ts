import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Request } from 'express';
import { ICurrentUser } from '../interfaces/current-user.interfaces';
import { AUTH_REQUEST_USER_KEY } from '../enums/auth.enum';

export const CurrentUser = createParamDecorator(
  (field: keyof ICurrentUser | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest<Request>();
    const user: ICurrentUser = request[AUTH_REQUEST_USER_KEY] as ICurrentUser;

    // If a user passes a field to the decorator use only that field
    return field ? user?.[field] : user;
  },
);
