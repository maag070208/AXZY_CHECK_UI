import { get, post, put, remove } from "@app/core/axios/axios";

export interface Location {
  id: number;
  aisle: string;
  spot: string;
  name: string;
  isOccupied: boolean;
  entries?: any[]; // For count
}

export const getLocations = async () => {
  return await get<Location[]>("/locations");
};

export const createLocation = async (data: { aisle: string; spot: string }) => {
  return await post<Location>("/locations", data);
};

export const updateLocation = async (id: number, data: { aisle: string; spot: string; name: string }) => {
  return await put<Location>(`/locations/${id}`, data);
};

export const deleteLocation = async (id: number) => {
  return await remove(`/locations/${id}`);
};
