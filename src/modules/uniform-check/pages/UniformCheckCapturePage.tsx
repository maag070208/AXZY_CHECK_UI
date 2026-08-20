import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ITButton, ITSelect } from "@axzydev/axzy_ui_system";
import { FaArrowLeft, FaPen, FaSave, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { getUsers, User } from "../../users/services/UserService";
import {
    createUniformCheck,
    CreateUniformCheckDto,
    getUniformCheck,
    UNIFORM_ITEMS,
    UniformCheck,
    UniformContext,
} from "../services/UniformCheckService";

type UniformValue = { value: boolean; note?: string | null };

const CONTEXT_OPTIONS: { value: UniformContext; label: string }[] = [
    { value: "SHIFT", label: "Cambio de turno" },
    { value: "ROUND", label: "Recorrido" },
    { value: "SPOT", label: "Verificación al azar" },
    { value: "OTHER", label: "Otra" },
];

/**
 * @description Verificación de uniforme y aseo. Independiente del
 * cambio de turno: se aplica a CUALQUIER guardia en cualquier momento.
 * Soporta dos modos:
 *  - Crear (?userId=): nuevo registro; checkedAt se fija a la hora actual.
 *  - Editar (?id=): carga lo guardado (ítems, observaciones, contexto, día)
 *    y al guardar re-envía con el MISMO checkedAt, de modo que el upsert por
 *    (guardia, día) del backend actualiza ese registro sin duplicar.
 */
const UniformCheckCapturePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const presetUserId = searchParams.get("userId");
    const editId = searchParams.get("id");

    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
    const [userId, setUserId] = useState<number | null>(
        presetUserId ? Number(presetUserId): null);
    const [context, setContext] = useState<UniformContext>("SHIFT");
    const [checkedAt, setCheckedAt] = useState<string>(new Date().toISOString());
    const [observations, setObservations] = useState<string>("");
    const [items, setItems] = useState<Record<string, UniformValue>>(() => {
        const init: Record<string, UniformValue> = {};
        UNIFORM_ITEMS.forEach((i) => (init[i.key] = { value: true, note: null }));
        return init;
    });
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [loadingEdit, setLoadingEdit] = useState<boolean>(false);
    const [editing, setEditing] = useState<UniformCheck | null>(null);

    const isEdit = Boolean(editId);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingUsers(true);
            const res = await getUsers();
            if (mounted) {
                setUsers(res.data ?? []);
                setLoadingUsers(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!editId) return;
        let mounted = true;
        (async () => {
            setLoadingEdit(true);
            const res = await getUniformCheck(String(editId));
            if (mounted) {
                if (res.success && res.data) {
                    const row = res.data;
                    setEditing(row);
                    setUserId(row.userId);
                    setContext(row.context);
                    setCheckedAt(row.checkedAt);
                    setObservations(row.observations ?? "");
                    setItems(row.items ?? {});
                } else {
                    dispatch(
                        showToast({
                            message: res.messages?.[0] ?? "No se pudo cargar la verificación",
                            type: "error",
                        }));
                    navigate("/uniform-check");
                }
                setLoadingEdit(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [editId, dispatch, navigate]);

    const guards = useMemo(() =>
            (users ?? []).filter(
                    (u) =>
                        u.active &&
                        ["GUARD", "MAINT", "SHIFT"].includes(u.role?.name ?? "")).sort((a, b) => `${a.name} ${a.lastName}`.localeCompare(`${b.name} ${b.lastName}`)),
        [users]);

    const userOptions = useMemo(() =>
            guards.map((u) => ({
                value: String(u.id),
                label: `${u.name} ${u.lastName ?? ""}`.trim() || u.username,
            })),
        [guards]);

    const failedItems = useMemo(() => UNIFORM_ITEMS.filter((i) => items[i.key] && !items[i.key].value),
        [items]);

    const toggle = (key: string) =>
        setItems((prev) => ({...prev, [key]: {...prev[key], value: !prev[key].value } }));

    const handleSave = async () => {
        if (!userId) {
            dispatch(showToast({ message: "Selecciona un guardia", type: "warning" }));
            return;
        }
        setSubmitting(true);
        const payload: CreateUniformCheckDto = {
            userId,
            // En edición se conserva el día original para que el upsert por
            // (guardia, día) actualice el mismo registro y no cree otro fuera de fecha.
            checkedAt: isEdit && editing ? editing.checkedAt: checkedAt,
            context,
            items,
            observations: observations || null,
        };
        const res = await createUniformCheck(payload);
        setSubmitting(false);
        if (res.success) {
            dispatch(
                showToast({
                    message:
                        `${isEdit ? "Verificación actualizada": "Verificación de uniforme guardada"} ` +
                        `(${failedItems.length} ítem(s) no cumplido(s)).`,
                    type: "success",
                }));
            navigate("/uniform-check");
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? "Error al guardar", type: "error" }));
        }
    };

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <ITButton
                    onClick={() => navigate("/uniform-check")}
                    color="secondary"
                    variant="outlined"
                    size="small"
                    className="!rounded-xl"
                >
                    <FaArrowLeft />
                </ITButton>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {isEdit
                            ? "Editar Verificación de Uniforme y Aseo": "Verificación de Uniforme y Aseo"}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isEdit
                            ? "Se cargaron los datos guardados; al guardar se actualiza la verificación del mismo día.": "Aplica a cualquier guardia, en cualquier momento (no solo en el cambio de turno)"}
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
                            <div className="text-sm text-slate-400">Cargando...</div>
                        ): isEdit ? (
                            <div className="h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-sm font-medium text-slate-700">
                                {userOptions.find((o) => o.value === String(userId))?.label ??
                                    `#${userId}`}
                            </div>
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
                            Contexto
                        </label>
                        <ITSelect
                            name="context"
                            value={context}
                            onChange={(e: any) => setContext(e.target.value)}
                            options={CONTEXT_OPTIONS}
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Fecha y hora
                        </label>
                        <input
                            type="datetime-local"
                            value={checkedAt.slice(0, 16)}
                            disabled
                            className="w-full h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            {isEdit
                                ? "Se conserva el día original (upsert por guardia/día).": "Se registra automáticamente al guardar."}
                        </p>
                    </div>
                </div>
            </div>

            {loadingEdit ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center text-slate-400">
                    Cargando verificación guardada...
                </div>
            ): userId ? (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                Checklist de uniforme y aseo (
                            </h2>
                            <span className="text-[11px] text-slate-500">
                                {9 - failedItems.length} / 9 cumplidos ·{" "}
                                {failedItems.length > 0 && (
                                    <strong className="text-red-600">
                                        {failedItems.length} ítem(s) no cumplido(s) generarán incidencia
                                    </strong>
                                )}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {UNIFORM_ITEMS.map((item) => {
                                const v = items[item.key];
                                const ok = v?.value ?? true;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggle(item.key)}
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
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                            Observaciones
                        </h2>
                        <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            rows={3}
                            placeholder="Notas libres del jefe sobre el uniforme/aseo..."
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end mt-4">
                        <ITButton
                            onClick={() => handleSave()}
                            color="primary"
                            variant="filled"
                            className="!rounded-xl flex items-center gap-2"
                            disabled={submitting}
                        >
                            {isEdit ? <FaPen />: <FaSave />}
                            <span className="text-xs font-bold">
                                {isEdit ? "Guardar cambios": "Guardar verificación de uniforme"}
                            </span>
                        </ITButton>
                    </div>
                </>
            ): (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center text-slate-400">
                    Selecciona un guardia para verificar su uniforme.
                </div>
            )}
        </div>
    );
};

export default UniformCheckCapturePage;