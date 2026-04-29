import { RoleName } from './auth.models';

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleInfo | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface RoleInfo {
  id: number;
  name: RoleName;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleName?: RoleName;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  roleName?: RoleName;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserMutationResponse {
  message: string;
  user: User;
}
