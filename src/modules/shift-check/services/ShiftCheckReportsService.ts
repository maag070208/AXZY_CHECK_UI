import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ShiftSummaryMetrics {
  total: number;
  signed: number;
  lateCount: number;
  absentCount: number;
  perUser: Array<{
    userId: number;
    userName: string;
    total: number;
    signed: number;
    late: number;
    absent: number;
    uniformFails: number;
  }>;
}

export interface ShiftPdfFilters {
  startDate: Date;
  endDate: Date;
  ids?: string[];
  includeImages?: boolean;
  includeLocation?: boolean;
}

export const getShiftCheckSummary = async (
  startDate: Date,
  endDate: Date): Promise<TResult<ShiftSummaryMetrics>> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  return get<ShiftSummaryMetrics>(`/reports/shift-check/summary?${params.toString()}`);
};

export const downloadShiftCheckPdf = async (filters: ShiftPdfFilters): Promise<TResult<boolean>> => {
  const params = new URLSearchParams({
    startDate: filters.startDate.toISOString(),
    endDate: filters.endDate.toISOString(),
    includeImages: filters.includeImages === false ? "false": "true",
    includeLocation: filters.includeLocation === false ? "false": "true",
  });
  if (filters.ids && filters.ids.length > 0) {
    params.set("ids", filters.ids.join(","));
  }
  const url = `/reports/shift-check/pdf?${params.toString()}`;
  try {
    const { axiosInstance } = await import("@app/core/axios/axios");
    const response = await axiosInstance.get(url, {
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    });
    const blob = response.data as Blob;
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `reporte-verificacion-turno-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return { data: true, success: true, message: "ok", messages: [], ex: null };
  } catch (error: unknown) {
    const e = error as { response?: { data?: Blob }; message?: string };
    let serverMessage = "Error al generar el PDF";
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text();
        const parsed = JSON.parse(text) as { messages?: string[] };
        if (parsed.messages && parsed.messages.length > 0) {
          serverMessage = parsed.messages.join(", ");
        }
      } catch {
        serverMessage = e.message ?? serverMessage;
      }
    } else if (e.message) {
      serverMessage = e.message;
    }
    return { data: false, success: false, message: serverMessage, messages: [serverMessage], ex: null };
  }
};

export const downloadShiftCheckElementPdf = async (
  userId: number,
  startDate: Date,
  endDate: Date): Promise<TResult<boolean>> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  const url = `/reports/shift-check/element/${userId}/pdf?${params.toString()}`;
  try {
    const { axiosInstance } = await import("@app/core/axios/axios");
    const response = await axiosInstance.get(url, {
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    });
    const blob = response.data as Blob;
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `expediente-verificacion-${userId}-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return { data: true, success: true, message: "ok", messages: [], ex: null };
  } catch (error: unknown) {
    const e = error as { response?: { data?: Blob }; message?: string };
    let serverMessage = "Error al generar el PDF";
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text();
        const parsed = JSON.parse(text) as { messages?: string[] };
        if (parsed.messages && parsed.messages.length > 0) {
          serverMessage = parsed.messages.join(", ");
        }
      } catch {
        serverMessage = e.message ?? serverMessage;
      }
    } else if (e.message) {
      serverMessage = e.message;
    }
    return { data: false, success: false, message: serverMessage, messages: [serverMessage], ex: null };
  }
};

// Reuse post import to keep tree-shaking aware.
void post;
