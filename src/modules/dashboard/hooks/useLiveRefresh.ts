import * as Ably from "ably";
import { useEffect, useRef } from "react";
import { getRealtimeToken } from "../services/DashboardService";

const ABLY_DASHBOARD_CHANNEL = "dashboard:live-ops";
const REFRESH_DEBOUNCE_MS = 1500;

/**
 * Señal de "algo cambió, vuelve a consultar": el API publica un evento ligero en Ably y la pantalla recarga por
 * REST, que sigue siendo la fuente de verdad. Con `reason` solo reacciona a ese tipo de cambio. Ably es una
 * mejora: cada pantalla mantiene su consulta periódica por si nunca conecta.
 */
export const useLiveRefresh = (onRefresh: () => void, reason?: string) => {
  const latest = useRef(onRefresh);
  useEffect(() => {
    latest.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
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
      client.channels.get(ABLY_DASHBOARD_CHANNEL).subscribe("refresh", schedule);
    } catch (error) {
      console.warn("[Realtime] Ably no disponible, usando solo la consulta periódica.", error);
    }

    return () => {
      if (debounce) clearTimeout(debounce);
      if (client) (client.close() as unknown as Promise<void> | void)?.catch?.(() => {});
    };
  }, [reason]);
};
