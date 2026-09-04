import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDatePicker, ITInput, ITSearchSelect, ITSlideToggle, ITTimePicker } from "@axzydev/axzy_ui_system";
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
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shift-handover")}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
              title="Volver"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <FaSwatchbook className="text-[#065911]" />
                Nueva Entrega de Turno
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Reporte de cambio de turno: caseta, elementos y verificación.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">1. Turno</p>
            <div className="flex gap-2">
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
            </div>
            <div className="mt-4">
              <ITDatePicker name="handoverDate" value={handoverDate} onChange={(e: any) => setHandoverDate(e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">2. Caseta</p>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="mt-3">
              <ITInput
                name="novedades"
                type="textarea"
                label="Novedades"
                value={novedades}
                onChange={(e: any) => setNovedades(e.target.value)}
                onBlur={noop}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">3. Registro por elemento</p>

            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-end">
                <div>
                  <ITSearchSelect
                    name="pickerGuard"
                    label="Guardia"
                    placeholder="Selecciona un guardia..."
                    options={guards.map((g) => ({ label: `${g.name} ${g.lastName ?? ""}`, value: String(g.id) }))}
                    value={pickerGuardId}
                    onChange={(val) => setPickerGuardId(String(val))}
                  />
                </div>
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
                  className="!bg-[#065911] hover:!bg-[#04400c] !h-10 !px-6 !rounded-xl font-bold text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FaPlus size={12} /> Agregar

                  </div>
                </ITButton>
              </div>
            </div>

            {elements.length > 0 ? (
              <div className="space-y-2">
                {elements.map((el, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#065911] font-bold flex items-center justify-center text-xs border border-emerald-100 flex-shrink-0">
                      {el.guardLabel
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join("") || "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{el.guardLabel}</p>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <FaClock className="text-slate-300" /> Entrada: {el.entryTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Puntual</span>
                      <ITSlideToggle
                        size="sm"
                        isOn={el.punctual}
                        onToggle={(v) =>
                          setElements((prev) => prev.map((e, i) => (i === index ? { ...e, punctual: v } : e)))
                        }
                      />
                    </div>
                    <button onClick={() => handleRemoveElement(index)} className="text-slate-300 hover:text-red-500 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center py-3 font-medium tracking-wide bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aún no se registran elementos. Agrega los guardias con su hora de entrada.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-3">4. Verificación de entrega de turno</p>
            <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
              {CHECKLIST_LABELS.map((item) => (
                <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-2.5">
                    <item.icon className="text-slate-400" />
                    {item.label}
                  </span>
                  <ITSlideToggle
                    size="sm"
                    isOn={checklist[item.key as keyof ChecklistState]}
                    onToggle={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3 mt-4">
              <span className="flex-1 text-sm font-semibold text-emerald-800">
                Se reportaron las novedades a la administración
              </span>
              <ITSlideToggle isOn={reportedToAdmin} onToggle={setReportedToAdmin} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pb-10">
            <ITButton variant="outlined" color="secondary" onClick={() => navigate("/shift-handover")}>
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
              className="!bg-[#065911] hover:!bg-[#04400c] !px-8"
            >
              {submitting ? "Enviando..." : "Enviar Reporte de Turno"}
            </ITButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewShiftHandoverPage;