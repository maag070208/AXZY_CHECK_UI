import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDataTable, ITDialog, ITInput, ITSelect, ITSlideToggle } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaTshirt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getUsers, User } from "../../users/services/UserService";
import { createUniformCheck, getPaginatedUniformChecks } from "../services/UniformService";

const CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: "pantalon", label: "Pantalón" },
  { key: "botas", label: "Botas" },
  { key: "cinturon", label: "Cinturón" },
  { key: "camisa", label: "Camisa" },
  { key: "pluma", label: "Pluma" },
  { key: "gorra", label: "Gorra (solo recorrido)" },
  { key: "unas", label: "Aseo: uñas" },
  { key: "orejas", label: "Aseo: orejas" },
  { key: "desodorante", label: "Aseo: desodorante / pulcro" },
  { key: "afeitado", label: "Afeitado" },
  { key: "peinado", label: "Peinado" },
];

const UNIFORM_FIELDS = CHECKLIST_ITEMS.map((i) => i.key);

const DEFAULT_CHECKLIST: Record<string, boolean> = UNIFORM_FIELDS.reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {},
);

const noop = () => {};

const complianceScore = (row: any) => {
  const ok = UNIFORM_FIELDS.filter((field) => row[field]).length;
  return { ok, total: UNIFORM_FIELDS.length };
};

/**
 * "4.3 Uniforme" — historial + captura desde WEB. Antes solo se podía
 * llenar desde la APP; este formulario usa exactamente el mismo endpoint
 * (`POST /uniform`) así que el jefe operativo también puede evaluar a un
 * guardia desde escritorio.
 */
const UniformPage = () => {
  const dispatch = useDispatch();
  const memoizedFetch = useCallback((params: any) => getPaginatedUniformChecks(params), []);
  const [refreshKey, setRefreshKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [guards, setGuards] = useState<User[]>([]);
  const [guardId, setGuardId] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(DEFAULT_CHECKLIST);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    getUsers().then((res) => {
      if (res.success && res.data) {
        setGuards(res.data.filter((u) => u.role?.name === "GUARD"));
      }
    });
  }, []);

  const resetForm = () => {
    setGuardId("");
    setChecklist(DEFAULT_CHECKLIST);
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!guardId) {
      dispatch(showToast({ message: "Selecciona al guardia a evaluar", type: "warning" }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await createUniformCheck({
        guardId: Number(guardId),
        ...(checklist as any),
        notes: notes || undefined,
      });

      if (res.success) {
        dispatch(showToast({ message: "Checklist de uniforme registrado", type: "success" }));
        setCreateOpen(false);
        resetForm();
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo registrar", type: "error" }));
      }
    } catch (error) {
      const result = error as { messages?: string[] };
      dispatch(showToast({ message: result?.messages?.[0] || "Error de conexión", type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

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
        <ITButton onClick={() => setCreateOpen(true)} color="primary" className="!rounded-xl !bg-[#065911] hover:!bg-[#04400c] !flex !items-center !gap-2">
          <FaPlus size={12} /> Nuevo Checklist
        </ITButton>
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

      {/* Nuevo checklist de uniforme */}
      <ITDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Checklist de Uniforme">
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <ITSelect
            name="guard"
            label="Guardia a evaluar"
            placeholder="Selecciona un guardia..."
            options={guards.map((g) => ({ id: String(g.id), value: `${g.name} ${g.lastName ?? ""}` }))}
            labelField="value"
            valueField="id"
            value={guardId}
            onChange={(e: any) => setGuardId(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Checklist</p>
            <div className="flex gap-2">
              <button
                onClick={() => setChecklist(UNIFORM_FIELDS.reduce((acc, key) => ({ ...acc, [key]: true }), {}))}
                className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wide hover:bg-emerald-100"
              >
                Todo bien
              </button>
              <button
                onClick={() => setChecklist(DEFAULT_CHECKLIST)}
                className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full uppercase tracking-wide hover:bg-slate-200"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                <ITSlideToggle
                  size="sm"
                  isOn={checklist[item.key]}
                  onToggle={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))}
                />
              </div>
            ))}
          </div>

          <ITInput name="notes" type="textarea" label="Notas" value={notes} onChange={(e: any) => setNotes(e.target.value)} onBlur={noop} />

          <div className="flex justify-end gap-3 pt-2">
            <ITButton variant="outlined" color="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
              className="!bg-[#065911] hover:!bg-[#04400c]"
            >
              {submitting ? "Enviando..." : "Registrar Checklist"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default UniformPage;
