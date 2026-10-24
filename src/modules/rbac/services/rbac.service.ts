import { get, put } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface RbacRole {
  name: string;
  value: string;
  permissions: string[];
}

export interface RbacPermission {
  code: string;
  description: string;
}

export interface RbacMatrix {
  roles: RbacRole[];
  permissions: RbacPermission[];
}

export const getRbacMatrix = async (): Promise<TResult<RbacMatrix>> =>
  get<RbacMatrix>("/rbac/matrix");

export const updateRolePermissions = async (
  roleName: string,
  permissions: string[],
): Promise<TResult<RbacMatrix>> =>
  put<RbacMatrix>(`/rbac/roles/${encodeURIComponent(roleName)}/permissions`, {
    permissions,
  });
