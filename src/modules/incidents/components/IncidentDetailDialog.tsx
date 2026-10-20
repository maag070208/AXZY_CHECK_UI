import { ITAvatar, ITBadget, ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaCheck, FaMapMarkerAlt } from "react-icons/fa";
import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { Incident } from "../services/IncidentService";

interface IncidentDetailDialogProps {
  incident: Incident;
  isAdmin: boolean;
  onClose: () => void;
  onResolve: (id: number) => void;
  onDeleteMedia: (item: { key?: string; url: string }) => void;
}

/** Detalle de incidencia: evidencia a la izquierda; datos, mapa y línea de tiempo a la derecha; acciones al pie. */
export const IncidentDetailDialog = ({ incident, isAdmin, onClose, onResolve, onDeleteMedia }: IncidentDetailDialogProps) => {
  const isPending = incident.status === "PENDING";
  const reporterName = incident.guard ? `${incident.guard.name} ${incident.guard.lastName ?? ""}`.trim() : "Sin registro";
  const initials = incident.guard ? `${incident.guard.name?.charAt(0) ?? ""}${incident.guard.lastName?.charAt(0) ?? ""}`.toUpperCase() : "?";
  const hasMedia = !!incident.media && incident.media.length > 0;
  const hasLocation = incident.latitude != null && incident.longitude != null;
  const daysAgo = dayjs().diff(incident.createdAt, "day");
  const reportedAgo = daysAgo <= 0 ? "Reportada hoy" : `Reportada hace ${daysAgo} ${daysAgo === 1 ? "día" : "días"}`;

  return (
    <ITDialog isOpen onClose={onClose} title={`Incidencia #${incident.id}`} className="max-w-5xl h-[88vh] flex flex-col" padded={false}>
      <ITFlex align="center" gap={2} className="flex-wrap border-b border-slate-200 px-6 py-3">
        <ITBadget color={isPending ? "warning" : "success"} size="sm">{isPending ? "Pendiente" : "Atendida"}</ITBadget>
        <ITBadget color="secondary" size="sm">{incident.category?.value || "General"}</ITBadget>
        {incident.type && <ITBadget color="secondary" size="sm">{incident.type.value}</ITBadget>}
      </ITFlex>

      <ITFlex className="min-h-0 overflow-hidden" style={{ height: "calc(88vh - 200px)" }}>
        <ITFlex direction="column" className="min-h-0 min-w-0 flex-[3] overflow-y-auto border-r border-slate-200 p-6">
          {hasMedia ? (
            <MediaCarousel media={incident.media!} title="Evidencia" showDelete={isAdmin} onDelete={(item) => onDeleteMedia(item)} />
          ) : (
            <ITFlex direction="column" align="center" justify="center" className="flex-1 rounded-xl border border-dashed border-slate-200">
              <ITText as="span" muted>Sin evidencia adjunta</ITText>
            </ITFlex>
          )}
        </ITFlex>

        <ITFlex direction="column" gap={5} className="min-h-0 min-w-0 flex-[2] overflow-y-auto p-6">
          <ITFlex direction="column" gap={2}>
            <ITText as="h3" className="text-xl font-medium text-slate-800">{incident.title}</ITText>
            <ITText as="p" className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {incident.description || "Sin descripción detallada."}
            </ITText>
          </ITFlex>

          <ITFlex align="center" gap={3} className="rounded-xl border border-slate-200 p-3">
            <ITAvatar initials={initials} size="md" />
            <ITFlex direction="column">
              <ITText as="span" muted>Reportó</ITText>
              <ITText as="span" className="font-medium text-slate-800">
                {reporterName}{incident.guard?.username ? ` · @${incident.guard.username}` : ""}
              </ITText>
            </ITFlex>
          </ITFlex>

          {hasLocation && (
            <ITFlex direction="column" gap={2}>
              <ITFlex align="center" gap={2}>
                <FaMapMarkerAlt />
                <ITText as="span" muted>Ubicación</ITText>
              </ITFlex>
              <GoogleMapComponent lat={incident.latitude!} lng={incident.longitude!} height="180px" />
            </ITFlex>
          )}

          <ITFlex direction="column" gap={3}>
            <ITText as="span" muted>Línea de tiempo</ITText>
            <ITFlex align="start" gap={3}>
              <ITFlex className="mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <ITFlex direction="column">
                <ITText as="span" className="font-medium text-slate-800">Reportada</ITText>
                <ITText as="span" muted>{dayjs(incident.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
              </ITFlex>
            </ITFlex>
            <ITFlex align="start" gap={3}>
              <ITFlex className="mt-1.5 h-2.5 w-2.5 rounded-full border border-slate-400" />
              <ITFlex direction="column">
                <ITText as="span" className="font-medium text-slate-800">{isPending ? "Atendida · pendiente" : "Atendida"}</ITText>
                {!isPending && incident.resolvedAt && (
                  <ITText as="span" muted>
                    {dayjs(incident.resolvedAt).format("DD/MM/YYYY HH:mm")}{incident.resolvedBy ? ` · ${incident.resolvedBy.name}` : ""}
                  </ITText>
                )}
              </ITFlex>
            </ITFlex>
          </ITFlex>
        </ITFlex>
      </ITFlex>

      <ITFlex align="center" justify="between" gap={3} className="border-t border-slate-200 px-6 py-4">
        <ITText as="span" muted>{reportedAgo}</ITText>
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="secondary" size="md" onClick={onClose}>Cerrar</ITButton>
          {isPending && (
            <ITButton onClick={() => onResolve(incident.id)} color="success" variant="filled" size="md">
              <ITFlex align="center" gap={2}>
                <FaCheck />
                <span>Marcar como atendida</span>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
