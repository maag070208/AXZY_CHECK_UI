import { ITBadget, ITButton, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import {
  FaBook,
  FaBroadcastTower,
  FaClipboardList,
  FaEye,
  FaKey,
  FaPhone,
  FaPlus,
  FaSwatchbook,
  FaTabletAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getPaginatedShiftHandovers,
  getShiftHandoverDetail,
} from "../services/ShiftHandoverService";

const CHECKLIST_LABELS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "checklistPhones", label: "Teléfonos", icon: FaPhone },
  { key: "checklistTablet", label: "Tablet", icon: FaTabletAlt },
  { key: "checklistRadios", label: "Radios", icon: FaBroadcastTower },
  { key: "checklistKeys", label: "Llaves", icon: FaKey },
  { key: "checklistLogbook", label: "Bitácora", icon: FaBook },
  { key: "checklistConsignas", label: "Consignas", icon: FaClipboardList },
];

/**
 * "4.2 Entrega de turno" — historial + detalle desde WEB. La captura ahora
 * vive en su propia pantalla (`/shift-handover/nuevo`).
 */
const ShiftHandoverPage = () => {
  const navigate = useNavigate();
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FaSwatchbook className="text-[#065911]" />
            Entrega de Turno
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Historial de reportes de cambio de turno (caseta, elementos y checklist de verificación).
          </p>
        </div>
        <ITButton onClick={() => navigate("/shift-handover/nuevo")} color="primary" className="!rounded-xl !bg-[#065911] hover:!bg-[#04400c] !flex !items-center !gap-2">
          <FaPlus size={12} /> Nueva Entrega de Turno
        </ITButton>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
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
              label: "Acciones",
              type: "actions",
              actions: (row: any) => (
                <div className="flex items-center gap-2">
                  <ITButton
                    onClick={() => openDetail(row.id)}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    className="!p-2"
                    title="Ver detalles"
                  >
                    <FaEye />
                  </ITButton>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Detalle de solo lectura */}
      <ITDialog isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de entrega de turno" className="!max-w-3xl">
        {detail && (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {(() => {
              const isNocturno = detail.shiftType === "NOCTURNO";
              const reported = detail.reportedToAdmin;
              const elements = detail.elements || [];
              const punctualCount = elements.filter((e: any) => e.punctual).length;
              const init = (n?: string, l?: string | null) =>
                `${(n || "?").charAt(0)}${(l || "").charAt(0) || ""}`.toUpperCase();

              const stat = (value: any, label: string, color: string) => (
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-sm font-black flex-shrink-0`}>
                    {value ?? "—"}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
              );

              return (
                <>
                  {/* Banner */}
                  <div
                    className={`rounded-3xl p-6 text-white ${
                      isNocturno ? "bg-slate-900" : "bg-[#065911]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">
                        {isNocturno ? "🌙" : "☀️"}
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black">Turno {isNocturno ? "Nocturno" : "Matutino"}</p>
                        <p className="text-white/75 text-sm font-medium capitalize">
                          {new Date(detail.handoverDate).toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 mt-5 rounded-full px-4 py-1.5 text-xs font-black ${
                        reported ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {reported ? "✓ Novedades reportadas" : "⚠ Novedades NO reportadas"}
                    </div>
                  </div>

                  {/* Jefe operativo */}
                  <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4">
                    <div className="w-11 h-11 rounded-full bg-[#065911] text-white font-black flex items-center justify-center">
                      {init(detail.createdBy?.name, detail.createdBy?.lastName)}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jefe Operativo</p>
                      <p className="text-sm font-bold text-slate-800">
                        {detail.createdBy?.name} {detail.createdBy?.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {stat(elements.length, "Elementos", "bg-emerald-100 text-[#065911]")}
                    {stat(punctualCount, "Puntuales", "bg-green-100 text-green-700")}
                    {stat(detail.credentialsCount ?? "—", "Credenciales", "bg-sky-100 text-sky-700")}
                    {stat(detail.tarjetonesCount ?? "—", "Tarjetones", "bg-amber-100 text-amber-700")}
                  </div>

                  {/* Caseta */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Caseta</p>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-800">Credenciales:</span> {detail.credentialsCount ?? "—"}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-800">Tarjetones:</span> {detail.tarjetonesCount ?? "—"}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-800">Novedades:</span>{" "}
                        {detail.novedades || "Sin novedades"}
                      </p>
                    </div>
                  </div>

                  {/* Verificación */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Verificación de entrega
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {CHECKLIST_LABELS.map((item) => {
                        const ok = !!detail[item.key];
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                              ok
                                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}
                          >
                            <item.icon className={ok ? "text-emerald-600" : "text-slate-400"} />
                            <span className="flex-1 font-semibold">{item.label}</span>
                            {ok ? "✓" : "✕"}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Elementos */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Elementos ({elements.length})
                    </p>
                    {elements.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Sin elementos registrados.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {elements.map((el: any) => (
                          <div
                            key={el.id}
                            className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3"
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#065911] font-black flex items-center justify-center text-xs border border-emerald-100">
                              {init(el.guard?.name, el.guard?.lastName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800">
                                {el.guard?.name} {el.guard?.lastName}
                              </p>
                              <p className="text-xs text-slate-400">
                                Entrada: {el.entryTime}
                                {el.observations ? ` · ${el.observations}` : ""}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                                el.punctual ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {el.punctual ? "Puntual" : "Retraso"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </ITDialog>
    </div>
  );
};

export default ShiftHandoverPage;