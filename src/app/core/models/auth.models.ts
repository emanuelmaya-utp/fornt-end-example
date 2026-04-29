export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface DecodedToken {
  id: number;
  email: string;
  roleId: number;
  roleName: RoleName;
  iat: number;
  exp: number;
}

export type RoleName = 'superuser' | 'admin' | 'user';

export type Permission =
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'admins:create';

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  superuser: ['users:create', 'users:read', 'users:update', 'users:delete', 'admins:create'],
  admin: ['users:create', 'users:read', 'users:update', 'users:delete'],
  user: []
};
