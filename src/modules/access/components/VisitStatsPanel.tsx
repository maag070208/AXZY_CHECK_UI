import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITCard, ITChip, ITFlex, ITGrid, ITProgress, ITSkeleton, ITStatCard, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaClock, FaDoorOpen, FaExclamationTriangle, FaFilePdf, FaSignInAlt } from "react-icons/fa";
import { downloadVisitStatsPdf, getVisitStats, VisitStats } from "@modules/invitations/services/invitations.service";

const RANGE_DAYS = 30;

const formatMinutes = (minutes: number | null) => {
  if (minutes === null) return "Sin datos";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

/** Indicadores de visitas de los últimos 30 días: entradas, permanencia, horas pico, casas y rechazos. */
export const VisitStatsPanel = () => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [range] = useState(() => ({
    from: dayjs().subtract(RANGE_DAYS, "day").startOf("day").toISOString(),
    to: new Date().toISOString(),
  }));

  useEffect(() => {
    let active = true;
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

  const exportPdf = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadVisitStatsPdf(range);
    } catch {
      setExportError("No se pudo descargar el PDF. Intenta de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <ITSkeleton variant="rectangular" height={160} className="rounded-2xl" />;
  }
  if (error || !stats) {
    return <ITAlert variant="error">{error ?? "No se pudieron cargar los indicadores de visitas"}</ITAlert>;
  }

  const peakHours = [...stats.byHour].filter((h) => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  const topProperties = stats.byProperty.slice(0, 5);
  const busiest = Math.max(1, ...topProperties.map((p) => p.entries));

  return (
    <ITCard
      title={`Visitas · últimos ${RANGE_DAYS} días`}
      contentClassName="p-4!"
      headerActions={
        <ITButton size="sm" variant="outlined" color="secondary" onClick={() => void exportPdf()} disabled={exporting}>
          <ITFlex align="center" gap={2}><FaFilePdf size={11} /> {exporting ? "Generando…" : "Descargar PDF"}</ITFlex>
        </ITButton>
      }
    >
      <ITFlex direction="column" gap={4}>
        {exportError && <ITAlert variant="error">{exportError}</ITAlert>}
        <ITGrid container columns={12} spacing={3}>
          {[
            { label: "Entradas", value: String(stats.entries), icon: <FaSignInAlt /> },
            { label: "Permanencia promedio", value: formatMinutes(stats.averageStayMinutes), icon: <FaClock /> },
            { label: "Rechazos de acceso", value: String(stats.rejected.total), icon: <FaDoorOpen /> },
            { label: "Fuera de tiempo ahora", value: String(stats.overstayedNow), icon: <FaExclamationTriangle /> },
          ].map((kpi) => (
            <ITGrid item xs={6} md={3} key={kpi.label}>
              <ITStatCard label={kpi.label} value={kpi.value} icon={kpi.icon} />
            </ITGrid>
          ))}
        </ITGrid>

        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={4}>
            <ITFlex direction="column" gap={2}>
              <ITText as="span" className="text-xs font-bold uppercase tracking-wide text-slate-500">Horas pico</ITText>
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

          <ITGrid item xs={12} md={4}>
            <ITFlex direction="column" gap={2}>
              <ITText as="span" className="text-xs font-bold uppercase tracking-wide text-slate-500">Casas con más visitas</ITText>
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

          <ITGrid item xs={12} md={4}>
            <ITFlex direction="column" gap={2}>
              <ITText as="span" className="text-xs font-bold uppercase tracking-wide text-slate-500">Motivos de rechazo</ITText>
              {stats.rejected.byReason.length === 0 ? (
                <ITText as="p" className="text-sm text-slate-500">Ningún intento rechazado.</ITText>
              ) : (
                stats.rejected.byReason.slice(0, 5).map((r) => (
                  <ITFlex key={r.reason} align="center" justify="between">
                    <ITText as="span" className="text-sm text-slate-700">{r.reason}</ITText>
                    <ITChip size="sm" color="danger" variant="outlined" label={String(r.count)} />
                  </ITFlex>
                ))
              )}
            </ITFlex>
          </ITGrid>
        </ITGrid>
      </ITFlex>
    </ITCard>
  );
};
