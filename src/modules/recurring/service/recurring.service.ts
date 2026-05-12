import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface RecurringConfiguration {
  id: string;
  title: string;
  active: boolean;
  _count?: {
    locations: number;
    assignedGuards: number;
  };
}

export const getRecurring = async (): Promise<TResult<RecurringConfiguration[]>> => {
  return await get<RecurringConfiguration[]>("/recurring");
};

export const getPaginatedRecurring = async (params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<TResult<{ rows: RecurringConfiguration[]; total: number }>> => {
  return await post<{ rows: RecurringConfiguration[]; total: number }>("/recurring/datatable", params);
};

export const createRecurring = async (data: { title: string }): Promise<TResult<RecurringConfiguration>> => {
  return await post<RecurringConfiguration>("/recurring", { ...data, locations: [] });
};

export const updateRecurring = async (id: string, data: { title: string }): Promise<TResult<RecurringConfiguration>> => {
  return await put<RecurringConfiguration>(`/recurring/${id}`, { ...data, locations: [] });
};

export const toggleRecurring = async (id: string): Promise<TResult<void>> => {
  return await put<void>(`/recurring/${id}/toggle`, {});
};

export const deleteRecurring = async (id: string): Promise<TResult<void>> => {
  return await remove<void>(`/recurring/${id}`);
};
