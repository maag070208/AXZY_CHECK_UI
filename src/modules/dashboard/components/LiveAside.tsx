import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useState } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaClock,
  FaComments,
  FaExclamationTriangle,
  FaHistory,
  FaPlay,
  FaRoute,
  FaTools,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ChatPanel } from "../../chat/components/ChatPanel";
import type { ILiveActiveRound, ILiveAlert, ILiveDashboard, ILiveTimelineEvent } from "../services/DashboardService";

const formatDuration = (minutes: number): string => {
  const total = Math.floor(Math.max(0, minutes));
  if (total === 0) return "menos de 1 min";
  const DAY = 24 * 60;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;
  const parts: string[] = [];
  const years = Math.floor(total / YEAR);
  const months = Math.floor((total % YEAR) / MONTH);
  const days = Math.floor((total % MONTH) / DAY);
  const hours = Math.floor((total % DAY) / 60);
  const mins = total % 60;
  if (years) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (months) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  if (days) parts.push(`${days} ${days === 1 ? "día" : "días"}`);
  if (hours) parts.push(`${hours} h`);
  if (mins) parts.push(`${mins} min`);
  // Dos unidades bastan en un panel angosto.
  return parts.slice(0, 2).join(" ");
};

const timeAgo = (value: string | null | undefined) => {
  if (!value) return "Sin actividad";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  return minutes < 1 ? "hace unos segundos" : `hace ${formatDuration(minutes)}`;
};

const Empty = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <ITFlex direction="column" align="center" justify="center" gap={2} className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
    <ITText as="span" className="text-2xl text-slate-300">{icon}</ITText>
    <ITText as="p" className="text-xs font-medium text-center">{text}</ITText>
  </ITFlex>
);

