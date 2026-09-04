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

export const getCategories = async (type: CatalogAdminType): Promise<TResult<CatalogCategory[]>> => {
  return await get<CatalogCategory[]>(`/catalog-admin/categories?type=${type}`);
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

export const reorderCategories = async (ids: number[]): Promise<TResult<boolean>> => {
  return await put<boolean>("/catalog-admin/categories/reorder", { ids });
};

export const pinCategory = async (id: number): Promise<TResult<CatalogCategory>> => {
  return await put<CatalogCategory>(`/catalog-admin/categories/${id}/pin`, {});
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

export const reorderTypes = async (ids: number[]): Promise<TResult<boolean>> => {
  return await put<boolean>("/catalog-admin/types/reorder", { ids });
};

export const pinType = async (id: number): Promise<TResult<CatalogType>> => {
  return await put<CatalogType>(`/catalog-admin/types/${id}/pin`, {});
};
