/**
 * Metadatos de los roles en la matriz RBAC: etiqueta corta, orden de columnas y
 * color del chip. El rol CLIENT (administrador de cliente) es un rol más de la
 * matriz aunque no se pueda crear desde el alta de usuarios sin cliente elegido.
 */
export type RbacRoleColor =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "purple"
  | "gray";

/** Etiquetas cortas de columna (la matriz solo tiene ~90 px por rol). */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SHIFT: "Jefe",
  GUARD: "Guardia",
  MAINT: "Maint.",
  CLIENT: "Cliente",
  RESDN: "Residente",
};

/** Orden de columnas: administración → operación → administrador de cliente → residente. */
export const ROLE_ORDER = ["ADMIN", "SHIFT", "GUARD", "MAINT", "CLIENT", "RESDN"];

/** Color del chip por rol (identidad CLIENT en ámbar, igual que su tema). */
export const ROLE_COLORS: Record<string, RbacRoleColor> = {
  ADMIN: "success",
  SHIFT: "info",
  GUARD: "primary",
  MAINT: "gray",
  CLIENT: "warning",
  RESDN: "purple",
};

/** Los roles desconocidos quedan al final sin romper la matriz. */
export const sortRoles = <T extends { name: string }>(roles: T[] = []): T[] =>
  [...roles].sort((a, b) => {
    const ia = ROLE_ORDER.indexOf(a.name);
    const ib = ROLE_ORDER.indexOf(b.name);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
