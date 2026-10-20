import { ITButton, ITFlex, ITPage, ITTabs, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import {
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkedAlt,
  FaRoute,
  FaShieldAlt,
  FaSync,
  FaTshirt,
  FaUserShield,
  FaWifi,
} from "react-icons/fa";
import { AnalyticsTab } from "../../home/components/tabs/AnalyticsTab";
import { useLiveDashboard } from "../hooks/useLiveDashboard";
import { LiveAside } from "../components/LiveAside";
import { IncidentsByCategory, IncidentsByHour, RoundsTrend, TodaySummary } from "../components/LiveInsights";
import { LiveGuardsMap } from "../components/LiveGuardsMap";

/** Pulse placeholder shown only on the very first load (loading && !data yet) —
 * así la página se lee como "cargando" en vez de saltar directo a estados
 * vacíos que se ven idénticos a "ya revisé y no hay nada". */
const Skeleton = ({ className = "" }: { className?: string }) => (
  <ITFlex direction="column" className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
);

/**
 * Dashboard administrativo en vivo — reemplaza el Home de WEB para
 * ADMIN/SHIFT. Layout partido: columna principal con el estado operativo
 * (rondas, mapa, alertas, analytics histórico integrado) + columna lateral
 * fija con el Chat del equipo en vivo, siempre visible mientras se navega
 * el resto — así no hay que adivinar qué onda con los guardias ni salir de
 * esta pantalla para coordinar por chat.
 */
export const LiveOpsDashboard = () => {
  const { data, loading, error, refetch } = useLiveDashboard();
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

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Monitoreo en Vivo"
      description="Qué está pasando ahora mismo con la operación — sin tener que adivinar."
      icon={<FaShieldAlt size={20} />}
      iconColor="#059669"
      breadcrumbs={[{ label: "Inicio" }, { label: "Monitoreo en vivo" }]}
      error={error && !data ? error : null}
      onRetry={refetch}
      actions={
        <ITFlex align="center" gap={3} className="flex items-center gap-3">
          <ITText as="span" className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
            <ITText as="span" className="relative flex h-2 w-2">
              <ITText as="span" className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <ITText as="span" className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </ITText>
            <FaWifi /> En vivo
          </ITText>
          {data && (
            <ITText as="span" className="text-[10px] text-slate-400 font-medium">
              Actualizado {dayjs(data.generatedAt).format("HH:mm:ss")}
            </ITText>
          )}
          <ITButton onClick={refetch} size="sm" variant="filled" color="primary">
            <FaSync className={loading ? "animate-spin" : ""} size={13} />
          </ITButton>
        </ITFlex>
      }
    >
      {error && data && (
        <ITFlex direction="column" className="bg-red-50 text-red-600 text-sm font-semibold rounded-2xl px-6 py-4 mb-4">
          {error}
        </ITFlex>
      )}

      {/* Layout partido: contenido principal (pestañas) + chat a la derecha */}
      <ITFlex direction="column" className="grid max-[899px]:grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        <ITFlex direction="column" className="min-w-0">
          <ITTabs
            variant="pill"
            items={[
              {
                id: "live",
                label: "Monitoreo",
                icon: <FaShieldAlt />,
                content: (
                  <ITFlex direction="column" className="space-y-5 pt-4">
                    {/* KPI strip */}
                    <ITFlex direction="column" className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
                      <KpiCard title="Rondas Activas" value={data?.kpis.activeRoundsCount} icon={<FaRoute />} color="emerald" loading={isFirstLoad} />
                      <KpiCard
                        title="Guardias en Turno"
                        value={data?.kpis.guardsOnShiftCount}
                        hint={data ? `${guardsOnRound} en ronda · ${guardsIdle} inactivos` : undefined}
                        icon={<FaUserShield />}
                        color="indigo"
                        loading={isFirstLoad}
                      />
                      <KpiCard title="Incidencias Abiertas" value={data?.kpis.openIncidentsCount} icon={<FaExclamationTriangle />} color="orange" loading={isFirstLoad} />
                      <KpiCard
                        title="Cobertura de Rutas"
                        value={data ? `${data.kpis.routesCovered}/${data.kpis.routesTotal}` : undefined}
                        hint={data && data.uncoveredRoutes.length > 0 ? `${data.uncoveredRoutes.length} sin cubrir` : data ? "Todas cubiertas" : undefined}
                        icon={<FaMapMarkedAlt />}
                        color="sky"
                        loading={isFirstLoad}
                      />
                      <KpiCard title="Rondas Estancadas" value={data ? staleRoundIds.size : undefined} hint="Sin escaneos recientes" icon={<FaClock />} color="red" loading={isFirstLoad} />
                      <KpiCard title="Uniformes Pendientes" value={data ? uniformsPending : undefined} hint="Revisión por hacer" icon={<FaTshirt />} color="amber" loading={isFirstLoad} />
                    </ITFlex>

                    {data?.insights && <TodaySummary insights={data.insights} />}

                    {/* Mapa + Alertas */}
                    <ITFlex direction="column">
                      <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm p-5">
                        <ITText as="h3" className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <FaMapMarkedAlt className="text-sky-500" /> Última Ubicación Conocida
                        </ITText>
                        {isFirstLoad ? <Skeleton className="h-[380px] w-full" /> : <LiveGuardsMap points={mapPoints} height="380px" />}
                      </ITFlex>

                    </ITFlex>

                    {data?.insights && (
                      <ITFlex direction="column" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <RoundsTrend insights={data.insights} />
                        <IncidentsByCategory insights={data.insights} />
                        <IncidentsByHour insights={data.insights} />
                      </ITFlex>
                    )}
                  </ITFlex>
                ),
              },
              {
                id: "analytics",
                label: "Security Analytics",
                icon: <FaChartLine />,
                content: <AnalyticsTab />,
              },
            ]}
          />
        </ITFlex>

        {/* Aside fijo a la derecha: alertas, rondas, actividad y chat. */}
        <ITFlex direction="column" className="min-[900px]:sticky min-[900px]:top-4">
          <LiveAside data={data} loading={loading} />
        </ITFlex>
      </ITFlex>
    </ITPage>
  );
};

const KpiCard = ({ title, value, hint, icon, color, loading }: { title: string; value?: number | string; hint?: string; icon: React.ReactNode; color: string; loading: boolean }) => {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    sky: "bg-sky-50 text-sky-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <ITFlex align="center" gap={3} className="flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3.5 min-w-0">
      <ITFlex direction="column" className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center text-base flex-shrink-0`}>{icon}</ITFlex>
      <ITFlex direction="column" className="min-w-0">
        <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{title}</ITText>
        {loading ? <Skeleton className="h-6 w-14 mt-1" /> : <ITText as="h4" className="text-xl font-black text-slate-800 leading-tight">{value ?? 0}</ITText>}
        {hint && !loading && <ITText as="p" className="text-[10px] text-slate-400 font-medium truncate">{hint}</ITText>}
      </ITFlex>
    </ITFlex>
  );
};
