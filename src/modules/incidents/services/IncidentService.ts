import { get, post, put } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface Incident {
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

export interface CreateIncidentDto {
  title: string;
  category: string;
  description: string;
  media: any[];
}

export const getIncidents = async (filters?: {
    startDate?: Date;
    endDate?: Date;
    guardId?: number;
    category?: string;
    title?: string;
}): Promise<TResult<Incident[]>> => {
    let query = '/incidents?';
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
        query = '/incidents';
    }

    return await get<Incident[]>(query);
};

export const createIncident = async (data: CreateIncidentDto): Promise<TResult<Incident>> => {
    return await post<Incident>('/incidents', data);
};

export const resolveIncident = async (id: number): Promise<TResult<Incident>> => {
    return await put<Incident>(`/incidents/${id}/resolve`, {});
};
