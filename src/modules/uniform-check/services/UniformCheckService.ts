import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export type UniformContext = "SHIFT" | "ROUND" | "SPOT" | "OTHER";

export type UniformCompliance = "EXCELENTE" | "MEDIO" | "MALO";

export interface UniformCheck {
  id: string;
  clientRef: string;
  userId: number;
  checkedAt: string;
  items: Record<string, { value: boolean; note?: string | null }>;
  severity: UniformCompliance;
  failedCount: number;
  observations: string | null;
  checkedById: number;
  context: UniformContext;
  shiftCheckId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; lastName?: string; username: string };
  checkedBy?: { id: number; name: string; lastName?: string };
  shiftCheck?: { id: string; clientRef: string; shiftType: string } | null;
}

export interface CreateUniformCheckDto {
  userId: number;
  items: Record<string, { value: boolean; note?: string | null }>;
  checkedAt?: string;
  observations?: string | null;
  context?: UniformContext;
  shiftCheckId?: string | null;
  clientRef?: string;
}

/**
 * @description Ítems del checklist de uniforme/aseo. Lista fija.
 */
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

export const getUniformItemsCatalog = async (): Promise<TResult<
  { key: string; label: string }[]
>> => get("/uniform-check/items/catalog");

export const getPaginatedUniformChecks = async (
  params: any): Promise<{ data: UniformCheck[]; total: number }> => {
  const res = await post<any>("/uniform-check/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};

export const listUniformChecks = async (filters?: {
  startDate?: string;
  endDate?: string;
  context?: UniformContext;
  userId?: number;
}): Promise<TResult<UniformCheck[]>> => {
  const params: string[] = [];
  if (filters?.startDate) params.push(`startDate=${encodeURIComponent(filters.startDate)}`);
  if (filters?.endDate) params.push(`endDate=${encodeURIComponent(filters.endDate)}`);
  if (filters?.context) params.push(`context=${filters.context}`);
  if (filters?.userId) params.push(`userId=${filters.userId}`);
  const qs = params.length ? `?${params.join("&")}`: "";
  return get<UniformCheck[]>(`/uniform-check${qs}`);
};

export const createUniformCheck = async (
  data: CreateUniformCheckDto): Promise<TResult<UniformCheck>> => post("/uniform-check", data);

export const getUniformCheck = async (id: string): Promise<TResult<UniformCheck>> =>
  get(`/uniform-check/${id}`);

export const getUniformHistoryByUser = async (
  userId: number,
  startDate?: string,
  endDate?: string): Promise<TResult<UniformCheck[]>> => {
  const params: string[] = [];
  if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
  const qs = params.length ? `?${params.join("&")}`: "";
  return get<UniformCheck[]>(`/uniform-check/history/user/${userId}${qs}`);
};