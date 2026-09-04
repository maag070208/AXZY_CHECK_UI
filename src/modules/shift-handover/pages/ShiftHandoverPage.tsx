import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDataTable, ITDatePicker, ITDialog, ITInput, ITSelect, ITSlideToggle } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { FaPlus, FaSwatchbook, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getUsers, User } from "../../users/services/UserService";
import {
  createShiftHandover,
  getPaginatedShiftHandovers,
  getShiftHandoverDetail,
  ICreateShiftHandoverElement,
} from "../services/ShiftHandoverService";

const CHECKLIST_LABELS: { key: string; label: string }[] = [
  { key: "checklistPhones", label: "Teléfonos" },
  { key: "checklistTablet", label: "Tablet" },
  { key: "checklistRadios", label: "Radios" },
  { key: "checklistKeys", label: "Llaves" },
  { key: "checklistLogbook", label: "Bitácora" },
  { key: "checklistConsignas", label: "Consignas" },
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

const noop = () => {};

/**
 * "4.2 Entrega de turno" — historial + captura desde WEB. Antes solo se
 * podía llenar desde la APP; este formulario usa exactamente el mismo
 * endpoint (`POST /shift-handover`) así que el jefe operativo también
 * puede reportarlo desde escritorio.
 */
const ShiftHandoverPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
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

  const memoizedFetch = useCallback((params: any) => getPaginatedShiftHandovers(params), []);

  const openDetail = async (id: number) => {
    const res = await getShiftHandoverDetail(id);
    if (res.success) {
      setDetail(res.data);
      setDetailOpen(true);
    }
  };

  const resetForm = () => {
    setShiftType(defaultShiftType());
    setHandoverDate(new Date());
    setCredentialsCount("");
    setTarjetonesCount("");
    setNovedades("");
    setChecklist(DEFAULT_CHECKLIST);
    setReportedToAdmin(false);
    setElements([]);
    setPickerGuardId("");
    setPickerEntryTime("");
  };

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
            <FaSwatchbook className="text-[#065911]" />
            Entrega de Turno
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Historial de reportes de cambio de turno (caseta, elementos y checklist de verificación).
          </p>
        </div>
        <ITButton onClick={() => setCreateOpen(true)} color="primary" className="!rounded-xl !bg-[#065911] hover:!bg-[#04400c] !flex !items-center !gap-2">
          <FaPlus size={12} /> Nueva Entrega de Turno
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

      {/* Detalle de solo lectura */}
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

      {/* Nueva entrega de turno */}
      <ITDialog
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
        title="Nueva Entrega de Turno"
      >
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-2">1. Turno</p>
            <div className="flex gap-2">
              {(["NOCTURNO", "MATUTINO"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setShiftType(type)}
                  className={`flex-1 text-sm font-bold px-4 py-2.5 rounded-xl border transition-colors ${
                    shiftType === type
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {type === "NOCTURNO" ? "Nocturno" : "Matutino"}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <ITDatePicker name="handoverDate" value={handoverDate} onChange={(e: any) => setHandoverDate(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-2">2. Caseta</p>
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

          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-2">3. Registro por elemento</p>
            <div className="bg-slate-50 rounded-xl p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end mb-3">
              <div className="flex-1 min-w-[160px]">
                <ITSelect
                  name="pickerGuard"
                  placeholder="Selecciona un guardia..."
                  options={guards.map((g) => ({ id: String(g.id), value: `${g.name} ${g.lastName ?? ""}` }))}
                  labelField="value"
                  valueField="id"
                  value={pickerGuardId}
                  onChange={(e: any) => setPickerGuardId(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-36">
                <ITInput
                  name="pickerEntryTime"
                  label="Hora entrada"
                  placeholder="07:00"
                  value={pickerEntryTime}
                  onChange={(e: any) => setPickerEntryTime(e.target.value)}
                  onBlur={noop}
                />
              </div>
              <ITButton onClick={handleAddElement} color="secondary" variant="outlined" className="!rounded-xl !h-10 flex-shrink-0">
                Agregar
              </ITButton>
            </div>

            {elements.length > 0 && (
              <div className="space-y-2">
                {elements.map((el, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{el.guardLabel}</p>
                      <p className="text-[10px] text-slate-400">Entrada: {el.entryTime}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
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
            )}
          </div>

          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-2">4. Verificación de entrega de turno</p>
            <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
              {CHECKLIST_LABELS.map((item) => (
                <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  <ITSlideToggle
                    size="sm"
                    isOn={checklist[item.key as keyof ChecklistState]}
                    onToggle={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="flex-1 text-sm font-semibold text-emerald-800">
              Se reportaron las novedades a la administración
            </span>
            <ITSlideToggle isOn={reportedToAdmin} onToggle={setReportedToAdmin} />
          </div>

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
              {submitting ? "Enviando..." : "Enviar Reporte de Turno"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default ShiftHandoverPage;
