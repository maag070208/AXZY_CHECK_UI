import { get, post } from "@app/core/axios/axios";

export interface Authorization {
  id: number;
  personId: number;
  scope: "PEDESTRIAN" | "VEHICLE" | "BOTH";
  days: string;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string | null;
  revokedAt: string | null;
  person: { id: number; firstName: string; lastName?: string | null };
}

export const listAuthorizations = (propertyId: number) => get<Authorization[]>(`/properties/${propertyId}/authorizations`);

/** Los errores vienen como cuerpo de respuesta (ver settle en persons.service). */
export const createAuthorization = (propertyId: number, body: { personId: number; scope: string; days: number[]; startTime: string; endTime: string; validFrom: string; validUntil?: string | null }) =>
  post<Authorization>(`/properties/${propertyId}/authorizations`, body).catch((error) => error as { success: false; code?: string; messages?: string[] });

export const revokeAuthorization = (authorizationId: number) =>
  post<Authorization>(`/authorizations/${authorizationId}/revoke`, {}).catch((error) => error as { success: false; messages?: string[] });

export const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
