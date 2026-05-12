import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface UserRole {
  id: string;
  name: string;
  value: string;
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  username: string;
  roleId: string;
  role: UserRole;
  active: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  isLoggedIn?: boolean;
  schedule?: Schedule;
  scheduleId?: string;
}

export interface CreateUserDto {
  name: string;
  lastName: string;
  username: string;
  password?: string;
  roleId: string;
  scheduleId?: string;
}

export interface UpdateUserDto {
  name?: string;
  lastName?: string;
  username?: string;
  roleId?: string;
  scheduleId?: string;
}

export interface ChangePasswordDto {
  oldPassword?: string;
  newPassword: string;
}

/**
 * Fetch all users (simple list)
 */
export const getUsers = async (): Promise<TResult<User[]>> => {
  return await get<User[]>("/users");
};

/**
 * Fetch users with pagination and filters
 */
export const getPaginatedUsers = async (params: {
  page: number;
  limit: number;
  search?: string;
  filters?: Record<string, any>;
}): Promise<TResult<{ rows: User[]; total: number }>> => {
  return await post<{ rows: User[]; total: number }>("/users/datatable", params);
};

/**
 * Create a new user
 */
export const createUser = async (data: CreateUserDto): Promise<TResult<User>> => {
  return await post<User>("/users", data);
};

/**
 * Update user profile
 */
export const updateUser = async (id: string, data: UpdateUserDto): Promise<TResult<User>> => {
  return await put<User>(`/users/${id}`, data);
};

/**
 * Change own password (requires old password)
 */
export const changePassword = async (id: string, data: ChangePasswordDto): Promise<TResult<void>> => {
  return await put<void>(`/users/${id}/password`, data);
};

/**
 * Admin reset password (no old password required)
 */
export const resetPassword = async (id: string, password: string): Promise<TResult<void>> => {
  return await put<void>(`/users/${id}/reset-password`, { newPassword: password });
};

/**
 * Delete (Soft or Hard) a user
 */
export const deleteUser = async (id: string): Promise<TResult<void>> => {
  return await remove<void>(`/users/${id}`);
};

/**
 * Get available roles for selection
 */
export const getRoles = async (): Promise<TResult<UserRole[]>> => {
  return await get<UserRole[]>("/users/roles");
};
