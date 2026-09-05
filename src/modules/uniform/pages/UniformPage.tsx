import { ITBadget, ITButton, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import {
  FaBrush,
  FaCut,
  FaEye,
  FaHandPeace,
  FaHatCowboy,
  FaHeadphones,
  FaLink,
  FaMale,
  FaPen,
  FaPlus,
  FaShoePrints,
  FaSprayCan,
  FaTshirt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getPaginatedUniformChecks } from "../services/UniformService";

const CHECKLIST_ITEMS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "pantalon", label: "Pantalón", icon: FaMale },
  { key: "botas", label: "Botas", icon: FaShoePrints },
  { key: "cinturon", label: "Cinturón", icon: FaLink },
  { key: "camisa", label: "Camisa", icon: FaTshirt },
  { key: "pluma", label: "Pluma", icon: FaPen },
  { key: "gorra", label: "Gorra (solo recorrido)", icon: FaHatCowboy },
  { key: "unas", label: "Aseo: uñas", icon: FaHandPeace },
  { key: "orejas", label: "Aseo: orejas", icon: FaHeadphones },
  { key: "desodorante", label: "Aseo: desodorante / pulcro", icon: FaSprayCan },
  { key: "afeitado", label: "Afeitado", icon: FaCut },
  { key: "peinado", label: "Peinado", icon: FaBrush },
];

const UNIFORM_FIELDS = CHECKLIST_ITEMS.map((i) => i.key);

const complianceScore = (row: any) => {
  const ok = UNIFORM_FIELDS.filter((field) => row[field]).length;
  return { ok, total: UNIFORM_FIELDS.length };
};

/**
 * "4.3 Uniforme" — historial + detalle desde WEB. La captura ahora vive en
 * su propia pantalla (`/uniform/nuevo`).
 */
const UniformPage = () => {
  const navigate = useNavigate();
  const memoizedFetch = useCallback((params: any) => getPaginatedUniformChecks(params), []);
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FaTshirt className="text-[#065911]" />
            Uniforme
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Checklist de uniformidad y aseo por elemento.
          </p>
        </div>
        <ITButton onClick={() => navigate("/uniform/nuevo")} color="primary" className="!rounded-xl !bg-[#065911] hover:!bg-[#04400c] !flex !items-center !gap-2">
          <FaPlus size={12} /> Nuevo Checklist
        </ITButton>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
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
            {
              key: "actions",
              label: "Acciones",
              type: "actions",
              actions: (row: any) => (
                <div className="flex items-center gap-2">
                  <ITButton
                    onClick={() => {
                      setDetail(row);
                      setDetailOpen(true);
                    }}
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
      <ITDialog isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de uniforme" className="!max-w-3xl">
        {detail && (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {(() => {
              const ok = UNIFORM_FIELDS.filter((field) => detail[field]).length;
              const total = UNIFORM_FIELDS.length;
              const pct = Math.round((ok / total) * 100);
              const passed = pct >= 70;
              const init = (n?: string, l?: string | null) =>
                `${(n || "?").charAt(0)}${(l || "").charAt(0) || ""}`.toUpperCase();

              return (
                <>
                  {/* Banner */}
                  <div className="bg-slate-900 rounded-3xl p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-white/15 text-white font-black flex items-center justify-center text-xl">
                        {init(detail.guard?.name, detail.guard?.lastName)}
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black">
                          {detail.guard?.name} {detail.guard?.lastName}
                        </p>
                        <p className="text-white/70 text-sm font-medium capitalize">
                          {new Date(detail.createdAt).toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 mt-5 bg-white/10 rounded-2xl p-4">
                      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center flex-col">
                        <p className={`text-xl font-black ${passed ? "text-emerald-600" : "text-amber-600"}`}>{pct}%</p>
                        <p className="text-[9px] font-bold text-slate-400">
                          {ok}/{total} puntos
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm font-black tracking-wide ${passed ? "text-emerald-300" : "text-amber-300"}`}>
                          {passed ? "CUMPLE" : "NO CUMPLE"}
                        </p>
                        <p className="text-white/70 text-xs mt-1">
                          {passed ? "Uniformidad y aseo en regla." : "Faltan elementos por revisar."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quién evaluó */}
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black">
                      ✓
                    </div>
                    <p className="text-sm text-slate-600">
                      Evaluó:{" "}
                      <span className="font-bold text-slate-800">
                        {detail.evaluatedBy?.name} {detail.evaluatedBy?.lastName}
                      </span>
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Checklist de uniforme
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {CHECKLIST_ITEMS.map((item) => {
                        const itemOk = !!detail[item.key];
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                              itemOk
                                ? "bg-white border-slate-200 text-slate-700"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}
                          >
                            <item.icon className={itemOk ? "text-emerald-600" : "text-slate-400"} />
                            <span className="flex-1 font-semibold">{item.label}</span>
                            {itemOk ? (
                              <span className="text-emerald-600 font-black">✓</span>
                            ) : (
                              <span className="text-slate-300 font-black">✕</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notas */}
                  {detail.notes && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas</p>
                      <p className="text-sm text-slate-700">{detail.notes}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </ITDialog>
    </div>
  );
};

export default UniformPage;