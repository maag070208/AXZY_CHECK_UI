import {
  ITCard,
  ITChip,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITLineBarChart,
  ITProgress,
  ITStack,
  ITStatCard,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import type { ILiveInsights } from "../services/DashboardService";

const formatMinutes = (m: number | null) => {
  if (m === null) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};

const deltaInfo = (now: number, before: number): { trend: string; direction: "up" | "down" | "neutral" } => {
  const diff = now - before;
  if (diff === 0) return { trend: "= que ayer", direction: "neutral" };
  return {
    trend: `${diff > 0 ? "+" : ""}${diff} vs ayer`,
    direction: diff > 0 ? "up" : "down",
  };
};

export const TodaySummary = ({ insights }: { insights: ILiveInsights }) => {
  const { today } = insights;
  const compliance = today.roundsStarted ? Math.round((today.roundsCompleted / today.roundsStarted) * 100) : null;
  const started = deltaInfo(today.roundsStarted, today.yesterdayRoundsStarted);
  const completed = deltaInfo(today.roundsCompleted, today.yesterdayRoundsCompleted);

  return (
    <ITCard title="Hoy en números" className="rounded-3xl" contentClassName="space-y-4">
      <ITFlex className="flex flex-wrap items-center justify-between gap-2">
        <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-primary-700">
          Pulso del día
        </ITText>
        <ITChip label="vs ayer" color="secondary" size="sm" variant="soft" />
      </ITFlex>

      <ITGrid container columns={10} spacing={2}>
        <ITGrid item xs={5} xl={2}>
        <ITStatCard
          label="Rondas iniciadas"
          value={today.roundsStarted}
          trend={started.trend}
          trendDirection={started.direction}
          color="bg-slate-50 dark:bg-slate-900/40"
          className="h-full"
        />
        </ITGrid>
        <ITGrid item xs={5} xl={2}>
        <ITStatCard
          label="Rondas completadas"
          value={today.roundsCompleted}
          trend={completed.trend}
          trendDirection={completed.direction}
          color="bg-slate-50 dark:bg-slate-900/40"
          className="h-full"
        />
        </ITGrid>
        <ITGrid item xs={5} xl={2}>
        <ITStatCard
          label="Cumplimiento"
          value={compliance === null ? "—" : `${compliance}%`}
          color="bg-slate-50 dark:bg-slate-900/40"
          className="h-full"
        />
        </ITGrid>
        <ITGrid item xs={5} xl={2}>
        <ITStatCard
          label="Duración prom. ronda"
          value={formatMinutes(insights.avgRoundMinutes)}
          color="bg-slate-50 dark:bg-slate-900/40"
          className="h-full"
        />
        </ITGrid>
        <ITGrid item xs={5} xl={2}>
        <ITStatCard
          label="Tiempo de atención"
          value={formatMinutes(insights.avgResolutionMinutes)}
          color="bg-slate-50 dark:bg-slate-900/40"
          className="h-full"
        />
        </ITGrid>
      </ITGrid>
    </ITCard>
  );
};

/** Rondas iniciadas vs completadas de los últimos 7 días. */
export const RoundsTrend = ({ insights, title = "Rondas — últimos 7 días", height = 180 }: { insights: Pick<ILiveInsights, "roundsByDay">; title?: string; height?: number }) => {
  const data = insights.roundsByDay.map((d) => ({
    label: dayjs(d.date).format("dd D"),
    bar: d.started,
    line: d.completed,
  }));

  return (
    <ITCard title={title} className="h-full rounded-3xl" contentClassName="space-y-3">
      <ITLineBarChart
        data={data}
        ariaLabel="Rondas iniciadas y completadas en los últimos 7 días"
        barLabel="Iniciadas"
        lineLabel="Completadas"
        barColor="#d9f99d"
        lineColor="#065911"
        height={height}
      />
    </ITCard>
  );
};

export const IncidentsByCategory = ({ insights, subtitle = "Últimos 7 días" }: { insights: Pick<ILiveInsights, "incidentsByCategory">; subtitle?: string }) => {
  const rows = insights.incidentsByCategory;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ITCard title="Incidencias por tipo" className="h-full rounded-3xl" contentClassName="space-y-3">
      <ITText as="p" className="text-[10px] font-semibold text-slate-400">
        {subtitle}
      </ITText>
      {rows.length === 0 ? (
        <ITEmptyState title="Sin incidencias en los últimos 7 días." />
      ) : (
        <ITStack spacing={3}>
          {rows.map((r) => (
            <ITFlex key={r.name} direction="column" gap={1}>
              <ITFlex justify="between" align="center" gap={2}>
                <ITText as="span" className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {r.name}
                </ITText>
                <ITText as="span" className="text-[11px] font-black text-slate-400">
                  {r.count}
                </ITText>
              </ITFlex>
              <ITProgress value={r.count} max={max} color="warning" size="sm" />
            </ITFlex>
          ))}
        </ITStack>
      )}
    </ITCard>
  );
};

export const IncidentsByHour = ({ insights, subtitle = "Top 6 horas · últimos 7 días" }: { insights: Pick<ILiveInsights, "incidentsByHour">; subtitle?: string }) => {
  const max = Math.max(1, ...insights.incidentsByHour.map((h) => h.count));
  const total = insights.incidentsByHour.reduce((a, h) => a + h.count, 0);
  const topHours = [...insights.incidentsByHour].sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <ITCard title="Incidencias por hora" className="h-full rounded-3xl" contentClassName="space-y-3">
      <ITText as="p" className="text-[10px] font-semibold text-slate-400">
        {subtitle}
      </ITText>
      {total === 0 ? (
        <ITEmptyState title="Sin incidencias en los últimos 7 días." />
      ) : (
        <ITStack spacing={2}>
          {topHours.map((h) => (
            <ITFlex key={h.hour} align="center" gap={2} className="flex items-center gap-2">
              <ITText as="span" className="w-8 shrink-0 text-[10px] font-bold text-slate-400">
                {String(h.hour).padStart(2, "0")}h
              </ITText>
              <ITProgress value={h.count} max={max} color="warning" size="sm" className="flex-1" />
              <ITText as="span" className="w-5 shrink-0 text-right text-[10px] font-black text-slate-500">
                {h.count}
              </ITText>
            </ITFlex>
          ))}
        </ITStack>
      )}
    </ITCard>
  );
};
