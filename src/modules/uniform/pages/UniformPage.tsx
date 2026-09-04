import { ITBadget, ITDataTable } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import { FaTshirt } from "react-icons/fa";
import { getPaginatedUniformChecks } from "../services/UniformService";

const UNIFORM_FIELDS = [
  "pantalon",
  "botas",
  "cinturon",
  "camisa",
  "pluma",
  "gorra",
  "unas",
  "orejas",
  "desodorante",
  "afeitado",
  "peinado",
];

const complianceScore = (row: any) => {
  const ok = UNIFORM_FIELDS.filter((field) => row[field]).length;
  return { ok, total: UNIFORM_FIELDS.length };
};

/**
 * "4.3 Uniforme" — historial de checklist de uniformidad y aseo por
 * elemento, capturado desde la APP por el jefe operativo.
 */
const UniformPage = () => {
  const memoizedFetch = useCallback((params: any) => getPaginatedUniformChecks(params), []);
  const [refreshKey] = useState(0);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <FaTshirt className="text-[#065911]" />
          Uniforme
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Checklist de uniformidad y aseo por elemento.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={10}
          title=""
          columns={[
            {
              key: "createdAt",
              label: "FECHA",
              type: "string",
              sortable: true,
              render: (row: any) => (
                <span className="text-xs font-bold text-slate-700">
                  {new Date(row.createdAt).toLocaleDateString("es-MX")}
                </span>
              ),
            },
            {
              key: "guard",
              label: "GUARDIA",
              type: "string",
              render: (row: any) => (
                <span className="text-xs font-semibold text-slate-600">
                  {row.guard?.name} {row.guard?.lastName}
                </span>
              ),
            },
            {
              key: "evaluatedBy",
              label: "EVALUADO POR",
              type: "string",
              render: (row: any) => (
                <span className="text-xs text-slate-500">
                  {row.evaluatedBy?.name} {row.evaluatedBy?.lastName}
                </span>
              ),
            },
            {
              key: "score",
              label: "CUMPLIMIENTO",
              type: "string",
              render: (row: any) => {
                const { ok, total } = complianceScore(row);
                const color = ok === total ? "success" : ok >= total * 0.7 ? "primary" : "danger";
                return <ITBadget label={`${ok}/${total}`} color={color} variant="filled" />;
              },
            },
            {
              key: "notes",
              label: "NOTAS",
              type: "string",
              render: (row: any) => (
                <span className="text-xs text-slate-400 line-clamp-1">{row.notes || "—"}</span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default UniformPage;
