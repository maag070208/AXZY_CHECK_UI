import {
  ITAvatar,
  ITBadget,
  ITCard,
  ITChip,
  ITEmptyState,
  ITFlex,
  ITProgress,
  ITSegmentedControl,
  ITSkeleton,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
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
  FaWifi,
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
  return parts.slice(0, 2).join(" ");
};

const timeAgo = (value: string | null | undefined) => {
  if (!value) return "Sin actividad";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  return minutes < 1 ? "hace unos segundos" : `hace ${formatDuration(minutes)}`;
};

const AlertItem = ({ alert }: { alert: ILiveAlert }) => {
  const high = alert.severity === "high";
  return (
    <ITCard
      className={`rounded-2xl! ${high ? "bg-red-50! border-red-200!" : "bg-amber-50! border-amber-200!"}`}
      contentClassName="p-3!"
    >
      <ITFlex gap={2} className="flex gap-2">
        <ITFlex
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white ${
            high ? "text-red-500" : "text-amber-500"
          }`}
        >
          <FaExclamationTriangle size={12} />
        </ITFlex>
        <ITFlex direction="column" className="min-w-0 flex-1">
          <ITText as="p" className="text-xs font-semibold leading-snug text-slate-700 dark:text-slate-200">
            {alert.message}
          </ITText>
          {alert.at && (
            <ITText as="p" className="mt-1 text-[10px] font-medium text-slate-400">
              {timeAgo(alert.at)}
            </ITText>
          )}
        </ITFlex>
      </ITFlex>
    </ITCard>
  );
};

const RoundItem = ({ round, onClick }: { round: ILiveActiveRound; onClick: () => void }) => {
  const initials = `${round.guard.name.charAt(0)}${round.guard.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const pct = round.progressPercent;

  return (
    <ITCard
      onClick={onClick}
      title={`${round.guard.name} ${round.guard.lastName ?? ""}`.trim()}
      titleClassName="text-xs! font-black! uppercase! text-slate-800! dark:text-slate-100!"
      className="rounded-2xl!"
      contentClassName="space-y-2 p-3!"
      actions={round.stale ? <ITBadget label="Estancada" color="danger" size="sm" /> : undefined}
    >
      <ITFlex align="center" gap={2} className="flex items-center gap-2">
        <ITAvatar
          initials={initials}
          size="xs"
          color={round.stale ? "#b91c1c" : "#047857"}
        />
        <ITText as="p" className="min-w-0 truncate text-[10px] font-medium text-slate-400">
          {round.routeTitle ?? "Sin ruta asignada"}
        </ITText>
      </ITFlex>

      {pct !== null && (
        <ITFlex align="center" gap={2} className="flex items-center gap-2">
          <ITProgress
            value={pct}
            max={100}
            color={round.stale ? "danger" : "success"}
            size="sm"
            className="flex-1"
          />
          <ITText as="span" className="w-8 shrink-0 text-right text-[10px] font-black text-slate-500">
            {pct}%
          </ITText>
        </ITFlex>
      )}

      <ITFlex className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        <ITText as="span" className="flex items-center gap-1">
          <FaClock className="text-slate-300" size={9} /> {formatDuration(round.elapsedMinutes)}
        </ITText>
        <ITText as="span">
          {pct !== null ? `${round.scannedCount}/${round.totalLocations} puntos` : `${round.scannedCount} escaneos`}
        </ITText>
      </ITFlex>

      <ITText as="p" className="truncate text-[10px] text-slate-400">
        {round.lastScan ? `${round.lastScan.locationName} · ${timeAgo(round.lastScan.timestamp)}` : "Sin escaneos aún"}
      </ITText>
    </ITCard>
  );
};

const TIMELINE_STYLE: Record<
  ILiveTimelineEvent["type"],
  { icon: React.ReactNode; color: string; row: string }
> = {
  ROUND_STARTED: {
    icon: <FaPlay size={8} />,
    color: "bg-sky-100 text-sky-600",
    row: "bg-sky-50 border-sky-200",
  },
  ROUND_COMPLETED: {
    icon: <FaCheckCircle size={10} />,
    color: "bg-emerald-100 text-emerald-600",
    row: "bg-emerald-50 border-emerald-200",
  },
  INCIDENT_CREATED: {
    icon: <FaExclamationTriangle size={9} />,
    color: "bg-orange-100 text-orange-600",
    row: "bg-amber-50 border-amber-200",
  },
  INCIDENT_ATTENDED: {
    icon: <FaTools size={9} />,
    color: "bg-indigo-100 text-indigo-600",
    row: "bg-indigo-50 border-indigo-200",
  },
};

const TimelineItem = ({ event }: { event: ILiveTimelineEvent }) => {
  const style = TIMELINE_STYLE[event.type];
  return (
    <ITFlex gap={2} className={`rounded-xl border p-2.5 ${style.row}`}>
      <ITFlex className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.color}`}>
        {style.icon}
      </ITFlex>
      <ITFlex direction="column" className="min-w-0 flex-1">
        <ITText as="p" className="text-xs font-semibold leading-snug text-slate-700 dark:text-slate-200">
          {event.message}
        </ITText>
        <ITText as="p" className="mt-0.5 text-[10px] font-medium text-slate-400">
          {dayjs(event.at).format("DD MMM · HH:mm")}
        </ITText>
      </ITFlex>
    </ITFlex>
  );
};

type TabId = "alerts" | "rounds" | "activity" | "chat";

/** Panel lateral del Home: alertas, rondas activas, actividad reciente y chat del equipo. */
export const LiveAside = ({ data, loading }: { data: ILiveDashboard | null; loading: boolean }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("alerts");

  const alerts = data?.alerts ?? [];
  const rounds = data?.activeRounds ?? [];
  const timeline = data?.insights?.timeline ?? [];

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "alerts", label: "Alertas", icon: <FaBell />, count: alerts.length },
    { id: "rounds", label: "Rondas", icon: <FaRoute />, count: rounds.length },
    { id: "activity", label: "Actividad", icon: <FaHistory /> },
    { id: "chat", label: "Chat", icon: <FaComments /> },
  ];

  return (
    <ITCard
      title="Ahora mismo"
      className="h-auto w-full rounded-3xl xl:h-[calc(100vh-8.5rem)]"
      contentClassName="flex min-h-0 flex-1 flex-col gap-3 p-4!"
    >
      <ITFlex align="center" justify="between" gap={2} wrap="wrap">
        <ITFlex direction="column">
          <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-primary-700">
            Sala de control
          </ITText>
          <ITText as="span" className="text-[10px] font-medium text-slate-400">
            {alerts.length} alertas · {rounds.length} rondas
          </ITText>
        </ITFlex>
        <ITChip label="En vivo" color="success" size="sm" variant="soft" icon={<FaWifi size={10} />} />
      </ITFlex>

      <ITSegmentedControl
        size="sm"
        className="w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:rounded-lg [&>button]:px-4! [&>button]:py-2! [&>button]:transition-colors [&>button]:hover:bg-slate-50!"
        options={tabs.map((t) => ({
          value: t.id,
          label: t.label,
          icon: t.icon,
        }))}
        value={tab}
        onChange={(value) => setTab(value as TabId)}
      />

      <ITFlex direction="column" className="flex-1 min-h-0 overflow-y-auto pt-2 pr-1">
        {loading && !data ? (
          <ITStack spacing={2}>
            <ITSkeleton variant="rectangular" height={64} count={3} className="rounded-xl" />
          </ITStack>
        ) : tab === "alerts" ? (
          alerts.length === 0 ? (
            <ITEmptyState
              icon={<FaCheckCircle className="text-emerald-400" />}
              title="Todo en orden — sin alertas activas."
            />
          ) : (
            <ITStack spacing={2}>
              {alerts.map((a, i) => (
                <AlertItem key={i} alert={a} />
              ))}
              {!!data?.uncoveredRoutes.length && (
                <ITText as="p" className="px-1 text-[10px] text-slate-400">
                  Sin nadie recorriéndolas ahora: {data.uncoveredRoutes.map((r) => r.title).join(", ")}
                </ITText>
              )}
            </ITStack>
          )
        ) : tab === "rounds" ? (
          rounds.length === 0 ? (
            <ITEmptyState
              icon={<FaRoute />}
              title="Nadie tiene una ronda activa en este momento."
            />
          ) : (
            <ITStack spacing={2}>
              {rounds.map((r) => (
                <RoundItem key={r.roundId} round={r} onClick={() => navigate(`/guard-tracking?guardId=${r.guard.id}`)} />
              ))}
            </ITStack>
          )
        ) : tab === "activity" ? (
          timeline.length === 0 ? (
            <ITEmptyState
              icon={<FaHistory />}
              title="Sin actividad reciente."
            />
          ) : (
            <ITStack spacing={3}>
              {timeline.map((e, i) => (
                <TimelineItem key={i} event={e} />
              ))}
            </ITStack>
          )
        ) : (
          <ITFlex direction="column" className="w-full flex-1 min-h-0">
            <ChatPanel variant="sidebar" />
          </ITFlex>
        )}
      </ITFlex>
    </ITCard>
  );
};
