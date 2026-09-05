import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ICreateShiftHandoverElement {
  guardId: number;
  entryTime: string;
  punctual: boolean;
  observations?: string;
}

export interface ICreateShiftHandoverPayload {
  shiftType: "MATUTINO" | "NOCTURNO";
  handoverDate: string;
  credentialsCount?: number;
  tarjetonesCount?: number;
  novedades?: string;
  checklistPhones: boolean;
  checklistTablet: boolean;
  checklistRadios: boolean;
  checklistKeys: boolean;
  checklistLogbook: boolean;
  checklistConsignas: boolean;
  reportedToAdmin: boolean;
  elements: ICreateShiftHandoverElement[];
}

/** @description Crea un reporte de entrega de turno (mismo endpoint que usa la APP). */
export const createShiftHandover = async (payload: ICreateShiftHandoverPayload): Promise<TResult<any>> => {
  return await post<any>("/shift-handover", payload);
};

export const getPaginatedShiftHandovers = async (params: any): Promise<{ data: any[]; total: number }> => {
  const res = await post<any>("/shift-handover/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};

export const getShiftHandoverDetail = async (id: number): Promise<TResult<any>> => {
  return await get<any>(`/shift-handover/${id}`);
};
