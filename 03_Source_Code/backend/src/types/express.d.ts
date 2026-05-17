import { ICurrentUser } from '../feature/auth/interfaces/current-user.interfaces';

declare namespace Express {
  export interface Request {
    user?: ICurrentUser;
  }
}
