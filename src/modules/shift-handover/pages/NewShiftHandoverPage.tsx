import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITCard,
  ITDatePicker,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITSlideToggle,
  ITText,
  ITTextarea,
  ITTimePicker,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
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
  FaBox,
  FaCheck,
  FaCheckDouble,
  FaMoon,
  FaSun,
  FaUserPlus,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUsers, User } from "../../users/services/UserService";
import {
  createShiftHandover,
  ICreateShiftHandoverElement,
} from "../services/ShiftHandoverService";
import { PersonAvatar } from "@app/core/components/PersonAvatar";
import { useRolePalette } from "@app/core/hooks/useRolePalette";

const CHECKLIST_LABELS: { key: string; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
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

const SHIFT_OPTIONS = [
  { value: "NOCTURNO" as const, label: "Nocturno", description: "Turno de noche", icon: FaMoon },
  { value: "MATUTINO" as const, label: "Matutino", description: "Turno de día", icon: FaSun },
];

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}) => {
  const palette = useRolePalette();
  return (
  <ITFlex align="center" gap={3}>
    <ITFlex
      align="center"
      justify="center"
      style={{ backgroundColor: palette.soft, color: palette.primary }}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
    >
      <Icon size={14} />
    </ITFlex>
    <ITFlex direction="column">
      <ITText as="h3" className="text-lg font-black text-slate-900 dark:text-white">
        {title}
      </ITText>
      <ITText as="p" className="text-[11px] text-slate-500">{description}</ITText>
    </ITFlex>
  </ITFlex>
  );
};

const noop = () => { };

/**
 * "4.2 Entrega de turno" — captura desde WEB en pantalla completa
 * (antes era un modal). Usa el mismo endpoint (`POST /shift-handover`)
 * que la APP.
 */
