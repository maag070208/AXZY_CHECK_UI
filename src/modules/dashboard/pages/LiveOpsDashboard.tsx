import {
  ITAlert,
  ITButton,
  ITCard,
  ITChip,
  ITFlex,
  ITGrid,
  ITPage,
  ITSegmentedControl,
  ITSkeleton,
  ITStatCard,
  ITText,
} from "@axzydev/axzy_ui_system";
import { AppState } from "@app/core/store/store";
import dayjs from "dayjs";
import { useState } from "react";
import {
  FaArrowRight,
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
import { LiveAside } from "../components/LiveAside";
import { IncidentsByCategory, IncidentsByHour, RoundsTrend, TodaySummary } from "../components/LiveInsights";
import { LiveGuardsMap } from "../components/LiveGuardsMap";

type KpiTone = "green" | "blue" | "amber" | "red" | "violet" | "mint";

const TONE_COLOR: Record<KpiTone, string> = {
  green: "bg-emerald-50 dark:bg-emerald-950/20",
  blue: "bg-blue-50 dark:bg-blue-950/20",
  amber: "bg-amber-50 dark:bg-amber-950/20",
  red: "bg-rose-50 dark:bg-rose-950/20",
  violet: "bg-violet-50 dark:bg-violet-950/20",
  mint: "bg-teal-50 dark:bg-teal-950/20",
};

interface KpiCardProps {
  title: string;
  value?: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone: KpiTone;
  loading: boolean;
  onClick: () => void;
}

const KpiCard = ({ title, value, hint, icon, tone, loading, onClick }: KpiCardProps) => {
  if (loading) {
    return <ITSkeleton variant="rectangular" height={112} className="rounded-2xl" />;
  }

  return (
    <ITStatCard
      label={title}
      value={value ?? "—"}
      trend={hint}
      trendDirection="neutral"
      icon={icon}
      color={TONE_COLOR[tone]}
      className="h-full rounded-2xl"
      onClick={onClick}
    />
  );
};

const SummarySkeleton = () => (
  <ITCard title="Hoy en números" className="rounded-3xl" contentClassName="space-y-3">
    <ITFlex className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <ITSkeleton variant="rectangular" height={80} count={5} />
    </ITFlex>
  </ITCard>
);

/**
 * Home de ADMIN/SHIFT — Centro de operaciones.
 * UI 100% AXZY UI System + utilidades de layout por className.
 */
export const LiveOpsDashboard = () => {
  const { data, loading, error, refetch } = useLiveDashboard();
  const auth = useSelector((state: AppState) => state.auth);
  const navigate = useNavigate();
  const [view, setView] = useState<"live" | "analytics">("live");
  const [monitorView, setMonitorView] = useState<"resumen" | "ritmo">("resumen");
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

  const firstName = auth.name?.trim().split(/\s+/)[0] || "equipo";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const hour = dayjs().hour();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateLabel = dayjs().format("dddd, D [de] MMMM");
  const dateCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  const activeRounds = data?.kpis.activeRoundsCount;
  const guardsOnShift = data?.kpis.guardsOnShiftCount;
  const openIncidents = data?.kpis.openIncidentsCount;
  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title={`${greeting}, ${displayName}`}
      description={`${dateCap} · El pulso de tu operación en tiempo real.`}
      icon={<FaShieldAlt size={20} />}
      iconColor="#065911"
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
              { value: "analytics", label: "Security Analytics", icon: <FaChartLine size={12} /> },
            ]}
            value={view}
            onChange={(value) => setView(value as "live" | "analytics")}
          />
          <ITText as="span" className="text-[10px] font-semibold text-slate-500">
            {view === "live" ? "Datos en vivo · actualización automática" : "Histórico y analítica de seguridad"}
          </ITText>
        </ITFlex>

        {view === "live" ? (
          <ITGrid container columns={12} spacing={5}>
            <ITGrid item xs={12} xl={9} className="min-w-0">
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

              <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                <ITSegmentedControl
                  size="sm"
                  options={[
                    { value: "resumen", label: "Resumen" },
                    { value: "ritmo", label: "Ritmo de la operación" },
                  ]}
                  value={monitorView}
                  onChange={(value) => setMonitorView(value as "resumen" | "ritmo")}
                />
                <ITText as="span" className="text-[10px] font-semibold text-slate-500">
                  {monitorView === "resumen" ? "Resumen operativo" : "Tendencias de los últimos 7 días"}
                </ITText>
              </ITFlex>

              {monitorView === "resumen" ? (
                <>
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
                </>
              ) : (
              <ITFlex direction="column" gap={3}>
                <ITFlex align="end" justify="between" gap={2} wrap="wrap">
                  <ITFlex direction="column" gap={1}>
                    <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-primary-700">
                      Últimos 7 días
                    </ITText>
                    <ITText as="h3" className="text-base font-extrabold tracking-tight text-slate-900">
                      Ritmo de la operación
                    </ITText>
                    <ITText as="p" className="text-xs text-slate-500">
                      Rondas, incidencias y horas de mayor actividad.
                    </ITText>
                  </ITFlex>
                  <ITChip label="Actualizado en vivo" color="secondary" size="sm" variant="soft" />
                </ITFlex>

                {data?.insights ? (
                  <ITGrid container columns={12} spacing={3}>
                    <ITGrid item xs={12} xl={4}>
                      <RoundsTrend insights={data.insights} />
                    </ITGrid>
                    <ITGrid item xs={12} xl={4}>
                      <IncidentsByCategory insights={data.insights} />
                    </ITGrid>
                    <ITGrid item xs={12} xl={4}>
                      <IncidentsByHour insights={data.insights} />
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
              )}
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} xl={3} className="min-w-0 xl:sticky xl:top-4">
            <LiveAside data={data} loading={loading} />
          </ITGrid>
        </ITGrid>
        ) : (
          <ITFlex className="w-full min-w-0">
            <AnalyticsTab />
          </ITFlex>
        )}
      </ITFlex>
    </ITPage>
  );
};
