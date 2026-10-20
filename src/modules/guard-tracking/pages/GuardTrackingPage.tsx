import { ITBadget, ITButton, ITDatePicker, ITFlex, ITPage, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaRoute,
  FaSync,
  FaUserShield,
} from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { getUsers, User } from "../../users/services/UserService";
import * as ReportService from "../../home/services/ReportService";
import { getPaginatedRounds, getRoundDetail, IRound, IRoundDetail } from "../../rounds/services/RoundsService";
import { getLiveDashboard, ILiveActiveRound } from "../../dashboard/services/DashboardService";
import { RoundRouteMap, RoutePoint } from "../components/RoundRouteMap";

const ROLE_TRANSLATIONS: Record<string, string> = {
  GUARD: "Guardia",
  SHIFT: "Jefe de Guardias",
  MAINT: "Mantenimiento",
};

const Skeleton = ({ className = "" }: { className?: string }) => (
  <ITFlex direction="column" className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
);

const LiveDot = () => (
  <ITText as="span" className="relative flex h-2 w-2">
    <ITText as="span" className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <ITText as="span" className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
  </ITText>
);

/**
 * "Seguimiento de Guardia" — reemplaza la vieja "Detalle Operativo".
 *
 * UX: al elegir un guardia, la ronda activa (o si no hay, la más reciente)
 * se selecciona SOLA — el mapa y la línea de tiempo siempre están visibles
 * a la derecha (arriba en móvil) en vez de esconderse hasta que el usuario
 * haga clic en una fila. Arriba hay accesos rápidos a los guardias que
 * están en ronda AHORA MISMO (mismo dato que el dashboard en vivo).
 */
const GuardTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGuardId = searchParams.get("guardId");

  const [guards, setGuards] = useState<User[]>([]);
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(
    initialGuardId ? Number(initialGuardId) : null,
  );
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf("month").toDate(), dayjs().toDate()]);

  const [liveActiveRounds, setLiveActiveRounds] = useState<ILiveActiveRound[]>([]);

  const [summary, setSummary] = useState<ReportService.IGuardDetail | null>(null);
  const [breakdown, setBreakdown] = useState<ReportService.IGuardDetailBreakdown | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [rounds, setRounds] = useState<IRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);

  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [roundDetail, setRoundDetail] = useState<IRoundDetail | null>(null);
  const [loadingRoundDetail, setLoadingRoundDetail] = useState(false);

  useEffect(() => {
    getUsers().then((res) => {
      if (res.success && res.data) {
        const onlyGuards = res.data.filter((u) => ["GUARD", "SHIFT", "MAINT"].includes(u.role?.name));
        setGuards(onlyGuards);
      }
    });
    getLiveDashboard().then((res) => {
      if (res.success && res.data) setLiveActiveRounds(res.data.activeRounds);
    });
  }, []);

  const filters = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1] || !selectedGuardId) return null;
    return {
      startDate: dayjs(dateRange[0]).format("YYYY-MM-DD"),
      endDate: dayjs(dateRange[1]).format("YYYY-MM-DD"),
      guardId: selectedGuardId,
    };
  }, [dateRange, selectedGuardId]);

  const loadSummary = useCallback(async () => {
    if (!filters || !selectedGuardId) return;
    setLoadingSummary(true);
    const [detailRes, breakdownRes] = await Promise.all([
      ReportService.getDetailedReport(filters),
      ReportService.getGuardDetailBreakdown(selectedGuardId, filters),
    ]);
    if (detailRes.success && detailRes.data) {
      setSummary(detailRes.data.find((d) => d.guardId === selectedGuardId) ?? null);
    }
    if (breakdownRes.success) setBreakdown(breakdownRes.data ?? null);
    setLoadingSummary(false);
  }, [filters, selectedGuardId]);

  const loadRounds = useCallback(async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1] || !selectedGuardId) {
      setRounds([]);
      return;
    }
    setLoadingRounds(true);
    const res = await getPaginatedRounds({
      page: 1,
      limit: 30,
      filters: {
        guard: selectedGuardId,
        date: [dayjs(dateRange[0]).format("YYYY-MM-DD"), dayjs(dateRange[1]).format("YYYY-MM-DD")] as any,
      },
      sort: { key: "startTime", direction: "desc" },
    });
    setRounds(res.data);
    setLoadingRounds(false);
  }, [dateRange, selectedGuardId]);

  useEffect(() => {
    setSelectedRoundId(null);
    setRoundDetail(null);
    if (selectedGuardId) {
      setSearchParams({ guardId: String(selectedGuardId) }, { replace: true });
      loadSummary();
      loadRounds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGuardId, dateRange]);

  // Auto-selección: la ronda EN CURSO tiene prioridad; si no hay ninguna
  // activa, cae a la más reciente del periodo. Así el mapa siempre se ve
  // sin necesidad de hacer clic.
  useEffect(() => {
    if (loadingRounds || selectedRoundId !== null || rounds.length === 0) return;
    const active = rounds.find((r) => r.status === "IN_PROGRESS");
    setSelectedRoundId(active ? active.id : rounds[0].id);
  }, [rounds, loadingRounds, selectedRoundId]);

  useEffect(() => {
    if (!selectedRoundId) return;
    setLoadingRoundDetail(true);
    getRoundDetail(selectedRoundId).then((res) => {
      if (res.success && res.data) setRoundDetail(res.data);
      setLoadingRoundDetail(false);
    });
  }, [selectedRoundId]);

  const routePoints: RoutePoint[] = useMemo(() => {
    if (!roundDetail) return [];
    let seq = 0;
    return roundDetail.timeline
      .filter((e) => e.type === "SCAN" && e.data?.latitude != null && e.data?.longitude != null)
      .map((e) => {
        seq += 1;
        return {
          seq,
          label: e.data?.location?.name ?? e.description,
          timestamp: e.timestamp,
          lat: e.data.latitude,
          lng: e.data.longitude,
        };
      });
  }, [roundDetail]);

  const compliance = summary
    ? summary.totalScans + summary.missedScans === 0
      ? null
      : Math.round((summary.totalScans / (summary.totalScans + summary.missedScans)) * 100)
    : null;

  const guardOptions = guards.map((g) => ({ label: `${g.name} ${g.lastName ?? ""}`, value: String(g.id) }));
  const selectedGuard = guards.find((g) => g.id === selectedGuardId) ?? null;
  const selectedRound = rounds.find((r) => r.id === selectedRoundId) ?? null;
  const isLiveGuard = liveActiveRounds.some((r) => r.guard.id === selectedGuardId);

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Seguimiento de Guardia"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Seguimiento de Guardia" }]}
      description={
        selectedGuard
          ? `${selectedGuard.name} ${selectedGuard.lastName ?? ""} · ${ROLE_TRANSLATIONS[selectedGuard.role?.name] ?? selectedGuard.role?.name}`
          : "Elige un guardia para ver su resumen del periodo, sus rondas, y el mapa de cada una."
      }
      icon={<FaUserShield size={20} />}
      iconColor="#065911"
      actions={
        isLiveGuard ? (
          <ITText as="span" className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
            <LiveDot /> en ronda ahora
          </ITText>
        ) : undefined
      }
    >
      <ITFlex direction="column" className="space-y-6">
        {/* Barra de filtros + guardias en ronda */}
        <ITFlex direction="column" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
          <ITFlex align="end" gap={3} className="flex flex-wrap items-end gap-3">
            <ITFlex direction="column" className="flex-1 min-w-[220px] max-w-sm">
              <ITText as="p" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Guardia</ITText>
              <ITSearchSelect
                name="guard"
                placeholder="Selecciona un guardia..."
                options={guardOptions}
                value={selectedGuardId ? String(selectedGuardId) : ""}
                onChange={(val) => setSelectedGuardId(val ? Number(val) : null)}
              />
            </ITFlex>
            <ITFlex direction="column" className="flex-1 min-w-[220px] max-w-xs">
              <ITText as="p" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Periodo</ITText>
              <ITDatePicker name="range" value={dateRange} range onChange={(e: any) => setDateRange(e.target.value)} />
            </ITFlex>
            <ITButton
              onClick={() => {
                loadSummary();
                loadRounds();
              }}
              size="sm"
              variant="filled"
              color="primary"
              title="Actualizar"
             
            >
              <FaSync className={loadingSummary || loadingRounds ? "animate-spin" : ""} />
            </ITButton>
          </ITFlex>

          {liveActiveRounds.length > 0 && (
            <ITFlex align="center" gap={2} className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
              <ITText as="span" className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <LiveDot /> En ronda ahora
              </ITText>
              {liveActiveRounds.map((r) => (
                <button
                  key={r.roundId}
                  onClick={() => setSelectedGuardId(r.guard.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    selectedGuardId === r.guard.id
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  {r.guard.name} {r.guard.lastName ?? ""}
                </button>
              ))}
            </ITFlex>
          )}
        </ITFlex>

        {!selectedGuardId && (
          <ITFlex direction="column" align="center" gap={2} className="bg-white border border-dashed border-slate-200 rounded-2xl py-14 flex flex-col items-center gap-2 text-slate-400">
            <FaUserShield size={28} className="text-slate-300" />
            <ITText as="p" className="text-sm font-medium">Selecciona un guardia para ver su seguimiento.</ITText>
            <ITText as="p" className="text-xs">Verás su resumen del periodo, sus rondas y el recorrido en el mapa.</ITText>
          </ITFlex>
        )}

        {selectedGuardId && (
          <>
            {/* Resumen del periodo */}
            <ITFlex direction="column" className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <SummaryCard title="Rondas" value={summary?.totalRounds} icon={<FaRoute />} color="emerald" loading={loadingSummary && !summary} />
              <SummaryCard title="Escaneos" value={summary?.totalScans} icon={<FaMapMarkerAlt />} color="sky" loading={loadingSummary && !summary} />
              <SummaryCard title="Omitidos" value={summary?.missedScans} icon={<FaExclamationCircle />} color="red" loading={loadingSummary && !summary} />
              <SummaryCard
                title="Cumplimiento"
                value={compliance !== null ? `${compliance}%` : "---"}
                icon={<FaCheckCircle />}
                color="indigo"
                loading={loadingSummary && !summary}
              />
            </ITFlex>

            {breakdown && breakdown.incompleteRounds.length > 0 && (
              <ITFlex direction="column" className="shadow-sm border border-amber-100 bg-amber-50 rounded-2xl p-4">
                <ITText as="p" className="text-xs font-black text-amber-700 uppercase tracking-wide mb-2">
                  {breakdown.incompleteRounds.length} ronda(s) incompleta(s) en este periodo
                </ITText>
                <ITText as="p" className="text-[11px] text-amber-600">
                  {breakdown.incompleteRounds
                    .map((r) => `${dayjs(r.startTime).format("DD/MM")} (${r.missedCount} omitidos)`)
                    .join(" · ")}
                </ITText>
              </ITFlex>
            )}

            {/* Rondas (izquierda en desktop) + Detalle de la ronda con mapa (derecha, siempre visible) */}
            <ITFlex direction="column" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <ITFlex direction="column" className="lg:col-span-7 order-1 lg:order-2 lg:sticky lg:top-6">
                <ITFlex direction="column" className="shadow-sm border border-slate-100 bg-white rounded-2xl p-5">
                  <ITFlex align="center" justify="between" className="flex items-center justify-between mb-4">
                    <ITText as="h3" className="text-sm font-bold text-slate-800">Mapa y Línea de Tiempo</ITText>
                    {selectedRound && (
                      <ITBadget
                        color={selectedRound.status === "IN_PROGRESS" ? "primary" : "secondary"}
                        variant="outlined"
                        size="sm"
                        className="!rounded-lg !text-[9px] whitespace-nowrap flex-shrink-0"
                      >
                        {selectedRound.status === "IN_PROGRESS" ? "En curso" : "Completada"} ·{" "}
                        {dayjs(selectedRound.startTime).format("DD/MM HH:mm")}
                      </ITBadget>
                    )}
                  </ITFlex>

                  {loadingRounds ? (
                    <ITFlex direction="column" className="space-y-3">
                      <Skeleton className="h-[320px] w-full" />
                    </ITFlex>
                  ) : !selectedRoundId ? (
                    <ITFlex align="center" justify="center" className="flex items-center justify-center h-[320px] bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                      Este guardia no tiene rondas en el periodo seleccionado.
                    </ITFlex>
                  ) : loadingRoundDetail ? (
                    <ITFlex direction="column" className="space-y-3">
                      <Skeleton className="h-[320px] w-full" />
                    </ITFlex>
                  ) : (
                    <ITFlex direction="column" className="space-y-4">
                      <RoundRouteMap points={routePoints} />
                      <ITFlex direction="column" className="max-h-[320px] overflow-y-auto pr-1 space-y-2">
                        {roundDetail?.timeline.map((event, i) => {
                          const prev = i > 0 ? roundDetail.timeline[i - 1] : null;
                          const deltaMin = prev
                            ? Math.round((new Date(event.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000)
                            : 0;
                          return (
                            <div key={i} className="flex items-start gap-3 bg-slate-50/60 border border-slate-100 rounded-xl px-4 py-2.5">
                              <ITFlex align="center" justify="center" className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                                {event.type === "SCAN" ? i : event.type === "START" ? "▶" : "■"}
                              </ITFlex>
                              <ITFlex direction="column" className="flex-1 min-w-0">
                                <ITText as="p" className="text-xs font-bold text-slate-700 truncate">{event.description}</ITText>
                                <ITText as="p" className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <FaClock className="text-slate-300" />
                                  {dayjs(event.timestamp).format("HH:mm:ss")}
                                  {i > 0 && <ITText as="span" className="text-sky-500 font-bold">+{deltaMin} min</ITText>}
                                </ITText>
                              </ITFlex>
                            </div>
                          );
                        })}
                      </ITFlex>
                    </ITFlex>
                  )}
                </ITFlex>
              </ITFlex>

              <ITFlex direction="column" className="lg:col-span-5 order-2 lg:order-1">
                <ITFlex direction="column" className="shadow-sm border border-slate-100 bg-white rounded-2xl p-5">
                  <ITText as="h3" className="text-sm font-bold text-slate-800 mb-4">Rondas del Periodo</ITText>
                  {loadingRounds ? (
                    <ITFlex direction="column" className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </ITFlex>
                  ) : rounds.length === 0 ? (
                    <ITText as="p" className="text-sm text-slate-400 py-6 text-center">Sin rondas en este rango de fechas.</ITText>
                  ) : (
                    <ITFlex direction="column" className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {rounds.map((round) => {
                        const isActive = round.status === "IN_PROGRESS";
                        const isSelected = selectedRoundId === round.id;
                        return (
                          <button
                            key={round.id}
                            onClick={() => setSelectedRoundId(round.id)}
                            className={`w-full text-left flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-all ${
                              isSelected
                                ? isActive
                                  ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100"
                                  : "bg-sky-50 border-sky-200"
                                : isActive
                                  ? "bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50"
                                  : "bg-slate-50/60 border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <ITFlex direction="column">
                              <ITText as="p" className="text-sm font-black text-slate-700 flex items-center gap-2">
                                {isActive && <LiveDot />}
                                {dayjs(round.startTime).format("DD [de] MMM, YYYY · HH:mm")}
                              </ITText>
                              <ITText as="p" className="text-[11px] text-slate-400 font-medium">
                                {round.recurringConfiguration?.title ?? "Sin ruta"}
                              </ITText>
                            </ITFlex>
                            <ITBadget
                              color={isActive ? "primary" : "secondary"}
                              variant="outlined"
                              size="sm"
                              className="!rounded-lg !text-[9px] whitespace-nowrap flex-shrink-0"
                            >
                              {isActive ? "En curso" : "Completada"}
                            </ITBadget>
                          </button>
                        );
                      })}
                    </ITFlex>
                  )}
                </ITFlex>
              </ITFlex>
            </ITFlex>
          </>
        )}
      </ITFlex>
    </ITPage>
  );
};

const SummaryCard = ({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string;
  value?: number | string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) => {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <ITFlex align="center" gap={3} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 min-w-0">
      <ITFlex direction="column" className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center text-base flex-shrink-0`}>{icon}</ITFlex>
      <ITFlex direction="column" className="min-w-0">
        <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{title}</ITText>
        {loading ? <Skeleton className="h-6 w-14 mt-1" /> : <ITText as="h4" className="text-xl font-black text-slate-800 leading-tight">{value ?? 0}</ITText>}
      </ITFlex>
    </ITFlex>
  );
};

export default GuardTrackingPage;
