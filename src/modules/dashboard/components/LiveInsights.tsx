import dayjs from "dayjs";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import type { ILiveInsights } from "../services/DashboardService";

const CARD = "bg-white rounded-2xl border border-slate-100 shadow-sm p-5";

const formatMinutes = (m: number | null) => {
  if (m === null) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};

/** Variación vs ayer. `lowerIsBetter` invierte el color (p. ej. incidencias). */
const Delta = ({ now, before, lowerIsBetter = false }: { now: number; before: number; lowerIsBetter?: boolean }) => {
  const diff = now - before;
  if (diff === 0) return <span className="text-[10px] font-bold text-slate-400">= que ayer</span>;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold ${good ? "text-emerald-600" : "text-red-500"}`}>
      {diff > 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
      {Math.abs(diff)} vs ayer
    </span>
  );
};

const Stat = ({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) => (
  <div className="bg-slate-50/70 border border-slate-100 rounded-xl px-4 py-3">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-xl font-black text-slate-800 mt-1">{value}</p>
    <div className="mt-0.5 min-h-[14px]">{children}</div>
  </div>
);

export const TodaySummary = ({ insights }: { insights: ILiveInsights }) => {
  const { today } = insights;
  const compliance = today.roundsStarted ? Math.round((today.roundsCompleted / today.roundsStarted) * 100) : null;
  return (
    <div className={CARD}>
      <h3 className="text-[13px] font-bold text-slate-800 mb-3">Hoy en números</h3>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <Stat label="Rondas iniciadas" value={today.roundsStarted}>
          <Delta now={today.roundsStarted} before={today.yesterdayRoundsStarted} />
        </Stat>
        <Stat label="Rondas completadas" value={today.roundsCompleted}>
          <Delta now={today.roundsCompleted} before={today.yesterdayRoundsCompleted} />
        </Stat>
        <Stat label="Cumplimiento" value={compliance === null ? "—" : `${compliance}%`}>
          <span className="text-[10px] font-bold text-slate-400">completadas / iniciadas</span>
        </Stat>
        <Stat label="Duración prom. ronda" value={formatMinutes(insights.avgRoundMinutes)}>
          <span className="text-[10px] font-bold text-slate-400">últimos 7 días</span>
        </Stat>
        <Stat label="Tiempo de atención" value={formatMinutes(insights.avgResolutionMinutes)}>
          <span className="text-[10px] font-bold text-slate-400">incidencias, 7 días</span>
        </Stat>
      </div>
    </div>
  );
};

/** Barras agrupadas: iniciadas vs completadas por día (últimos 7 días). */
export const RoundsTrend = ({ insights }: { insights: ILiveInsights }) => {
  const max = Math.max(1, ...insights.roundsByDay.map((d) => d.started));
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-slate-800">Rondas — últimos 7 días</h3>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-300" /> Iniciadas</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Completadas</span>
        </div>
      </div>
      <div className="flex items-end gap-3 h-36">
        {insights.roundsByDay.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div className="flex items-end gap-1 w-full h-full justify-center">
              <div className="w-1/3 max-w-[14px] bg-slate-300 rounded-t" style={{ height: `${(d.started / max) * 100}%` }} title={`${d.started} iniciadas`} />
              <div className="w-1/3 max-w-[14px] bg-emerald-500 rounded-t" style={{ height: `${(d.completed / max) * 100}%` }} title={`${d.completed} completadas`} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{dayjs(d.date).format("dd D")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const IncidentsByCategory = ({ insights }: { insights: ILiveInsights }) => {
  const rows = insights.incidentsByCategory;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className={CARD}>
      <h3 className="text-[13px] font-bold text-slate-800 mb-4">Incidencias por tipo <span className="text-slate-400 font-medium">· 7 días</span></h3>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">Sin incidencias en los últimos 7 días.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.name}>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span className="truncate pr-2">{r.name}</span>
                <span>{r.count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const IncidentsByHour = ({ insights }: { insights: ILiveInsights }) => {
  const max = Math.max(1, ...insights.incidentsByHour.map((h) => h.count));
  const total = insights.incidentsByHour.reduce((a, h) => a + h.count, 0);
  return (
    <div className={CARD}>
      <h3 className="text-[13px] font-bold text-slate-800 mb-4">Incidencias por hora del día <span className="text-slate-400 font-medium">· 7 días</span></h3>
      {total === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">Sin incidencias en los últimos 7 días.</p>
      ) : (
        <>
          <div className="flex items-end gap-[3px] h-28">
            {insights.incidentsByHour.map((h) => (
              <div
                key={h.hour}
                className={`flex-1 rounded-t ${h.count === max ? "bg-orange-500" : "bg-orange-200"}`}
                style={{ height: `${Math.max(h.count ? 6 : 2, (h.count / max) * 100)}%` }}
                title={`${String(h.hour).padStart(2, "0")}:00 — ${h.count}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1.5">
            <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>
        </>
      )}
    </div>
  );
};
