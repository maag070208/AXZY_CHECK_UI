import * as Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLiveDashboard, getRealtimeToken, ILiveDashboard } from "../services/DashboardService";

const POLL_INTERVAL_MS = 30000;
const ABLY_DASHBOARD_CHANNEL = "dashboard:live-ops";
const REFRESH_DEBOUNCE_MS = 1500;

/**
 * Fetches the live-ops snapshot and keeps it fresh: Ably pushes a
 * lightweight "refresh" event whenever something relevant happens
 * server-side (round started/ended, scan, incident, shift-handover
 * submitted) and this hook just re-fetches /dashboard/live — Postgres via
 * REST stays the source of truth, Ably is only the "someone should
 * refetch now" signal. Polling every 30s is the fallback if Ably never
 * connects (blocked network, not configured, etc.).
 */
export const useLiveDashboard = () => {
  const [data, setData] = useState<ILiveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNow = useCallback(async () => {
    const res = await getLiveDashboard();
    if (res.success && res.data) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.messages?.[0] || "No se pudo cargar el dashboard");
    }
    setLoading(false);
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchNow, REFRESH_DEBOUNCE_MS);
  }, [fetchNow]);

  useEffect(() => {
    fetchNow();

    const pollTimer = setInterval(fetchNow, POLL_INTERVAL_MS);

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
      ablyRef.current = client;
      const channel = client.channels.get(ABLY_DASHBOARD_CHANNEL);
      channel.subscribe("refresh", scheduleRefresh);
    } catch (error) {
      console.warn("[Dashboard] Ably no disponible, usando solo polling.", error);
    }

    return () => {
      clearInterval(pollTimer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (client) (client.close() as unknown as Promise<void> | void)?.catch?.(() => {});
      ablyRef.current = null;
    };
  }, [fetchNow, scheduleRefresh]);

  return { data, loading, error, refetch: fetchNow };
};
