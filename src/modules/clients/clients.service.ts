import { get, patch, post } from "@app/core/axios/axios";
import type { Client, ClientType } from "@app/core/types/client.types";
import { TResult } from "@app/core/types/TResult";

/**
 * Clientes de la organización. `GET /clients` devuelve los clientes permitidos
 * por el alcance del token (ADMIN/MAINT con `client.view`) y no depende del
 * encabezado `X-Client-Id`.
 */
export const getClients = async (): Promise<TResult<Client[]>> => {
  return await get<Client[]>("/clients");
};

export interface CreateClientDto {
  name: string;
  type: ClientType;
}

export const createClient = async (data: CreateClientDto): Promise<TResult<Client>> => {
  return await post<Client>("/clients", data);
};

export interface UpdateClientDto {
  name?: string;
  type?: ClientType;
  active?: boolean;
}

export const updateClient = async (id: number, data: UpdateClientDto): Promise<TResult<Client>> => {
  return await patch<Client>(`/clients/${id}`, data);
};