const AlertItem = ({ alert }: { alert: ILiveAlert }) => {
  const high = alert.severity === "high";
  return (
    <li className={`flex gap-3 rounded-xl p-3 ${high ? "bg-red-50/70" : "bg-amber-50/70"}`}>
      <ITText as="span" className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${high ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-500"}`}>
        <FaExclamationTriangle size={11} />
      </ITText>
      <ITFlex direction="column" className="min-w-0">
        <ITText as="p" className={`text-xs font-semibold leading-snug ${high ? "text-red-800" : "text-amber-800"}`}>{alert.message}</ITText>
        {alert.at && <ITText as="p" className="text-[10px] font-medium text-slate-400 mt-1">{timeAgo(alert.at)}</ITText>}
      </ITFlex>
    </li>
  );
};

const RoundItem = ({ round, onClick }: { round: ILiveActiveRound; onClick: () => void }) => {
  const initials = `${round.guard.name.charAt(0)}${round.guard.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const pct = round.progressPercent;
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left rounded-xl p-3 transition-colors ${
          round.stale ? "bg-red-50/50" : "bg-slate-50/60"
        }`}
      >
        <ITFlex align="center" className="flex items-center gap-2.5">
          <ITText as="span" className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${round.stale ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
            {initials}
          </ITText>
          <ITFlex direction="column" className="min-w-0 flex-1">
            <ITText as="p" className="text-xs font-black text-slate-800 uppercase truncate">
              {round.guard.name} {round.guard.lastName}
            </ITText>
            <ITText as="p" className="text-[10px] font-medium text-slate-400 truncate">{round.routeTitle ?? "Sin ruta asignada"}</ITText>
          </ITFlex>
          {round.stale && (
            <ITText as="span" className="text-[9px] font-black text-red-600 bg-red-100 rounded-md px-1.5 py-0.5 uppercase flex-shrink-0">Estancada</ITText>
          )}
        </ITFlex>

        {pct !== null && (
          <ITFlex align="center" gap={2} className="mt-3 flex items-center gap-2">
            <ITFlex direction="column" className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <ITFlex direction="column" className={`h-full rounded-full ${round.stale ? "bg-red-400" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
            </ITFlex>
            <ITText as="span" className="text-[10px] font-black text-slate-500 w-8 text-right">{pct}%</ITText>
          </ITFlex>
        )}

        <ITFlex align="center" className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500">
          <ITText as="span" className="flex items-center gap-1"><FaClock className="text-slate-300" size={9} /> {formatDuration(round.elapsedMinutes)}</ITText>
          <ITText as="span">{pct !== null ? `${round.scannedCount}/${round.totalLocations} puntos` : `${round.scannedCount} escaneos`}</ITText>
        </ITFlex>
        <ITText as="p" className="mt-1 text-[10px] text-slate-400 truncate">
          {round.lastScan ? `${round.lastScan.locationName} · ${timeAgo(round.lastScan.timestamp)}` : "Sin escaneos aún"}
        </ITText>
      </button>
    </li>
  );
};

const TIMELINE_STYLE: Record<ILiveTimelineEvent["type"], { icon: React.ReactNode; color: string }> = {
  ROUND_STARTED: { icon: <FaPlay size={8} />, color: "bg-sky-100 text-sky-600" },
  ROUND_COMPLETED: { icon: <FaCheckCircle size={10} />, color: "bg-emerald-100 text-emerald-600" },
  INCIDENT_CREATED: { icon: <FaExclamationTriangle size={9} />, color: "bg-orange-100 text-orange-600" },
  INCIDENT_ATTENDED: { icon: <FaTools size={9} />, color: "bg-indigo-100 text-indigo-600" },
};

const TimelineItem = ({ event, last }: { event: ILiveTimelineEvent; last: boolean }) => {
  const style = TIMELINE_STYLE[event.type];
  return (
    <li className="flex gap-3">
      <ITFlex direction="column" align="center" className="flex flex-col items-center">
        <ITText as="span" className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${style.color}`}>{style.icon}</ITText>
        {!last && <ITText as="span" className="w-px flex-1 bg-slate-100 my-1" />}
      </ITFlex>
      <ITFlex direction="column" className="pb-4 min-w-0">
        <ITText as="p" className="text-xs font-semibold text-slate-700 leading-snug">{event.message}</ITText>
        <ITText as="p" className="text-[10px] font-medium text-slate-400 mt-0.5">{dayjs(event.at).format("DD MMM · HH:mm")}</ITText>
      </ITFlex>
    </li>
  );
};

type TabId = "alerts" | "rounds" | "activity" | "chat";

/** Panel lateral fijo del dashboard: alertas, rondas activas, actividad reciente y chat del equipo. */
export const LiveAside = ({ data, loading }: { data: ILiveDashboard | null; loading: boolean }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("alerts");

  const alerts = data?.alerts ?? [];
  const rounds = data?.activeRounds ?? [];
  const timeline = data?.insights?.timeline ?? [];

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number; tone?: string }[] = [
    { id: "alerts", label: "Alertas", icon: <FaBell />, count: alerts.length, tone: "bg-red-500" },
    { id: "rounds", label: "Rondas", icon: <FaRoute />, count: rounds.length, tone: "bg-emerald-500" },
    { id: "activity", label: "Actividad", icon: <FaHistory /> },
    { id: "chat", label: "Chat", icon: <FaComments /> },
  ];

  return (
    <aside className="flex flex-col h-[calc(100vh-11rem)] min-h-[420px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
      <nav className="grid grid-cols-4 flex-shrink-0" role="tablist">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-black uppercase tracking-wide transition-colors ${
                active ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <ITText as="span" className="relative text-sm">
                {t.icon}
                {!!t.count && (
                  <ITText as="span" className={`absolute -top-2 -right-3 min-w-[15px] h-[15px] px-1 rounded-full text-[8px] leading-[15px] text-white text-center ${t.tone}`}>
                    {t.count}
                  </ITText>
                )}
              </ITText>
              {t.label}
              {active && <ITText as="span" className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-emerald-600" />}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 min-h-0 overflow-y-auto p-3" hidden={tab === "chat"}>
        {loading && !data ? (
          <ITFlex direction="column" className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
          </ITFlex>
        ) : tab === "alerts" ? (
          alerts.length === 0 ? (
            <Empty icon={<FaCheckCircle className="text-emerald-400" />} text="Todo en orden — sin alertas activas." />
          ) : (
            <>
              <ul className="space-y-2">{alerts.map((a, i) => <AlertItem key={i} alert={a} />)}</ul>
              {!!data?.uncoveredRoutes.length && (
                <ITText as="p" className="text-[10px] text-slate-400 mt-3 px-1">
                  Sin nadie recorriéndolas ahora: {data.uncoveredRoutes.map((r) => r.title).join(", ")}
                </ITText>
              )}
            </>
          )
        ) : tab === "rounds" ? (
          rounds.length === 0 ? (
            <Empty icon={<FaRoute />} text="Nadie tiene una ronda activa en este momento." />
          ) : (
            <ul className="space-y-2">
              {rounds.map((r) => (
                <RoundItem key={r.roundId} round={r} onClick={() => navigate(`/guard-tracking?guardId=${r.guard.id}`)} />
              ))}
            </ul>
          )
        ) : tab === "activity" ? (
          timeline.length === 0 ? (
            <Empty icon={<FaHistory />} text="Sin actividad reciente." />
          ) : (
            <ul className="pt-1">{timeline.map((e, i) => <TimelineItem key={i} event={e} last={i === timeline.length - 1} />)}</ul>
          )
        ) : null}
      </div>

      {/* El chat se queda montado para no perder la conexión ni el scroll al cambiar de pestaña. */}
      <div className="flex-1 min-h-0 [&>div]:shadow-none [&>div]:rounded-none" hidden={tab !== "chat"}>
        <ChatPanel variant="sidebar" />
      </div>
    </aside>
  );
};
