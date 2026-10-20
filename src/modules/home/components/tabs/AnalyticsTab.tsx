import { useEffect, useState } from "react";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITDatePicker,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITLineBarChart,
  ITSegmentedControl,
  ITSkeleton,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaChartLine, FaExclamationTriangle, FaQrcode, FaSync, FaTimesCircle } from "react-icons/fa";
import dayjs from "dayjs";
import * as ReportService from "../../services/ReportService";

type AnalyticsSubTab = "resumen" | "carga";

/**
 * "Security Analytics" — histórico por rango de fechas.
 * Sin Chart.js ni canvas: usa ITLineBarChart/ITCard/ITGrid del UI System.
 */
export const AnalyticsTab = () => {
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf("year").toDate(), dayjs().toDate()]);
  const [stats, setStats] = useState<ReportService.IGuardStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<ReportService.ITopPerformance[]>([]);
  const [workloadData, setWorkloadData] = useState<ReportService.IGuardWorkload[]>([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<AnalyticsSubTab>("resumen");

  const fetchData = async () => {
    if (!dateRange?.[0] || !dateRange?.[1]) return;
    setLoading(true);
    const filters = {
      startDate: dayjs(dateRange[0]).format("YYYY-MM-DD"),
      endDate: dayjs(dateRange[1]).format("YYYY-MM-DD"),
    };

    const [statsRes, topRes, workloadRes] = await Promise.all([
      ReportService.getGuardStats(filters),
      ReportService.getTopPerformance(filters),
      ReportService.getWorkloadComparison(filters),
    ]);

    if (statsRes.success) setStats(statsRes.data || null);
    if (topRes.success) setTopPerformers(topRes.data || []);
    if (workloadRes.success) setWorkloadData(workloadRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const distributionTotal = stats
    ? stats.totalScans + stats.totalIncidents + stats.incompleteRounds + stats.missedScans
    : 1;

  const distribution = stats
    ? [
        { label: "Escaneos", value: stats.totalScans, color: "success" as const },
        { label: "Reportes/Manto.", value: stats.totalIncidents, color: "info" as const },
        { label: "Rondas incompletas", value: stats.incompleteRounds, color: "warning" as const },
        { label: "Puntos omitidos", value: stats.missedScans, color: "danger" as const },
      ]
    : [];

  const topChartData = topPerformers.slice(0, 6).map((p) => ({
    label: p.name,
    bar: p.totalScans,
    line: 0,
  }));
  const distributionChartData = distribution.map((d) => ({
    label: d.label,
    bar: Math.round((d.value / Math.max(distributionTotal, 1)) * 100),
    line: 0,
  }));
  const workloadChartData = workloadData.slice(0, 10).map((w) => ({
    label: w.name,
    bar: w.workload,
    line: 0,
  }));

  return (
    <ITFlex direction="column" gap={4} className="w-full">
      <ITFlex align="end" justify="between" gap={3} wrap="wrap">
        <ITFlex direction="column" gap={1}>
          <ITText as="h2" className="text-xl font-black text-slate-900 tracking-tight dark:text-white">
            Security Analytics
          </ITText>
          <ITText as="p" className="text-xs text-slate-500">
            Histórico y analítica por rango de fechas.
          </ITText>
        </ITFlex>
        <ITFlex align="center" gap={2} wrap="nowrap" className="w-full sm:w-auto">
          <ITDatePicker
            name="range"
            value={dateRange}
            range
            onChange={(e: any) => setDateRange(e.target.value)}
            className="w-full sm:w-[260px]"
          />
          <ITButton
            variant="icon-only"
            color="primary"
            size="sm"
            icon={<FaSync className={loading ? "animate-spin" : ""} size={13} />}
            ariaLabel="Actualizar analítica"
            onClick={fetchData}
            className="shrink-0"
          />
        </ITFlex>
      </ITFlex>

      <ITSegmentedControl
        className="self-start"
        size="sm"
        options={[
          { value: "resumen", label: "Resumen" },
          { value: "carga", label: "Carga de Trabajo" },
        ]}
        value={subTab}
        onChange={(value) => setSubTab(value as AnalyticsSubTab)}
      />

      {subTab === "resumen" ? (
        <ITFlex direction="column" gap={4}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} sm={6} xl={3}>
              <StatPill title="Eventos/Incidencias" value={stats?.totalIncidents} icon={<FaExclamationTriangle />} color="indigo" loading={loading} />
            </ITGrid>
            <ITGrid item xs={12} sm={6} xl={3}>
              <StatPill title="Puntos Escaneados" value={stats?.totalScans} icon={<FaQrcode />} color="emerald" loading={loading} />
            </ITGrid>
            <ITGrid item xs={12} sm={6} xl={3}>
              <StatPill title="Rondas Incompletas" value={stats?.incompleteRounds} icon={<FaChartLine />} color="orange" loading={loading} />
            </ITGrid>
            <ITGrid item xs={12} sm={6} xl={3}>
              <StatPill title="Puntos Omitidos" value={stats?.missedScans} icon={<FaTimesCircle />} color="red" loading={loading} />
            </ITGrid>
          </ITGrid>

          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} lg={7}>
              <ITCard title="Top Desempeño (Escaneos)" className="h-full" contentClassName="pt-2">
                {loading ? (
                  <ITSkeleton variant="rectangular" height={220} />
                ) : topChartData.length === 0 ? (
                  <ITEmptyState title="Sin datos en el rango seleccionado." />
                ) : (
                  <ITLineBarChart
                    data={topChartData}
                    ariaLabel="Top desempeño por escaneos"
                    barLabel="Escaneos"
                    showLine={false}
                    barColor="#d9f99d"
                    height={220}
                  />
                )}
              </ITCard>
            </ITGrid>

            <ITGrid item xs={12} lg={5}>
              <ITCard title="Distribución de Actividad" className="h-full" contentClassName="space-y-3">
                {loading || !stats ? (
                  <ITSkeleton variant="rectangular" height={220} />
                ) : (
                  <>
                    <ITLineBarChart
                      data={distributionChartData}
                      ariaLabel="Distribución de actividad por porcentaje"
                      barLabel="Participación"
                      showLine={false}
                      barColor="#12a36f"
                      height={200}
                      formatValue={(v) => `${v}%`}
                      formatAxis={(v) => `${v}%`}
                    />
                    <ITFlex wrap="wrap" gap={3}>
                      {distribution.map((d) => (
                        <ITText key={d.label} as="span" className="text-[10px] text-slate-500 dark:text-slate-400">
                          {d.label}: {d.value}
                        </ITText>
                      ))}
                    </ITFlex>
                  </>
                )}
              </ITCard>
            </ITGrid>
          </ITGrid>
        </ITFlex>
      ) : (
        <ITCard title="Comparativa de Carga de Trabajo" contentClassName="space-y-3">
          <ITFlex align="center" justify="end">
            <ITBadget color="primary" variant="outlined" size="sm">
              Ranking Operacional
            </ITBadget>
          </ITFlex>

          {loading ? (
            <ITSkeleton variant="rectangular" height={320} />
          ) : workloadData.length === 0 ? (
            <ITEmptyState title="Sin datos en el rango seleccionado." />
          ) : (
            <ITLineBarChart
              data={workloadChartData}
              ariaLabel="Comparativa de carga de trabajo"
              barLabel="Carga"
              showLine={false}
              barColor="#12a36f"
              height={320}
            />
          )}

          <ITText as="p" className="text-[10px] text-slate-400 italic">
            * El índice de carga se calcula ponderando escaneos, reportes y rondas finalizadas.
          </ITText>
        </ITCard>
      )}
    </ITFlex>
  );
};

const StatPill = ({ title, value, icon, color, loading }: any) => {
  const colorClasses: Record<string, string> = {
    indigo: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
    red: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
  };

  return (
    <ITCard className="h-full" contentClassName="p-4!">
      <ITFlex align="center" gap={2}>
        <ITFlex className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${colorClasses[color]}`}>
          {icon}
        </ITFlex>
        <ITFlex direction="column" className="min-w-0">
          {loading ? (
            <ITSkeleton variant="rectangular" height={20} width={44} />
          ) : (
            <ITText as="p" className="text-xl font-black leading-none text-slate-900 dark:text-white">
              {value ?? 0}
            </ITText>
          )}
          <ITText as="p" className="mt-0.5 truncate text-[8.5px] font-black uppercase tracking-wide text-slate-400">
            {title}
          </ITText>
        </ITFlex>
      </ITFlex>
    </ITCard>
  );
};
