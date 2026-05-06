import { axiosInstance, get, post, put, remove } from "@app/core/axios/axios";
import { Zone } from "./zones.service";

export interface Location {
  id: number;
  aisle: string;
  spot: string;
  number: string;
  name: string;
  isOccupied: boolean;
  zoneId?: number;
  zone?: Zone;
  entries?: any[];
}

export const getLocations = async () => {
  return await get<Location[]>("/locations");
};

export const createLocation = async (data: {
  aisle: string;
  spot: string;
  number: string;
  name?: string;
  zoneId?: number;
}) => {
  return await post<Location>("/locations", data);
};

export const updateLocation = async (
  id: number,
  data: {
    aisle: string;
    spot: string;
    number: string;
    name: string;
    zoneId?: number;
  },
) => {
  return await put<Location>(`/locations/${id}`, data);
};

export const deleteLocation = async (id: number) => {
  return await remove(`/locations/${id}`);
};

export const getPaginatedLocations = async (params: any) => {
  const res = await post<any>("/locations/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const getBulkQRPDF = async (ids: number[]) => {
  const response = await axiosInstance.post(
    "/locations/bulk-qr-pdf",
    { ids },
    {
      responseType: "blob",
    },
  );
  return response.data;
};
