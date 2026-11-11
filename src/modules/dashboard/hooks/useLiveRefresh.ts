import * as Ably from "ably";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { getRealtimeToken } from "../services/DashboardService";

/** Fase 7: el refresco del dashboard se publica por cliente (`dashboard:live-ops:<clientId>`). */
const ABLY_DASHBOARD_CHANNEL_PREFIX = "dashboard:live-ops:";
/** Roles de organización: el cliente activo lo elige el selector global (tenant). */
const ORGANIZATION_ROLES = ["ADMIN", "MAINT"];
const REFRESH_DEBOUNCE_MS = 1500;

/**
 * Señal de "algo cambió, vuelve a consultar": el API publica un evento ligero en Ably y la pantalla recarga por
 * REST, que sigue siendo la fuente de verdad. Con `reason` solo reacciona a ese tipo de cambio. Ably es una
 * mejora: cada pantalla mantiene su consulta periódica por si nunca conecta.
 *
 * El canal es el del cliente activo: ADMIN/MAINT usan el selector global (tenant) y el resto de roles el
 * cliente fijo que devuelve `GET /users/me` (auth.clientId). Sin cliente no se abre conexión (solo polling/REST).
 */
export const useLiveRefresh = (onRefresh: () => void, reason?: string) => {
  const latest = useRef(onRefresh);
  useEffect(() => {
    latest.current = onRefresh;
  }, [onRefresh]);

  const role = useSelector((state: AppState) => state.auth.role);
  const authClientId = useSelector((state: AppState) => state.auth.clientId);
  const selectedClientId = useSelector((state: AppState) => state.tenant.selectedClientId);
  const selectionVersion = useSelector((state: AppState) => state.tenant.selectionVersion);

  const isOrganizationRole = ORGANIZATION_ROLES.includes(String(role));
  const activeClientId: number | null = isOrganizationRole ? selectedClientId : authClientId;
  const channelName = activeClientId === null ? null : `${ABLY_DASHBOARD_CHANNEL_PREFIX}${activeClientId}`;

  useEffect(() => {
    if (!channelName) return;

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const schedule = (message: { data?: { reason?: string } }) => {
      if (reason && message.data?.reason !== reason) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => latest.current(), REFRESH_DEBOUNCE_MS);
    };

    let client: Ably.Realtime | null = null;
    try {
      client = new Ably.Realtime({
        authCallback: async (_tokenParams, callback) => {
          try {
            const res = await getRealtimeToken();
            if (res.success && res.data) {
              callback(null, res.data);
            } else {
              callback("No se pudo obtener el token de tiempo real", null);
            }
          } catch (error) {
            callback(error as Ably.ErrorInfo, null);
          }
        },
      });
      client.channels.get(channelName).subscribe("refresh", schedule);
    } catch (error) {
      console.warn("[Realtime] Ably no disponible, usando solo la consulta periódica.", error);
    }

    return () => {
      // Un cliente por canal: su `authCallback` pide un token nuevo, así que al
      // cambiar de cliente se refresca también el token. Se cierra el anterior.
      if (debounce) clearTimeout(debounce);
      if (client) (client.close() as unknown as Promise<void> | void)?.catch?.(() => {});
    };
    // `selectionVersion` fuerza la re-suscripción cuando el ADMIN cambia de cliente.
  }, [channelName, selectionVersion, reason]);
};
