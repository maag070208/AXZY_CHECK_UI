import { VehicleEntry } from "../service/entries.service";
import { ITTable, Column, ITButton } from "axzy_ui_system";
import { useNavigate } from "react-router-dom";
import { FaEye, FaKey, FaCheckCircle } from "react-icons/fa";
import { StatusBadge } from "@app/core/components/StatusBadge";

interface Props {
  data: VehicleEntry[];
  onAssignKey?: (entry: VehicleEntry) => void;
  onFinishAssignment?: (assignmentId: number) => void;
  readOnly?: boolean;
}


export const EntriesTable = ({ data, onAssignKey, onFinishAssignment, readOnly = false }: Props) => {
  const navigate = useNavigate();

  const columns: Column<VehicleEntry>[] = [
    { key: "entryNumber", label: "Folio", type: "string", sortable: true, filter: true },
    { 
        key: "user.name", 
        label: "Cliente", 
        type: "string", 
        sortable: true, 
        filter: true,
        render: (row) => row.user ? `${row.user.name} ${row.user.lastName}` : 'N/A'
    },
    { key: "plates", label: "Placas", type: "string", sortable: true, filter: true },
    { key: "brand", label: "Marca", type: "string", sortable: true, filter: true },
    { key: "model", label: "Modelo", type: "string", sortable: true, filter: true },
    { key: "location.name", label: "Ubicación", type: "string", sortable: true, filter: true, render: (row: any) => row.location?.name || "Sin Asignar" },
    { 
        key: "status", 
        label: "Estatus", 
        type: "string", 
        sortable: true, 
        filter: true,
        render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: any) => {
        const activeAssignment = row.assignments?.find((a: any) => a.status === 'ACTIVE');
        
        return (
            <div className="flex gap-2">
                <ITButton 
                    size="small" 
                    variant="outline" 
                    color="primary"
                    onClick={() => navigate(`/entries/${row.id}`)} 
                    title="Ver Detalle"
                >
                    <FaEye />
                </ITButton>
                
                {!readOnly && (
                    <>
                        {activeAssignment ? (
                            <ITButton
                                size="small"
                                variant="solid"
                                color="success"
                                onClick={() => onFinishAssignment?.(activeAssignment.id)}
                                title={`Finalizar ${activeAssignment.type === 'MOVEMENT' ? 'Movimiento' : 'Entrega'}`}
                            >
                                <FaCheckCircle />
                            </ITButton>
                        ) : (
                            <ITButton 
                                size="small" 
                                variant="outline" 
                                color="warning" 
                                onClick={() => onAssignKey?.(row)} 
                                title="Asignar Llave"
                            >
                                <FaKey />
                            </ITButton>
                        )}
                    </>
                )}
            </div>
        );
      },
    },
  ];

  return <ITTable columns={columns} data={data} title="Vehículos en Parking" />;
};
