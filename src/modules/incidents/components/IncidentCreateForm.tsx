import { ICatalogItem } from "@app/core/types/catalog.types";
import { ReportCreateForm } from "@core/components/ReportCreateForm";
import { FaExclamationTriangle } from "react-icons/fa";
import { createIncident, uploadIncidentFile } from "../services/IncidentService";

interface IncidentCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoriesCatalog: ICatalogItem[];
  typesCatalog: ICatalogItem[];
}

const IncidentCreateForm = ({ isOpen, onClose, onSuccess, typesCatalog }: IncidentCreateFormProps) => (
  <ReportCreateForm
    isOpen={isOpen}
    onClose={onClose}
    onSuccess={onSuccess}
    typesCatalog={typesCatalog}
    title="Nuevo reporte de incidencia"
    subtitle="Registra lo sucedido con evidencia y ubicación"
    icon={<FaExclamationTriangle size={15} />}
    accent="red"
    typeLabel="Tipo de incidencia"
    placeholder="Describe lo sucedido brevemente..."
    fallbackTitle="Incidencia"
    create={createIncident}
    upload={uploadIncidentFile}
  />
);

export default IncidentCreateForm;
