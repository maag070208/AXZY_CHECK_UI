import { post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ICreateUniformCheckPayload {
  guardId: number;
  pantalon: boolean;
  botas: boolean;
  cinturon: boolean;
  camisa: boolean;
  pluma: boolean;
  gorra: boolean;
  unas: boolean;
  orejas: boolean;
  desodorante: boolean;
  afeitado: boolean;
  peinado: boolean;
  notes?: string;
}

/** @description Registra un checklist de uniforme (mismo endpoint que usa la APP). */
export const createUniformCheck = async (payload: ICreateUniformCheckPayload): Promise<TResult<any>> => {
  return await post<any>("/uniform", payload);
};

export const getPaginatedUniformChecks = async (params: any): Promise<{ data: any[]; total: number }> => {
  const res = await post<any>("/uniform/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};
