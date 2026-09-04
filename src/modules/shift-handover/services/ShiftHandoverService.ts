import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

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
