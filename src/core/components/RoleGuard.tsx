import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AppState } from "../store/store";

interface RoleGuardProps {
    /**
     * Lista de roles permitidos para acceder a la ruta. Si el rol del usuario
     * no está en la lista, se redirige a `/home` (no se renderiza la página).
     */
    allow: string[];
    /**
     * Página a la que se redirige cuando el rol no está permitido.
     * Default: `/home`.
     */
    redirectTo?: string;
    children: React.ReactNode;
}

/**
 * @description Componente de protección por rol para rutas privadas. Si el
 * rol del usuario autenticado no está en `allow`, redirige a `redirectTo`.
 * Uso:
 *   <Route path="/locations" element={<RoleGuard allow={["ADMIN","GUARD","MAINT","LIDER"]}><LocationsPage /></RoleGuard>} />
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ allow, redirectTo = "/home", children }) => {
    const role = useSelector((state: AppState) => state.auth.role);
    if (!role) return <Navigate to={redirectTo} replace />;
    if (!allow.includes(role)) return <Navigate to={redirectTo} replace />;
    return <>{children}</>;
};

export default RoleGuard;
