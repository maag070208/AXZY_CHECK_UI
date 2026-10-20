import { ReportDetailDialog } from "@core/components/ReportDetailDialog";
import { Incident } from "../services/IncidentService";

interface IncidentDetailDialogProps {
  incident: Incident;
  isAdmin: boolean;
  onClose: () => void;
  onResolve: (id: number) => void;
}

/** Adapta el detalle de incidencia al componente compartido de reportes. */
export const IncidentDetailDialog = ({ incident, isAdmin, onClose, onResolve }: IncidentDetailDialogProps) => (
  <ReportDetailDialog
    kind="incident"
    report={incident}
    categoryLabel={incident.category?.value || "General"}
    typeLabel={incident.type?.value}
    isAdmin={isAdmin}
    onClose={onClose}
    onResolve={() => onResolve(incident.id)}
  />
);
