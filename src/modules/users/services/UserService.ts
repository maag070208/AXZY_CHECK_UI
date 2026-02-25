import { get, post, put } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

import { Schedule } from "../../schedules/SchedulesService";

export interface User {
  id: number;
  name: string;
  lastName: string;
  username: string;
  role: "ADMIN" | "OPERATOR" | "GUARD" | "SHIFT_GUARD" | "USER" | "MANTENIMIENTO";
  active: boolean;
  shiftStart?: string; // HH:mm
  shiftEnd?: string;   // HH:mm
  isLoggedIn?: boolean;
  schedule?: Schedule;
  scheduleId?: number;
}

export interface CreateUserDto {
  name: string;
  lastName: string;
  username: string;
  password?: string;
  role: string;
  shiftStart?: string;
  shiftEnd?: string;
  scheduleId?: number;
}

export interface UpdateUserDto {
    name?: string;
    lastName?: string;
    username?: string;
    role?: string;
    shiftStart?: string;
    shiftEnd?: string;
    scheduleId?: number;
}

export interface ChangePasswordDto {
    oldPassword?: string; // Optional if admin resets it? API checks oldPassword. Wait, for admin usage usually we don't need old password.
    // API: changePassword controller checks oldPassword. This means it's a "User changes own password" flow.
    // But for "Admin resets password", usually we don't need old.
    // Let's re-read API controller.
    // export const changePassword = async (req: Request, res: Response) => { ... const { oldPassword, newPassword } = req.body; ... const isValid = await comparePassword(oldPassword, user.password); ... }
    // It enforces old password. So this is strictly for "My Profile" or similar.
    // Is there an admin endpoint to reset? 
    // `updateUserProfile` only takes { name, lastName, username, shiftStart, shiftEnd }.
    // It seems there is NO Admin Reset Password endpoint currently visible in the controller I read.
    // `createUser` hashes password.
    // `updateUser` service method is used by `updateUserProfile` and `changePassword`.
    // I might need to implement a new endpoint/method for Admin to reset password without old password if that's a requirement.
    // The user said "agregar las acciones que tenemos como en la checkapp". CheckApp usually has edit/password.
    // If I can't reset password without old password, I can't make a "Reset Password" button for Admin.
    // HOWEVER, I can modify the API if needed? The user said "revisa todo y la API". 
    // I'll stick to what is there for now or check if I can add a `resetPassword` endpoint. 
    // For now, I'll add the method as is.
    newPassword: string;
}

export const getUsers = async (): Promise<TResult<User[]>> => {
  return await get<User[]>("/users");
};

export const createUser = async (data: CreateUserDto): Promise<TResult<User>> => {
    return await post<User>("/users", data);
};

export const updateUser = async (id: number, data: UpdateUserDto): Promise<TResult<User>> => {
    return await put<User>(`/users/${id}`, data);
};

/* 
   NOTE: The current API requires oldPassword for changePassword. 
   If this is intended for Admin use, we might need a different endpoint.
   For now, we map what exists.
*/
export const changePassword = async (id: number, data: ChangePasswordDto): Promise<TResult<boolean>> => {
    return await put<boolean>(`/users/${id}/password`, data);
};

export const resetPassword = async (id: number, password: string): Promise<TResult<boolean>> => {
    return await put<boolean>(`/users/${id}/reset-password`, { newPassword: password });
};
