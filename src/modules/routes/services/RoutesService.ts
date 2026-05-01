import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ITaskCreate {
    description: string;
    reqPhoto: boolean;
}

export interface ILocationCreate {
    locationId: number;
    locationName?: string;
    tasks: ITaskCreate[];
}

export interface IRecurringConfigCreate {
    title: string;
    locations: ILocationCreate[];
    guardIds?: number[];
}

export const getRoutesList = async (): Promise<TResult<any[]>> => {
    return await get<any[]>('/recurring');
};

export const getPaginatedRoutes = async (params: any): Promise<{ data: any[], total: number }> => {
    const res = await post<any>('/recurring/datatable', params);
    if (res.success && res.data) {
        return {
            data: res.data.rows || [],
            total: res.data.total || 0,
        };
    }
    return { data: [], total: 0 };
};

export const createRoute = async (data: IRecurringConfigCreate): Promise<TResult<any>> => {
    return await post<any>('/recurring', data);
};

export const updateRoute = async (id: number, data: IRecurringConfigCreate): Promise<TResult<any>> => {
    return await put<any>(`/recurring/${id}`, data);
};

export const deleteRoute = async (id: number): Promise<TResult<any>> => {
    return await remove<any>(`/recurring/${id}`);
};

export const assignGuardToRoute = async (configId: number, guardIds: number[]): Promise<TResult<any>> => {
    return await post<any>(`/recurring/${configId}/assign`, { guardIds });
};
