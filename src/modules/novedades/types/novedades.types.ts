/** @description Novedad en tiempo real devuelta por la API. */
export interface Novedad {
  id: string;
  userId: number;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
}

/** @description Página de novedades (listado paginado). */
export interface NovedadPage {
  rows: Novedad[];
  total: number;
  page: number;
  limit: number;
}

/** @description Carga útil para crear una novedad. */
export interface CreateNovedadDto {
  message: string;
}

/** @description Roles autorizados para leer y publicar novedades. */
export const NOVEDADES_ROLES: readonly string[] = [
  "ADMIN",
  "LIDER",
  "GUARD",
  "SHIFT",
  "MAINT",
];

/** @description Nombre del canal de Ably donde se difunden las novedades. */
export const NOVEDADES_CHANNEL = "novedades";

/** @description Nombre del evento publicado en el canal de Ably. */
export const NOVEDADES_EVENT = "novedad";
