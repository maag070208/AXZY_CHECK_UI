import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ITBadget,
    ITButton,
    ITDatePicker,
    ITDialog,
    ITInput,
    ITLoader,
    ITSelect,
} from "@axzydev/axzy_ui_system";
import { FaArrowLeft, FaCheck, FaSave, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { getUsers, User } from "../../users/services/UserService";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import {
    createUniformCheck,
    UNIFORM_ITEMS,
} from "../../uniform-check/services/UniformCheckService";
import {
    createShiftCheck,
    CreateShiftCheckDto,
    getDayOverview,
    HANDOVER_ITEMS,
    ShiftCheck,
    signShiftCheck,
} from "../services/ShiftCheckService";

type UniformValue = { value: boolean; note?: string | null };

const ShiftCheckCapturePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const presetUserId = searchParams.get("userId");

    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [scheduleId, setScheduleId] = useState<number | null>(null);
    const [userId, setUserId] = useState<number | null>(
        presetUserId ? Number(presetUserId): null);
    const [shiftType, setShiftType] = useState<"MATUTINO" | "NOCTURNO">(
        new Date().getHours() < 12 ? "MATUTINO": "NOCTURNO");
    const [shiftDate, setShiftDate] = useState<Date>(() => new Date());
    const [isAbsent, setIsAbsent] = useState<boolean>(false);
    const [observations, setObservations] = useState<string>("");
    const [handover, setHandover] = useState<Record<string, UniformValue>>(() => {
        const init: Record<string, UniformValue> = {};
        HANDOVER_ITEMS.forEach((i) => (init[i.key] = { value: true, note: null }));
        return init;
    });
    const [validateUniform, setValidateUniform] = useState<boolean>(false);
    const [uniformItems, setUniformItems] = useState<Record<string, UniformValue>>(() => {
        const init: Record<string, UniformValue> = {};
        UNIFORM_ITEMS.forEach((i) => (init[i.key] = { value: true, note: null }));
        return init;
    });
    const [uniformObservations, setUniformObservations] = useState<string>("");
    const [replacedById, setReplacedById] = useState<number | null>(null);
    const [coverageStart, setCoverageStart] = useState<string>("");
    const [coverageEnd, setCoverageEnd] = useState<string>("");
    const [credentialsCount, setCredentialsCount] = useState<number | null>(null);
    const [tarjetonesCount, setTarjetonesCount] = useState<number | null>(null);
    const [novedadesCaseta, setNovedadesCaseta] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [created, setCreated] = useState<ShiftCheck | null>(null);
    const [signingOpen, setSigningOpen] = useState<boolean>(false);
    const [receivedUsername, setReceivedUsername] = useState("");
    const [receivedPassword, setReceivedPassword] = useState("");
    const [overview, setOverview] = useState<{
        matutino: ShiftCheck[];
        nocturno: ShiftCheck[];
    }>({ matutino: [], nocturno: [] });
    const [loadingOverview, setLoadingOverview] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingUsers(true);
            const res = await getUsers();
            const scheds = await getSchedules();
            if (mounted) {
                setUsers(res.data ?? []);
                setSchedules(scheds ?? []);
                setLoadingUsers(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Carga el overview del día seleccionado para saber qué guardias ya
    // tienen verificación capturada (matutino / nocturno).
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingOverview(true);
            const day = shiftDate.toISOString().slice(0, 10);
            const res = await getDayOverview(day);
            if (mounted) {
                setOverview(
                    res.success && res.data
                        ? res.data: { matutino: [], nocturno: [] });
                setLoadingOverview(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [shiftDate]);

    const guards = useMemo(() =>
            (users ?? []).filter(
                    (u) =>
                        u.active &&
                        ["GUARD", "MAINT", "SHIFT"].includes(u.role?.name ?? "") &&
                        u.schedule).sort((a, b) => `${a.name} ${a.lastName}`.localeCompare(`${b.name} ${b.lastName}`)),
        [users]);

    // Al elegir guardia, precarga su horario del Directorio y deriva el turno.
    useEffect(() => {
        const selected = users.find((u) => u.id === userId);
        if (!selected?.schedule) return;
        setScheduleId(selected.schedule.id ?? null);
        const startHour = Number(String(selected.schedule.startTime).split(":")[0]);
        setShiftType(startHour < 12 ? "MATUTINO": "NOCTURNO");
    }, [userId, users]);

    const scheduleOptions = useMemo(() =>
            (schedules ?? []).map((s) => ({
                    value: String(s.id),
                    label: `${s.name} · ${s.startTime} - ${s.endTime}`,
                })).sort((a, b) => a.label.localeCompare(b.label)),
        [schedules]);

    const suplenteOptions = useMemo(() =>
            (users ?? []).filter(
                    (u) =>
                        u.active &&
                        u.id !== userId &&
                        ["GUARD", "MAINT", "SHIFT"].includes(u.role?.name ?? "")).map((g) => ({
                    value: String(g.id),
                    label: `${g.name} ${g.lastName ?? ""}`.trim() || g.username,
                })).sort((a, b) => a.label.localeCompare(b.label)),
        [users, userId]);

    const selectedSuplenteName = useMemo(() => (users ?? []).find((g) => g.id === replacedById) ?? null,
        [users, replacedById]);

    // ShiftCheck existente del día para el turno seleccionado, indexado por userId.
    const existingByUser = useMemo(() => {
        const list = shiftType === "MATUTINO" ? overview.matutino: overview.nocturno;
        const map = new Map<number, ShiftCheck>();
        for (const sc of list ?? []) map.set(sc.userId, sc);
        return map;
    }, [overview, shiftType]);

    const existingForSelected = userId ? existingByUser.get(userId) ?? null: null;

    const selectedUser = useMemo(() => users.find((u) => u.id === userId) ?? null,
        [users, userId]);

    const failedHandover = useMemo(() => HANDOVER_ITEMS.filter((i) => handover[i.key] && !handover[i.key].value),
        [handover]);

    const toggleHandover = (key: string) =>
        setHandover((prev) => ({...prev, [key]: {...prev[key], value: !prev[key].value } }));

    const failedUniform = useMemo(() => UNIFORM_ITEMS.filter((i) => uniformItems[i.key] && !uniformItems[i.key].value),
        [uniformItems]);

    const toggleUniform = (key: string) =>
        setUniformItems((prev) => ({...prev, [key]: {...prev[key], value: !prev[key].value } }));

    const submitUniformIfValidated = async (): Promise<boolean> => {
        if (!validateUniform || !userId) return true;
        const res = await createUniformCheck({
            userId,
            checkedAt: shiftDate.toISOString(),
            context: "SHIFT",
            items: uniformItems,
            observations: uniformObservations || null,
        });
        return res.success;
    };

    const userOptions = useMemo(() =>
            guards.map((u) => {
                const fullName = `${u.name} ${u.lastName ?? ""}`.trim() || u.username;
                const start = u.schedule?.startTime ?? "";
                const end = u.schedule?.endTime ?? "";
                const existing = existingByUser.get(u.id);
                const capturedTag = existing
                    ? existing.status === "SIGNED"
                        ? " · ✓ FIRMADO": " · ✓ Capturado": "";
                return {
                    value: String(u.id),
                    label: `${fullName} · ${u.role.value} · ${start}-${end}${capturedTag}`,
                };
            }),
        [guards, existingByUser]);

    const handleCreate = async (thenSign: boolean) => {
        if (!userId) {
            dispatch(showToast({ message: "Selecciona un guardia", type: "warning" }));
            return;
        }
        if (thenSign) {
            setCreated({
                id: "pending",
                userId,
                shiftType,
                shiftDate: shiftDate.toISOString(),
            } as any);
            setSigningOpen(true);
            return;
        }
        setSubmitting(true);
        const payload: CreateShiftCheckDto = {
            userId,
            shiftDate: shiftDate.toISOString(),
            shiftType,
            isAbsent,
            handoverItems: handover,
            observations: observations || null,
            replacedById: isAbsent ? replacedById ?? undefined: undefined,
            coverageStart: isAbsent ? coverageStart || undefined: undefined,
            coverageEnd: isAbsent ? coverageEnd || undefined: undefined,
            credentialsCount,
            tarjetonesCount,
            novedadesCaseta: novedadesCaseta || undefined,
        };
        const res = await createShiftCheck(payload);
        const uniformOk = await submitUniformIfValidated();
        setSubmitting(false);
        if (res.success) {
            dispatch(showToast({ message: "Verificación guardada (se generaron las incidencias automáticas).", type: "success" }));
            if (!uniformOk) {
                dispatch(showToast({ message: "El uniforme no se pudo guardar.", type: "warning" }));
            }
            setCreated(res.data ?? null);
            navigate("/shift-check");
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? "Error al guardar", type: "error" }));
        }
    };

    const confirmSign = async () => {
        if (!created || created.id === "pending") {
            // No hay id aún: crear primero, luego firmar
            if (!userId) return;
            setSubmitting(true);
            const payload: CreateShiftCheckDto = {
                userId,
                shiftDate: shiftDate.toISOString(),
                shiftType,
                isAbsent,
                handoverItems: handover,
                observations: observations || null,
                replacedById: isAbsent ? replacedById ?? undefined: undefined,
                coverageStart: isAbsent ? coverageStart || undefined: undefined,
                coverageEnd: isAbsent ? coverageEnd || undefined: undefined,
                credentialsCount,
                tarjetonesCount,
                novedadesCaseta: novedadesCaseta || undefined,
            };
            const createRes = await createShiftCheck(payload);
            if (!createRes.success || !createRes.data) {
                setSubmitting(false);
                dispatch(showToast({ message: createRes.messages?.[0] ?? "Error al guardar", type: "error" }));
                return;
            }
            const uniformOk = await submitUniformIfValidated();
            if (!uniformOk) {
                dispatch(showToast({ message: "El uniforme no se pudo guardar.", type: "warning" }));
            }
            await doSign(createRes.data.id);
            return;
        }
        await doSign(created.id);
    };

    const doSign = async (shiftCheckId: string) => {
        setSubmitting(true);
        const res = await signShiftCheck(shiftCheckId, {
            receivedUsername,
            receivedPassword,
        });
        setSubmitting(false);
        setSigningOpen(false);
        if (res.success) {
            dispatch(showToast({ message: "Verificación firmada", type: "success" }));
            navigate("/shift-check");
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? "Error al firmar", type: "error" }));
        }
    };

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <ITButton
                    onClick={() => navigate("/shift-check")}
                    color="secondary"
                    variant="outlined"
                    size="small"
                    className="!rounded-xl"
                >
                    <FaArrowLeft />
                </ITButton>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Verificación de Cambio de Turno
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Selecciona un guardia y aplica el flujo de captura
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                            <FaUser className="text-emerald-500" /> Guardia
                        </label>
                        {loadingUsers ? (
                            <ITLoader size="sm" />
                        ): (
                            <ITSelect
                                name="userId"
                                value={userId ? String(userId): ""}
                                onChange={(e: any) => setUserId(Number(e.target.value) || null)}
                                options={userOptions}
                                placeholder="Selecciona un guardia"
                            />
                        )}
                    </div>
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Turno (Directorio de Horarios)
                        </label>
                        <ITSelect
                            name="scheduleId"
                            value={scheduleId !== null ? String(scheduleId): ""}
                            onChange={(e: any) => {
                                const val = Number(e.target.value) || null;
                                setScheduleId(val);
                                const sched = (schedules ?? []).find((s) => s.id === val);
                                if (sched) {
                                    const startHour = Number(String(sched.startTime).split(":")[0]);
                                    setShiftType(startHour < 12 ? "MATUTINO": "NOCTURNO");
                                }
                            }}
                            options={scheduleOptions}
                            placeholder="Selecciona el horario"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Fecha
                        </label>
                        <ITDatePicker
                            name="shiftDate"
                            value={shiftDate}
                            onChange={(e: any) => {
                                const v = e.target.value;
                                if (v instanceof Date && !isNaN(v.getTime())) setShiftDate(v);
                            }}
                            onBlur={() => {}}
                            className="text-sm text-slate-600 outline-none font-medium h-[42px] !border-slate-200"
                        />
                    </div>
                </div>

                {selectedUser?.schedule && (
                    <p className="text-xs text-slate-500 mt-3">
                        Horario oficial: <strong>{selectedUser.schedule.startTime}</strong> - <strong>{selectedUser.schedule.endTime}</strong>
                    </p>
                )}

                {loadingOverview && (
                    <div className="mt-3"><ITLoader size="sm" /></div>
                )}

                {existingForSelected && (
                    <div
                        className={`mt-3 px-4 py-3 rounded-xl border text-sm ${
                            existingForSelected.status === "SIGNED"
                                ? "bg-amber-50 border-amber-200 text-amber-800": "bg-sky-50 border-sky-200 text-sky-800"
                        }`}
                    >
                        <div className="flex items-center gap-2 font-bold">
                            <ITBadget
                                color={existingForSelected.status === "SIGNED" ? "warning": "primary"}
                                size="small"
                            >
                                {existingForSelected.status === "SIGNED" ? "FIRMADO": "YA CAPTURADO"}
                            </ITBadget>
                            <span>Este guardia ya tiene una verificación para este turno.</span>
                        </div>
                        <p className="text-xs mt-1">
                            {existingForSelected.isAbsent
                                ? "Marcado como FALTA": existingForSelected.isLate
                                    ? `Con retardo de ${existingForSelected.delayMinutes} min`: "Puntual"}{" "}
                            · Estado: <strong>{existingForSelected.status}</strong>
                        </p>
                        {existingForSelected.status !== "SIGNED" && (
                            <p className="text-xs mt-1 italic">
                                Si continúas, se creará un nuevo registro (editable desde el listado mientras no esté firmado).
                            </p>
                        )}
                    </div>
                )}
            </div>

            {userId ? (
                <>
                    {/* Asistencia: 2 checks, default SÍ */}
                    <Section title="Asistencia">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                            <button
                                type="button"
                                onClick={() => setIsAbsent(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                    !isAbsent
                                        ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200": "bg-white border-slate-200 hover:border-emerald-200"
                                }`}
                            >
                                <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                        !isAbsent ? "bg-emerald-500": "bg-slate-200"
                                    }`}
                                >
                                    ✓
                                </span>
                                <span className="text-sm font-semibold text-slate-800">Sí, asistió</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAbsent(true)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                    isAbsent
                                        ? "bg-red-50 border-red-300 ring-1 ring-red-200": "bg-white border-slate-200 hover:border-red-200"
                                }`}
                            >
                                <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                        isAbsent ? "bg-red-500": "bg-slate-200"
                                    }`}
                                >
                                    ✗
                                </span>
                                <span className="text-sm font-semibold text-slate-800">No, faltó</span>
                            </button>
                        </div>
                        {isAbsent && (
                            <p className="text-xs text-red-600 mt-3">
                                Se habilitó el Suplente. Captura los datos de cobertura a continuación.
                            </p>
                        )}
                    </Section>

                    {/* Suplente: solo aplica cuando hay FALTA */}
                    {isAbsent && (
                        <Section
                            title="Suplente"
                            hint={
                                replacedById
                                    ? `Cubre: ${selectedSuplenteName?.name ?? ""} ${selectedSuplenteName?.lastName ?? ""}`.trim(): "El suplente cubre al guardia que faltó"
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        Guardia que suple
                                    </label>
                                    <ITSelect
                                        name="replacedById"
                                        value={replacedById !== null ? String(replacedById): ""}
                                        onChange={(e: any) =>
                                            setReplacedById(Number(e.target.value) || null)
                                        }
                                        options={suplenteOptions}
                                        placeholder="Selecciona el guardia suplente"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        Inicio cobertura
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={coverageStart}
                                        onChange={(e) => setCoverageStart(e.target.value)}
                                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        Fin cobertura
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={coverageEnd}
                                        onChange={(e) => setCoverageEnd(e.target.value)}
                                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 text-sm"
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* Uniforme: verificación inline */}
                    <Section
                        title="Uniforme y aseo"
                        hint={
                            validateUniform
                                ? `${failedUniform.length} ítem(s) no cumplido(s)`: "Verificación opcional aquí mismo"
                        }
                    >
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-emerald-600"
                                checked={validateUniform}
                                onChange={(e) => setValidateUniform(e.target.checked)}
                            />
                            <span className="text-sm font-semibold text-slate-800">
                                Validar uniforme y aseo de este guardia aquí mismo
                            </span>
                        </label>

                        {validateUniform && (
                            <div className="mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {UNIFORM_ITEMS.map((item) => {
                                        const v = uniformItems[item.key];
                                        const ok = v?.value ?? true;
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => toggleUniform(item.key)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${
                                                    ok
                                                        ? "bg-emerald-50 border-emerald-200": "bg-red-50 border-red-300 ring-1 ring-red-200"
                                                }`}
                                            >
                                                <span
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                        ok ? "bg-emerald-500": "bg-red-500"
                                                    }`}
                                                >
                                                    {ok ? "✓": "✗"}
                                                </span>
                                                <span className="text-sm font-medium text-slate-800">
                                                    {item.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <textarea
                                    value={uniformObservations}
                                    onChange={(e) => setUniformObservations(e.target.value)}
                                    rows={2}
                                    placeholder="Notas del jefe sobre el uniforme/aseo..."
                                    className="w-full mt-3 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white"
                                />
                            </div>
                        )}
                    </Section>

                    {/* Entrega de turno */}
                    <Section
                        title="Entrega de turno"
                        hint={`${failedHandover.length} ítem(s) no cumplido(s)`}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {HANDOVER_ITEMS.map((item) => {
                                const v = handover[item.key];
                                const ok = v?.value ?? true;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggleHandover(item.key)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${
                                            ok
                                                ? "bg-emerald-50 border-emerald-200": "bg-amber-50 border-amber-300 ring-1 ring-amber-200"
                                        }`}
                                    >
                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                ok ? "bg-emerald-500": "bg-amber-500"
                                            }`}
                                        >
                                            {ok ? "✓": "✗"}
                                        </span>
                                        <span className="text-sm font-medium text-slate-800">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </Section>

                    {/* Campos en caseta (ajuste) */}
                    <Section
                        title="Campos en caseta"
                        hint="Se capturan por cada guardia que se verifica"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                    Número de credenciales
                                </label>
                                <ITInput
                                    name="credentialsCount"
                                    type="number"
                                    placeholder="0"
                                    value={credentialsCount !== null ? String(credentialsCount): ""}
                                    onChange={(e: any) => {
                                        const v = e.target.value;
                                        setCredentialsCount(v === "" ? null: Number(v));
                                    }}
                                    onBlur={() => {}}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                    Número de tarjetones
                                </label>
                                <ITInput
                                    name="tarjetonesCount"
                                    type="number"
                                    placeholder="0"
                                    value={tarjetonesCount !== null ? String(tarjetonesCount): ""}
                                    onChange={(e: any) => {
                                        const v = e.target.value;
                                        setTarjetonesCount(v === "" ? null: Number(v));
                                    }}
                                    onBlur={() => {}}
                                />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                Registro de novedades de caseta
                            </label>
                            <textarea
                                value={novedadesCaseta}
                                onChange={(e) => setNovedadesCaseta(e.target.value)}
                                rows={3}
                                placeholder="Novedades relevantes de la caseta (este guardia/turno)..."
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white"
                            />
                        </div>
                    </Section>

                    {/* Observaciones */}
                    <Section title="Observaciones">
                        <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            rows={3}
                            placeholder="Notas libres..."
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white"
                        />
                    </Section>

                    <div className="flex flex-wrap gap-3 justify-end mt-4">
                        <ITButton
                            onClick={() => handleCreate(false)}
                            color="primary"
                            variant="outlined"
                            className="!rounded-xl flex items-center gap-2"
                            disabled={submitting}
                        >
                            <FaSave />
                            <span className="text-xs font-bold">Guardar verificación</span>
                        </ITButton>
                        <ITButton
                            onClick={() => handleCreate(true)}
                            color="primary"
                            variant="filled"
                            className="!rounded-xl flex items-center gap-2"
                            disabled={submitting}
                        >
                            <FaCheck />
                            <span className="text-xs font-bold">Firmar y guardar</span>
                        </ITButton>
                    </div>
                </>
            ): (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center text-slate-400">
                    Selecciona un guardia para iniciar la verificación.
                </div>
            )}

            <ITDialog
                isOpen={signingOpen}
                onClose={() => setSigningOpen(false)}
                title="Firma (username + password del receptor)"
                className="!max-w-lg"
            >
                <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-500">
                        Se validarán las credenciales del que RECIBE contra
                        <code className="mx-1">User.password</code>(bcrypt).
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <ITInput
                            name="receivedUsername"
                            placeholder="Username RECEPTOR"
                            value={receivedUsername}
                            onChange={(e: any) => setReceivedUsername(e.target.value)}
                            onBlur={() => {}}
                        />
                        <ITInput
                            name="receivedPassword"
                            type="password"
                            placeholder="Password RECEPTOR"
                            value={receivedPassword}
                            onChange={(e: any) => setReceivedPassword(e.target.value)}
                            onBlur={() => {}}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <ITButton variant="outlined" onClick={() => setSigningOpen(false)}>
                            Cancelar
                        </ITButton>
                        <ITButton
                            variant="filled"
                            color="success"
                            onClick={confirmSign}
                            disabled={submitting}
                        >
                            {submitting ? <ITLoader size="sm" />: "Firmar y guardar"}
                        </ITButton>
                    </div>
                </div>
            </ITDialog>
        </div>
    );
};

const Section = ({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: React.ReactNode;
}) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
            {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
        </div>
        {children}
    </div>
);

export default ShiftCheckCapturePage;
