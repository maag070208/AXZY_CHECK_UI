import { ITBadget, ITButton, ITCard, ITDatePicker, ITSelect } from "@axzydev/axzy_ui_system";
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
import { RoundRouteMap, RoutePoint } from "../components/RoundRouteMap";

const ROLE_TRANSLATIONS: Record<string, string> = {
  GUARD: "Guardia",
  SHIFT: "Jefe de Guardias",
  MAINT: "Mantenimiento",
};

/**
 * "Seguimiento de Guardia" — reemplaza la vieja "Detalle Operativo": en vez
 * de una tabla con un modal de historial, eliges un guardia y ves de
 * frente su resumen del periodo, sus rondas, y al elegir una ronda el
 * mapa con los puntos escaneados EN ORDEN y cuánto tardó entre cada uno.
 */
const GuardTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGuardId = searchParams.get("guardId");

  const [guards, setGuards] = useState<User[]>([]);
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(
    initialGuardId ? Number(initialGuardId) : null,
  );
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf("month").toDate(), dayjs().toDate()]);

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

  const guardOptions = guards.map((g) => ({ id: String(g.id), value: `${g.name} ${g.lastName ?? ""}` }));
  const selectedGuard = guards.find((g) => g.id === selectedGuardId) ?? null;

  return (
    <div className="bg-[#f8fafc] min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FaUserShield className="text-emerald-600" /> Seguimiento de Guardia
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {selectedGuard
              ? `${selectedGuard.name} ${selectedGuard.lastName ?? ""} · ${ROLE_TRANSLATIONS[selectedGuard.role?.name] ?? selectedGuard.role?.name}`
              : "Elige un guardia para ver su resumen del periodo, sus rondas, y el mapa de cada una."}
          </p>
        </div>

        {/* Filtros */}
        <ITCard className="shadow-sm border-none bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 min-w-[220px]">
            <ITSelect
              name="guard"
              placeholder="Selecciona un guardia..."
              options={guardOptions}
              labelField="value"
              valueField="id"
              value={selectedGuardId ? String(selectedGuardId) : ""}
              onChange={(e: any) => setSelectedGuardId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <ITDatePicker name="range" value={dateRange} range onChange={(e: any) => setDateRange(e.target.value)} />
          <ITButton
            onClick={() => {
              loadSummary();
              loadRounds();
            }}
            size="small"
            variant="filled"
            color="primary"
            className="!rounded-xl !h-10 !w-10 !p-0 flex items-center justify-center flex-shrink-0"
          >
            <FaSync className={loadingSummary || loadingRounds ? "animate-spin" : ""} />
          </ITButton>
        </ITCard>

        {!selectedGuardId && (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl py-20 text-center text-slate-400 text-sm">
            Selecciona un guardia arriba para ver su seguimiento.
          </div>
        )}

        {selectedGuardId && (
          <>
            {/* Resumen del periodo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard title="Rondas" value={summary?.totalRounds} icon={<FaRoute />} color="emerald" />
              <SummaryCard title="Escaneos" value={summary?.totalScans} icon={<FaMapMarkerAlt />} color="sky" />
              <SummaryCard title="Omitidos" value={summary?.missedScans} icon={<FaExclamationCircle />} color="red" />
              <SummaryCard title="Cumplimiento" value={compliance !== null ? `${compliance}%` : "---"} icon={<FaCheckCircle />} color="indigo" />
            </div>

            {breakdown && breakdown.incompleteRounds.length > 0 && (
              <ITCard className="shadow-sm border-none bg-amber-50 rounded-2xl p-5">
                <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-2">
                  {breakdown.incompleteRounds.length} ronda(s) incompleta(s) en este periodo
                </p>
                <p className="text-[11px] text-amber-600">
                  {breakdown.incompleteRounds
                    .map((r) => `${dayjs(r.startTime).format("DD/MM")} (${r.missedCount} omitidos)`)
                    .join(" · ")}
                </p>
              </ITCard>
            )}

            {/* Lista de rondas */}
            <ITCard className="shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Rondas del Periodo</h3>
              {loadingRounds ? (
                <p className="text-sm text-slate-400 py-6 text-center">Cargando...</p>
              ) : rounds.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">Sin rondas en este rango de fechas.</p>
              ) : (
                <div className="space-y-2">
                  {rounds.map((round) => (
                    <button
                      key={round.id}
                      onClick={() => setSelectedRoundId(round.id)}
                      className={`w-full text-left flex items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 transition-all ${
                        selectedRoundId === round.id
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50/60 border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-black text-slate-700">
                          {dayjs(round.startTime).format("DD [de] MMM, YYYY · HH:mm")}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {round.recurringConfiguration?.title ?? "Sin ruta"}
                        </p>
                      </div>
                      <ITBadget
                        color={round.status === "IN_PROGRESS" ? "primary" : "secondary"}
                        variant="outlined"
                        size="small"
                        className="!rounded-lg !text-[9px] whitespace-nowrap flex-shrink-0"
                      >
                        {round.status === "IN_PROGRESS" ? "En curso" : "Completada"}
                      </ITBadget>
                    </button>
                  ))}
                </div>
              )}
            </ITCard>

            {/* Detalle de la ronda seleccionada */}
            {selectedRoundId && (
              <ITCard className="shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Detalle de la Ronda</h3>
                {loadingRoundDetail ? (
                  <p className="text-sm text-slate-400 py-10 text-center">Cargando detalle...</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7">
                      <RoundRouteMap points={routePoints} />
                    </div>
                    <div className="lg:col-span-5 max-h-[420px] overflow-y-auto pr-1 space-y-2">
                      {roundDetail?.timeline.map((event, i) => {
                        const prev = i > 0 ? roundDetail.timeline[i - 1] : null;
                        const deltaMin = prev
                          ? Math.round((new Date(event.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000)
                          : 0;
                        return (
                          <div key={i} className="flex items-start gap-3 bg-slate-50/60 border border-slate-100 rounded-xl px-4 py-2.5">
                            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                              {event.type === "SCAN" ? i : event.type === "START" ? "▶" : "■"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{event.description}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                <FaClock className="text-slate-300" />
                                {dayjs(event.timestamp).format("HH:mm:ss")}
                                {i > 0 && <span className="text-sky-500 font-bold">+{deltaMin} min</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </ITCard>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }: { title: string; value?: number | string; icon: React.ReactNode; color: string }) => {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <ITCard className="p-5 shadow-lg shadow-slate-100/50 border-none bg-white rounded-2xl">
      <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-3 text-base`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-800">{value ?? 0}</h4>
    </ITCard>
  );
};

export default GuardTrackingPage;
