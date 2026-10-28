import {
  ITAlert,
  ITButton,
  ITCard,
  ITChip,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITPage,
  ITSegmentedControl,
  ITSkeleton,
  ITText,
  ITProgress,
} from "@axzydev/axzy_ui_system";
import { AppState } from "@app/core/store/store";
import { getCatalogOptions } from "@core/services/CatalogService";
import { getIncidents } from "../../incidents/services/IncidentService";
import { getPaginatedRounds } from "../../rounds/services/RoundsService";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaChartBar,
  FaChartLine,
  FaCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkedAlt,
  FaPlus,
  FaRoute,
  FaShieldAlt,
  FaSync,
  FaTshirt,
  FaUserShield,
  FaWifi,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnalyticsTab } from "../../home/components/tabs/AnalyticsTab";
import { useLiveDashboard } from "../hooks/useLiveDashboard";
import { useRolePalette } from "@app/core/hooks/useRolePalette";
import type { ILiveInsights } from "../services/DashboardService";
import { LiveAside } from "../components/LiveAside";
import { IncidentsByCategory, IncidentsByHour, RoundsTrend, TodaySummary } from "../components/LiveInsights";
import { LiveGuardsMap } from "../components/LiveGuardsMap";

type KpiTone = "green" | "blue" | "amber" | "red" | "violet" | "mint";

const TONE_ICON: Record<KpiTone, string> = {
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  red: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
  mint: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
};

const TONE_PROGRESS: Record<KpiTone, "success" | "info" | "warning" | "danger" | "purple" | "primary"> = {
  green: "primary",
  blue: "info",
  amber: "warning",
  red: "danger",
  violet: "purple",
  mint: "success",
};

interface KpiCardProps {
  title: string;
  value?: number | string;
  hint?: string;
  progress?: number;
  icon: React.ReactNode;
  tone: KpiTone;
  loading: boolean;
  onClick: () => void;
}

