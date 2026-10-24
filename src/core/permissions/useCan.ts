import { useCallback } from "react";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { PermissionCode, PermissionRequirement } from "./permissions.constants";
import { ROLE_PERMISSIONS } from "./role-permissions";

/**
 * `can(P.X)` o `can([P.X, P.Y], "all")`. Los permisos vienen del API y se
 * cargan al restaurar la sesión; mientras no lleguen, todo protegido falla.
 */
export const useCan = () => {
  const permissions = useSelector((state: AppState) => state.auth.permissions);
  const role = useSelector((state: AppState) => state.auth.role);

  return useCallback(
    (required: PermissionRequirement, mode: "any" | "all" = "any") => {
      const effective = permissions ?? (role ? ROLE_PERMISSIONS[role] ?? [] : []);
      if (!effective.length) return false;
      const list = Array.isArray(required) ? required : [required];
      if (!list.length) return true;
      return mode === "all"
        ? list.every((code) => effective.includes(code))
        : list.some((code) => effective.includes(code));
    },
    [permissions, role],
  );
};

export type { PermissionCode };
