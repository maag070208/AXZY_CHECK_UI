import { ITBadget, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import { FaSwatchbook } from "react-icons/fa";
import { getPaginatedShiftHandovers, getShiftHandoverDetail } from "../services/ShiftHandoverService";

const CHECKLIST_LABELS: { key: string; label: string }[] = [
  { key: "checklistPhones", label: "Teléfonos" },
  { key: "checklistTablet", label: "Tablet" },
  { key: "checklistRadios", label: "Radios" },
  { key: "checklistKeys", label: "Llaves" },
  { key: "checklistLogbook", label: "Bitácora" },
  { key: "checklistConsignas", label: "Consignas" },
];

/**
 * "4.2 Entrega de turno" — vista de administración (solo lectura) de los
 * reportes de cambio de turno capturados desde la APP por el jefe operativo.
 */
const ShiftHandoverPage = () => {
  const [refreshKey] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const memoizedFetch = useCallback((params: any) => getPaginatedShiftHandovers(params), []);

  const openDetail = async (id: number) => {
    const res = await getShiftHandoverDetail(id);
    if (res.success) {
      setDetail(res.data);
      setDetailOpen(true);
    }
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <FaSwatchbook className="text-[#065911]" />
          Entrega de Turno
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Historial de reportes de cambio de turno (caseta, elementos y checklist de verificación).
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
              key: "handoverDate",
              label: "FECHA",
              type: "string",
              render: (row: any) => (
                <span className="text-xs font-bold text-slate-700">
                  {new Date(row.handoverDate).toLocaleDateString("es-MX")}
                </span>
              ),
            },
            {
              key: "shiftType",
              label: "TURNO",
              type: "string",
              render: (row: any) => (
                <ITBadget
                  label={row.shiftType === "NOCTURNO" ? "Nocturno" : "Matutino"}
                  color={row.shiftType === "NOCTURNO" ? "primary" : "success"}
                  variant="filled"
                />
              ),
            },
            {
              key: "createdBy",
              label: "JEFE OPERATIVO",
              type: "string",
              render: (row: any) => (
                <span className="text-xs font-semibold text-slate-600">
                  {row.createdBy?.name} {row.createdBy?.lastName}
                </span>
              ),
            },
            {
              key: "elements",
              label: "ELEMENTOS",
              type: "number",
              render: (row: any) => <span className="text-xs">{row._count?.elements || 0}</span>,
            },
            {
              key: "reportedToAdmin",
              label: "NOVEDADES REPORTADAS",
              type: "string",
              render: (row: any) => (
                <ITBadget
                  label={row.reportedToAdmin ? "Sí" : "No"}
                  color={row.reportedToAdmin ? "success" : "danger"}
                  variant="filled"
                />
              ),
            },
            {
              key: "actions",
              label: "",
              type: "actions",
              actions: (row: any) => (
                <button
                  onClick={() => openDetail(row.id)}
                  className="text-xs font-bold text-[#065911] hover:underline"
                >
                  Ver detalle
                </button>
              ),
            },
          ]}
        />
      </div>

      <ITDialog isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de entrega de turno">
        {detail && (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Caseta</p>
              <p className="text-sm text-slate-700">Credenciales: {detail.credentialsCount ?? "—"}</p>
              <p className="text-sm text-slate-700">Tarjetones: {detail.tarjetonesCount ?? "—"}</p>
              <p className="text-sm text-slate-700">Novedades: {detail.novedades || "Sin novedades"}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Verificación</p>
              <div className="grid grid-cols-2 gap-2">
                {CHECKLIST_LABELS.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${detail[item.key] ? "bg-emerald-500" : "bg-slate-200"}`}
                    />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Elementos ({detail.elements?.length || 0})
              </p>
              <div className="space-y-2">
                {(detail.elements || []).map((el: any) => (
                  <div key={el.id} className="border border-slate-100 rounded-lg px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-700">
                      {el.guard?.name} {el.guard?.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Entrada: {el.entryTime} · {el.punctual ? "Puntual" : "Con retraso"}
                    </p>
                    {el.observations && <p className="text-xs text-slate-500 mt-1">{el.observations}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </ITDialog>
    </div>
  );
};

export default ShiftHandoverPage;
