import { useCallback, useEffect, useState } from "react";
import { getLiveDashboard, ILiveDashboard } from "../services/DashboardService";
import { useLiveRefresh } from "./useLiveRefresh";

const POLL_INTERVAL_MS = 30000;

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

  useEffect(() => {
    fetchNow();
    const pollTimer = setInterval(fetchNow, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer);
  }, [fetchNow]);

  useLiveRefresh(fetchNow);

  return { data, loading, error, refetch: fetchNow };
};
