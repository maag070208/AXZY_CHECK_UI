import { get, post } from "@app/core/axios/axios";
import { IAuthLogin, IAuthRegister } from "@app/core/types/auth.types";
import { TResult } from "@app/core/types/TResult";
import { PermissionCode } from "@app/core/permissions/permissions.constants";

export const login = async (data: IAuthLogin): Promise<TResult<string>> => {
  return await post<string>("/users/login", data);
};

export const register = async (data: IAuthRegister): Promise<TResult<any>> => {
    return await post<any>("/users", data);
};

export interface IMyPermissions {
  role: string;
  permissions: PermissionCode[];
}

/** Permisos efectivos del rol autenticado (RBAC del API). */
export const getMyPermissions = async (): Promise<TResult<IMyPermissions>> => {
  return await get<IMyPermissions>("/users/me/permissions");
};
