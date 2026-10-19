import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaCamera, FaCheck, FaMinus, FaPlus, FaPrint, FaRoute, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getLocations, Location } from "../../locations/service/locations.service";
import { getUsers, User } from "../../users/services/UserService";
import { printLocationQRs } from "@core/utils/printLocationQRs";
import { createRoute, ILocationCreate, updateRoute } from "../services/RoutesService";

interface CreateRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editConfig?: any; // If editing
}

export const CreateRouteModal = ({ isOpen, onClose, onSuccess, editConfig }: CreateRouteModalProps) => {
    const dispatch = useDispatch();
    const [title, setTitle] = useState("");
    const [addedLocations, setAddedLocations] = useState<ILocationCreate[]>([]);
    const [selectedGuards, setSelectedGuards] = useState<number[]>([]);
    
    // Data sources
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [allGuards, setAllGuards] = useState<User[]>([]);
    
    // UI Local State
    const [selectedLocId, setSelectedLocId] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && editConfig) {
            setTitle(editConfig.title);
            const mapped = editConfig.recurringLocations.map((rl: any) => ({
                locationId: rl.location.id,
                locationName: rl.location.name,
                tasks: rl.tasks.map((t: any) => ({
                    description: t.description,
                    reqPhoto: t.reqPhoto
                }))
            }));
            setAddedLocations(mapped);
            if (editConfig.guards) {
                setSelectedGuards(editConfig.guards.map((g: any) => g.id));
            } else {
                setSelectedGuards([]);
            }
        } else if (isOpen) {
            setTitle("");
            setAddedLocations([]);
            if (allGuards.length > 0) {
                 setSelectedGuards(allGuards.map(g => g.id));
            }
        }
    }, [isOpen, editConfig, allGuards]);

    const fetchInitialData = async () => {
        const [locRes, usersRes] = await Promise.all([
            getLocations(),
            getUsers()
        ]);

        if (locRes.success && locRes.data) {
            setAllLocations(locRes.data);
        }
        
        if (usersRes.success && usersRes.data) {
            const guards = usersRes.data.filter(u => {
                const roleName = typeof u.role === 'object' ? u.role.name : u.role;
                return (roleName === 'GUARD' || roleName === 'SHIFT' || roleName === 'MAINT') && u.active;
            });
            setAllGuards(guards);
            if (!editConfig) {
                setSelectedGuards(guards.map(g => g.id));
            }
        }
    };

    const handleAddLocation = () => {
        if (!selectedLocId) return;
        const locIdNum = Number(selectedLocId);
        if (addedLocations.find(l => l.locationId === locIdNum)) {
            dispatch(showToast({ message: "La ubicación ya está en la lista", type: "warning" }));
            return;
        }
        const locObj = allLocations.find(l => l.id === locIdNum);
        if (!locObj) return;
        setAddedLocations([...addedLocations, {
            locationId: locIdNum,
            locationName: locObj.name,
            tasks: []
        }]);
        setSelectedLocId("");
    };

    const handleRemoveLocation = (index: number) => {
        const copy = [...addedLocations];
        copy.splice(index, 1);
        setAddedLocations(copy);
    };

    const handleAddTask = (locIndex: number) => {
        const copy = [...addedLocations];
        copy[locIndex].tasks.push({ description: "", reqPhoto: false });
        setAddedLocations(copy);
    };

    const handleRemoveTask = (locIndex: number, taskIndex: number) => {
        const copy = [...addedLocations];
        copy[locIndex].tasks.splice(taskIndex, 1);
        setAddedLocations(copy);
    };

    const handleTaskChange = (locIndex: number, taskIndex: number, val: string) => {
        const copy = [...addedLocations];
        copy[locIndex].tasks[taskIndex].description = val;
        setAddedLocations(copy);
    };

    const handleTaskPhoto = (locIndex: number, taskIndex: number) => {
        const copy = [...addedLocations];
        copy[locIndex].tasks[taskIndex].reqPhoto = !copy[locIndex].tasks[taskIndex].reqPhoto;
        setAddedLocations(copy);
    };

    const handlePrintQRs = async () => {
        try {
            await printLocationQRs(
                addedLocations.map(l => ({ id: l.locationId, name: l.locationName ?? `Ubicación ${l.locationId}` })),
                title.trim() || undefined,
            );
        } catch {
            dispatch(showToast({ message: "No se pudieron generar los QR", type: "error" }));
        }
    };

    const toggleGuard = (guardId: number) => {
        if (selectedGuards.includes(guardId)) {
            setSelectedGuards(selectedGuards.filter(id => id !== guardId));
        } else {
            setSelectedGuards([...selectedGuards, guardId]);
        }
    };

    const toggleAllGuards = () => {
        if (selectedGuards.length === allGuards.length) {
            setSelectedGuards([]);
        } else {
            setSelectedGuards(allGuards.map(g => g.id));
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            dispatch(showToast({ message: "Ingresa un nombre para la ruta", type: "warning" }));
            return;
        }
        if (addedLocations.length === 0) {
            dispatch(showToast({ message: "Agrega al menos una ubicación", type: "warning" }));
            return;
        }
        setLoading(true);
        try {
            const payload = { title, locations: addedLocations, guardIds: selectedGuards };
            let res = editConfig ? await updateRoute(editConfig.id, payload) : await createRoute(payload);
            if (res.success) {
                dispatch(showToast({ message: "Guardado correctamente", type: "success" }));
                onSuccess();
                onClose();
            } else {
                dispatch(showToast({ message: "Error al guardar: " + (res.messages?.join(", ") || ""), type: "error" }));
            }
        } catch (e) {
            dispatch(showToast({ message: "Error de conexión", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const availableLocations = allLocations.filter(l => !addedLocations.find(al => al.locationId === l.id));
    const canSave = !loading && !!title.trim() && addedLocations.length > 0;

    return (
        <ITDialog
            isOpen={isOpen}
            onClose={onClose}
            title={editConfig ? "Ajustar ruta" : "Nueva ruta"}
            className="!w-full !max-w-5xl !rounded-3xl"
        >
            <div className="flex flex-col lg:flex-row gap-6 h-[66vh] min-h-[420px] px-1 pt-1">

                {/* Izquierda: nombre y personal */}
                <aside className="lg:w-[300px] flex-shrink-0 flex flex-col gap-5 lg:border-r border-slate-100 lg:pr-6 min-h-0">
                    <ITInput
                        name="title"
                        label="Nombre de la ruta"
                        placeholder="Ej: Ronda perimetral nocturna"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => {}}
                    />

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Personal</h3>
                                <p className="text-[11px] text-slate-400">{selectedGuards.length} de {allGuards.length} asignados</p>
                            </div>
                            <button
                                type="button"
                                onClick={toggleAllGuards}
                                className="text-[11px] font-bold text-[#065911] hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                            >
                                {selectedGuards.length === allGuards.length ? "Limpiar" : "Marcar todos"}
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
                            {allGuards.map(guard => {
                                const on = selectedGuards.includes(guard.id);
                                return (
                                    <button
                                        type="button"
                                        key={guard.id}
                                        onClick={() => toggleGuard(guard.id)}
                                        aria-pressed={on}
                                        className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-colors ${
                                            on ? "bg-emerald-50/60 border-emerald-200" : "bg-white border-transparent hover:bg-slate-50"
                                        }`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${on ? "bg-[#065911] text-white" : "bg-slate-100 text-slate-400"}`}>
                                            {guard.name[0]}{guard.lastName?.[0] || ""}
                                        </span>
                                        <span className={`flex-1 min-w-0 truncate text-[13px] font-semibold ${on ? "text-slate-800" : "text-slate-500"}`}>
                                            {guard.name} {guard.lastName}
                                        </span>
                                        <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${on ? "bg-[#065911] border-[#065911]" : "border-slate-300 bg-white"}`}>
                                            {on && <FaCheck className="text-white" size={8} />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Derecha: puntos de control */}
                <section className="flex-1 min-w-0 flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Puntos de control</h3>
                            <p className="text-[11px] text-slate-400">{addedLocations.length} {addedLocations.length === 1 ? "punto" : "puntos"} en el recorrido</p>
                        </div>
                        <button
                            type="button"
                            onClick={handlePrintQRs}
                            disabled={addedLocations.length === 0}
                            title="Imprime los QR de todos los puntos de esta ruta"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <FaPrint size={12} /> Imprimir QRs
                        </button>
                    </div>

                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                        <div className="flex-1 min-w-0">
                            <ITSearchSelect
                                placeholder="Busca una ubicación para agregarla..."
                                noResultsMessage="No hay ubicaciones disponibles"
                                value={selectedLocId}
                                onChange={(val) => setSelectedLocId(String(val))}
                                options={availableLocations.map(l => ({
                                    label: `${l.name} (${l.aisle}-${l.number})`,
                                    value: String(l.id),
                                }))}
                            />
                        </div>
                        <ITButton onClick={handleAddLocation} disabled={!selectedLocId} color="primary" variant="filled">
                            <span className="flex items-center gap-1.5"><FaPlus size={10} /> Añadir</span>
                        </ITButton>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto pt-4 pr-1 space-y-3">
                        {addedLocations.map((loc, idx) => (
                            <div key={loc.locationId} className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#065911] text-sm font-black flex items-center justify-center flex-shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{loc.locationName}</h4>
                                        <p className="text-[11px] text-slate-400">
                                            {loc.tasks.length === 0 ? "Sin consignas" : `${loc.tasks.length} ${loc.tasks.length === 1 ? "consigna" : "consignas"}`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAddTask(idx)}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#065911] hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                    >
                                        <FaPlus size={8} /> Consigna
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLocation(idx)}
                                        aria-label={`Quitar ${loc.locationName}`}
                                        className="w-8 h-8 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors flex items-center justify-center"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>

                                {loc.tasks.length > 0 && (
                                    <div className="px-4 pb-3 space-y-2">
                                        {loc.tasks.map((task, tIdx) => (
                                            <div key={tIdx} className="flex items-center gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <ITInput
                                                        name={`task-${idx}-${tIdx}`}
                                                        placeholder="Instrucción para el guardia..."
                                                        value={task.description}
                                                        onChange={(e) => handleTaskChange(idx, tIdx, e.target.value)}
                                                        onBlur={() => {}}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTaskPhoto(idx, tIdx)}
                                                    aria-pressed={task.reqPhoto}
                                                    title={task.reqPhoto ? "Requiere foto" : "No requiere foto"}
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                                                        task.reqPhoto ? "bg-emerald-50 border-emerald-200 text-[#065911]" : "border-slate-200 text-slate-300 hover:text-slate-500"
                                                    }`}
                                                >
                                                    <FaCamera size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTask(idx, tIdx)}
                                                    aria-label="Quitar consigna"
                                                    className="w-9 h-9 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center flex-shrink-0 transition-colors"
                                                >
                                                    <FaMinus size={11} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {addedLocations.length === 0 && (
                            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                                    <FaRoute size={26} />
                                </div>
                                <h5 className="text-slate-700 font-bold mb-1">Ruta vacía</h5>
                                <p className="text-slate-400 text-xs max-w-xs">Busca y agrega los puntos de control que forman este recorrido.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                <ITButton onClick={onClose} variant="outlined" color="secondary" className="!rounded-xl">
                    Descartar
                </ITButton>
                <ITButton
                    onClick={handleSave}
                    color="primary"
                    disabled={!canSave}
                    className="!rounded-xl !bg-[#065911] hover:!bg-[#04400c] disabled:!opacity-40"
                >
                    {loading ? "Guardando..." : editConfig ? "Guardar cambios" : "Crear ruta"}
                </ITButton>
            </div>
        </ITDialog>
    );
};
