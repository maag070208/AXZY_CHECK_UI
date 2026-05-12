import { axiosInstance, get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";
import { Zone } from "./zones.service";

export interface Location {
  id: string;
  spot?: string;
  number?: string;
  name: string;
  fullName: string;
  isOccupied: boolean;
  active: boolean;
  zoneId?: string;
  zone?: Zone;
  recurringConfigurationId?: string;
  recurringConfiguration?: { id: string; title: string };
}

export interface LocationDataTable {
  rows: Location[];
  total: number;
}

export const getLocations = async (): Promise<TResult<Location[]>> => {
  return await get<Location[]>("/locations");
};

export const createLocation = async (data: {
  spot?: string;
  number?: string;
  name: string;
  zoneId?: string;
  recurringConfigurationId?: string;
}): Promise<TResult<Location>> => {
  return await post<Location>("/locations", data);
};

export const updateLocation = async (
  id: string,
  data: {
    spot?: string;
    number?: string;
    name?: string;
    zoneId?: string;
    recurringConfigurationId?: string;
    isOccupied?: boolean;
  },
): Promise<TResult<Location>> => {
  return await put<Location>(`/locations/${id}`, data);
};

export const deleteLocation = async (id: string): Promise<TResult<void>> => {
  return await remove<void>(`/locations/${id}`);
};

export const getPaginatedLocations = async (params: {
  page: number;
  limit: number;
  search?: string;
  filters?: any;
}): Promise<TResult<LocationDataTable>> => {
  return await post<LocationDataTable>("/locations/datatable", params);
};

export const getBulkQRPDF = async (ids: string[]): Promise<Blob> => {
  const response = await axiosInstance.post(
    "/locations/bulk-qr-pdf",
    { ids },
    {
      responseType: "blob",
    },
  );
  return response.data;
};
