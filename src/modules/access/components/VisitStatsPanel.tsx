import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITCard, ITChip, ITFlex, ITGrid, ITProgress, ITSegmentedControl, ITSkeleton, ITStatCard, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaBoxOpen, FaClock, FaDoorOpen, FaExclamationTriangle, FaFileExcel, FaFilePdf, FaHourglassEnd, FaSignInAlt } from "react-icons/fa";
import { downloadVisitStats, getVisitStats, VisitPeriod, VisitStats } from "@modules/invitations/services/invitations.service";

const RANGES = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "365", label: "12 meses" },
];

type Grouping = "day" | "week" | "month";

const GROUPINGS: { value: Grouping; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

const MAX_PERIOD_ROWS = 8;

const periodLabel = (period: string, grouping: Grouping) => {
  if (grouping === "month") return dayjs(`${period}-01`).format("MMM YYYY");
  if (grouping === "week") return `Semana del ${dayjs(period).format("DD MMM")}`;
  return dayjs(period).format("DD MMM");
};

const formatMinutes = (minutes: number | null) => {
  if (minutes === null) return "Sin datos";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

const sectionLabel = "text-xs font-bold uppercase tracking-wide text-slate-500";

/** Indicadores de visitas por periodo: entradas, entregas, permanencia, horas pico, casas, rechazos y sin salida. */
export const VisitStatsPanel = () => {
  const [days, setDays] = useState("30");
  const [grouping, setGrouping] = useState<Grouping>("day");
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const range = useMemo(
    () => ({ from: dayjs().subtract(Number(days), "day").startOf("day").toISOString(), to: new Date().toISOString() }),
    [days],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getVisitStats(range).then((res) => {
      if (!active) return;
      if (res.success && res.data) setStats(res.data);
      else setError(res.messages?.[0] ?? "No se pudieron cargar los indicadores de visitas");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [range]);

  const exportStats = async (format: "pdf" | "xlsx") => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadVisitStats(format, range);
    } catch {
      setExportError("No se pudo descargar el reporte. Intenta de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  const rangeLabel = RANGES.find((option) => option.value === days)?.label ?? "";

  return (
    <ITCard
      title={`Visitas · últimos ${rangeLabel}`}
      contentClassName="p-4!"
      headerActions={
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITSegmentedControl size="sm" options={RANGES} value={days} onChange={setDays} />
          <ITButton size="sm" variant="outlined" color="secondary" onClick={() => void exportStats("xlsx")} disabled={exporting || !stats}>
            <ITFlex align="center" gap={2}><FaFileExcel size={11} /> Descargar Excel</ITFlex>
          </ITButton>
          <ITButton size="sm" variant="outlined" color="secondary" onClick={() => void exportStats("pdf")} disabled={exporting || !stats}>
            <ITFlex align="center" gap={2}><FaFilePdf size={11} /> {exporting ? "Generando…" : "Descargar PDF"}</ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      {loading ? (
        <ITSkeleton variant="rectangular" height={160} className="rounded-2xl" />
      ) : error || !stats ? (
        <ITAlert variant="error">{error ?? "No se pudieron cargar los indicadores de visitas"}</ITAlert>
      ) : (
        <ITFlex direction="column" gap={4}>
          {exportError && <ITAlert variant="error">{exportError}</ITAlert>}
          <StatsBody stats={stats} grouping={grouping} onGrouping={setGrouping} />
        </ITFlex>
      )}
    </ITCard>
  );
};

type BodyProps = { stats: VisitStats; grouping: Grouping; onGrouping: (value: Grouping) => void };

const StatsBody = ({ stats, grouping, onGrouping }: BodyProps) => {
  const peakHours = [...stats.byHour].filter((h) => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  const topProperties = stats.byProperty.slice(0, 5);
  const busiest = Math.max(1, ...topProperties.map((p) => p.entries));
  const periods: VisitPeriod[] = { day: stats.byDay, week: stats.byWeek, month: stats.byMonth }[grouping].slice(-MAX_PERIOD_ROWS).reverse();
  const busiestPeriod = Math.max(1, ...periods.map((p) => p.count));

  return (
    <>
      <ITGrid container columns={12} spacing={3}>
        {[
          { label: "Entradas", value: String(stats.entries), icon: <FaSignInAlt /> },
          { label: "Entregas de repartidores", value: String(stats.deliveries), icon: <FaBoxOpen /> },
          { label: "Permanencia promedio", value: formatMinutes(stats.averageStayMinutes), icon: <FaClock /> },
          { label: "Rechazos de acceso", value: String(stats.rejected.total), icon: <FaDoorOpen /> },
          { label: "Excedieron su tiempo", value: String(stats.exceededStay), icon: <FaHourglassEnd /> },
          { label: "Sin salida registrada", value: String(stats.noExit), icon: <FaExclamationTriangle /> },
        ].map((kpi) => (
          <ITGrid item xs={6} md={4} lg={2} key={kpi.label}>
            <ITStatCard label={kpi.label} value={kpi.value} icon={kpi.icon} />
          </ITGrid>
        ))}
      </ITGrid>

      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={12} md={6} lg={3}>
          <ITFlex direction="column" gap={2}>
            <ITFlex align="center" justify="between" gap={2} wrap="wrap">
              <ITText as="span" className={sectionLabel}>Visitas por</ITText>
              <ITSegmentedControl size="sm" options={GROUPINGS} value={grouping} onChange={(value) => onGrouping(value as Grouping)} />
            </ITFlex>
            {periods.length === 0 ? (
              <ITText as="p" className="text-sm text-slate-500">Sin visitas en el periodo.</ITText>
            ) : (
              periods.map((p) => (
                <ITFlex key={p.period} direction="column" gap={1}>
                  <ITFlex align="center" justify="between" gap={2}>
                    <ITText as="span" className="text-sm font-semibold text-slate-700">{periodLabel(p.period, grouping)}</ITText>
                    <ITText as="span" className="text-xs text-slate-500">Visitas {p.count} · Entregas {p.deliveries}</ITText>
                  </ITFlex>
                  <ITProgress value={Math.round((p.count / busiestPeriod) * 100)} size="sm" />
                </ITFlex>
              ))
            )}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={6} lg={3}>
          <ITFlex direction="column" gap={2}>
            <ITText as="span" className={sectionLabel}>Horas pico</ITText>
            {peakHours.length === 0 ? (
              <ITText as="p" className="text-sm text-slate-500">Sin entradas en el periodo.</ITText>
            ) : (
              <ITFlex gap={2} wrap="wrap">
                {peakHours.map((h) => (
                  <ITChip key={h.hour} label={`${String(h.hour).padStart(2, "0")}:00 · ${h.count}`} color="primary" variant="outlined" />
                ))}
              </ITFlex>
            )}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={6} lg={3}>
          <ITFlex direction="column" gap={2}>
            <ITText as="span" className={sectionLabel}>Casas con más visitas</ITText>
            {topProperties.length === 0 ? (
              <ITText as="p" className="text-sm text-slate-500">Sin visitas en el periodo.</ITText>
            ) : (
              topProperties.map((p) => (
                <ITFlex key={p.propertyId} direction="column" gap={1}>
                  <ITFlex align="center" justify="between">
                    <ITText as="span" className="text-sm font-semibold text-slate-700">{p.identifier}</ITText>
                    <ITText as="span" className="text-xs text-slate-500">{p.entries} · {formatMinutes(p.averageStayMinutes)}</ITText>
                  </ITFlex>
                  <ITProgress value={Math.round((p.entries / busiest) * 100)} size="sm" />
                </ITFlex>
              ))
            )}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={6} lg={3}>
          <ITFlex direction="column" gap={2}>
            <ITText as="span" className={sectionLabel}>Motivos de rechazo</ITText>
            {stats.rejected.byReason.length === 0 ? (
              <ITText as="p" className="text-sm text-slate-500">Ningún intento rechazado.</ITText>
            ) : (
              stats.rejected.byReason.slice(0, 5).map((r) => (
                <ITFlex key={r.reason} align="center" justify="between">
                  <ITText as="span" className="text-sm text-slate-700">{r.label}</ITText>
                  <ITChip size="sm" color="danger" variant="outlined" label={String(r.count)} />
                </ITFlex>
              ))
            )}
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </>
  );
};
