import { get, post, put, remove } from "@app/core/axios/axios";

export interface GenericCatalogItem {
  id: number;
  name: string;
  value: string;
  order: number;
  active: boolean;
  isSystem: boolean;
}

export const GENERIC_CATALOGS = [
  { key: "property-types", label: "Tipos de propiedad", description: "Casas, departamentos y otros tipos." },
  { key: "property-statuses", label: "Estados de propiedad", description: "Disponibilidad y ocupación." },
  { key: "invitation-types", label: "Tipos de invitación", description: "Visitas, proveedores y accesos." },
  { key: "resident-relationships", label: "Parentescos", description: "Relación con el residente." },
] as const;

export type GenericCatalogKey = (typeof GENERIC_CATALOGS)[number]["key"];

export const listGenericCatalog = (key: GenericCatalogKey) =>
  get<GenericCatalogItem[]>(`/catalogs/${key}?all=true`);

export const createGenericCatalogItem = (key: GenericCatalogKey, data: { name: string; value: string }) =>
  post<GenericCatalogItem>(`/catalogs/${key}`, data);

export const updateGenericCatalogItem = (key: GenericCatalogKey, id: number, data: Partial<{ name: string; value: string; active: boolean }>) =>
  put<GenericCatalogItem>(`/catalogs/${key}/${id}`, data);

export const deleteGenericCatalogItem = (key: GenericCatalogKey, id: number) =>
  remove<unknown>(`/catalogs/${key}/${id}`);
