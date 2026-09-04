import { ITBadget, ITButton, ITCard } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import {
  FaCheckCircle,
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
import { useNavigate } from "react-router-dom";
import { AnalyticsTab } from "../../home/components/tabs/AnalyticsTab";
import { useLiveDashboard } from "../hooks/useLiveDashboard";
import { LiveGuardsMap } from "../components/LiveGuardsMap";
import type { ILiveActiveRound, ILiveAlert, ILiveGuardOnShift } from "../services/DashboardService";

const ROLE_TRANSLATIONS: Record<string, string> = {
  GUARD: "Guardia",
  SHIFT: "Jefe de Guardias",
};

const timeAgo = (value: string | null) => {
  if (!value) return "Sin actividad";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "hace unos segundos";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours} h`;
};

const formatElapsed = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
};

/**
 * Dashboard administrativo en vivo — reemplaza el Home de WEB para
 * ADMIN/SHIFT. Complementa (no repite) el análisis histórico que ya
 * existía (AnalyticsTab, integrado aquí abajo
 * como secciones): esto es una sola foto de "qué está pasando ahora
 * mismo" — rondas activas y su avance, quién está de turno y qué
 * necesita atención — para no tener que adivinar qué onda con los
 * guardias.
 */
export const LiveOpsDashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useLiveDashboard();

  const staleRoundIds = new Set((data?.activeRounds ?? []).filter((r) => r.stale).map((r) => r.roundId));

  const mapPoints = (data?.mapPoints ?? []).map((p) => ({
    guardId: p.guardId,
    label: `${p.guardName} — ${p.routeTitle ?? "Sin ruta"}`,
    lat: p.lat,
    lng: p.lng,
    stale: staleRoundIds.has(p.roundId),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FaShieldAlt className="text-emerald-600" />
            Monitoreo en Vivo
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Qué está pasando ahora mismo con la operación — sin tener que adivinar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
            <FaWifi /> En vivo
          </span>
          {data && (
            <span className="text-[10px] text-slate-400 font-medium">
              Actualizado {dayjs(data.generatedAt).format("HH:mm:ss")}
            </span>
          )}
          <ITButton onClick={refetch} size="small" variant="filled" color="primary" className="!rounded-xl !h-10 !w-10 !p-0 flex items-center justify-center">
            <FaSync className={loading ? "animate-spin" : ""} />
          </ITButton>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-2xl px-6 py-4">
          {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Rondas Activas" value={data?.kpis.activeRoundsCount} icon={<FaRoute />} color="emerald" loading={loading} />
        <KpiCard title="Guardias en Turno" value={data?.kpis.guardsOnShiftCount} icon={<FaUserShield />} color="indigo" loading={loading} />
        <KpiCard title="Incidencias Abiertas" value={data?.kpis.openIncidentsCount} icon={<FaExclamationTriangle />} color="orange" loading={loading} />
        <KpiCard
          title="Cobertura de Rutas"
          value={data ? `${data.kpis.routesCovered}/${data.kpis.routesTotal}` : undefined}
          icon={<FaMapMarkedAlt />}
          color="sky"
          loading={loading}
        />
      </div>

      {/* Alertas operativas */}
      <ITCard className="shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FaExclamationTriangle className="text-amber-500" /> Alertas Operativas
          {data && data.alerts.length > 0 && (
            <ITBadget color="danger" variant="filled" size="small" className="!rounded-full">{data.alerts.length}</ITBadget>
          )}
        </h3>
        {!data || data.alerts.length === 0 ? (
          <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-sm font-bold">
            <FaCheckCircle /> Todo en orden — sin alertas activas.
          </div>
        ) : (
          <div className="space-y-2">
            {data.alerts.map((alert, i) => (
              <AlertRow key={i} alert={alert} />
            ))}
          </div>
        )}
        {data && data.uncoveredRoutes.length > 0 && (
          <p className="text-[11px] text-slate-400 mt-4">
            Sin nadie recorriéndolas ahora mismo: {data.uncoveredRoutes.map((r) => r.title).join(", ")}
          </p>
        )}
      </ITCard>

      {/* Rondas activas + Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ITCard className="lg:col-span-7 shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Rondas Activas</h3>
          {!data || data.activeRounds.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Nadie tiene una ronda activa en este momento.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {data.activeRounds.map((round) => (
                <ActiveRoundRow key={round.roundId} round={round} onClick={() => navigate(`/guard-tracking?guardId=${round.guard.id}`)} />
              ))}
            </div>
          )}
        </ITCard>

        <ITCard className="lg:col-span-5 shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FaMapMarkedAlt className="text-sky-500" /> Última Ubicación Conocida
          </h3>
          <LiveGuardsMap points={mapPoints} height="380px" />
        </ITCard>
      </div>

      {/* Guardias en turno */}
      <ITCard className="shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Guardias en Turno</h3>
        {!data || data.guardsOnShift.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No hay guardias con sesión iniciada en este momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.guardsOnShift.map((guard) => (
              <GuardOnShiftCard key={guard.guardId} guard={guard} onClick={() => navigate(`/guard-tracking?guardId=${guard.guardId}`)} />
            ))}
          </div>
        )}
      </ITCard>

      {/* Análisis histórico — integrado como sección, ya no en pestañas */}
      <div className="pt-4 border-t border-slate-100 space-y-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Security Analytics</h2>
          <p className="text-slate-400 text-xs mt-1">Histórico por rango de fechas.</p>
        </div>
        <AnalyticsTab />
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, color, loading }: { title: string; value?: number | string; icon: React.ReactNode; color: string; loading: boolean }) => {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    sky: "bg-sky-50 text-sky-600",
  };
  const circleClasses: Record<string, string> = {
    emerald: "bg-emerald-500/10",
    indigo: "bg-indigo-500/10",
    orange: "bg-orange-500/10",
    sky: "bg-sky-500/10",
  };
  return (
    <ITCard className="p-6 shadow-lg shadow-slate-100/50 border-none bg-white rounded-3xl relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${circleClasses[color]} group-hover:scale-110 transition-transform duration-500`} />
      {loading && !value && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center animate-pulse" />}
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-4 text-xl shadow-sm`}>{icon}</div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-3xl font-black text-slate-800">{value ?? 0}</h4>
      </div>
    </ITCard>
  );
};

const AlertRow = ({ alert }: { alert: ILiveAlert }) => {
  const isHigh = alert.severity === "high";
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold border ${
        isHigh ? "bg-red-50 border-red-100 text-red-700" : "bg-amber-50 border-amber-100 text-amber-700"
      }`}
    >
      <FaExclamationTriangle className={isHigh ? "text-red-500" : "text-amber-500"} />
      <span className="flex-1">{alert.message}</span>
      <ITBadget color={isHigh ? "danger" : "warning"} variant="outlined" size="small" className="!rounded-lg !text-[9px]">
        {isHigh ? "Urgente" : "Atención"}
      </ITBadget>
    </div>
  );
};

