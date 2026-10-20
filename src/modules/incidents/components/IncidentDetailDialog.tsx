import { ITBadget, ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
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

const Label = ({ children }: { children: string }) => (
  <ITText as="span" muted>{children}</ITText>
);

/** Detalle de incidencia: evidencia a la izquierda, datos y acción fijos a la derecha. */
export const IncidentDetailDialog = ({ incident, isAdmin, onClose, onResolve, onDeleteMedia }: IncidentDetailDialogProps) => {
  const isPending = incident.status === "PENDING";
  const reporter = incident.guard ? `${incident.guard.name} ${incident.guard.lastName ?? ""}`.trim() : "Sin registro";
  const hasMedia = !!incident.media && incident.media.length > 0;
  const hasLocation = incident.latitude != null && incident.longitude != null;

  return (
    <ITDialog isOpen onClose={onClose} title={`Incidencia #${incident.id}`} className="max-w-5xl h-[88vh] flex flex-col">
      <ITFlex direction="column" gap={4} className="flex-1 min-h-0">
        <ITFlex align="center" gap={2} className="flex-wrap">
          <ITBadget color={isPending ? "danger" : "success"} size="sm">{isPending ? "Pendiente" : "Atendida"}</ITBadget>
          <ITBadget color="secondary" size="sm">{incident.category?.value || "General"}</ITBadget>
          {incident.type && <ITBadget color="secondary" size="sm">{incident.type.value}</ITBadget>}
        </ITFlex>

        <ITFlex gap={4} className="flex-1 min-h-0 flex-col lg:flex-row">
          <ITFlex direction="column" gap={3} className="flex-[3] min-w-0">
            <ITFlex align="center" justify="between" gap={2}>
              <ITText as="h3" className="text-base font-medium text-slate-800">Evidencia</ITText>
              {hasMedia && <ITText as="span" muted>{incident.media!.length} archivos</ITText>}
            </ITFlex>
            {hasMedia ? (
              <MediaCarousel media={incident.media!} showDelete={isAdmin} onDelete={(item) => onDeleteMedia(item)} />
            ) : (
              <ITFlex direction="column" align="center" justify="center" gap={2} className="h-[280px] rounded-xl border border-dashed border-slate-200">
                <Label>Sin evidencia adjunta</Label>
              </ITFlex>
            )}
          </ITFlex>

          <ITFlex direction="column" gap={3} className="flex-[2] min-w-0 lg:overflow-y-auto">
            <ITText as="h3" className="text-lg font-medium text-slate-800">{incident.title}</ITText>
            <ITText as="p" className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {incident.description || "Sin descripción detallada."}
            </ITText>

            <ITFlex direction="column" gap={1}>
              <Label>Reportó</Label>
              <ITText as="span" className="text-sm font-medium text-slate-800">{reporter}</ITText>
              {incident.guard?.username && <Label>{`@${incident.guard.username}`}</Label>}
            </ITFlex>

            {hasLocation && (
              <ITFlex direction="column" gap={2}>
                <ITFlex align="center" gap={2}>
                  <FaMapMarkerAlt />
                  <Label>Ubicación</Label>
                </ITFlex>
                <GoogleMapComponent lat={incident.latitude!} lng={incident.longitude!} height="160px" />
              </ITFlex>
            )}

            <ITFlex direction="column" gap={1}>
              <Label>Línea de tiempo</Label>
              <ITText as="span" className="text-sm text-slate-600">{dayjs(incident.createdAt).format("DD/MM/YYYY HH:mm")} · Reportada</ITText>
              {incident.resolvedAt && (
                <ITText as="span" className="text-sm text-slate-600">{dayjs(incident.resolvedAt).format("DD/MM/YYYY HH:mm")} · Atendida{incident.resolvedBy ? ` por ${incident.resolvedBy.name}` : ""}</ITText>
              )}
            </ITFlex>

            <ITFlex direction="column" gap={2} className="mt-auto pt-2">
              {isPending ? (
                <ITButton onClick={() => onResolve(incident.id)} color="success" variant="filled" size="md">
                  <ITFlex align="center" gap={2}>
                    <FaCheck />
                    <span>Marcar como atendida</span>
                  </ITFlex>
                </ITButton>
              ) : (
                <ITText as="span" className="text-sm text-slate-500">Incidencia atendida</ITText>
              )}
            </ITFlex>
          </ITFlex>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
