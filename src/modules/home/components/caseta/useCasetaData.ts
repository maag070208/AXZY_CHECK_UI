import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { getCasetaStatus, getPaginatedInvitations, Invitation } from "@modules/invitations/services/invitations.service";
import { getRounds, IRound } from "@modules/rounds/services/RoundsService";
import { useLiveRefresh } from "@modules/dashboard/hooks/useLiveRefresh";

/** Respaldo por si el tiempo real no conecta. */
const REFRESH_MS = 60_000;

const fetchByStatus = async (status: Invitation["status"], sortKey: string, direction: "asc" | "desc") => {
  const res = await getPaginatedInvitations({ page: 1, limit: 200, filters: { status }, sort: { key: sortKey, direction } });
  if (!res.success) throw new Error(res.messages?.[0] ?? "No se pudieron cargar las visitas");
  return (res.data ?? []) as Invitation[];
};

export type CasetaData = {
  /** Pases pendientes que todavía no vencen, del más próximo al más lejano. */
  expected: Invitation[];
  /** Visitas que entraron y no han salido. */
  inside: Invitation[];
  /** Visitas sin cita esperando la decisión del residente, de la más antigua a la más reciente. */
  awaiting: Invitation[];
  /** Entradas registradas hoy (sigan dentro o ya hayan salido). */
  entriesToday: number;
  activeRound: IRound | null;
  /** Permanencia máxima (horas) y visitas dentro que ya la rebasaron. */
  maxStayHours: number | null;
  overstayedIds: number[];
};

/** Datos operativos de la caseta: visitas por llegar, visitas dentro y la ronda del guardia. Se recarga en cuanto cambia una visita. */
export const useCasetaData = (guardId?: number) => {
  const [data, setData] = useState<CasetaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [pending, awaiting, entered, exited, rounds, casetaStatus] = await Promise.all([
        fetchByStatus("PENDING", "validFrom", "asc"),
        fetchByStatus("PENDING_APPROVAL", "createdAt", "asc"),
        fetchByStatus("ENTERED", "entryTime", "desc"),
        fetchByStatus("EXITED", "exitTime", "desc"),
        guardId ? getRounds(undefined, guardId).catch(() => null) : Promise.resolve(null),
        getCasetaStatus(),
      ]);
      const now = dayjs();
      const isToday = (value?: string) => !!value && dayjs(value).isSame(now, "day");
      setData({
        expected: pending.filter((inv) => dayjs(inv.validUntil).isAfter(now)),
        inside: entered,
        awaiting,
        entriesToday: [...entered, ...exited].filter((inv) => isToday(inv.entryTime)).length,
        activeRound: rounds?.success ? rounds.data?.find((round) => round.status === "IN_PROGRESS") ?? null : null,
        maxStayHours: casetaStatus.data?.maxStayHours ?? null,
        overstayedIds: casetaStatus.data?.overstayedIds ?? [],
      });
      setError(null);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las visitas");
    } finally {
      setLoading(false);
    }
  }, [guardId]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useLiveRefresh(load, "invitation-updated");

  return { data, error, loading, updatedAt, reload: load };
};
