import { get, post, put, remove } from "../../core/axios/axios";

export interface Schedule {
  id: string;
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

export const updateSchedule = async (id: string, schedule: Partial<Schedule>) => {
  const data = await put<Schedule>(`/schedules/${id}`, schedule);
  return data.data;
};

export const deleteSchedule = async (id: string) => {
  const data = await remove<boolean>(`/schedules/${id}`);
  return data.data;
};

export const getScheduleUsers = async (id: string): Promise<any[]> => {
    const res = await get<any[]>(`/schedules/${id}/users`);
    return res.success ? res.data || [] : [];
};
