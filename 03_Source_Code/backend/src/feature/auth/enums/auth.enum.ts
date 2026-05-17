export enum AuthDecorator {
  ROLES_KEY = 'roles',
}

export enum AuthRole {
  ANY = 'any',
  ADMIN = 'admin',
  CURATOR = 'curator',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

export const AUTH_REQUEST_USER_KEY = 'user';
