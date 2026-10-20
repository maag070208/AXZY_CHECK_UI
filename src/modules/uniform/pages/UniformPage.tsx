import { ITBadget, ITButton, ITDataTable, ITDialog, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
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
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Uniforme"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Uniforme" }]}
      description="Checklist de uniformidad y aseo por elemento."
      icon={<FaTshirt size={20} />}
      iconColor="#065911"
      actions={
<ITButton onClick={() => navigate("/uniform/nuevo")} color="primary" size="md">
          <ITFlex align="center" gap={2}><FaPlus size={12} /> Nuevo Checklist
        </ITFlex></ITButton>
      }
    >

      <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          fetchData={memoizedFetch as any}
          title=""
          columns={[
            {
              key: "createdAt",
              label: "FECHA",
              type: "string",
              sortable: false,
              render: (row: any) => (
                <ITText as="span" className="text-xs font-bold text-slate-700">
                  {new Date(row.createdAt).toLocaleDateString("es-MX")}
                </ITText>
              ),
            },
            {
              key: "guard",
              label: "GUARDIA",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className="text-xs font-semibold text-slate-600">
                  {row.guard?.name} {row.guard?.lastName}
                </ITText>
              ),
            },
            {
              key: "evaluatedBy",
              label: "EVALUADO POR",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className="text-xs text-slate-500">
                  {row.evaluatedBy?.name} {row.evaluatedBy?.lastName}
                </ITText>
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
                <ITText as="span" className="text-xs text-slate-400 line-clamp-1">{row.notes || "—"}</ITText>
              ),
            },
            {
              key: "actions",
              label: "Acciones",
              type: "actions",
              actions: (row: any) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                  <ITButton
                    onClick={() => {
                      setDetail(row);
                      setDetailOpen(true);
                    }}
                    size="sm"
                    color="secondary"
                    variant="outlined"
                   
                    title="Ver detalles"
                  >
                    <FaEye />
                  </ITButton>
                </ITFlex>
              ),
            },
          ]}
        />
      </ITFlex>

      {/* Detalle de solo lectura */}
      <ITDialog isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de uniforme" className="!max-w-3xl">
        {detail && (
          <ITFlex direction="column" className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
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
                  <ITFlex direction="column" className="bg-slate-900 rounded-3xl p-6 text-white">
                    <ITFlex align="center" gap={4} className="flex items-center gap-4">
                      <ITFlex align="center" justify="center" className="w-14 h-14 rounded-full bg-white/15 text-white font-black flex items-center justify-center text-xl">
                        {init(detail.guard?.name, detail.guard?.lastName)}
                      </ITFlex>
                      <ITFlex direction="column" className="flex-1">
                        <ITText as="p" className="text-2xl font-black">
                          {detail.guard?.name} {detail.guard?.lastName}
                        </ITText>
                        <ITText as="p" className="text-white/70 text-sm font-medium capitalize">
                          {new Date(detail.createdAt).toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </ITText>
                      </ITFlex>
                    </ITFlex>

                    <ITFlex align="center" gap={5} className="flex items-center gap-5 mt-5 bg-white/10 rounded-2xl p-4">
                      <ITFlex direction="column" align="center" justify="center" className="w-20 h-20 rounded-full bg-white flex items-center justify-center flex-col">
                        <ITText as="p" className={`text-xl font-black ${passed ? "text-emerald-600" : "text-amber-600"}`}>{pct}%</ITText>
                        <ITText as="p" className="text-[9px] font-bold text-slate-400">
                          {ok}/{total} puntos
                        </ITText>
                      </ITFlex>
                      <ITFlex direction="column">
                        <ITText as="p" className={`text-sm font-black tracking-wide ${passed ? "text-emerald-300" : "text-amber-300"}`}>
                          {passed ? "CUMPLE" : "NO CUMPLE"}
                        </ITText>
                        <ITText as="p" className="text-white/70 text-xs mt-1">
                          {passed ? "Uniformidad y aseo en regla." : "Faltan elementos por revisar."}
                        </ITText>
                      </ITFlex>
                    </ITFlex>
                  </ITFlex>

                  {/* Quién evaluó */}
                  <ITFlex align="center" gap={3} className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4">
                    <ITFlex align="center" justify="center" className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black">
                      ✓
                    </ITFlex>
                    <ITText as="p" className="text-sm text-slate-600">
                      Evaluó:{" "}
                      <ITText as="span" className="font-bold text-slate-800">
                        {detail.evaluatedBy?.name} {detail.evaluatedBy?.lastName}
                      </ITText>
                    </ITText>
                  </ITFlex>

                  {/* Checklist */}
                  <ITFlex direction="column" className="bg-white border border-slate-200 rounded-2xl p-5">
                    <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Checklist de uniforme
                    </ITText>
                    <ITFlex direction="column" className="grid grid-cols-2 lg:grid-cols-3 gap-2">
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
                            <ITText as="span" className="flex-1 font-semibold">{item.label}</ITText>
                            {itemOk ? (
                              <ITText as="span" className="text-emerald-600 font-black">✓</ITText>
                            ) : (
                              <ITText as="span" className="text-slate-300 font-black">✕</ITText>
                            )}
                          </div>
                        );
                      })}
                    </ITFlex>
                  </ITFlex>

                  {/* Notas */}
                  {detail.notes && (
                    <ITFlex direction="column" className="bg-white border border-slate-200 rounded-2xl p-5">
                      <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas</ITText>
                      <ITText as="p" className="text-sm text-slate-700">{detail.notes}</ITText>
                    </ITFlex>
                  )}
                </>
              );
            })()}
          </ITFlex>
        )}
      </ITDialog>
    </ITPage>
  );
};

export default UniformPage;