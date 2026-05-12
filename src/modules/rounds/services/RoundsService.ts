import { get, post, put } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface IRound {
  id: string;
  guardId: string;
  startTime: string;
  endTime?: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  recurringConfigurationId: number;
  recurringConfiguration?: {
      id: string;
      title: string;
      startTime?: string;
      endTime?: string;
      recurringLocations?: Array<{
         id: string;
         locationId: string;
         location: {
           id: string;
           name: string;
         }
      }>;
  };
  guard: {
    id: string;
    name: string;
    lastName: string | null;
  };
}

export interface IRoundEvent {
  type: "START" | "SCAN" | "INCIDENT" | "END";
  timestamp: string;
  description: string;
  guard?: {
    id: string;
    name: string;
    lastName: string | null;
  };
  data: any;
}

export interface IRoundDetail {
  round: IRound;
  timeline: IRoundEvent[];
}

export interface ITDataTableFetchParams {
  page: number; // Página actual. Inicio en 1.
  limit: number; // Items per page
  filters: Record<string, string | number | boolean>; // Ej: { username: "pepe" }
  sort?: {
    key: string; 
    direction: "asc" | "desc";
  };
}

export interface ITDataTableResponse<T> {
  data: T[];
  total: number;
}

export const getRounds = async (date?: string, guardId?: number): Promise<TResult<IRound[]>> => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (guardId) params.append("guardId", guardId.toString());

  return await get<IRound[]>(`/rounds?${params.toString()}`);
};

export const getRoundDetail = async (id: string): Promise<TResult<IRoundDetail>> => {
  return await get<IRoundDetail>(`/rounds/${id}`);
};

export const getPaginatedRounds = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<IRound>> => {
  const res = await post<any>("/rounds/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const startRound = async (guardId: string): Promise<TResult<IRound>> => {
    // We import post from axios/axios but let's assume it was already imported or I need to add it.
    // Checking imports... only 'get' is imported. I need to update imports too.
    return await post<IRound>("/rounds/start", { guardId });
};

export const endRound = async (id: string): Promise<TResult<IRound>> => {
    return await put<IRound>(`/rounds/${id}/end`, {});
};
