import { StatusBadge } from "@app/core/components/StatusBadge";
import { KardexItem } from "../service/movements.service";
import { ITTable, Column } from "axzy_ui_system";

interface Props {
  data: KardexItem[];
}

export const MovementsTable = ({ data }: Props) => {
  const columns: Column<KardexItem>[] = [
    { key: "date", label: "Fecha", type: "date", sortable: true, filter: true, render: (row: any) => new Date(row.date).toLocaleString("es-MX") },
    { key: "type", label: "Tipo", type: "string", sortable: true, filter: true, 
      render: (row) => <StatusBadge status={row.type} />
    },
    { key: "description", label: "Descripción", type: "string", sortable: true, filter: true },
    { key: "plates", label: "Placas", type: "string", sortable: true, filter: true },
    { key: "clientName", label: "Cliente", type: "string", sortable: true, filter: true },
    { key: "operatorName", label: "Operador", type: "string", sortable: true, filter: true },
    { key: "status", label: "Estado", type: "string", sortable: true, filter: true, render: (row: any) => <StatusBadge status={row.status} /> },
  ];

  return <ITTable columns={columns} data={data} title="Kardex General de Operaciones" />;
};