const NewShiftHandoverPage = () => {
  const palette = useRolePalette();
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
  const [elements, setElements] = useState<(ICreateShiftHandoverElement & { guardLabel: string; photoUrl?: string | null })[]>([]);
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
        photoUrl: guard?.photoUrl,
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
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      backAction={() => navigate("/shift-handover")}
      title="Nueva Entrega de Turno"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Entrega de Turno", href: "#/shift-handover" }, { label: "Nueva entrega" }]}
      description="Reporte de cambio de turno: caseta, elementos y verificación."
      icon={<FaSwatchbook size={20} />}
      iconColor={palette.primary}
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITGrid container columns={12} spacing={5}>
          <ITGrid item xs={12} lg={7}>
            <ITFlex direction="column" gap={5}>
              <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="space-y-4 p-5!">
                <SectionHeader
                  icon={FaClock}
                  title="Turno"
                  description="Selecciona el turno y la fecha de la entrega."
                />

                <ITFlex direction="row" justify="between" gap={3} wrap="wrap" className="w-full">
                  {SHIFT_OPTIONS.map((option) => {
                    const selected = shiftType === option.value;
                    return (
                      <ITCard
                        key={option.value}
                        onClick={() => setShiftType(option.value)}
                        className={`flex-1 min-w-[140px] rounded-2xl border-0! shadow-none! ${selected ? palette.softClass : "bg-slate-50/70"}`}
                        contentClassName="p-4!"
                      >
                        <ITFlex align="center" gap={3}>
                          <ITFlex
                            align="center"
                            justify="center"
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              selected ? `${palette.primaryBgClass} text-white` : "bg-white text-slate-500 dark:bg-slate-800"
                            }`}
                          >
                            <option.icon size={16} />
                          </ITFlex>
                          <ITFlex direction="column" className="min-w-0 flex-1">
                            <ITText as="span" className={`text-sm font-black ${selected ? palette.primaryTextClass : "text-slate-700 dark:text-slate-200"}`}>
                              {option.label}
                            </ITText>
                            <ITText as="span" className={`text-[10px] ${selected ? palette.primaryTextClass : "text-slate-400"}`}>
                              {option.description}
                            </ITText>
                          </ITFlex>
                          {selected && <FaCheck className={`shrink-0 ${palette.primaryTextClass}`} size={12} />}
                        </ITFlex>
                      </ITCard>
                    );
                  })}
                </ITFlex>

                <ITDatePicker
                  name="handoverDate"
                  label="Fecha de entrega"
                  value={handoverDate}
                  onChange={(e: any) => setHandoverDate(e.target.value)}
                  className="w-full"
                />
              </ITCard>

              <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="space-y-4 p-5!">
                <SectionHeader
                  icon={FaBox}
                  title="Caseta"
                  description="Credenciales, tarjetones y novedades del turno."
                />
                <ITGrid container columns={12} spacing={3}>
                  <ITGrid item xs={12} md={6}>
                    <ITInput
                      name="credentialsCount"
                      type="number"
                      label="No. de credenciales"
                      value={credentialsCount}
                      onChange={(e: any) => setCredentialsCount(e.target.value)}
                      onBlur={noop}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={6}>
                    <ITInput
                      name="tarjetonesCount"
                      type="number"
                      label="No. de tarjetones"
                      value={tarjetonesCount}
                      onChange={(e: any) => setTarjetonesCount(e.target.value)}
                      onBlur={noop}
                    />
                  </ITGrid>
                  <ITGrid item xs={12}>
                    <ITTextarea
                      name="novedades"
                      label="Novedades"
                      rows={4}
                      value={novedades}
                      onChange={(value) => setNovedades(value)}
                      placeholder="Describe las novedades del turno..."
                    />
                  </ITGrid>
                </ITGrid>
              </ITCard>

              <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="space-y-4 p-5!">
                <SectionHeader
                  icon={FaUserPlus}
                  title="Registro por elemento"
                  description="Agrega guardias con hora de entrada y puntualidad."
                />
                <ITFlex className="rounded-2xl bg-slate-50/70 p-4 dark:bg-slate-900/40">
                  <ITGrid container columns={12} spacing={3} className="w-full items-end">
                    <ITGrid item xs={12} md={5}>
                      <ITSearchSelect
                        name="pickerGuard"
                        label="Guardia"
                        placeholder="Selecciona un guardia..."
                        options={guards.map((g) => ({ label: `${g.name} ${g.lastName ?? ""}`, value: String(g.id) }))}
                        value={pickerGuardId}
                        onChange={(val) => setPickerGuardId(String(val))}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} md={4}>
                      <ITTimePicker
                        name="pickerEntryTime"
                        label="Hora de entrada"
                        placeholder="07:00"
                        value={pickerEntryTime}
                        onChange={(e) => setPickerEntryTime(e.target.value)}
                        onBlur={noop}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} md={3}>
                      <ITButton onClick={handleAddElement} color="primary" size="md" icon={<FaPlus />} className="w-full">
                        Agregar
                      </ITButton>
                    </ITGrid>
                  </ITGrid>
                </ITFlex>

                {elements.length > 0 ? (
                  <ITFlex direction="column" gap={2}>
                    {elements.map((el, index) => (
                      <ITCard
                        key={index}
                        className="rounded-xl border-0! bg-slate-50/40! shadow-none!"
                        contentClassName="p-3!"
                      >
                        <ITFlex align="center" gap={3}>
                          <PersonAvatar name={el.guardLabel} photoUrl={el.photoUrl} size={32} />
                          <ITFlex direction="column" className="min-w-0 flex-1">
                            <ITText as="p" className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                              {el.guardLabel || "—"}
                            </ITText>
                            <ITText as="p" className="flex items-center gap-1 text-[11px] text-slate-400">
                              <FaClock size={10} /> Entrada: {el.entryTime}
                            </ITText>
                          </ITFlex>
                          <ITFlex align="center" gap={2}>
                            <ITText as="span" className="text-[9px] font-bold uppercase text-slate-400">Puntual</ITText>
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
                            color="danger"
                            size="sm"
                            onClick={() => handleRemoveElement(index)}
                            icon={<FaTrash size={12} />}
                            ariaLabel="Quitar elemento"
                            title="Quitar elemento"
                          />
                        </ITFlex>
                      </ITCard>
                    ))}
                  </ITFlex>
                ) : (
                  <ITEmptyState
                    icon={<FaSwatchbook />}
                    title="Aún no hay elementos"
                    description="Agrega los guardias con su hora de entrada."
                    className="py-8"
                  />
                )}
              </ITCard>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} lg={5}>
            <ITFlex direction="column" gap={5}>
              <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="space-y-2 p-5!">
                <SectionHeader
                  icon={FaCheckDouble}
                  title="Verificación de entrega"
                  description="Confirma los elementos y el reporte a administración."
                />
                {CHECKLIST_LABELS.map((item) => (
                  <ITFlex key={item.key} align="center" gap={2} className="rounded-lg bg-slate-50/70 px-3 py-2 dark:bg-slate-900/40">
                    <item.icon className="text-slate-400" size={12} />
                    <ITText as="span" className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {item.label}
                    </ITText>
                    <ITSlideToggle
                      size="sm"
                      isOn={checklist[item.key as keyof ChecklistState]}
                      onToggle={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))}
                    />
                  </ITFlex>
                ))}

                <ITFlex align="center" gap={3} style={{ backgroundColor: palette.soft }} className="rounded-xl px-3 py-2.5">
                  <ITText as="span" style={{ color: palette.primary }} className="flex-1 text-xs font-semibold">
                    Se reportaron las novedades a la administración
                  </ITText>
                  <ITSlideToggle isOn={reportedToAdmin} onToggle={setReportedToAdmin} />
                </ITFlex>
              </ITCard>

              <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="space-y-3 p-5!">
                <SectionHeader
                  icon={FaClipboardList}
                  title="Resumen"
                  description="Totales del reporte antes de enviar."
                />
                <ITFlex justify="between">
                  <ITText as="span" className="text-xs text-slate-500">Elementos registrados</ITText>
                  <ITText as="span" className="text-sm font-black text-slate-800 dark:text-slate-100">{elements.length}</ITText>
                </ITFlex>
                <ITFlex justify="between">
                  <ITText as="span" className="text-xs text-slate-500">Puntuales</ITText>
                  <ITText as="span" style={{ color: palette.primary }} className="text-sm font-black">{elements.filter((e) => e.punctual).length}</ITText>
                </ITFlex>
                <ITFlex justify="between">
                  <ITText as="span" className="text-xs text-slate-500">Novedades reportadas</ITText>
                  <ITText as="span" style={{ color: reportedToAdmin ? palette.primary : "#D97706" }} className="text-sm font-black">
                    {reportedToAdmin ? "Sí" : "No"}
                  </ITText>
                </ITFlex>
              </ITCard>
            </ITFlex>
          </ITGrid>
        </ITGrid>

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/shift-handover")}>
            Cancelar
          </ITButton>
          <ITButton
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Enviar reporte de turno"}
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITPage>
  );
};

export default NewShiftHandoverPage;
