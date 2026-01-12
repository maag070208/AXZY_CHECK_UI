import { get, post } from "@app/core/axios/axios";
import { VehicleEntry } from "../../entries/service/entries.service";

export interface VehicleExit {
  id: number;
  entryId: number;
  operatorUserId: number;
  exitDate: string;
  status: 'REQUESTED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  entry?: VehicleEntry;
}

export const getExits = async () => {
  return await get<VehicleExit[]>("/exits");
};

export const createExit = async (data: { entryId: number; operatorUserId: number; notes?: string }) => {
  return await post<VehicleExit>("/exits", data);
};
