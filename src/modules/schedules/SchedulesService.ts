import { get, post, put, remove } from "../../core/axios/axios";

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

export const getPaginatedSchedules = async (params: any): Promise<{ data: Schedule[], total: number }> => {
    const res = await post<any>('/schedules/datatable', params);
    if (res.success && res.data) {
        return {
            data: res.data.rows || [],
            total: res.data.total || 0,
        };
    }
    return { data: [], total: 0 };
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
