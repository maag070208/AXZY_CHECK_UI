import type { ICatalogItem } from "@app/core/types/catalog.types";

/**
 * Roles de staff que se administran desde el WEB de BARCELONA.
 * RESDN no se ofrece aquí: el catálogo puede traerlo de otros proyectos y el
 * WEB no gestiona residentes. CLIENT (administrador de cliente) solo se ofrece
 * al crear un usuario cuando el ADMIN tiene un cliente elegido en el selector:
 * el API liga ese usuario al cliente del encabezado `X-Client-Id`.
 */
export const BARCELONA_ROLE_ORDER = ["ADMIN", "GUARD", "SHIFT", "MAINT"] as const;

/** Rol administrador de un cliente (residencial, plaza o maquila). */
export const CLIENT_ROLE = "CLIENT";

const ROLE_ORDER: string[] = [...BARCELONA_ROLE_ORDER];
const ROLE_ORDER_WITH_CLIENT: string[] = [...ROLE_ORDER, CLIENT_ROLE];

const isVisibleRole = (role: ICatalogItem, includeClient: boolean): boolean =>
  (includeClient ? ROLE_ORDER_WITH_CLIENT : ROLE_ORDER).includes(role.name);

/**
 * Roles visibles en el alta/edición, con label en español y orden operativo.
 * `includeClient` agrega CLIENT al final (solo cuando es seguro ofrecerlo).
 */
export const getVisibleRoles = (
  roles: ICatalogItem[],
  { includeClient = false }: { includeClient?: boolean } = {},
): ICatalogItem[] => {
  const order = includeClient ? ROLE_ORDER_WITH_CLIENT : ROLE_ORDER;
  return roles
    .filter((role) => isVisibleRole(role, includeClient) && Boolean(role.value))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
};

/**
 * Opciones para el filtro de la tabla. El UI system pinta `name` como label,
 * así que lo reemplazamos por el `value` en español y conservamos el `id`.
 * Filtrar es seguro: incluye CLIENT para poder localizar a los administradores
 * de cliente ya existentes.
 */
export const getRoleFilterOptions = (roles: ICatalogItem[]) =>
  getVisibleRoles(roles, { includeClient: true }).map((role) => ({ ...role, name: role.value }));