const ActiveRoundRow = ({ round, onClick }: { round: ILiveActiveRound; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-2xl border p-4 transition-colors hover:bg-slate-100/80 ${round.stale ? "bg-red-50/50 border-red-100" : "bg-slate-50/60 border-slate-100"}`}
  >
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="font-black text-slate-800 text-sm uppercase">
          {round.guard.name} {round.guard.lastName}
        </p>
        <p className="text-[11px] text-slate-400 font-medium">{round.routeTitle ?? "Sin ruta asignada"}</p>
      </div>
      {round.stale && (
        <ITBadget color="danger" variant="filled" size="small" className="!rounded-lg !text-[9px]">Estancada</ITBadget>
      )}
    </div>
    {round.progressPercent !== null && (
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-1000 ${round.stale ? "bg-red-400" : "bg-emerald-500"}`}
          style={{ width: `${round.progressPercent}%` }}
        />
      </div>
    )}
    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tight">
      <span className="flex items-center gap-1"><FaClock className="text-slate-300" /> {formatElapsed(round.elapsedMinutes)}</span>
      <span>
        {round.progressPercent !== null ? `${round.scannedCount}/${round.totalLocations} puntos` : `${round.scannedCount} escaneos`}
      </span>
      <span>{round.lastScan ? `${round.lastScan.locationName} · ${timeAgo(round.lastScan.timestamp)}` : "Sin escaneos aún"}</span>
    </div>
  </button>
);

const GuardOnShiftCard = ({ guard, onClick }: { guard: ILiveGuardOnShift; onClick: () => void }) => {
  const initials = `${guard.name.charAt(0)}${guard.lastName?.charAt(0) ?? ""}`.toUpperCase();
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 bg-slate-50/60 border border-slate-100 rounded-2xl px-4 py-3 transition-colors hover:bg-slate-100/80"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-700 text-xs uppercase truncate">
          {guard.name} {guard.lastName}
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{ROLE_TRANSLATIONS[guard.role] ?? guard.role}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <ITBadget
          color={guard.status === "ON_ROUND" ? "primary" : "secondary"}
          variant="outlined"
          size="small"
          className="!rounded-lg !text-[8px] whitespace-nowrap"
        >
          {guard.status === "ON_ROUND" ? "En ronda" : "Inactivo"}
        </ITBadget>
        {guard.uniformCheckPending && (
          <span className="flex items-center gap-1 text-[8px] font-black text-orange-500 uppercase">
            <FaTshirt /> Uniforme pendiente
          </span>
        )}
      </div>
    </button>
  );
};
