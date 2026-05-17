import { AuthRole } from '../enums/auth.enum';

export interface ICurrentUser {
  id: string;
  email: string;
  username: string;
  role: AuthRole;
}
