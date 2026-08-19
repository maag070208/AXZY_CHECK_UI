import { get, post, put, patch, remove } from '@app/core/axios/axios';
import { TResult } from '@app/core/types/TResult';
import {
    CreateCategoryInput,
    CreateTypeInput,
    IncidentCategory,
    IncidentType,
    UpdateCategoryInput,
    UpdateTypeInput,
    CatalogType,
} from '../types/catalogs.types';

/**
 * Servicio para administración de catálogos de incidencias y mantenimiento.
 * Sincronizado con TResult.
 */

// =============================================================================
// Categorías
// =============================================================================

export const getCategories = async (
    type?: CatalogType,
    includeInactive = false,
): Promise<TResult<IncidentCategory[]>> => {
    const params: string[] = [];
    if (type) params.push(`type=${type}`);
    if (includeInactive) params.push('adminOnly=true');
    const qs = params.length ? `?${params.join('&')}` : '';
    return await get<IncidentCategory[]>(`/catalog/incident-categories${qs}`);
};

export const getCategory = async (id: number): Promise<TResult<IncidentCategory>> => {
    return await get<IncidentCategory>(`/catalog/incident-categories/${id}`);
};

export const createCategory = async (data: CreateCategoryInput): Promise<TResult<IncidentCategory>> => {
    return await post<IncidentCategory>('/catalog/incident-categories', data);
};

export const updateCategory = async (
    id: number,
    data: UpdateCategoryInput,
): Promise<TResult<IncidentCategory>> => {
    return await put<IncidentCategory>(`/catalog/incident-categories/${id}`, data);
};

export const deleteCategory = async (id: number): Promise<TResult<IncidentCategory>> => {
    return await remove<IncidentCategory>(`/catalog/incident-categories/${id}`);
};

/**
 * Borrado físico de una categoría. Sólo permitido si está desactivada y sin registros.
 */
export const hardDeleteCategory = async (id: number): Promise<TResult<IncidentCategory>> => {
    return await remove<IncidentCategory>(`/catalog/incident-categories/${id}/hard`);
};

export const activateCategory = async (id: number): Promise<TResult<IncidentCategory>> => {
    return await patch<IncidentCategory>(`/catalog/incident-categories/${id}/activate`, {});
};

// =============================================================================
// Tipos
// =============================================================================

export interface GetTypesFilters {
    categoryId?: number;
    type?: CatalogType;
    includeInactive?: boolean;
}

export const getTypes = async (filters: GetTypesFilters = {}): Promise<TResult<IncidentType[]>> => {
    const params: string[] = [];
    if (filters.categoryId !== undefined) params.push(`categoryId=${filters.categoryId}`);
    if (filters.type) params.push(`type=${filters.type}`);
    if (filters.includeInactive) params.push('adminOnly=true');
    const qs = params.length ? `?${params.join('&')}` : '';
    return await get<IncidentType[]>(`/catalog/incident-types${qs}`);
};

export const getType = async (id: number): Promise<TResult<IncidentType>> => {
    return await get<IncidentType>(`/catalog/incident-types/${id}`);
};

export const createType = async (data: CreateTypeInput): Promise<TResult<IncidentType>> => {
    return await post<IncidentType>('/catalog/incident-types', data);
};

export const updateType = async (
    id: number,
    data: UpdateTypeInput,
): Promise<TResult<IncidentType>> => {
    return await put<IncidentType>(`/catalog/incident-types/${id}`, data);
};

export const deleteType = async (id: number): Promise<TResult<IncidentType>> => {
    return await remove<IncidentType>(`/catalog/incident-types/${id}`);
};

/**
 * Borrado físico de un tipo. Sólo permitido si está desactivado y sin registros.
 */
export const hardDeleteType = async (id: number): Promise<TResult<IncidentType>> => {
    return await remove<IncidentType>(`/catalog/incident-types/${id}/hard`);
};

export const activateType = async (id: number): Promise<TResult<IncidentType>> => {
    return await patch<IncidentType>(`/catalog/incident-types/${id}/activate`, {});
};