const KpiCard = ({ title, value, hint, progress, icon, tone, loading, onClick }: KpiCardProps) => {
  const palette = useRolePalette();
  if (loading) {
    return <ITSkeleton variant="rectangular" height={112} className="rounded-2xl" />;
  }

  return (
    <ITCard onClick={onClick} className="h-full" contentClassName="p-4!">
      <ITFlex align="center" justify="between" gap={2}>
        <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </ITText>
        <ITFlex
          align="center"
          justify="center"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone === "green" ? `${palette.softClass} ${palette.primaryTextClass}` : TONE_ICON[tone]}`}
        >
          {icon}
        </ITFlex>
      </ITFlex>
      <ITText as="p" className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
        {value}
      </ITText>
      {hint && (
        <ITText as="p" className="mt-1 text-[10px] font-medium leading-snug text-slate-500 dark:text-slate-400">
          {hint}
        </ITText>
      )}
      {progress !== undefined && (
        <ITProgress
          value={progress}
          max={100}
          color={TONE_PROGRESS[tone]}
          size="sm"
          className="mt-3"
        />
      )}
    </ITCard>
  );
};

const SummarySkeleton = () => (
  <ITCard title="Hoy en números" className="rounded-3xl" contentClassName="space-y-3">
    <ITFlex className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <ITSkeleton variant="rectangular" height={80} count={5} />
    </ITFlex>
  </ITCard>
);

type RhythmInsights = Pick<ILiveInsights, "roundsByDay" | "incidentsByCategory" | "incidentsByHour">;

const RhythmSection = () => {
  const [range, setRange] = useState<any>([dayjs().subtract(6, "day").toDate(), dayjs().toDate()]);
  const [rhythm, setRhythm] = useState<RhythmInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!range?.[0] || !range?.[1]) return;
      const start = dayjs(range[0]).startOf("day");
      const end = dayjs(range[1]).endOf("day");

      setLoading(true);
      setError(null);

      try {
        const [incidentsRes, categoriesRes, firstPage] = await Promise.all([
          getIncidents({ startDate: start.toDate(), endDate: end.toDate() }),
          getCatalogOptions("incident_category" as any),
          getPaginatedRounds({
            page: 1,
            limit: 1000,
            filters: { date: [start.toISOString(), end.toISOString()] } as any,
            sort: { key: "startTime", direction: "asc" },
          }),
        ]);

        if (cancelled) return;

        const incidents = incidentsRes.success ? incidentsRes.data ?? [] : [];
        const categoryMap = new Map<number, string>();
        if (categoriesRes?.success && Array.isArray(categoriesRes.data)) {
          for (const c of categoriesRes.data) {
            categoryMap.set(Number(c.id), c.name ?? c.value ?? "Sin categoría");
          }
        }

        let rounds = firstPage.data;
        if (firstPage.total > rounds.length && rounds.length > 0) {
          const pages = Math.ceil(firstPage.total / 1000);
          const rest = await Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
              getPaginatedRounds({
                page: i + 2,
                limit: 1000,
                filters: { date: [start.toISOString(), end.toISOString()] } as any,
                sort: { key: "startTime", direction: "asc" },
              }),
            ),
          );
          if (cancelled) return;
          rounds = rounds.concat(...rest.map((p) => p.data));
        }

        const days: string[] = [];
        for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(1, "day")) {
          days.push(d.format("YYYY-MM-DD"));
        }

        const roundsByDay = days.map((date) => {
          const ofDay = rounds.filter((r) => dayjs(r.startTime).format("YYYY-MM-DD") === date);
          return {
            date,
            started: ofDay.length,
            completed: ofDay.filter((r) => r.status === "COMPLETED").length,
          };
        });

        const byCategory = new Map<string, number>();
        for (const i of incidents) {
          const name = (i.categoryId && categoryMap.get(Number(i.categoryId))) || "Sin categoría";
          byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
        }
        const incidentsByCategory = [...byCategory.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        const incidentsByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
        for (const i of incidents) incidentsByHour[dayjs(i.createdAt).hour()].count++;

        setRhythm({ roundsByDay, incidentsByCategory, incidentsByHour });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "No se pudo cargar el rango.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [range, reloadKey]);

  const start = range?.[0] ? dayjs(range[0]) : dayjs().subtract(6, "day");
  const end = range?.[1] ? dayjs(range[1]) : dayjs();

  return (
    <ITFlex direction="column" gap={3}>
      <ITFlex align="end" justify="between" gap={2} wrap="wrap">
        <ITFlex direction="column" gap={1}>
          <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-primary-700">
            Ritmo de la operación
          </ITText>
          <ITText as="h3" className="text-base font-extrabold tracking-tight text-slate-900">
            Rondas, incidencias y horas de mayor actividad
          </ITText>
          <ITText as="p" className="text-xs text-slate-500">
            Filtra las tres gráficas por rango de fechas.
          </ITText>
        </ITFlex>
        <ITFlex align="center" gap={2} wrap="nowrap" className="w-full sm:w-auto">
          <ITDatePicker
            name="rhythm-range"
            value={range}
            range
            onChange={(e: any) => setRange(e.target.value)}
            className="w-full sm:w-[260px]"
          />
          <ITButton
            variant="icon-only"
            color="primary"
            size="sm"
            icon={<FaSync className={loading ? "animate-spin" : ""} size={13} />}
            ariaLabel="Actualizar rango"
            onClick={() => setReloadKey((k) => k + 1)}
            className="shrink-0"
          />
        </ITFlex>
      </ITFlex>

      {error && (
        <ITAlert variant="error" title="No se pudo cargar el rango">
          {error}
        </ITAlert>
      )}

      {rhythm && !loading ? (
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} xl={6}>
            <RoundsTrend
              insights={rhythm}
              title={`Rondas — ${start.format("DD MMM")} a ${end.format("DD MMM")}`}
              height={240}
            />
          </ITGrid>
          <ITGrid item xs={12} xl={3}>
            <IncidentsByCategory insights={rhythm} subtitle={`Rango: ${start.format("DD MMM")} a ${end.format("DD MMM")}`} />
          </ITGrid>
          <ITGrid item xs={12} xl={3}>
            <IncidentsByHour insights={rhythm} subtitle={`Top 6 horas · ${start.format("DD MMM")} a ${end.format("DD MMM")}`} />
          </ITGrid>
        </ITGrid>
      ) : (
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} xl={4}>
            <ITSkeleton variant="rectangular" height={220} />
          </ITGrid>
          <ITGrid item xs={12} xl={4}>
            <ITSkeleton variant="rectangular" height={220} />
          </ITGrid>
          <ITGrid item xs={12} xl={4}>
            <ITSkeleton variant="rectangular" height={220} />
          </ITGrid>
        </ITGrid>
      )}
    </ITFlex>
  );
};

/**
 * Home de ADMIN/SHIFT — Centro de operaciones.
 * UI 100% AXZY UI System + utilidades de layout por className.
 */
export const LiveOpsDashboard = () => {
  const { data, loading, error, refetch } = useLiveDashboard();
  const auth = useSelector((state: AppState) => state.auth);
  const navigate = useNavigate();
  const [view, setView] = useState<"live" | "rhythm" | "analytics">("live");
  const isFirstLoad = loading && !data;

  const staleRoundIds = new Set((data?.activeRounds ?? []).filter((r) => r.stale).map((r) => r.roundId));
  const guardsOnRound = (data?.guardsOnShift ?? []).filter((g) => g.status === "ON_ROUND").length;
  const guardsIdle = (data?.guardsOnShift.length ?? 0) - guardsOnRound;
  const uniformsPending = (data?.guardsOnShift ?? []).filter((g) => g.uniformCheckPending).length;

  const mapPoints = (data?.mapPoints ?? []).map((p) => ({
    guardId: p.guardId,
    label: `${p.guardName} — ${p.routeTitle ?? "Sin ruta"}`,
    lat: p.lat,
    lng: p.lng,
    stale: staleRoundIds.has(p.roundId),
  }));

  const palette = useRolePalette();
  const firstName = auth.name?.trim().split(/\s+/)[0] || "equipo";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const hour = dayjs().hour();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateLabel = dayjs().format("dddd, D [de] MMMM");
  const dateCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  const activeRounds = data?.kpis.activeRoundsCount;
  const guardsOnShift = data?.kpis.guardsOnShiftCount;
  const openIncidents = data?.kpis.openIncidentsCount;
  const guardProgress = guardsOnShift ? Math.round((guardsOnRound / guardsOnShift) * 100) : 0;
  const coverageProgress = data?.kpis.routesTotal
    ? Math.round((data.kpis.routesCovered / data.kpis.routesTotal) * 100)
    : 0;
  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      noPadding
      title={`${greeting}, ${displayName}`}
      description={`${dateCap} · El pulso de tu operación en tiempo real.`}
      icon={<FaShieldAlt size={20} />}
      iconColor={palette.primary}
      error={error && !data ? error : null}
      onRetry={refetch}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITChip label="En vivo" color="success" size="sm" variant="soft" icon={<FaWifi size={10} />} />
          <ITText as="span" className="text-[10px] font-semibold text-slate-500">
            {data ? `Actualizado ${dayjs(data.generatedAt).format("HH:mm:ss")}` : "Conectando…"}
          </ITText>
          <ITButton
            variant="icon-only"
            color="secondary"
            size="sm"
            icon={<FaSync size={13} className={loading ? "animate-spin" : ""} />}
            ariaLabel="Actualizar datos"
            onClick={refetch}
          />
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        {error && data && (
          <ITAlert variant="error" title="No se pudo actualizar el tablero">
            <ITFlex align="center" className="flex flex-wrap items-center gap-2">
              <ITText as="span">{error}</ITText>
              <ITButton variant="text" color="secondary" size="sm" onClick={refetch}>
                Reintentar
              </ITButton>
            </ITFlex>
          </ITAlert>
        )}

        <ITFlex align="center" gap={4} wrap="wrap" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <ITFlex direction="column" align="center" justify="center" className="h-16 w-16 shrink-0 rounded-2xl bg-primary-700">
            <ITText as="span" className="text-[8px] font-black uppercase tracking-widest text-white/70!">
              {dayjs().format("MMM")}
            </ITText>
            <ITText as="strong" className="text-2xl font-black leading-none text-white!">
              {dayjs().format("D")}
            </ITText>
            <ITText as="span" className="text-[8px] font-black uppercase tracking-widest text-white/70!">
              {dayjs().format("ddd")}
            </ITText>
          </ITFlex>

          <ITFlex align="center" gap={6} wrap="wrap">
            <ITFlex direction="column">
              <ITText as="strong" className="text-xl font-black tracking-tight text-slate-900">
                {activeRounds ?? "—"}
              </ITText>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                rondas activas
              </ITText>
            </ITFlex>
            <ITFlex direction="column">
              <ITText as="strong" className="text-xl font-black tracking-tight text-slate-900">
                {guardsOnShift ?? "—"}
              </ITText>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                guardias en turno
              </ITText>
            </ITFlex>
            <ITFlex direction="column">
              <ITText as="strong" className="text-xl font-black tracking-tight text-slate-900">
                {openIncidents ?? "—"}
              </ITText>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                incidencias abiertas
              </ITText>
            </ITFlex>
          </ITFlex>

          <ITFlex align="center" gap={2} wrap="wrap" className="ml-auto">
            <ITButton color="primary" variant="filled" size="sm" onClick={() => navigate("/incidents")}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={11} />
                <ITText as="span">Nuevo reporte</ITText>
              </ITFlex>
            </ITButton>
            <ITButton color="secondary" variant="outlined" size="sm" onClick={() => navigate("/rounds")}>
              <ITFlex align="center" gap={1}>
                <ITText as="span">Ver rondas</ITText>
                <FaArrowRight size={9} />
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
          <ITSegmentedControl
            size="sm"
            options={[
              { value: "live", label: "Monitoreo", icon: <FaShieldAlt size={12} /> },
              { value: "rhythm", label: "Ritmo de la operación", icon: <FaChartBar size={12} /> },
              { value: "analytics", label: "Security Analytics", icon: <FaChartLine size={12} /> },
            ]}
            value={view}
            onChange={(value) => setView(value as "live" | "rhythm" | "analytics")}
          />
          <ITText as="span" className="text-[10px] font-semibold text-slate-500">
            {view === "live"
              ? "Datos en vivo · actualización automática"
              : view === "rhythm"
                ? "Tendencias de los últimos 7 días"
                : "Histórico y analítica de seguridad"}
          </ITText>
        </ITFlex>

        {view === "live" ? (
          <ITGrid container columns={12} spacing={5}>
            <ITGrid item xs={12} xl={8} className="min-w-0">
              <ITFlex direction="column" gap={5}>
                <ITGrid container columns={12} spacing={3}>
                <ITGrid item xs={12} md={6} xl={4}>
                <KpiCard
                  title="Rondas activas"
                  value={activeRounds}
                  hint={data && staleRoundIds.size > 0 ? `${staleRoundIds.size} ${staleRoundIds.size === 1 ? "estancada" : "estancadas"}` : "En curso ahora"}
                  icon={<FaRoute />}
                  tone="green"
                  loading={isFirstLoad}
                  onClick={() => navigate("/rounds")}
                />
                </ITGrid>
                <ITGrid item xs={12} md={6} xl={4}>
                <KpiCard
                  title="Guardias en turno"
                  value={guardsOnShift}
                  hint={`${guardsOnRound} en ronda · ${guardsIdle} inactivos`}
                  progress={guardProgress}
                  icon={<FaUserShield />}
                  tone="blue"
                  loading={isFirstLoad}
                  onClick={() => navigate("/guards")}
                />
                </ITGrid>
                <ITGrid item xs={12} md={6} xl={4}>
                <KpiCard
                  title="Incidencias abiertas"
                  value={openIncidents}
                  hint="Pendientes de atender"
                  icon={<FaExclamationTriangle />}
                  tone="amber"
                  loading={isFirstLoad}
                  onClick={() => navigate("/incidents")}
                />
                </ITGrid>
                <ITGrid item xs={12} md={6} xl={4}>
                <KpiCard
                  title="Cobertura de rutas"
                  value={data ? `${data.kpis.routesCovered}/${data.kpis.routesTotal}` : undefined}
                  hint={data && data.uncoveredRoutes.length ? `${data.uncoveredRoutes.length} sin cubrir` : "Todas cubiertas"}
                  progress={coverageProgress}
                  icon={<FaMapMarkedAlt />}
                  tone="mint"
                  loading={isFirstLoad}
                  onClick={() => navigate("/routes")}
                />
                </ITGrid>
                <ITGrid item xs={12} md={6} xl={4}>
                <KpiCard
                  title="Rondas estancadas"
                  value={data ? staleRoundIds.size : undefined}
                  hint="Sin escaneos recientes"
                  icon={<FaClock />}
                  tone="red"
                  loading={isFirstLoad}
                  onClick={() => navigate("/rounds")}
                />
                </ITGrid>
                <ITGrid item xs={12} md={6} xl={4}>
                <KpiCard
                  title="Uniformes pendientes"
                  value={data ? uniformsPending : undefined}
                  hint="Revisión por hacer"
                  icon={<FaTshirt />}
                  tone="violet"
                  loading={isFirstLoad}
                  onClick={() => navigate("/uniform")}
                />
                </ITGrid>
              </ITGrid>

              {data?.insights ? <TodaySummary insights={data.insights} /> : <SummarySkeleton />}

              <ITCard title="Última ubicación conocida" className="rounded-3xl" contentClassName="space-y-3">
                <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                  <ITText as="p" className="text-xs text-slate-500">
                    Guardias con ronda activa en este momento.
                  </ITText>
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <ITChip
                      label={`${mapPoints.length} en ruta`}
                      color="success"
                      size="sm"
                      variant="soft"
                      icon={<FaUserShield size={10} />}
                    />
                    <ITButton variant="text" color="secondary" size="sm" onClick={() => navigate("/guard-tracking")}>
                      <ITFlex align="center" gap={1}>
                        <ITText as="span">Abrir seguimiento</ITText>
                        <FaArrowRight size={9} />
                      </ITFlex>
                    </ITButton>
                  </ITFlex>
                </ITFlex>

                {isFirstLoad ? (
                  <ITSkeleton variant="rectangular" height={420} className="rounded-2xl" />
                ) : (
                  <LiveGuardsMap points={mapPoints} height="420px" className="rounded-2xl" />
                )}

                <ITFlex align="center" gap={2} wrap="wrap">
                  <ITChip label="En ruta" color="success" size="sm" variant="soft" icon={<FaCircle size={7} />} />
                  <ITChip label="Estancada" color="danger" size="sm" variant="soft" icon={<FaCircle size={7} />} />
                  <ITText as="span" className="ml-auto text-[10px] font-medium text-slate-400">
                    Ctrl/Cmd + scroll para zoom
                  </ITText>
                </ITFlex>
              </ITCard>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} xl={4} className="min-w-0 xl:sticky xl:top-4">
            <LiveAside data={data} loading={loading} />
          </ITGrid>
        </ITGrid>
        ) : view === "rhythm" ? (
          <ITFlex className="w-full">
            <RhythmSection />
          </ITFlex>
        ) : (
          <ITFlex className="w-full min-w-0">
            <AnalyticsTab />
          </ITFlex>
        )}
      </ITFlex>
    </ITPage>
  );
};
