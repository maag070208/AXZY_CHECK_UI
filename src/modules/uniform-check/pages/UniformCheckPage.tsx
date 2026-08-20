import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITInput } from "@axzydev/axzy_ui_system";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { FaFilter, FaPen, FaPlus, FaSync } from "react-icons/fa";
import dayjs from "dayjs";
import { getPaginatedUniformChecks, UniformCheck } from "../services/UniformCheckService";

const CONTEXT_LABEL: Record<string, string> = {
  SHIFT: "Cambio de turno",
  ROUND: "Recorrido",
  SPOT: "Al azar",
  OTHER: "Otra",
};

const UniformCheckPage = () => {
  const navigate = useNavigate();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdminOrShift = auth.role === "ADMIN" || auth.role === "SHIFT";

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const externalFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (searchTerm.trim()) f.search = searchTerm.trim();
    if (severityFilter !== "ALL") f.severity = severityFilter;
    return f;
  }, [searchTerm, severityFilter]);

  const memoizedFetch = useCallback(
    (params: Record<string, unknown>) => getPaginatedUniformChecks(params),
    []);

  useEffect(() => {
    const t = setTimeout(() => setRefreshKey((p) => p + 1), 400);
    return () => clearTimeout(t);
  }, [searchTerm, severityFilter]);

  const columns = useMemo(() => [
      {
        key: "checkedAt",
        label: "Fecha",
        type: "string",
        sortable: true,
        render: (row: UniformCheck) => (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-700">
              {dayjs(row.checkedAt).format("DD/MM/YYYY HH:mm")}
            </span>
            <span className="text-slate-400">{CONTEXT_LABEL[row.context] ?? row.context}</span>
          </div>
        ),
      },
      {
        key: "user",
        label: "Guardia",
        type: "string",
        render: (row: UniformCheck) => (
          <div>
            <p className="font-medium text-slate-800 text-sm">
              {row.user ? `${row.user.name} ${row.user.lastName ?? ""}`.trim(): `#${row.userId}`}
            </p>
            <p className="text-xs text-slate-400">@{row.user?.username ?? "—"}</p>
          </div>
        ),
      },
      {
        key: "failedCount",
        label: "Cumplimiento",
        type: "number",
        render: (row: UniformCheck) => (
          <div className="flex flex-col text-xs">
            <span className={`font-semibold ${row.severity === "MALO" ? "text-red-600": row.severity === "MEDIO" ? "text-amber-600": "text-emerald-600"}`}>
              {9 - row.failedCount} / 9
            </span>
            <span className="text-slate-400">ítems cumplidos</span>
          </div>
        ),
      },
      {
        key: "severity",
        label: "Cumplimiento",
        type: "string",
        sortable: true,
        render: (row: UniformCheck) => (
          <ITBadget
            color={row.severity === "EXCELENTE" ? "success": row.severity === "MEDIO" ? "warning": "danger"}
            size="small"
          >
            {row.severity === "EXCELENTE"
              ? "Excelente": row.severity === "MEDIO"
                ? "Medio": "Malo"}
          </ITBadget>
        ),
      },
      {
        key: "observations",
        label: "Comentarios",
        type: "string",
        render: (row: UniformCheck) => (
          <span className="text-xs text-slate-600 break-words whitespace-pre-wrap max-w-[220px] block">
            {row.observations || <span className="text-slate-300">—</span>}
          </span>
        ),
      },
      {
        key: "checkedBy",
        label: "Revisado por",
        type: "string",
        render: (row: UniformCheck) => (
          <span className="text-xs text-slate-600">
            {row.checkedBy
              ? `${row.checkedBy.name} ${row.checkedBy.lastName ?? ""}`.trim(): `#${row.checkedById}`}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: UniformCheck) => (
          <div className="flex items-center gap-2">
            <ITButton
              size="small"
              color="secondary"
              variant="outlined"
              className="!p-2"
              title="Editar esta verificación"
              onClick={() => navigate(`/uniform-check/capture?id=${row.id}`)}
            >
              <FaPen />
            </ITButton>
          </div>
        ),
      },
    ],
    [navigate]);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Verificación de Uniforme y Aseo
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Checklist independiente del turno: se aplica a cualquier guardia
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="w-64 relative">
            <ITInput
              placeholder="Buscar por nombre..."
              name="search"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              onBlur={() => {}}
              className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
            />
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2">
            <FaFilter className="text-slate-400 text-xs mr-2" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Todos</option>
              <option value="EXCELENTE">Excelente</option>
              <option value="MEDIO">Medio</option>
              <option value="MALO">Malo</option>
            </select>
          </div>
          <ITButton
            onClick={() => setRefreshKey((p) => p + 1)}
            color="secondary"
            variant="outlined"
            className="h-[42px] px-4 !rounded-xl border-slate-200"
            size="small"
          >
            <FaSync className="text-xs text-slate-500" />
            <span className="text-xs font-bold text-slate-500 ml-2">Refrescar</span>
          </ITButton>
          {isAdminOrShift && (
            <ITButton
              onClick={() => navigate("/uniform-check/capture")}
              color="primary"
              variant="filled"
              className="h-[42px] px-4 !rounded-xl flex items-center gap-2"
              size="small"
            >
              <FaPlus />
              <span className="text-xs font-bold">Nueva verificación</span>
            </ITButton>
          )}
        </div>
      </div>

      {!isAdminOrShift && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-4 text-sm">
          Módulo en modo lectura. La captura de uniforme solo está disponible para ADMIN/SHIFT.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={`${refreshKey}`}
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

export default UniformCheckPage;