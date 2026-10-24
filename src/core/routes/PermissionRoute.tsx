import { useCan } from "@app/core/permissions/useCan";
import { PermissionRequirement } from "@app/core/permissions/permissions.constants";
import { Navigate } from "react-router-dom";

/**
 * Protege una ruta por permiso efectivo del API, no por nombre de rol.
 * Si el usuario no tiene el permiso, cae al home; el API sigue siendo la
 * última línea de defensa.
 */
export const PermissionRoute = ({
  permissions,
  mode = "any",
  children,
}: {
  permissions: PermissionRequirement;
  mode?: "any" | "all";
  children: React.ReactNode;
}) => {
  const can = useCan();

  if (!can(permissions, mode)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
