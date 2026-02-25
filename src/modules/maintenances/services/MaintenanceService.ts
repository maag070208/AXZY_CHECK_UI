import { get, post, put } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface Maintenance {
  id: number;
  title: string;
  description: string;
  category: string;
  status: "PENDING" | "ATTENDED";
  createdAt: string;
  resolvedAt?: string;
  media?: { type: string; url: string; key?: string }[];
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
    
    // Clean up query string logic
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

export const resolveMaintenance = async (id: number): Promise<TResult<Maintenance>> => {
    return await put<Maintenance>(`/maintenance/${id}/resolve`, {});
};
