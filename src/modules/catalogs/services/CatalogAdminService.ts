import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export type CatalogAdminType = "INCIDENT" | "MAINTENANCE" | "CASA_CLUB";

export interface CatalogCategory {
  id: number;
  name: string;
  value: string;
  color?: string | null;
  icon?: string | null;
  type: string;
  active: boolean;
  order: number;
  _count?: { types: number };
}

export interface CatalogType {
  id: number;
  name: string;
  value: string;
  categoryId: number;
  active: boolean;
  order: number;
}

// Categories --------------------------------------------------------------

/**
 * Lists every category. When `type` is omitted the API returns the three
 * catalogs (INCIDENT, MAINTENANCE, CASA_CLUB) in a single request, which lets
 * the screen switch tabs instantly and show accurate counters.
 */
export const getCategories = async (type?: CatalogAdminType): Promise<TResult<CatalogCategory[]>> => {
  const query = type ? `?type=${type}` : "";
  return await get<CatalogCategory[]>(`/catalog-admin/categories${query}`);
};

export const createCategory = async (data: {
  name: string;
  value: string;
  type: CatalogAdminType;
  color?: string;
  icon?: string;
}): Promise<TResult<CatalogCategory>> => {
  return await post<CatalogCategory>("/catalog-admin/categories", data);
};

export const updateCategory = async (
  id: number,
  data: Partial<{ name: string; value: string; color: string; icon: string; active: boolean }>,
): Promise<TResult<CatalogCategory>> => {
  return await put<CatalogCategory>(`/catalog-admin/categories/${id}`, data);
};

export const deleteCategory = async (id: number): Promise<TResult<any>> => {
  return await remove<any>(`/catalog-admin/categories/${id}`);
};

/** Reassigns category order following the position of each id in the array. */
export const reorderCategories = async (ids: number[]): Promise<TResult<boolean>> => {
  return await put<boolean>("/catalog-admin/categories/reorder", { ids });
};

// Types ---------------------------------------------------------------------

export const getTypes = async (categoryId: number): Promise<TResult<CatalogType[]>> => {
  return await get<CatalogType[]>(`/catalog-admin/types?categoryId=${categoryId}`);
};

export const createType = async (data: {
  name: string;
  value: string;
  categoryId: number;
}): Promise<TResult<CatalogType>> => {
  return await post<CatalogType>("/catalog-admin/types", data);
};

export const updateType = async (
  id: number,
  data: Partial<{ name: string; value: string; categoryId: number; active: boolean }>,
): Promise<TResult<CatalogType>> => {
  return await put<CatalogType>(`/catalog-admin/types/${id}`, data);
};

export const deleteType = async (id: number): Promise<TResult<any>> => {
  return await remove<any>(`/catalog-admin/types/${id}`);
};

/** Reassigns the order of the types that belong to a category. */
export const reorderTypes = async (ids: number[]): Promise<TResult<boolean>> => {
  return await put<boolean>("/catalog-admin/types/reorder", { ids });
};
