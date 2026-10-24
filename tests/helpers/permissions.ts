import { ROLE_PERMISSIONS } from "@app/core/permissions/role-permissions";

export const PERMISSIONS_BY_ROLE = ROLE_PERMISSIONS;

export const permissionsForRole = (role?: string | null) =>
  role ? PERMISSIONS_BY_ROLE[role] ?? [] : [];

export const roleFromAuthHeader = (header: string | null): string | null => {
  if (!header) return null;
  try {
    const token = header.replace(/^Bearer\s+/i, "");
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return payload.role ?? null;
  } catch {
    return null;
  }
};
