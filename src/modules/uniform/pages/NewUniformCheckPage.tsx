import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITSearchSelect, ITSlideToggle } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBrush,
  FaCut,
  FaHandPeace,
  FaHatCowboy,
  FaHeadphones,
  FaLink,
  FaMale,
  FaPen,
  FaShoePrints,
  FaSprayCan,
  FaTshirt,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUsers, User } from "../../users/services/UserService";
import { createUniformCheck } from "../services/UniformService";

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

const DEFAULT_CHECKLIST: Record<string, boolean> = UNIFORM_FIELDS.reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {},
);

const noop = () => {};

/**
 * "4.3 Uniforme" — captura desde WEB en pantalla completa (antes era un
 * modal). Usa el mismo endpoint (`POST /uniform`) que la APP.
 */
const NewUniformCheckPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
        navigate("/uniform");
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/uniform")}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
              title="Volver"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <FaTshirt className="text-[#065911]" />
                Nuevo Checklist de Uniforme
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Evaluación de uniformidad y aseo por elemento.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">1. Guardia</p>
            <ITSearchSelect
              name="guard"
              label="Guardia a evaluar"
              placeholder="Selecciona un guardia..."
              options={guards.map((g) => ({ label: `${g.name} ${g.lastName ?? ""}`, value: String(g.id) }))}
              value={guardId}
              onChange={(val) => setGuardId(String(val))}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">2. Checklist</p>
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
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-2.5">
                    <item.icon className="text-slate-400" />
                    {item.label}
                  </span>
                  <ITSlideToggle
                    size="sm"
                    isOn={checklist[item.key]}
                    onToggle={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">3. Notas</p>
            <ITInput name="notes" type="textarea" label="Notas (opcional)" value={notes} onChange={(e: any) => setNotes(e.target.value)} onBlur={noop} />
          </div>

          <div className="flex justify-end gap-3 pb-10">
            <ITButton variant="outlined" color="secondary" onClick={() => navigate("/uniform")}>
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
              className="!bg-[#065911] hover:!bg-[#04400c] !px-8"
            >
              {submitting ? "Enviando..." : "Registrar Checklist"}
            </ITButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewUniformCheckPage;