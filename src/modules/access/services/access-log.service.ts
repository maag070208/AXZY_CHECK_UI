import { get } from "@app/core/axios/axios";

export type AccessMethod = "QR" | "TAG" | "PIN" | "MANUAL";
export type AccessDirection = "ENTRY" | "EXIT";
export type AccessDecision = "ALLOWED" | "DENIED";

export interface AccessEventRow {
  id: number;
  propertyId: number;
  method: AccessMethod;
  direction: AccessDirection;
  decision: AccessDecision;
  reason: string | null;
  occurredAt: string;
  property?: { id: number; identifier: string; name: string } | null;
  person?: { id: number; firstName: string; lastName: string | null } | null;
  vehicle?: { id: number; plate: string; tagCode: string | null } | null;
  invitation?: { id: number; code: string; guestName: string } | null;
  guard?: { id: number; name: string; lastName: string | null } | null;
}

export interface AccessLogFilters {
  page: number;
  pageSize: number;
  propertyId?: number;
  method?: AccessMethod;
  direction?: AccessDirection;
  decision?: AccessDecision;
  q?: string;
  from?: string;
  to?: string;
}

const errorOf = (error: any, fallback: string) => new Error(error?.messages?.[0] ?? fallback);

export const getAccessLog = async (filters: AccessLogFilters) => {
  try {
    const res = await get<{ items: AccessEventRow[]; total: number }>("/access/events", { params: filters });
    if (!res.success || !res.data) throw new Error("No se pudo cargar la bitácora");
    return res.data;
  } catch (error) {
    throw errorOf(error, "No se pudo cargar la bitácora de accesos");
  }
};

export const downloadAccessLogCsv = async (filters: Omit<AccessLogFilters, "page" | "pageSize">) => {
  const { axiosInstance } = await import("@app/core/axios/axios");
  const response = await axiosInstance.get("/access/events/export.csv", {
    responseType: "blob",
    params: filters,
  });
  const blob = response.data as Blob;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bitacora-accesos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
