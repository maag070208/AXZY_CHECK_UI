import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDatePicker, ITFlex, ITInput, ITSearchSelect, ITSlideToggle, ITText, ITTimePicker } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBook,
  FaBroadcastTower,
  FaClipboardList,
  FaClock,
  FaKey,
  FaPhone,
  FaPlus,
  FaSwatchbook,
  FaTabletAlt,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUsers, User } from "../../users/services/UserService";
import {
  createShiftHandover,
  ICreateShiftHandoverElement,
} from "../services/ShiftHandoverService";

const CHECKLIST_LABELS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "checklistPhones", label: "Teléfonos", icon: FaPhone },
  { key: "checklistTablet", label: "Tablet", icon: FaTabletAlt },
  { key: "checklistRadios", label: "Radios", icon: FaBroadcastTower },
  { key: "checklistKeys", label: "Llaves", icon: FaKey },
  { key: "checklistLogbook", label: "Bitácora", icon: FaBook },
  { key: "checklistConsignas", label: "Consignas", icon: FaClipboardList },
];

type ChecklistState = Record<
  "checklistPhones" | "checklistTablet" | "checklistRadios" | "checklistKeys" | "checklistLogbook" | "checklistConsignas",
  boolean
>;

const DEFAULT_CHECKLIST: ChecklistState = {
  checklistPhones: false,
  checklistTablet: false,
  checklistRadios: false,
  checklistKeys: false,
  checklistLogbook: false,
  checklistConsignas: false,
};

const defaultShiftType = (): "MATUTINO" | "NOCTURNO" => (new Date().getHours() >= 14 ? "MATUTINO" : "NOCTURNO");

const noop = () => { };

/**
 * "4.2 Entrega de turno" — captura desde WEB en pantalla completa
 * (antes era un modal). Usa el mismo endpoint (`POST /shift-handover`)
 * que la APP.
 */
const NewShiftHandoverPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [guards, setGuards] = useState<User[]>([]);

  const [shiftType, setShiftType] = useState<"MATUTINO" | "NOCTURNO">(defaultShiftType());
  const [handoverDate, setHandoverDate] = useState<any>(new Date());
  const [credentialsCount, setCredentialsCount] = useState("");
  const [tarjetonesCount, setTarjetonesCount] = useState("");
  const [novedades, setNovedades] = useState("");
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_CHECKLIST);
  const [reportedToAdmin, setReportedToAdmin] = useState(false);
  const [elements, setElements] = useState<(ICreateShiftHandoverElement & { guardLabel: string })[]>([]);
  const [pickerGuardId, setPickerGuardId] = useState("");
  const [pickerEntryTime, setPickerEntryTime] = useState("");

  useEffect(() => {
    getUsers().then((res) => {
      if (res.success && res.data) {
        setGuards(res.data.filter((u) => u.role?.name === "GUARD"));
      }
    });
  }, []);

  const handleAddElement = () => {
    if (!pickerGuardId) {
      dispatch(showToast({ message: "Selecciona un guardia", type: "warning" }));
      return;
    }
    if (!pickerEntryTime.trim()) {
      dispatch(showToast({ message: "Indica la hora de entrada", type: "warning" }));
      return;
    }
    const guard = guards.find((g) => String(g.id) === pickerGuardId);
    setElements((prev) => [
      ...prev,
      {
        guardId: Number(pickerGuardId),
        guardLabel: `${guard?.name ?? ""} ${guard?.lastName ?? ""}`.trim(),
        entryTime: pickerEntryTime.trim(),
        punctual: true,
        observations: "",
      },
    ]);
    setPickerGuardId("");
    setPickerEntryTime("");
  };

  const handleRemoveElement = (index: number) => {
    setElements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reportedToAdmin) {
      dispatch(
        showToast({
          message: "Debes confirmar que se reportaron las novedades a la administración",
          type: "warning",
        }),
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await createShiftHandover({
        shiftType,
        handoverDate: dayjs(handoverDate).format("YYYY-MM-DD"),
        credentialsCount: credentialsCount ? Number(credentialsCount) : undefined,
        tarjetonesCount: tarjetonesCount ? Number(tarjetonesCount) : undefined,
        novedades: novedades || undefined,
        ...checklist,
        reportedToAdmin,
        elements: elements.map(({ guardId, entryTime, punctual, observations }) => ({
          guardId,
          entryTime,
          punctual,
          observations: observations || undefined,
        })),
      });

      if (res.success) {
        dispatch(showToast({ message: "Entrega de turno registrada", type: "success" }));
        navigate("/shift-handover");
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
    <ITFlex direction="column" className="p-6 bg-[#f8fafc] min-h-screen">
      <ITFlex direction="column" className="max-w-7xl mx-auto">
        <ITFlex align="center" justify="between" gap={4} className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <ITFlex align="center" gap={3} className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shift-handover")}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
              title="Volver"
            >
              <FaArrowLeft />
            </button>
            <ITFlex direction="column">
              <ITText as="h1" className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <FaSwatchbook className="text-[#065911]" />
                Nueva Entrega de Turno
              </ITText>
              <ITText as="p" className="text-slate-500 text-sm mt-1">
                Reporte de cambio de turno: caseta, elementos y verificación.
              </ITText>
            </ITFlex>
          </ITFlex>
        </ITFlex>

        <ITFlex direction="column" className="space-y-6">
          <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <ITText as="p" className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">1. Turno</ITText>
            <ITFlex gap={2} className="flex gap-2">
              {(["NOCTURNO", "MATUTINO"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setShiftType(type)}
                  className={`flex-1 text-sm font-bold px-4 py-2.5 rounded-xl border transition-colors ${shiftType === type
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  {type === "NOCTURNO" ? "Nocturno" : "Matutino"}
                </button>
              ))}
            </ITFlex>
            <ITFlex direction="column" className="mt-4">
              <ITDatePicker name="handoverDate" value={handoverDate} onChange={(e: any) => setHandoverDate(e.target.value)} />
            </ITFlex>
          </ITFlex>

          <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <ITText as="p" className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">2. Caseta</ITText>
            <ITFlex direction="column" className="grid grid-cols-2 gap-3">
              <ITInput
                name="credentialsCount"
                type="number"
                label="No. de credenciales"
                value={credentialsCount}
                onChange={(e: any) => setCredentialsCount(e.target.value)}
                onBlur={noop}
              />
              <ITInput
                name="tarjetonesCount"
                type="number"
                label="No. de tarjetones"
                value={tarjetonesCount}
                onChange={(e: any) => setTarjetonesCount(e.target.value)}
                onBlur={noop}
              />
            </ITFlex>
            <ITFlex direction="column" className="mt-3">
              <ITInput
                name="novedades"
                type="textarea"
                label="Novedades"
                value={novedades}
                onChange={(e: any) => setNovedades(e.target.value)}
                onBlur={noop}
              />
            </ITFlex>
          </ITFlex>

          <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <ITText as="p" className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">3. Registro por elemento</ITText>

            <ITFlex direction="column" className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-4">
              <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-end">
                <ITFlex direction="column">
                  <ITSearchSelect
                    name="pickerGuard"
                    label="Guardia"
                    placeholder="Selecciona un guardia..."
                    options={guards.map((g) => ({ label: `${g.name} ${g.lastName ?? ""}`, value: String(g.id) }))}
                    value={pickerGuardId}
                    onChange={(val) => setPickerGuardId(String(val))}
                  />
                </ITFlex>
                <ITTimePicker
                  name="pickerEntryTime"
                  label="Hora de entrada"
                  placeholder="07:00"
                  value={pickerEntryTime}
                  onChange={(e) => setPickerEntryTime(e.target.value)}
                  onBlur={noop}
                />
                <ITButton
                  onClick={handleAddElement}
                  color="primary"
                  variant="filled"
                 
                >
                  <ITFlex align="center" gap={2} className="flex items-center gap-2">
                    <FaPlus size={12} /> Agregar

                  </ITFlex>
                </ITButton>
              </ITFlex>
            </ITFlex>

            {elements.length > 0 ? (
              <ITFlex direction="column" className="space-y-2">
                {elements.map((el, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                    <ITFlex align="center" justify="center" className="w-9 h-9 rounded-full bg-emerald-50 text-[#065911] font-bold flex items-center justify-center text-xs border border-emerald-100 flex-shrink-0">
                      {el.guardLabel
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join("") || "—"}
                    </ITFlex>
                    <ITFlex direction="column" className="flex-1 min-w-0">
                      <ITText as="p" className="text-xs font-bold text-slate-700 truncate">{el.guardLabel}</ITText>
                      <ITText as="p" className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <FaClock className="text-slate-300" /> Entrada: {el.entryTime}
                      </ITText>
                    </ITFlex>
                    <ITFlex align="center" gap={2} className="flex items-center gap-2">
                      <ITText as="span" className="text-[9px] font-bold text-slate-400 uppercase">Puntual</ITText>
                      <ITSlideToggle
                        size="sm"
                        isOn={el.punctual}
                        onToggle={(v) =>
                          setElements((prev) => prev.map((e, i) => (i === index ? { ...e, punctual: v } : e)))
                        }
                      />
                    </ITFlex>
                    <ITButton
                      variant="icon-only"
                      color="gray"
                      size="sm"
                      onClick={() => handleRemoveElement(index)}
                      icon={<FaTrash size={12} />}
                     
                    />
                  </div>
                ))}
              </ITFlex>
            ) : (
              <ITText as="p" className="text-[11px] text-slate-400 italic text-center py-3 font-medium tracking-wide bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aún no se registran elementos. Agrega los guardias con su hora de entrada.
              </ITText>
            )}
          </ITFlex>

          <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <ITText as="p" className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">4. Verificación de entrega de turno</ITText>
            <ITFlex direction="column" className="bg-slate-50 rounded-xl divide-y divide-slate-100">
              {CHECKLIST_LABELS.map((item) => (
                <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
                  <ITText as="span" className="text-sm font-semibold text-slate-700 flex items-center gap-2.5">
                    <item.icon className="text-slate-400" />
                    {item.label}
                  </ITText>
                  <ITSlideToggle
                    size="sm"
                    isOn={checklist[item.key as keyof ChecklistState]}
                    onToggle={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </ITFlex>

            <ITFlex align="center" gap={3} className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3 mt-4">
              <ITText as="span" className="flex-1 text-sm font-semibold text-emerald-800">
                Se reportaron las novedades a la administración
              </ITText>
              <ITSlideToggle isOn={reportedToAdmin} onToggle={setReportedToAdmin} />
            </ITFlex>
          </ITFlex>

          <ITFlex justify="end" gap={3} className="flex justify-end gap-3 pb-10">
            <ITButton variant="outlined" color="secondary" onClick={() => navigate("/shift-handover")}>
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
             
            >
              {submitting ? "Enviando..." : "Enviar Reporte de Turno"}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITFlex>
    </ITFlex>
  );
};

export default NewShiftHandoverPage;