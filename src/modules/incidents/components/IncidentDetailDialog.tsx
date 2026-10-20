import { ITBadget, ITButton, ITDialog, ITFlex } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaCalendarAlt, FaCheck, FaCheckCircle, FaFileAlt, FaMapMarkerAlt, FaUserShield } from "react-icons/fa";
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

const SectionTitle = ({ children }: { children: string }) => (
  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">{children}</p>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">{children}</div>
);

/** Detalle de una incidencia: descripción, evidencia, ubicación, responsables y acción de atender. */
export const IncidentDetailDialog = ({ incident, isAdmin, onClose, onResolve, onDeleteMedia }: IncidentDetailDialogProps) => {
  const isPending = incident.status === "PENDING";
  const reporter = incident.guard ? `${incident.guard.name} ${incident.guard.lastName ?? ""}`.trim() : "Sin registro";
  const hasMedia = !!incident.media && incident.media.length > 0;
  const hasLocation = incident.latitude != null && incident.longitude != null;

  return (
    <ITDialog isOpen onClose={onClose} title={`Incidencia #${incident.id}`} className="max-w-5xl max-h-[90vh] flex flex-col">
      <ITFlex align="center" gap={2}>
        <ITBadget color={isPending ? "danger" : "success"} size="sm">
          {isPending ? "Pendiente" : "Atendida"}
        </ITBadget>
        <ITBadget color="secondary" size="sm">
          {incident.category?.value || "General"}
        </ITBadget>
        <span className="text-sm text-slate-500">Reportada el {dayjs(incident.createdAt).format("DD [de] MMMM, YYYY [a las] HH:mm")}</span>
      </ITFlex>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto flex-1 min-h-0 pr-1">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-slate-800">{incident.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {incident.description || "Sin descripción detallada."}
            </p>
          </Card>

          <Card>
            <ITFlex align="center" justify="between">
              <SectionTitle>Evidencia</SectionTitle>
              {hasMedia && <span className="-mt-3 text-xs font-bold text-indigo-600">{incident.media!.length} archivos</span>}
            </ITFlex>
            {hasMedia ? (
              <MediaCarousel
                media={incident.media!}
                title={incident.title}
                showDelete={isAdmin}
                onDelete={(item) => onDeleteMedia(item)}
              />
            ) : (
              <ITFlex direction="column" align="center" gap={2} className="py-10 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                <FaFileAlt />
                <span className="text-sm font-medium">Sin evidencia adjunta</span>
              </ITFlex>
            )}
          </Card>

          {hasLocation && (
            <Card>
              <ITFlex align="center" gap={2} className="mb-3">
                <FaMapMarkerAlt className="text-emerald-500" />
                <SectionTitle>Ubicación reportada</SectionTitle>
              </ITFlex>
              <GoogleMapComponent lat={incident.latitude!} lng={incident.longitude!} height="300px" />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle>Responsables</SectionTitle>
            <ITFlex direction="column" gap={4}>
              <ITFlex align="center" gap={3}>
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <FaUserShield />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Reportó</p>
                  <p className="text-sm font-bold text-slate-800">{reporter}</p>
                  {incident.guard?.username && <p className="text-xs text-slate-500">@{incident.guard.username}</p>}
                </div>
              </ITFlex>

              {incident.type && (
                <div>
                  <p className="text-xs text-slate-400">Tipo</p>
                  <p className="text-sm font-bold text-slate-800">{incident.type.value}</p>
                </div>
              )}
            </ITFlex>
          </Card>

          {isPending ? (
            <Card>
              <SectionTitle>Acción pendiente</SectionTitle>
              <p className="text-sm text-slate-600 mb-4">Esta incidencia requiere atención inmediata.</p>
              <ITButton onClick={() => onResolve(incident.id)} color="success" variant="filled" size="md">
                <ITFlex align="center" gap={2}>
                  <FaCheck />
                  <span>Marcar como atendida</span>
                </ITFlex>
              </ITButton>
            </Card>
          ) : (
            incident.resolvedBy && (
              <Card>
                <SectionTitle>Atención</SectionTitle>
                <ITFlex align="center" gap={3}>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Atendida por</p>
                    <p className="text-sm font-bold text-slate-800">{incident.resolvedBy.name}</p>
                    {incident.resolvedAt && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <FaCalendarAlt /> {dayjs(incident.resolvedAt).format("DD/MM/YYYY HH:mm")}
                      </p>
                    )}
                  </div>
                </ITFlex>
              </Card>
            )
          )}
        </div>
      </div>
    </ITDialog>
  );
};
