import { StatusBadge } from "@app/core/components/StatusBadge";
import { VehicleExit } from "../service/exits.service";
import { ITTable, Column } from "axzy_ui_system";
interface Props {
  data: VehicleExit[];
}

export const ExitsTable = ({ data }: Props) => {
  const columns: Column<VehicleExit>[] = [
    { key: "entry.entryNumber", label: "Folio", type: "string", sortable: true, filter: true, render: (row: any) => row.entry?.entryNumber },
    { key: "operators", label: "Operador", type: "string", sortable: true, filter: true, render: (row: any) => `${row.operator?.name} ${row.operator?.lastName}` },
    { key: "client", label: "Cliente", type: "string", sortable: true, filter: true, render: (row: any) => `${row.entry?.user?.name} ${row.entry?.user?.lastName}` },
    { key: "entry.plates", label: "Placas", type: "string", sortable: true, filter: true, render: (row: any) => row.entry?.plates },
    { key: "exitDate", label: "Fecha Salida", type: "date", sortable: true, filter: true, render: (row: any) => new Date(row.exitDate).toLocaleString("es-MX") },
    { 
        key: "status", 
        label: "Estado", 
        type: "string", 
        sortable: true, 
        filter: true,
        render: (row: any) => <StatusBadge status={row.status} />
    },
  ];

  return <ITTable columns={columns} data={data} title="Salidas Registradas" />;
};
