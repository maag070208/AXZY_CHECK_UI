import { post } from "@app/core/axios/axios";

export const getPaginatedUniformChecks = async (params: any): Promise<{ data: any[]; total: number }> => {
  const res = await post<any>("/uniform/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};
