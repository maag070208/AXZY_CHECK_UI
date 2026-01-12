import { Location } from "../service/locations.service";
import { ITTable, Column, ITButton } from "axzy_ui_system";

interface Props {
  data: Location[];
  onViewCars: (location: Location) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

export const LocationsTable = ({ data, onViewCars, onEdit, onDelete }: Props) => {
  const columns: Column<Location>[] = [
    { key: "aisle", label: "Pasillo", type: "string", sortable: true, filter: true },
    { key: "spot", label: "Cajón", type: "string", sortable: true, filter: true },
    { key: "name", label: "Identificador", type: "string", sortable: true, filter: true },
    { 
        key: "actions", 
        label: "Acciones", 
        type: "actions",
        actions: (row) => (
            <div className="flex gap-2">
                <ITButton 
                    size="small" 
                    color="primary" 
                    onClick={() => onViewCars(row)}
                    title="Ver Autos"
                >
                    Autos ({row.entries?.length || 0})
                </ITButton>
                <ITButton 
                    size="small" 
                    color="warning" 
                    onClick={() => onEdit(row)}
                >
                    Editar
                </ITButton>
                <ITButton 
                    size="small" 
                    color="danger" 
                    onClick={() => onDelete(row)}
                >
                    Eliminar
                </ITButton>
            </div>
        )
    },
  ];

  return <ITTable columns={columns} data={data} title="Listado de Ubicaciones" />;
};
