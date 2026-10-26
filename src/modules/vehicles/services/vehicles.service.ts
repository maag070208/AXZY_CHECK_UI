import { get, patch } from "@app/core/axios/axios";

export type VehicleStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";

export interface VehicleRow {
  id: number;
  propertyId: number;
  property?: { id: number; identifier: string; name: string } | null;
  ownerId: number;
  owner?: { id: number; name: string; lastName: string | null } | null;
  plate: string;
  tagCode: string | null;
  kind: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  status: VehicleStatus;
  notes: string | null;
  createdAt: string;
}

const errorOf = (error: any, fallback: string) => new Error(error?.messages?.[0] ?? fallback);

export const getVehicles = async (params: { page: number; pageSize: number; status?: VehicleStatus; search?: string }) => {
  try {
    const res = await get<{ items: VehicleRow[]; total: number }>("/vehicles", { params });
    if (!res.success || !res.data) throw new Error("No se pudo cargar el padrón");
    return res.data;
  } catch (error) {
    throw errorOf(error, "No se pudo cargar el padrón de vehículos");
  }
};

export const approveVehicle = async (id: number, tagCode?: string) => {
  try {
    const res = await patch<VehicleRow>(`/vehicles/${id}/approve`, tagCode ? { tagCode } : {});
    if (!res.success || !res.data) throw new Error("No se pudo aprobar");
    return res.data;
  } catch (error) {
    throw errorOf(error, "No se pudo aprobar el vehículo");
  }
};

export const rejectVehicle = async (id: number, notes?: string) => {
  try {
    const res = await patch<VehicleRow>(`/vehicles/${id}/reject`, notes ? { notes } : {});
    if (!res.success || !res.data) throw new Error("No se pudo rechazar");
    return res.data;
  } catch (error) {
    throw errorOf(error, "No se pudo rechazar el vehículo");
  }
};
