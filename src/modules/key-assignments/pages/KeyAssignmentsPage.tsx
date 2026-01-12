import { useEffect, useState } from "react";
import { getKeyAssignments, KeyAssignment } from "../../entries/service/entries.service";
import { ITTable, Column, ITLoader } from "axzy_ui_system";
import dayjs from "dayjs";

const KeyAssignmentsPage = () => {
  const [assignments, setAssignments] = useState<KeyAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    const res = await getKeyAssignments();
    if (res.success && res.data) {
        setAssignments(res.data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const isCompleted = status === "COMPLETED";
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${isCompleted ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
            {isCompleted ? "COMPLETADO" : "ACTIVO"}
        </span>
    );
  };

  const getTypeBadge = (type: string) => {
      const isMovement = type === "MOVEMENT";
      return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${isMovement ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
            {isMovement ? "MOVIMIENTO" : "ENTREGA"}
        </span>
      );
  }

  const columns: Column<KeyAssignment>[] = [
    { key: "entry.entryNumber", label: "Folio", type: "string", render: (row) => row.entry?.entryNumber },
    { key: "entry", label: "Auto", type: "string", render: (row) => `${row.entry?.brand} ${row.entry?.model} ${row.entry?.color}` },
    { key: "entry.plates", label: "Placas", type: "string", render: (row) => row.entry?.plates },
    { key: "operator", label: "Operador", type: "string", render: (row) => `${row.operator?.name} ${row.operator?.lastName}` },
    { key: "type", label: "Acción", type: "string", render: (row) => getTypeBadge(row.type) },
    { key: "entry.location", label: "Origen (Actual)", type: "string", render: (row) => row.entry?.location?.name || "-" },
    { key: "targetLocation", label: "Destino", type: "string", render: (row) => row.targetLocation ? `${row.targetLocation.name} (P ${row.targetLocation.aisle})` : "-" },
    { key: "startedAt", label: "Inicio", type: "date", render: (row) => dayjs(row.startedAt).format("DD/MM/YYYY HH:mm") },
    { key: "endedAt", label: "Fin", type: "date", render: (row) => row.endedAt ? dayjs(row.endedAt).format("DD/MM/YYYY HH:mm") : "-" },
    { key: "status", label: "Estatus", type: "string", render: (row) => getStatusBadge(row.status) },
  ];

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Historial de Asignaciones de Llaves</h1>
      <ITTable columns={columns} data={assignments} />
    </div>
  );
};

export default KeyAssignmentsPage;
