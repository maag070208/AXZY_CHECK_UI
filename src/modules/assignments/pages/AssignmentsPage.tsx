import { fetchDataTable } from "@app/core/services/table-fetcher.service";
import { ITBadget, ITButton, ITDataTable } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { FaEye, FaSync, FaTasks } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AssignmentsPage = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const externalFilters = useMemo(() => ({
    status: ["PENDING", "CHECKING"],
    refreshKey
  }), [refreshKey]);

  const memoizedFetch = useCallback(async (params: any) => {
    return fetchDataTable("/assignments/datatable", {
      ...params,
      filters: { ...params.filters, status: ["PENDING", "CHECKING"] },
    });
  }, []);

  const columns = useMemo(() => [
    { key: "id", label: "ID", type: "number", sortable: true },
    {
      key: "guard",
      label: "Guardia",
      type: "string",
      render: (row: any) => (
        <span className="font-bold text-slate-700">{row.guard?.name} {row.guard?.lastName}</span>
      ),
    },
    {
      key: "location",
      label: "Ubicación",
      type: "string",
      render: (row: any) => (
        <span className="font-medium text-slate-600">{row.location?.name || "N/A"}</span>
      ),
    },
    {
      key: "tasks",
      label: "Tareas",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col gap-0.5">
          {row.tasks?.length > 0
            ? row.tasks.map((t: any) => (
                <span key={t.id} className="text-[10px] font-medium">
                  {t.completed ? "✅" : "⬜"} {t.description}
                </span>
              ))
            : <span className="text-xs text-slate-300">Sin tareas</span>}
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      type: "string",
      sortable: true,
      render: (row: any) => (
        <ITBadget
          color={row.status === "PENDING" ? "warning" : "primary"}
          variant="filled"
          size="small"
        >
          {row.status === "PENDING" ? "Pendiente" : "En revisión"}
        </ITBadget>
      ),
    },
    {
      key: "createdAt",
      label: "Creada",
      type: "string",
      sortable: true,
      render: (row: any) => (
        <span className="text-xs text-slate-500">{dayjs(row.createdAt).format("DD/MM/YYYY HH:mm")}</span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: any) => (
        <ITButton
          onClick={() => navigate(`/rounds/${row.id}`)}
          size="small"
          variant="outlined"
          color="secondary"
          className="!p-2"
          title="Ver detalle"
        >
          <FaEye />
        </ITButton>
      ),
    },
  ], [navigate]);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FaTasks className="text-purple-500" />
            Asignaciones Activas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Asignaciones pendientes y en revisión</p>
        </div>
        <ITButton
          onClick={() => setRefreshKey(prev => prev + 1)}
          variant="outlined"
          color="secondary"
          className="h-[42px] px-4 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
          size="small"
        >
          <FaSync className="text-xs text-slate-500" />
          <span className="text-xs font-bold text-slate-500">Refrescar</span>
        </ITButton>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters as any}
          defaultItemsPerPage={10}
          title=""
        />
      </div>
    </div>
  );
};

export default AssignmentsPage;
