import { get, post, put, remove } from "../../core/axios/axios";
import { TResult } from "../../core/types/TResult";

export interface Schedule {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export const getSchedules = async (): Promise<Schedule[]> => {
  const data = await get<Schedule[]>("/schedules");
  return data.data || [];
};

export const createSchedule = async (schedule: Partial<Schedule>) => {
  const data = await post<Schedule>("/schedules", schedule);
  return data.data;
};

export const updateSchedule = async (id: number, schedule: Partial<Schedule>) => {
  const data = await put<Schedule>(`/schedules/${id}`, schedule);
  return data.data;
};

export const deleteSchedule = async (id: number) => {
  const data = await remove<boolean>(`/schedules/${id}`);
  return data.data;
};
