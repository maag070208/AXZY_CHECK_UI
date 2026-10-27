import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITChip,
  ITDatePicker,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITImage,
  ITPage,
  ITSearchSelect,
  ITSkeleton,
  ITText,
} from "@axzydev/axzy_ui_system";
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
import { MediaCarousel, type MediaItem } from "@app/core/components/MediaCarousel";
import { useRolePalette } from "@app/core/hooks/useRolePalette";
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

const LiveDot = () => {
  const palette = useRolePalette();
  return (
  <ITText as="span" className="relative flex h-2 w-2">
    <ITText as="span" style={{ backgroundColor: palette.accent }} className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" />
    <ITText as="span" style={{ backgroundColor: palette.primary }} className="relative inline-flex rounded-full h-2 w-2" />
  </ITText>
  );
};

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
  const palette = useRolePalette();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGuardId = searchParams.get("guardId");

  const [guards, setGuards] = useState<User[]>([]);
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(
    initialGuardId ? Number(initialGuardId) : null,
  );
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf("month").toDate(), dayjs().toDate()]);
  const [loadingGuards, setLoadingGuards] = useState(true);
  const [guardsError, setGuardsError] = useState<string | null>(null);

  const [liveActiveRounds, setLiveActiveRounds] = useState<ILiveActiveRound[]>([]);

  const [summary, setSummary] = useState<ReportService.IGuardDetail | null>(null);
  const [breakdown, setBreakdown] = useState<ReportService.IGuardDetailBreakdown | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [rounds, setRounds] = useState<IRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);

  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [roundDetail, setRoundDetail] = useState<IRoundDetail | null>(null);
  const [loadingRoundDetail, setLoadingRoundDetail] = useState(false);
  const [evidence, setEvidence] = useState<{ media: MediaItem[]; title: string } | null>(null);

  const loadInitial = useCallback(async () => {
    setLoadingGuards(true);
    setGuardsError(null);
    try {
      const [usersRes, liveRes] = await Promise.all([getUsers(), getLiveDashboard()]);
      if (usersRes.success && usersRes.data) {
        const onlyGuards = usersRes.data.filter((u) => ["GUARD", "SHIFT", "MAINT"].includes(u.role?.name));
        setGuards(onlyGuards);
      } else {
        setGuardsError(usersRes.messages?.[0] ?? "No se pudieron cargar los guardias.");
      }
      if (liveRes.success && liveRes.data) setLiveActiveRounds(liveRes.data.activeRounds);
    } catch (error: any) {
      setGuardsError(error?.message ?? "No se pudieron cargar los guardias.");
    } finally {
      setLoadingGuards(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

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
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      loading={loadingGuards}
      empty={!loadingGuards && !guardsError && guards.length === 0}
      emptyTitle="Sin guardias disponibles"
      emptyDescription="No hay guardias o jefes de guardia activos para mostrar."
      error={guardsError}
      onRetry={loadInitial}
      title="Seguimiento de Guardia"
      breadcrumbs={[
        { label: "Inicio", href: "#/home" },
        { label: "Operación" },
        { label: "Seguimiento de Guardia" },
      ]}
      description={
        selectedGuard
          ? `${selectedGuard.name} ${selectedGuard.lastName ?? ""} · ${ROLE_TRANSLATIONS[selectedGuard.role?.name] ?? selectedGuard.role?.name}`
          : "Elige un guardia para ver su resumen del periodo, sus rondas y el mapa de cada una."
      }
      icon={<FaUserShield size={20} />}
      iconColor={palette.primary}
      actions={
        isLiveGuard ? (
          <ITChip
            label="En ronda ahora"
            color="success"
            size="sm"
            variant="soft"
            icon={<LiveDot />}
          />
        ) : undefined
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITCard className="rounded-3xl" contentClassName="space-y-4">
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={5}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Guardia
                </ITText>
                <ITSearchSelect
                  name="guard"
                  placeholder="Selecciona un guardia..."
                  options={guardOptions}
                  value={selectedGuardId ? String(selectedGuardId) : ""}
                  onChange={(val) => setSelectedGuardId(val ? Number(val) : null)}
                />
              </ITFlex>
            </ITGrid>

            <ITGrid item xs={12} md={5}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Periodo
                </ITText>
                <ITDatePicker
                  name="range"
                  value={dateRange}
                  range
                  onChange={(e: any) => setDateRange(e.target.value)}
                  className="w-full"
                />
              </ITFlex>
            </ITGrid>

            <ITGrid item xs={12} md={2}>
              <ITFlex align="end" justify="end" className="h-full">
                <ITButton
                  variant="icon-only"
                  color="primary"
                  size="sm"
                  icon={<FaSync className={loadingSummary || loadingRounds ? "animate-spin" : ""} size={13} />}
                  ariaLabel="Actualizar seguimiento"
                  onClick={() => {
                    loadSummary();
                    loadRounds();
                  }}
                  className="shrink-0"
                />
              </ITFlex>
            </ITGrid>
          </ITGrid>

          {liveActiveRounds.length > 0 && (
            <ITFlex align="center" gap={2} wrap="wrap" className="pt-1">
              <ITFlex align="center" gap={1}>
                <LiveDot />
                <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  En ronda ahora
                </ITText>
              </ITFlex>
              {liveActiveRounds.map((r) => {
                const active = selectedGuardId === r.guard.id;
                return (
                  <ITChip
                    key={r.roundId}
                    label={`${r.guard.name} ${r.guard.lastName ?? ""}`.trim()}
                    color={active ? "primary" : "success"}
                    selected={active}
                    size="sm"
                    variant="soft"
                    onClick={() => setSelectedGuardId(r.guard.id)}
                  />
                );
              })}
            </ITFlex>
          )}
        </ITCard>

        {!selectedGuardId && (
          <ITCard className="rounded-3xl" contentClassName="p-0!">
            <ITEmptyState
              icon={<FaUserShield size={28} />}
              title="Selecciona un guardia para ver su seguimiento."
              description="Verás su resumen del periodo, sus rondas y el recorrido en el mapa."
              className="py-14"
            />
          </ITCard>
        )}

        {selectedGuardId && (
          <>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={12} sm={6} xl={3}>
                <SummaryCard title="Rondas" value={summary?.totalRounds} icon={<FaRoute />} color="emerald" loading={loadingSummary && !summary} />
              </ITGrid>
              <ITGrid item xs={12} sm={6} xl={3}>
                <SummaryCard title="Escaneos" value={summary?.totalScans} icon={<FaMapMarkerAlt />} color="sky" loading={loadingSummary && !summary} />
              </ITGrid>
              <ITGrid item xs={12} sm={6} xl={3}>
                <SummaryCard title="Omitidos" value={summary?.missedScans} icon={<FaExclamationCircle />} color="red" loading={loadingSummary && !summary} />
              </ITGrid>
              <ITGrid item xs={12} sm={6} xl={3}>
                <SummaryCard
                  title="Cumplimiento"
                  value={compliance !== null ? `${compliance}%` : "---"}
                  icon={<FaCheckCircle />}
                  color="indigo"
                  loading={loadingSummary && !summary}
                />
              </ITGrid>
            </ITGrid>

            {breakdown && breakdown.incompleteRounds.length > 0 && (
              <ITAlert
                variant="warning"
                title={`${breakdown.incompleteRounds.length} ronda(s) incompleta(s) en este periodo`}
              >
                <ITText as="p" className="text-[11px] text-amber-700 dark:text-amber-300">
                  {breakdown.incompleteRounds
                    .map((r) => `${dayjs(r.startTime).format("DD/MM")} (${r.missedCount} omitidos)`)
                    .join(" · ")}
                </ITText>
              </ITAlert>
            )}

            <ITGrid container columns={12} spacing={5} className="items-stretch">
              <ITGrid item xs={12} lg={4} className="order-2 lg:order-1">
                <ITCard title="Rondas del Periodo" className="h-full rounded-3xl" contentClassName="space-y-2">
                  {loadingRounds ? (
                    <ITFlex direction="column" className="space-y-2">
                      <ITSkeleton variant="rectangular" height={60} count={3} className="rounded-xl" />
                    </ITFlex>
                  ) : rounds.length === 0 ? (
                    <ITEmptyState title="Sin rondas en este rango de fechas." className="py-12" />
                  ) : (
                    <ITFlex direction="column" className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {rounds.map((round) => {
                        const isActive = round.status === "IN_PROGRESS";
                        const isSelected = selectedRoundId === round.id;
                        return (
                          <ITCard
                            key={round.id}
                            onClick={() => setSelectedRoundId(round.id)}
                            className={`rounded-2xl! shrink-0 ${
                              isSelected
                                ? isActive
                                  ? `${palette.softClass}! border-transparent!`
                                  : "bg-sky-50! border-sky-200!"
                                : isActive
                                  ? `${palette.softClass}!/40 border-transparent!`
                                  : "bg-slate-50/60! border-slate-100!"
                            }`}
                            contentClassName="space-y-2 p-3!"
                          >
                            <ITFlex align="center" gap={2}>
                              {isActive && <LiveDot />}
                              <ITText as="p" className="text-xs font-black text-slate-700 dark:text-slate-200">
                                {dayjs(round.startTime).format("DD [de] MMM, YYYY · HH:mm")}
                              </ITText>
                            </ITFlex>
                            <ITFlex align="center" justify="between" gap={2}>
                              <ITText as="p" className="min-w-0 truncate text-[10px] font-medium text-slate-400">
                                {round.recurringConfiguration?.title ?? "Sin ruta"}
                              </ITText>
                              <ITBadget
                                color={isActive ? "primary" : "secondary"}
                                variant="outlined"
                                size="sm"
                                className="shrink-0 whitespace-nowrap"
                              >
                                {isActive ? "En curso" : "Completada"}
                              </ITBadget>
                            </ITFlex>
                          </ITCard>
                        );
                      })}
                    </ITFlex>
                  )}
                </ITCard>
              </ITGrid>

              <ITGrid item xs={12} lg={4} className="order-1 lg:order-2">
                <ITCard title="Mapa de la Ronda" className="h-full rounded-3xl" contentClassName="space-y-3">
                  {selectedRound && (
                    <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                      <ITText as="p" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Ronda seleccionada
                      </ITText>
                      <ITBadget
                        color={selectedRound.status === "IN_PROGRESS" ? "primary" : "secondary"}
                        variant="outlined"
                        size="sm"
                        className="shrink-0 whitespace-nowrap"
                      >
                        {selectedRound.status === "IN_PROGRESS" ? "En curso" : "Completada"} ·{" "}
                        {dayjs(selectedRound.startTime).format("DD/MM HH:mm")}
                      </ITBadget>
                    </ITFlex>
                  )}

                  {loadingRounds ? (
                    <ITSkeleton variant="rectangular" height={420} className="rounded-2xl" />
                  ) : !selectedRoundId ? (
                    <ITEmptyState
                      title="Este guardia no tiene rondas en el periodo seleccionado."
                      className="py-12"
                    />
                  ) : loadingRoundDetail ? (
                    <ITSkeleton variant="rectangular" height={420} className="rounded-2xl" />
                  ) : (
                    <>
                      <RoundRouteMap points={routePoints} height="420px" className="rounded-2xl" />
                      <ITText as="p" className="text-[10px] font-medium text-slate-400">
                        Ctrl/Cmd + scroll para zoom
                      </ITText>
                    </>
                  )}
                </ITCard>
              </ITGrid>

              <ITGrid item xs={12} lg={4} className="order-3">
                <ITCard title="Línea de Tiempo" className="h-full rounded-3xl" contentClassName="space-y-2">
                  {loadingRounds || loadingRoundDetail ? (
                    <ITSkeleton variant="rectangular" height={320} className="rounded-2xl" />
                  ) : !roundDetail?.timeline.length ? (
                    <ITEmptyState title="Sin eventos para esta ronda." className="py-12" />
                  ) : (
                    <ITFlex direction="column" className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {roundDetail.timeline.map((event, i) => {
                        const prev = i > 0 ? roundDetail.timeline[i - 1] : null;
                        const deltaMin = prev
                          ? Math.round((new Date(event.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000)
                          : 0;
                        const media = Array.isArray(event.data?.media) ? (event.data.media as MediaItem[]) : [];
                        const firstImage = media.find((m) => m.type === "IMAGE");
                        return (
                          <ITFlex
                            key={i}
                            direction="column"
                            gap={2}
                            className="shrink-0 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                          >
                            <ITFlex align="start" gap={2}>
                              <ITFlex
                                align="center"
                                justify="center"
                                className="h-6 w-6 shrink-0 rounded-full bg-sky-100 text-[10px] font-black text-sky-700"
                              >
                                {event.type === "SCAN" ? i : event.type === "START" ? "▶" : "■"}
                              </ITFlex>
                              <ITFlex direction="column" className="min-w-0 flex-1">
                                <ITText as="p" className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {event.description}
                                </ITText>
                                <ITFlex align="center" gap={2} className="flex flex-wrap items-center gap-2">
                                  <ITText as="span" className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <FaClock className="text-slate-300" />
                                    {dayjs(event.timestamp).format("HH:mm:ss")}
                                  </ITText>
                                  {i > 0 && (
                                    <ITText as="span" className="text-[10px] font-bold text-sky-500">
                                      +{deltaMin} min
                                    </ITText>
                                  )}
                                </ITFlex>
                              </ITFlex>
                            </ITFlex>

                            {media.length > 0 && (
                              <ITFlex align="center" gap={2} className="pl-8">
                                {firstImage && (
                                  <ITImage
                                    src={firstImage.url}
                                    alt={event.description}
                                    fit="cover"
                                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                  />
                                )}
                                <ITButton
                                  variant="text"
                                  color="secondary"
                                  size="sm"
                                  onClick={() => setEvidence({ media, title: event.description })}
                                >
                                  Ver evidencia ({media.length})
                                </ITButton>
                              </ITFlex>
                            )}
                          </ITFlex>
                        );
                      })}
                    </ITFlex>
                  )}
                </ITCard>
              </ITGrid>
            </ITGrid>

            <ITDialog
              isOpen={!!evidence}
              onClose={() => setEvidence(null)}
              title="Evidencia del escaneo"
              padded={false}
              className="max-w-3xl"
            >
              {evidence && (
                <ITFlex className="p-4">
                  <MediaCarousel media={evidence.media} title={evidence.title} />
                </ITFlex>
              )}
            </ITDialog>
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
  const palette = useRolePalette();
  const colorClasses: Record<string, string> = {
    emerald: `${palette.softClass} ${palette.primaryTextClass}`,
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
    red: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
    indigo: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
  };

  return (
    <ITCard className="h-full" contentClassName="p-4!">
      <ITFlex align="center" justify="between" gap={2}>
        <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </ITText>
        <ITFlex
          align="center"
          justify="center"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${colorClasses[color]}`}
        >
          {icon}
        </ITFlex>
      </ITFlex>
      {loading ? (
        <ITSkeleton variant="rectangular" height={28} width={70} className="mt-2" />
      ) : (
        <ITText as="p" className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {value ?? 0}
        </ITText>
      )}
    </ITCard>
  );
};

export default GuardTrackingPage;
