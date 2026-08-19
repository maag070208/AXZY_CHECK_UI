import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";
import {
  CreateNovedadDto,
  Novedad,
  NovedadPage,
} from "../types/novedades.types";

/**
 * @description Obtiene el historial de novedades paginado (más recientes primero).
 * @param page Página a consultar (inicia en 1).
 * @param limit Cantidad de elementos por página.
 * @returns TResult con la página de novedades.
 */
export const getNovedades = (page = 1, limit = 30): Promise<TResult<NovedadPage>> =>
  get<NovedadPage>(`/novedades?page=${page}&limit=${limit}`);

/**
 * @description Publica una novedad. La API la persiste y la difunde en tiempo
 * real a través de Ably.
 * @param data Mensaje de la novedad.
 * @returns TResult con la novedad creada.
 */
export const createNovedad = (data: CreateNovedadDto): Promise<TResult<Novedad>> =>
  post<Novedad>("/novedades", data);

/**
 * @description Obtiene la solicitud de token de Ably firmada por el servidor
 * para conectar el streaming en tiempo real sin exponer la clave secreta.
 * @returns TResult con el tokenRequest de Ably.
 */
export const getNovedadesAblyToken = async (): Promise<TResult<Record<string, unknown>>> =>
  get<Record<string, unknown>>("/novedades/ably-token");
