import { get, post, put } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ShiftCheck {
  id: string;
  clientRef: string;
  userId: number;
  shiftDate: string;
  shiftType: "MATUTINO" | "NOCTURNO";
  scheduledStartAt: string;
  actualEntryAt: string | null;
  delayMinutes: number;
  isLate: boolean;
  isAbsent: boolean;
  uniformCheck: Record<string, { value: boolean; note?: string | null }> | null;
  handoverItems: Record<string, { value: boolean; note?: string | null }> | null;
  observations: string | null;
  status: "DRAFT" | "COMPLETED" | "SIGNED";
  createdById: number;
  signedById: number | null;
  signedAt: string | null;
  deliveredById: number | null;
  receivedById: number | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; lastName?: string; username: string };
  createdBy?: { id: number; name: string; lastName?: string };
}

export interface CreateShiftCheckDto {
  userId: number;
  shiftDate: string;
  shiftType: "MATUTINO" | "NOCTURNO";
  actualEntryAt?: string | null;
  isAbsent?: boolean;
  uniformCheck?: Record<string, { value: boolean; note?: string | null }> | null;
  handoverItems?: Record<string, { value: boolean; note?: string | null }> | null;
  observations?: string | null;
  clientRef?: string;
}

export interface SignShiftCheckDto {
  deliveredUsername: string;
  deliveredPassword: string;
  receivedUsername: string;
  receivedPassword: string;
}

export const UNIFORM_ITEMS: { key: string; label: string }[] = [
  { key: "pantalon", label: "Pantalón" },
  { key: "botas", label: "Botas" },
  { key: "cinturon", label: "Cinturón" },
  { key: "camisa", label: "Camisa" },
  { key: "pluma", label: "Pluma" },
  { key: "gorra", label: "Gorra" },
  { key: "aseo", label: "Aseo (uñas, orejas, desodorante)" },
  { key: "afeitado", label: "Afeitado" },
  { key: "peinado", label: "Peinado" },
];

export const HANDOVER_ITEMS: { key: string; label: string }[] = [
  { key: "caseta", label: "Caseta" },
  { key: "telefonos", label: "Teléfonos" },
  { key: "tablet", label: "Tablet" },
  { key: "radios", label: "Radios" },
  { key: "llaves", label: "Llaves" },
  { key: "bitacora", label: "Bitácora" },
  { key: "consignas", label: "Consignas" },
  { key: "reportedToAdmin", label: "Se reportaron novedades a la administración" },
];

export const getPaginatedShiftChecks = async (params: any): Promise<{ data: ShiftCheck[]; total: number }> => {
  const res = await post<any>("/shift-check/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};

export const listShiftChecks = async (filters?: {
  startDate?: string;
  endDate?: string;
  shiftType?: "MATUTINO" | "NOCTURNO";
  status?: "DRAFT" | "COMPLETED" | "SIGNED";
  userId?: number;
}): Promise<TResult<ShiftCheck[]>> => {
  const params: string[] = [];
  if (filters?.startDate) params.push(`startDate=${encodeURIComponent(filters.startDate)}`);
  if (filters?.endDate) params.push(`endDate=${encodeURIComponent(filters.endDate)}`);
  if (filters?.shiftType) params.push(`shiftType=${filters.shiftType}`);
  if (filters?.status) params.push(`status=${filters.status}`);
  if (filters?.userId) params.push(`userId=${filters.userId}`);
  const qs = params.length ? `?${params.join("&")}` : "";
  return get<ShiftCheck[]>(`/shift-check${qs}`);
};

export const getShiftCheck = async (id: string): Promise<TResult<ShiftCheck>> => {
  return get<ShiftCheck>(`/shift-check/${id}`);
};

export const createShiftCheck = async (data: CreateShiftCheckDto): Promise<TResult<ShiftCheck>> => {
  return post<ShiftCheck>("/shift-check", data);
};

export const updateShiftCheck = async (id: string, data: Partial<CreateShiftCheckDto>): Promise<TResult<ShiftCheck>> => {
  return put<ShiftCheck>(`/shift-check/${id}`, data);
};

export const signShiftCheck = async (id: string, data: SignShiftCheckDto): Promise<TResult<ShiftCheck>> => {
  return post<ShiftCheck>(`/shift-check/${id}/sign`, data);
};

export const getDayOverview = async (date?: string): Promise<TResult<{ matutino: ShiftCheck[]; nocturno: ShiftCheck[] }>> => {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  return get<{ matutino: ShiftCheck[]; nocturno: ShiftCheck[] }>(`/shift-check/overview/day${qs}`);
};

export const getHistoryByUser = async (
  userId: number,
  startDate?: string,
  endDate?: string,
): Promise<TResult<ShiftCheck[]>> => {
  const params: string[] = [];
  if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
  const qs = params.length ? `?${params.join("&")}` : "";
  return get<ShiftCheck[]>(`/shift-check/history/user/${userId}${qs}`);
};
