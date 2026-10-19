import { ICatalogItem } from "@app/core/types/catalog.types";
import { ReportCreateForm } from "@core/components/ReportCreateForm";
import { FaGlassCheers } from "react-icons/fa";
import { createClub, uploadClubFile } from "../services/ClubService";

interface ClubCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoriesCatalog: ICatalogItem[];
  typesCatalog: ICatalogItem[];
}

const ClubCreateForm = ({ isOpen, onClose, onSuccess, typesCatalog }: ClubCreateFormProps) => (
  <ReportCreateForm
    isOpen={isOpen}
    onClose={onClose}
    onSuccess={onSuccess}
    typesCatalog={typesCatalog}
    title="Nuevo reporte de Casa Club"
    subtitle="Registra una novedad de la casa club"
    icon={<FaGlassCheers size={15} />}
    accent="sky"
    typeLabel="Tipo de reporte"
    placeholder="Describe lo sucedido brevemente..."
    fallbackTitle="Casa Club"
    create={createClub}
    upload={uploadClubFile}
  />
);

export default ClubCreateForm;
