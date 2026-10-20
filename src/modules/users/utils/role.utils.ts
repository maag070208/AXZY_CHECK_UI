import type { ICatalogItem } from "@app/core/types/catalog.types";

/**
 * Roles válidos para BARCELONA. El catálogo `role` puede traer roles de otros
 * proyectos (por ejemplo CLIENT); aquí solo dejamos los que usa esta operación.
 */
export const BARCELONA_ROLE_ORDER = ["ADMIN", "GUARD", "SHIFT", "MAINT", "RESDN"] as const;

const ROLE_ORDER: string[] = [...BARCELONA_ROLE_ORDER];

const isBarcelonaRole = (role: ICatalogItem): boolean => ROLE_ORDER.includes(role.name);

/** Roles visibles, sin CLIENT, con label en español y en orden operativo. */
export const getVisibleRoles = (roles: ICatalogItem[]): ICatalogItem[] =>
  roles
    .filter((role) => isBarcelonaRole(role) && Boolean(role.value))
    .sort((a, b) => ROLE_ORDER.indexOf(a.name) - ROLE_ORDER.indexOf(b.name));

/**
 * Opciones para el filtro de la tabla. El UI system pinta `name` como label,
 * así que lo reemplazamos por el `value` en español y conservamos el `id`.
 */
export const getRoleFilterOptions = (roles: ICatalogItem[]) =>
  getVisibleRoles(roles).map((role) => ({ ...role, name: role.value }));
