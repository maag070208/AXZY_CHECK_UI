import { get, patch, post } from "@app/core/axios/axios";

export type ComplaintCategory = "MANTENIMIENTO" | "SEGURIDAD" | "RUIDO" | "LIMPIEZA" | "ADMINISTRACION" | "SUGERENCIA" | "OTRA";
export type ComplaintStatus = "NEW" | "IN_REVIEW" | "WAITING_RESIDENT" | "RESOLVED" | "CLOSED" | "REOPENED";

export interface ComplaintAuthor {
  id: number;
  name: string;
  lastName: string | null;
}

export interface ComplaintListItem {
  id: number;
  propertyId: number;
  category: ComplaintCategory;
  title: string;
  status: ComplaintStatus;
  authorId: number;
  author: ComplaintAuthor | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintMessage {
  id: number;
  body: string;
  internal: boolean;
  authorId: number;
  createdAt: string;
}

export interface ComplaintEvent {
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  createdAt: string;
}

export interface ComplaintPhoto {
  type: "IMAGE";
  url: string;
  key: string;
  size: number;
}

export interface ComplaintDetail extends ComplaintListItem {
  description: string;
  media: ComplaintPhoto[] | null;
  resolvedAt: string | null;
  messages: ComplaintMessage[];
  events: ComplaintEvent[];
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  NEW: "Nueva",
  IN_REVIEW: "En revisión",
  WAITING_RESIDENT: "Esperando al residente",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
  REOPENED: "Reabierta",
};

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  MANTENIMIENTO: "Mantenimiento",
  SEGURIDAD: "Seguridad",
  RUIDO: "Ruido",
  LIMPIEZA: "Limpieza",
  ADMINISTRACION: "Administración",
  SUGERENCIA: "Sugerencia",
  OTRA: "Otra",
};

/** Siguientes estados válidos desde cada estado (espejo de COMPLAINT_TRANSITIONS en la API). */
export const NEXT_COMPLAINT_STATUSES: Record<ComplaintStatus, ComplaintStatus[]> = {
  NEW: ["IN_REVIEW"],
  IN_REVIEW: ["WAITING_RESIDENT", "RESOLVED"],
  WAITING_RESIDENT: ["IN_REVIEW", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: [],
  REOPENED: ["IN_REVIEW", "RESOLVED"],
};

const errorOf = (messages: string[] | undefined, fallback: string) => new Error(messages?.[0] ?? fallback);

export const getComplaints = async (params: { page: number; pageSize: number; status?: ComplaintStatus }) => {
  const res = await get<{ items: ComplaintListItem[]; total: number }>("/complaints", { params });
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudieron cargar las quejas");
  return { data: res.data.items, total: res.data.total };
};

export const getComplaint = async (id: number): Promise<ComplaintDetail> => {
  const res = await get<ComplaintDetail>(`/complaints/${id}`);
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo cargar la queja");
  return res.data;
};

export const addComplaintMessage = async (id: number, body: string, internal: boolean): Promise<ComplaintMessage> => {
  const res = await post<ComplaintMessage>(`/complaints/${id}/messages`, { body, internal });
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo enviar el mensaje");
  return res.data;
};

export const changeComplaintStatus = async (id: number, status: ComplaintStatus) => {
  const res = await patch<{ id: number; status: ComplaintStatus }>(`/complaints/${id}/status`, { status });
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo cambiar el estado");
  return res.data;
};
