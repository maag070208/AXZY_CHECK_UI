import { ITAvatar, ITBadget, ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaCheck, FaMapMarkerAlt } from "react-icons/fa";
import { MediaCarousel, type MediaItem } from "@app/core/components/MediaCarousel";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";

export type ReportDetailKind = "incident" | "maintenance" | "club";

export interface ReportDetailReport {
  id: number;
  title: string;
  description?: string | null;
  status: "PENDING" | "ATTENDED";
  createdAt: string;
  resolvedAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  media?: MediaItem[];
  guard?: { name?: string; lastName?: string; username?: string } | null;
  resolvedBy?: { name?: string } | null;
}

interface ReportDetailDialogProps {
  kind: ReportDetailKind;
  report: ReportDetailReport;
  categoryLabel: string;
  typeLabel?: string;
  isAdmin?: boolean;
  onClose: () => void;
  onResolve?: () => void;
  onDeleteMedia?: (item: MediaItem, index: number) => void;
}

const KIND_LABEL: Record<ReportDetailKind, string> = {
  incident: "Incidencia",
  maintenance: "Mantenimiento",
  club: "Reporte de Casa Club",
};

/** Detalle compartido de incidencias, mantenimientos y casa club: mismo layout en los tres módulos. */
export const ReportDetailDialog = ({
  kind,
  report,
  categoryLabel,
  typeLabel,
  onClose,
  onResolve,
}: ReportDetailDialogProps) => {
  const isPending = report.status === "PENDING";
  const reporterName = report.guard
    ? `${report.guard.name ?? ""} ${report.guard.lastName ?? ""}`.trim() || "Sin registro"
    : "Sin registro";
  const initials = report.guard
    ? `${report.guard.name?.charAt(0) ?? ""}${report.guard.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?"
    : "?";
  const hasMedia = !!report.media && report.media.length > 0;
  const hasLocation = report.latitude != null && report.longitude != null;
  const resolvedLabel = kind === "incident" ? "Atendida" : "Atendido";
  const reportedLabel = kind === "incident" ? "Reportada" : "Reportado";
  const actionLabel = kind === "incident" ? "Marcar como atendida" : "Marcar como atendido";

  return (
    <ITDialog isOpen onClose={onClose} className="w-[1100px] max-w-[95vw] h-[90vh] flex flex-col overflow-hidden" padded={false}>
      <ITFlex align="center" gap={3} className="flex-wrap px-6 py-4 pr-14">
        <ITText as="h2" className="text-lg font-semibold text-slate-800">
          {KIND_LABEL[kind]} #{report.id}
        </ITText>
        <ITFlex align="center" gap={2} className="flex-wrap">
          <ITBadget color={isPending ? "warning" : "success"} size="sm">
            {isPending ? "Pendiente" : resolvedLabel}
          </ITBadget>
          <ITBadget color="secondary" size="sm">{categoryLabel || "General"}</ITBadget>
          {typeLabel && <ITBadget color="secondary" size="sm">{typeLabel}</ITBadget>}
        </ITFlex>
      </ITFlex>

      <ITFlex className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <ITFlex direction="column" className="min-h-0 min-w-0 w-full overflow-y-auto bg-slate-50/70 p-5 lg:flex-[3]">
          {hasMedia ? (
            <ITFlex className="w-full">
              <MediaCarousel
                media={report.media ?? []}
                title="Evidencia"
                showDelete={false}
              />
            </ITFlex>
          ) : (
            <ITFlex direction="column" align="center" justify="center" className="flex-1 rounded-2xl bg-white">
              <ITText as="span" muted>Sin evidencia adjunta</ITText>
            </ITFlex>
          )}
        </ITFlex>

        <ITFlex direction="column" gap={4} className="min-h-0 min-w-0 w-full overflow-y-auto bg-white p-5 lg:flex-[2]">
          <ITFlex direction="column" gap={2}>
            <ITText as="h3" className="text-xl font-semibold text-slate-800">{report.title}</ITText>
            <ITText as="p" className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {report.description || "Sin descripción detallada."}
            </ITText>
          </ITFlex>

          <ITFlex align="center" gap={3} className="rounded-xl bg-slate-50/70 p-3">
            <ITAvatar initials={initials} size="md" />
            <ITFlex direction="column">
              <ITText as="span" muted>Reportó</ITText>
              <ITText as="span" className="font-medium text-slate-800">
                {reporterName}{report.guard?.username ? ` · @${report.guard.username}` : ""}
              </ITText>
            </ITFlex>
          </ITFlex>

          {hasLocation && (
            <ITFlex direction="column" gap={2}>
              <ITFlex align="center" gap={2}>
                <FaMapMarkerAlt />
                <ITText as="span" muted>Ubicación</ITText>
              </ITFlex>
              <GoogleMapComponent lat={report.latitude!} lng={report.longitude!} height="180px" />
            </ITFlex>
          )}

          <ITFlex direction="column" gap={3}>
            <ITText as="span" muted>Línea de tiempo</ITText>
            <ITFlex align="start" gap={3}>
              <ITFlex className="mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <ITFlex direction="column">
                <ITText as="span" className="font-medium text-slate-800">{reportedLabel}</ITText>
                <ITText as="span" muted>{dayjs(report.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
              </ITFlex>
            </ITFlex>
            <ITFlex align="start" gap={3}>
              <ITFlex className="mt-1.5 h-2.5 w-2.5 rounded-full border border-slate-400" />
              <ITFlex direction="column">
                <ITText as="span" className="font-medium text-slate-800">
                  {isPending ? `${resolvedLabel} · pendiente` : resolvedLabel}
                </ITText>
                {!isPending && report.resolvedAt && (
                  <ITText as="span" muted>
                    {dayjs(report.resolvedAt).format("DD/MM/YYYY HH:mm")}{report.resolvedBy ? ` · ${report.resolvedBy.name}` : ""}
                  </ITText>
                )}
              </ITFlex>
            </ITFlex>
          </ITFlex>
        </ITFlex>
      </ITFlex>

      <ITFlex align="center" justify="between" gap={3} className="bg-white px-6 py-3">
        <ITText as="span" muted className="text-xs">
          {reportedLabel}: {dayjs(report.createdAt).format("DD/MM/YYYY HH:mm")}
        </ITText>
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="secondary" size="md" onClick={onClose}>Cerrar</ITButton>
          {isPending && onResolve && (
            <ITButton onClick={onResolve} color="success" variant="filled" size="md" icon={<FaCheck />} label={actionLabel} />
          )}
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
