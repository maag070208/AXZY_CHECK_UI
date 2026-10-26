import { get, post, put, remove } from "@app/core/axios/axios";

export interface DelinquencyRule {
  id: number;
  enabled: boolean;
  minOverdueDays: number;
  blockVisitors: boolean;
  active: boolean;
  updatedById: number | null;
  updatedBy?: { id: number; name: string; lastName: string | null } | null;
  updatedAt: string;
}

export interface AccessException {
  id: number;
  propertyId: number;
  reason: string;
  validUntil: string;
  revokedAt: string | null;
  createdAt: string;
  property?: { id: number; identifier: string; name: string } | null;
  createdBy?: { id: number; name: string; lastName: string | null } | null;
}

export interface AccessEventRow {
  id: number;
  propertyId: number;
  method: "QR" | "TAG" | "PIN" | "MANUAL";
  direction: "ENTRY" | "EXIT";
  decision: "ALLOWED" | "DENIED";
  reason: string | null;
  occurredAt: string;
  property?: { id: number; identifier: string; name: string } | null;
  guard?: { id: number; name: string; lastName: string | null } | null;
  person?: { id: number; firstName: string; lastName: string | null } | null;
}

const errorOf = (messages: string[] | undefined, fallback: string) => new Error(messages?.[0] ?? fallback);

export const getDelinquencyRule = async (): Promise<DelinquencyRule> => {
  const res = await get<DelinquencyRule>("/access/delinquency-rule");
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo cargar la regla de morosos");
  return res.data;
};

export const updateDelinquencyRule = async (input: Omit<DelinquencyRule, "id" | "updatedById" | "updatedBy" | "updatedAt">): Promise<DelinquencyRule> => {
  const res = await put<DelinquencyRule>("/access/delinquency-rule", input);
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo guardar la regla de morosos");
  return res.data;
};

export const getAccessExceptions = async (): Promise<AccessException[]> => {
  const res = await get<AccessException[]>("/access/exceptions");
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudieron cargar las excepciones");
  return res.data;
};

export const createAccessException = async (input: { propertyId: number; reason: string; validUntil: string }): Promise<AccessException> => {
  const res = await post<AccessException>("/access/exceptions", input);
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo autorizar la excepción");
  return res.data;
};

export const revokeAccessException = async (id: number) => {
  const res = await remove(`/access/exceptions/${id}`);
  if (!res.success) throw errorOf(res.messages, "No se pudo revocar la excepción");
  return res;
};

export const getAccessEvents = async (params: { page?: number; pageSize?: number; propertyId?: number; decision?: "ALLOWED" | "DENIED" } = {}) => {
  const res = await get<{ items: AccessEventRow[]; total: number }>("/access/events", { params });
  if (!res.success || !res.data) throw errorOf(res.messages, "No se pudo cargar la bitácora de accesos");
  return res.data;
};
