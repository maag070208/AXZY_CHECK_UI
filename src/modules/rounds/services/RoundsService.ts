import { get } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface IRound {
  id: number;
  guardId: number;
  startTime: string;
  endTime?: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  guard: {
    id: number;
    name: string;
    lastName: string | null;
  };
}

export interface IRoundEvent {
  type: "START" | "SCAN" | "INCIDENT" | "END";
  timestamp: string;
  description: string;
  guard?: {
    id: number;
    name: string;
    lastName: string | null;
  };
  data: any;
}

export interface IRoundDetail {
  round: IRound;
  timeline: IRoundEvent[];
}

export const getRounds = async (date?: string, guardId?: number): Promise<TResult<IRound[]>> => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (guardId) params.append("guardId", guardId.toString());

  return await get<IRound[]>(`/rounds?${params.toString()}`);
};

export const getRoundDetail = async (id: number): Promise<TResult<IRoundDetail>> => {
  return await get<IRoundDetail>(`/rounds/${id}`);
};
