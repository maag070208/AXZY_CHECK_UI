import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITCard, ITFlex, ITGrid, ITPage, ITProgress, ITSearchSelect, ITSlideToggle, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaBrush, FaCut, FaHandPeace, FaHatCowboy, FaHeadphones,
  FaLink, FaMale, FaPen, FaShoePrints, FaSprayCan, FaTshirt,
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
      if (res.success && res.data) setGuards(res.data.filter((u) => u.role?.name === "GUARD"));
    });
  }, []);

  const completed = UNIFORM_FIELDS.filter((key) => checklist[key]).length;
  const pct = Math.round((completed / UNIFORM_FIELDS.length) * 100);
  const selectedGuard = guards.find((g) => String(g.id) === guardId);

  const handleSubmit = async () => {
    if (!guardId) {
      dispatch(showToast({ message: "Selecciona al guardia a evaluar", type: "warning" }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await createUniformCheck({ guardId: Number(guardId), ...(checklist as any), notes: notes || undefined });
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
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      noPadding
      backAction={() => navigate("/uniform")}
      title="Nuevo checklist de uniforme"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Uniforme", href: "#/uniform" }, { label: "Nuevo checklist" }]}
      description="Evaluación de uniformidad y aseo por elemento."
      icon={<FaTshirt size={20} />}
    >
      <ITGrid container columns={12} spacing={5} className="w-full pb-10 pt-5">
        <ITGrid item xs={12} lg={7}>
          <ITFlex direction="column" gap={5}>
            <ITCard title="Guardia" className="rounded-3xl" contentClassName="space-y-3 p-5!">
              <ITSearchSelect
                name="guard"
                label="Guardia a evaluar"
                placeholder="Selecciona un guardia..."
                options={guards.map((g) => ({ label: `${g.name} ${g.lastName ?? ""}`, value: String(g.id) }))}
                value={guardId}
                onChange={(val) => setGuardId(String(val))}
              />
              {selectedGuard && (
                <ITFlex align="center" gap={3} className="rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/20">
                  <ITFlex align="center" justify="center" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-black text-white">
                    {(selectedGuard.name || "?").charAt(0)}{(selectedGuard.lastName || "").charAt(0)}
                  </ITFlex>
                  <ITFlex direction="column" className="min-w-0 flex-1">
                    <ITText as="p" className="truncate text-sm font-bold text-emerald-950 dark:text-emerald-100">
                      {selectedGuard.name} {selectedGuard.lastName}
                    </ITText>
                    <ITText as="p" className="text-[10px] text-emerald-700/70">
                      @{selectedGuard.username} · {selectedGuard.role?.value || selectedGuard.role?.name}
                    </ITText>
                  </ITFlex>
                  <ITFlex direction="column" align="end">
                    <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-emerald-700/60">Turno</ITText>
                    <ITText as="p" className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                      {selectedGuard.schedule?.name || "Sin turno"}
                    </ITText>
                    {selectedGuard.schedule && (
                      <ITText as="p" className="text-[10px] text-emerald-700/70">
                        {selectedGuard.schedule.startTime} – {selectedGuard.schedule.endTime}
                      </ITText>
                    )}
                  </ITFlex>
                </ITFlex>
              )}
            </ITCard>

            <ITCard title="Checklist" className="rounded-3xl" contentClassName="space-y-3 p-5!">
              <ITFlex align="center" justify="between" gap={2} wrap="wrap" className="mb-4">
                <ITText as="p" className="text-xs text-slate-500">Marca los elementos que el guardia cumple.</ITText>
                <ITFlex align="center" gap={2}>
                  <ITButton variant="text" color="success" size="sm" onClick={() => setChecklist(UNIFORM_FIELDS.reduce((acc, key) => ({ ...acc, [key]: true }), {}))}>Todo bien</ITButton>
                  <ITButton variant="text" color="secondary" size="sm" onClick={() => setChecklist(DEFAULT_CHECKLIST)}>Limpiar</ITButton>
                </ITFlex>
              </ITFlex>

              <ITGrid container columns={12} spacing={2}>
                {CHECKLIST_ITEMS.map((item) => {
                  const ok = checklist[item.key];
                  return (
                    <ITGrid item xs={12} sm={6} key={item.key}>
                      <ITFlex align="center" gap={2} className={`rounded-xl border p-3 ${ok ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50/70"}`}>
                        <ITFlex align="center" justify="center" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ok ? "bg-emerald-600 text-white" : "bg-white text-slate-400 dark:bg-slate-800"}`}>
                          <item.icon className="text-[12px]" />
                        </ITFlex>
                        <ITText as="span" className={`min-w-0 flex-1 text-xs font-semibold ${ok ? "text-emerald-900" : "text-slate-600 dark:text-slate-300"}`}>{item.label}</ITText>
                        <ITSlideToggle size="sm" isOn={ok} onToggle={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))} ariaLabel={item.label} />
                      </ITFlex>
                    </ITGrid>
                  );
                })}
              </ITGrid>
            </ITCard>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={5}>
          <ITFlex direction="column" gap={5}>
            <ITCard title="Resumen" className="rounded-3xl" contentClassName="space-y-4 p-5!">
              <ITFlex align="center" justify="between" gap={2}>
                <ITFlex direction="column">
                  <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cumplimiento</ITText>
                  <ITText as="p" className="text-3xl font-black text-slate-900 dark:text-white">{pct}%</ITText>
                </ITFlex>
                <ITBadget color={pct >= 70 ? "success" : "warning"} variant="filled" size="sm">
                  {pct >= 70 ? "Cumple" : "No cumple"}
                </ITBadget>
              </ITFlex>
              <ITProgress value={completed} max={UNIFORM_FIELDS.length} color={pct >= 70 ? "success" : "warning"} size="sm" />
              <ITFlex justify="between">
                <ITText as="span" className="text-xs text-slate-500">Elementos cumplidos</ITText>
                <ITText as="span" className="text-xs font-bold text-slate-800 dark:text-slate-100">{completed}/{UNIFORM_FIELDS.length}</ITText>
              </ITFlex>
              <ITFlex direction="column" gap={2}>
                <ITButton color="primary" size="md" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Enviando..." : "Registrar checklist"}
                </ITButton>
                <ITButton variant="outlined" color="secondary" size="md" onClick={() => navigate("/uniform")}>Cancelar</ITButton>
              </ITFlex>
            </ITCard>

            <ITCard title="Notas" className="rounded-3xl" contentClassName="p-5!">
              <ITTextarea name="notes" label="Notas (opcional)" rows={4} value={notes} onChange={(value) => setNotes(value)} placeholder="Observaciones sobre la uniformidad..." />
            </ITCard>
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
};

export default NewUniformCheckPage;
