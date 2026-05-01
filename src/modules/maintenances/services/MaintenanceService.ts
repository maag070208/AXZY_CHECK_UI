import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface Maintenance {
  id: number;
  title: string;
  description: string;
  category: string;
  status: "PENDING" | "ATTENDED";
  createdAt: string;
  resolvedAt?: string;
  latitude?: number;
  longitude?: number;
  media?: { type: "IMAGE" | "VIDEO"; url: string; key?: string }[];
  guard?: { 
      id: number;
      name: string; 
      lastName: string;
      username: string;
  };
  resolvedBy?: {
      id: number;
      name: string;
      lastName: string;
      username: string;
  };
}

export interface CreateMaintenanceDto {
  title: string;
  category: string;
  description: string;
  media: any[];
}

export const getPaginatedMaintenances = async (params: Record<string, unknown>): Promise<{ data: Maintenance[], total: number }> => {
    const res = await post<any>('/maintenance/datatable', params);
    if (res.success && res.data) {
        return {
            data: res.data.rows || [],
            total: res.data.total || 0,
        };
    }
    return { data: [], total: 0 };
};

export const getMaintenances = async (filters?: {
    startDate?: Date;
    endDate?: Date;
    guardId?: number;
    category?: string;
    title?: string;
}): Promise<TResult<Maintenance[]>> => {
    let query = '/maintenance?';
    const params = [];
    if (filters?.startDate) params.push(`startDate=${filters.startDate.toISOString()}`);
    if (filters?.endDate) params.push(`endDate=${filters.endDate.toISOString()}`);
    if (filters?.guardId) params.push(`guardId=${filters.guardId}`);
    if (filters?.category) params.push(`category=${filters.category}`);
    if (filters?.title) params.push(`title=${filters.title}`);
    
    if (params.length > 0) {
        query += params.join('&');
    } else {
        query = '/maintenance';
    }

    return await get<Maintenance[]>(query);
};

export const createMaintenance = async (data: CreateMaintenanceDto): Promise<TResult<Maintenance>> => {
    return await post<Maintenance>('/maintenance', data);
};

export const resolveMaintenance = async (id: number, userId?: number): Promise<TResult<Maintenance>> => {
    return await put<Maintenance>(`/maintenance/${id}/resolve`, { userId });
};

export const deleteMaintenance = async (id: number): Promise<TResult<boolean>> => {
    return await remove<boolean>(`/maintenance/${id}`);
};

export const deleteMaintenanceMedia = async (maintenanceId: number, key: string): Promise<TResult<boolean>> => {
    return await remove<boolean>(`/maintenance/${maintenanceId}/media?key=${key}`);
};
