import {
  ITCard,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITLineBarChart,
  ITLoader,
  ITProgress,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaBuilding, FaExclamationTriangle, FaHome, FaUsers } from "react-icons/fa";
import { getOccupancyStats, OccupancyStats } from "./occupancy.service";

export const OccupancyDashboard = () => {
  const [stats, setStats] = useState<OccupancyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOccupancyStats()
      .then((res) => setStats(res.data ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ITFlex align="center" justify="center" className="py-16">
        <ITLoader />
      </ITFlex>
    );
  }

  if (!stats) {
    return <ITEmptyState title="Sin datos de ocupación" className="py-12" />;
  }

  const vacant = stats.byStatus.find((s) => s.code === "VACNT")?.count ?? 0;
  const occupied = Math.max(0, stats.properties - vacant);
  const occupancyRate = stats.properties > 0 ? Math.round((occupied / stats.properties) * 100) : 0;
  const avgResidents = stats.properties > 0 ? (stats.residents / stats.properties).toFixed(1) : "0";
  const max = Math.max(1, ...stats.byStatus.map((s) => s.count));
  const chartData = stats.byStatus.map((s) => ({ label: s.name, bar: s.count, line: 0 }));

  const kpi = (title: string, value: string | number, icon: React.ReactNode, tone: string) => (
    <ITCard className="h-full rounded-3xl" contentClassName="p-4!">
      <ITFlex align="center" justify="between" gap={2}>
        <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </ITText>
        <ITFlex
          align="center"
          justify="center"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${tone}`}
        >
          {icon}
        </ITFlex>
      </ITFlex>
      <ITText as="p" className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
        {value}
      </ITText>
    </ITCard>
  );

  return (
    <ITFlex direction="column" gap={4} className="w-full">
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi("Propiedades", stats.properties, <FaHome />, "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400")}
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi("Residentes", stats.residents, <FaUsers />, "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400")}
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi("Ocupadas", `${occupied} · ${occupancyRate}%`, <FaBuilding />, "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400")}
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi("Sobreocupadas", stats.overcrowded, <FaExclamationTriangle />, "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400")}
        </ITGrid>
      </ITGrid>

      <ITGrid container columns={12} spacing={4} className="items-stretch">
        <ITGrid item xs={12} xl={8}>
          <ITCard
            title="Propiedades por estado"
            className="h-full rounded-3xl"
            contentClassName="space-y-3 pt-2!"
          >
            <ITLineBarChart
              data={chartData}
              ariaLabel="Distribución de propiedades por estado de ocupación"
              barLabel="Propiedades"
              showLine={false}
              barColor="#d9f99d"
              height={260}
            />
          </ITCard>
        </ITGrid>

        <ITGrid item xs={12} xl={4}>
          <ITCard title="Desglose por estado" className="h-full rounded-3xl" contentClassName="space-y-2 pt-2!">
            {stats.byStatus.map((status) => {
              const pct = stats.properties > 0 ? Math.round((status.count / stats.properties) * 100) : 0;
              return (
                <ITFlex key={status.code} direction="column" gap={1}>
                  <ITFlex align="center" justify="between" gap={2}>
                    <ITText as="span" className="truncate text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {status.name}
                    </ITText>
                    <ITText as="span" className="shrink-0 text-[10px] font-black text-slate-500">
                      {status.count} · {pct}%
                    </ITText>
                  </ITFlex>
                  <ITProgress value={status.count} max={max} color="success" size="sm" />
                </ITFlex>
              );
            })}
          </ITCard>
        </ITGrid>
      </ITGrid>

      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi("Ocupación", `${occupancyRate}%`, <FaBuilding />, "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400")}
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi("Promedio residentes", avgResidents, <FaUsers />, "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400")}
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi("Disponibles", vacant, <FaHome />, "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          {kpi(
            "Tasa de sobreocupación",
            `${stats.properties > 0 ? Math.round((stats.overcrowded / stats.properties) * 100) : 0}%`,
            <FaExclamationTriangle />,
            "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
          )}
        </ITGrid>
      </ITGrid>
    </ITFlex>
  );
};
