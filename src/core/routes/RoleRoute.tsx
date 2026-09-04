import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { AppState } from "../store/store";

/**
 * Protege una ruta por rol (misma lógica que la matriz de roles de la APP).
 * Si el rol autenticado no está en `roles`, redirige al home.
 */
export const RoleRoute = ({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) => {
  const role = useSelector((state: AppState) => state.auth.role);

  if (!role || !roles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};