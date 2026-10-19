import { ICatalogItem } from "@app/core/types/catalog.types";
import { ReportCreateForm } from "@core/components/ReportCreateForm";
import { FaWrench } from "react-icons/fa";
import { createMaintenance, uploadMaintenanceFile } from "../services/MaintenanceService";

interface MaintenanceCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoriesCatalog: ICatalogItem[];
  typesCatalog: ICatalogItem[];
}

const MaintenanceCreateForm = ({ isOpen, onClose, onSuccess, typesCatalog }: MaintenanceCreateFormProps) => (
  <ReportCreateForm
    isOpen={isOpen}
    onClose={onClose}
    onSuccess={onSuccess}
    typesCatalog={typesCatalog}
    title="Nuevo reporte de mantenimiento"
    subtitle="Registra un desperfecto o tarea pendiente"
    icon={<FaWrench size={15} />}
    accent="amber"
    typeLabel="Tipo de mantenimiento"
    placeholder="Describe el problema encontrado..."
    fallbackTitle="Mantenimiento"
    create={createMaintenance}
    upload={uploadMaintenanceFile}
  />
);

export default MaintenanceCreateForm;
