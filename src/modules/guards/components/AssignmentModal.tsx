import { ITButton, ITDialog, ITBadget } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaCamera, FaClipboardList, FaMapMarkerAlt } from "react-icons/fa";
import { getLocations, Location } from "../../locations/service/locations.service";
import { createAssignment } from "../service/guards.service";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { AppState } from "@app/core/store/store";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    guardId: number;
    guardName: string;
    onSuccess: () => void;
}

export const AssignmentModal = ({ isOpen, onClose, guardId, guardName, onSuccess }: Props) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    const [tasks, setTasks] = useState<{ description: string; reqPhoto: boolean }[]>([]);
    const [tempTaskDesc, setTempTaskDesc] = useState("");
    const [tempTaskPhoto, setTempTaskPhoto] = useState(false);

    const dispatch = useDispatch();
    const currentUser = useSelector((state: AppState) => state.auth);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            // Reset form
            setSelectedLocationId("");
            setNotes("");
            setTasks([]);
            setTempTaskDesc("");
            setTempTaskPhoto(false);
        }
    }, [isOpen]);

    const fetchData = async () => {
        const res = await getLocations();
        if (res.success && res.data) {
            setLocations(res.data);
        }
    };

    const addTask = () => {
        if (!tempTaskDesc.trim()) return;
        setTasks([...tasks, { description: tempTaskDesc, reqPhoto: tempTaskPhoto }]);
        setTempTaskDesc("");
        setTempTaskPhoto(false);
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedLocationId) {
            dispatch(showToast({ message: "Selecciona una ubicación", type: "error" }));
            return;
        }

        setSubmitting(true);
        try {
            const res = await createAssignment({
                guardId,
                locationId: Number(selectedLocationId),
                assignedBy: Number(currentUser.id) || 1,
                notes,
                tasks: tasks.length > 0 ? tasks : undefined
            });

            if (res.success) {
                dispatch(showToast({ message: "Asignación creada correctamente", type: "success" }));
                onSuccess();
            } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al crear asignación", type: "error" }));
            }
        } catch (error: any) {
            dispatch(showToast({ message: error.message || "Error al crear asignación", type: "error" }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ITDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Asignar Tarea Especial a ${guardName}`}
            className="!max-w-2xl w-full"
        >
            <div className="p-6">
                <div className="space-y-6">
                    {/* Location Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[#065911]" />
                            Ubicación
                        </label>
                        <select
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-[#065911] focus:border-transparent transition-all outline-none"
                        >
                            <option value="">Seleccionar ubicación...</option>
                            {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tasks Section */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <FaClipboardList className="text-[#065911]" />
                            Tareas Adicionales
                        </label>
                        
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Descripción de la tarea..."
                                value={tempTaskDesc}
                                onChange={(e) => setTempTaskDesc(e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#065911]"
                                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                            />
                            <button
                                onClick={() => setTempTaskPhoto(!tempTaskPhoto)}
                                title={tempTaskPhoto ? "Foto requerida" : "Sin foto"}
                                className={`p-2.5 rounded-xl border transition-all ${
                                    tempTaskPhoto 
                                    ? "bg-[#065911] text-white border-[#065911]" 
                                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <FaCamera />
                            </button>
                            <ITButton
                                onClick={addTask}
                                size="small"
                                className="!bg-[#065911] !h-[38px] !px-4"
                                disabled={!tempTaskDesc.trim()}
                            >
                                <FaPlus />
                            </ITButton>
                        </div>

                        {tasks.length > 0 ? (
                            <div className="space-y-2">
                                {tasks.map((task, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-slate-700 font-medium">{task.description}</span>
                                            {task.reqPhoto && (
                                                <ITBadget color="success" size="small" variant="filled" className="!px-2 !py-0.5">
                                                    <div className="flex items-center gap-1 text-[10px]">
                                                        <FaCamera />
                                                        <span>FOTO</span>
                                                    </div>
                                                </ITBadget>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => removeTask(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-2">No hay tareas agregadas</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notas Generales (opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Instrucciones adicionales..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 h-24 resize-none outline-none focus:ring-1 focus:ring-[#065911]"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <ITButton
                        variant="outlined"
                        color="secondary"
                        onClick={onClose}
                    >
                        Cancelar
                    </ITButton>
                    <ITButton
                        variant="solid"
                        onClick={handleSubmit}
                        disabled={!selectedLocationId || submitting}
                        className="!bg-[#065911]"
                    >
                        {submitting ? "Creando..." : "Crear Asignación"}
                    </ITButton>
                </div>
            </div>
        </ITDialog>
    );
};
