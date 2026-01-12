import { get, post } from "@app/core/axios/axios";
import { VehicleEntry } from "../../entries/service/entries.service";

export interface VehicleMovement {
  id: number;
  entryId: number;
  fromLocationId: number;
  toLocationId: number;
  assignedUserId: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  entry?: VehicleEntry;
  // relations typically included in get response
}

export interface KardexItem {
    id: string;
    date: string;
    type: 'INGRESO' | 'SALIDA' | 'MOVIMIENTO' | 'LLAVES' | 'LLAVES_FIN';
    description: string;
    plates: string;
    clientName: string;
    operatorName: string;
    status: string;
}

export const getMovements = async () => {
  return await get<VehicleMovement[]>("/movements");
};

export const getKardex = async () => {
    return await get<KardexItem[]>("/movements/kardex");
};

export const createMovement = async (data: { entryId: number; toLocationId: number; assignedUserId: number }) => {
  return await post<VehicleMovement>("/movements", data);
};
