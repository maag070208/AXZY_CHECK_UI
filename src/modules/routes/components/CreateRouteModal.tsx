import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaCheck, FaMapMarkerAlt, FaMinus, FaPlus, FaRoute, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getLocations, Location } from "../../locations/service/locations.service";
import { getUsers, User } from "../../users/services/UserService";
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

    return (
        <ITDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title={editConfig ? "Ajustar Parámetros de Ruta" : "Configurar Nueva Ruta"}
            className="!w-full !max-w-6xl !rounded-3xl"
        >
            <div className="flex flex-col lg:flex-row gap-10 max-h-[75vh] overflow-hidden p-1">
                
                {/* Left Side: General Info & Guards */}
                <div className="lg:w-1/3 flex flex-col gap-8 border-r border-slate-100 pr-6 overflow-hidden">
                    {/* Fixed Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#065911] rounded-full" />
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Información Base</h3>
                        </div>
                        <ITInput
                             name="title"
                             label="Nombre identificador"
                             placeholder="Ej: Ronda Perimetral Nocturna"
                             value={title}
                             onChange={(e) => setTitle(e.target.value)}
                             onBlur={() => {}}
                             className="!rounded-xl"
                        />
                    </div>

                    {/* Scrollable Guards List */}
                    <div className="flex-1 flex flex-col overflow-hidden mt-2">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#065911] rounded-full" />
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Personal</h3>
                            </div>
                            <button 
                                onClick={toggleAllGuards} 
                                className="text-[9px] font-black uppercase tracking-widest text-[#065911] hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
                            >
                                {selectedGuards.length === allGuards.length ? 'Limpiar Selección' : 'Marcar Todos'}
                            </button>
                        </div>
                        
                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                            {allGuards.map(guard => (
                                <div 
                                    key={guard.id} 
                                    onClick={() => toggleGuard(guard.id)}
                                    className={`
                                        group cursor-pointer p-3 rounded-2xl border flex items-center justify-between transition-all duration-200
                                        ${selectedGuards.includes(guard.id) 
                                            ? 'bg-emerald-50/50 border-[#065911] shadow-sm' 
                                            : 'bg-white border-slate-100 hover:border-slate-200'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${selectedGuards.includes(guard.id) ? 'bg-[#065911] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {guard.name[0]}{guard.lastName?.[0] || ''}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black tracking-tight ${selectedGuards.includes(guard.id) ? 'text-slate-900' : 'text-slate-500'}`}>
                                                {guard.name} {guard.lastName}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <div className={`w-1 h-1 rounded-full ${selectedGuards.includes(guard.id) ? 'bg-[#065911]' : 'bg-slate-300'}`} />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {guard.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedGuards.includes(guard.id) ? 'bg-[#065911] border-[#065911] scale-100' : 'border-slate-200 bg-white scale-90 opacity-50 group-hover:opacity-100 group-hover:scale-100'}`}>
                                         {selectedGuards.includes(guard.id) && <FaCheck className="text-white text-[8px]" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Locations & Tasks */}
                <div className="lg:w-2/3 flex flex-col gap-8 overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6 items-end pb-8 border-b border-slate-100">
                        <div className="flex-1 w-full space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#065911] rounded-full" />
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Puntos de Control a Vincular</h3>
                            </div>
                             <ITSearchSelect
                                placeholder="Escribe el nombre de la ubicación para agregar..."
                                noResultsMessage="No encontramos ubicaciones disponibles"
                                value={selectedLocId}
                                onChange={(val) => setSelectedLocId(String(val))}
                                options={availableLocations.map(l => ({ 
                                    label: `${l.name} (${l.aisle}-${l.number})`, 
                                    value: String(l.id) 
                                }))}
                                className="!rounded-xl"
                             />
                        </div>
                        <ITButton 
                            onClick={handleAddLocation} 
                            disabled={!selectedLocId}
                            color="primary"
                            variant="filled"
                        >
                            Añadir
                        </ITButton>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 space-y-6 pb-6 custom-scrollbar">
                        {addedLocations.map((loc, idx) => (
                            <div key={loc.locationId} className="group bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-all">
                                <div className="flex justify-between items-center p-4 bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#065911] font-black border border-slate-200 shadow-sm">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-base">{loc.locationName}</h4>
                                            <div className="flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-[#065911] text-[10px]" />
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Punto de Control Activo</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveLocation(idx)} className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center">
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                                
                                <div className="p-5 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-[#065911] rounded-full" /> Consignas
                                        </span>
                                        <button 
                                            onClick={() => handleAddTask(idx)}
                                            className="text-[10px] font-black text-[#065911] uppercase tracking-widest flex items-center gap-2 hover:underline"
                                        >
                                            <FaPlus className="text-[8px]" /> Nueva Tarea
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {loc.tasks.map((task, tIdx) => (
                                            <div key={tIdx} className="bg-white p-3.5 rounded-xl border-2 border-slate-100 flex items-center gap-3">
                                                <div className="flex-1">
                                                    <ITInput
                                                        name={`task-${idx}-${tIdx}`}
                                                        placeholder="Instrucción..."
                                                        value={task.description}
                                                        onChange={(e) => handleTaskChange(idx, tIdx, e.target.value)}
                                                        onBlur={() => {}}
                                                        className="!bg-slate-50 !rounded-xl !border-transparent focus:!bg-white focus:!border-[#065911]"
                                                    />
                                                </div>
                                                <button onClick={() => handleRemoveTask(idx, tIdx)} className="text-slate-200 hover:text-rose-500 transition-colors">
                                                    <FaMinus size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {loc.tasks.length === 0 && (
                                            <div className="col-span-2 py-4 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic opacity-60">Sin consignas asignadas</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {addedLocations.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-16">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                                    <FaRoute size={40} />
                                </div>
                                <h5 className="text-slate-800 font-black text-xl mb-2 tracking-tight">Ruta Vacía</h5>
                                <p className="text-slate-400 text-sm max-w-xs font-medium leading-relaxed">
                                    Agrega los puntos de control necesarios para este recorrido.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <ITButton 
                    onClick={onClose} 
                    variant="outlined" 
                    color="secondary" 
                    className="!px-6 !py-2.5 !rounded-xl font-bold text-xs uppercase tracking-widest !border-slate-200 !text-slate-400 hover:!bg-slate-50 transition-colors"
                >
                    Descartar
                </ITButton>
                <ITButton 
                    onClick={handleSave} 
                    color="primary"
                    disabled={loading || !title || addedLocations.length === 0}
                    className="!px-8 !py-2.5 !rounded-xl !bg-[#065911] font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-50 hover:!bg-[#04400c] transition-all active:scale-95 disabled:!opacity-30"
                >
                    {loading ? "Sincronizando..." : editConfig ? "Actualizar" : "Guardar Ruta"}
                </ITButton>
            </div>
        </ITDialog>
    );
};
