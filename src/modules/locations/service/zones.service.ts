import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface Zone {
  id: string;
  name: string;
  active: boolean;
  _count?: {
    locations: number;
  };
}

export const getZones = async (): Promise<TResult<Zone[]>> => {
  return await get<Zone[]>("/zones");
};

export const createZone = async (data: { name: string }): Promise<TResult<Zone>> => {
  return await post<Zone>("/zones", data);
};

export const updateZone = async (id: string, data: { name: string; active?: boolean }): Promise<TResult<Zone>> => {
  return await put<Zone>(`/zones/${id}`, data);
};

export const deleteZone = async (id: string): Promise<TResult<boolean>> => {
  return await remove<boolean>(`/zones/${id}`);
};
