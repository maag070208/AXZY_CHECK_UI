import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaClipboardList, FaPlus, FaTrash, FaMapMarkerAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { getLocations, Location } from "../../locations/service/locations.service";
import { createAssignment } from "../service/guards.service";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    guardId: number;
    guardName: string;
    onSuccess: () => void;
}

export const AssignmentModal = ({ isOpen, onClose, guardId, guardName, onSuccess }: Props) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string | number | undefined>(undefined);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    const [tasks, setTasks] = useState<{ description: string; reqPhoto: boolean }[]>([]);
    const [tempTaskDesc, setTempTaskDesc] = useState("");

    const dispatch = useDispatch();
    const currentUser = useSelector((state: AppState) => state.auth);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            // Reset form
            setSelectedLocationId(undefined);
            setNotes("");
            setTasks([]);
            setTempTaskDesc("");
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
        setTasks([...tasks, { description: tempTaskDesc, reqPhoto: false }]);
        setTempTaskDesc("");
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

    const locationOptions = locations.map(loc => ({
        label: `${loc.name} (${loc.aisle}-${loc.number})`,
        value: loc.id
    }));

    return (
        <ITDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Asignar Tarea Especial: ${guardName}`}
            className="!max-w-2xl w-full"
        >
            <div className="p-6">
                <div className="space-y-6">
                    {/* Location Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                            <FaMapMarkerAlt className="text-slate-400" /> Ubicación del punto
                        </label>
                        <ITSearchSelect
                            label=""
                            placeholder="Selecciona el punto de control..."
                            options={locationOptions}
                            value={selectedLocationId}
                            onChange={(val) => setSelectedLocationId(val)}
                        />
                    </div>

                    {/* Tasks Section - Camera removed as per user request */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                                <FaClipboardList className="text-slate-400" /> Consignas
                            </label>
                            {tasks.length > 0 && (
                                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase">
                                    {tasks.length} {tasks.length === 1 ? 'Tarea' : 'Tareas'}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex gap-2 mb-4">
                            <ITInput
                                name="tempTaskDesc"
                                placeholder="Describe la consigna..."
                                value={tempTaskDesc}
                                onChange={(e) => setTempTaskDesc(e.target.value)}
                                onBlur={() => {}}
                                className="flex-1 !h-[40px] !py-0 !rounded-xl !border-slate-100"
                            />
                            <ITButton
                                onClick={addTask}
                                size="small"
                                className="!bg-[#065911] !h-[40px] !px-4 !rounded-xl"
                                disabled={!tempTaskDesc.trim()}
                            >
                                <FaPlus size={14} />
                            </ITButton>
                        </div>

                        {tasks.length > 0 ? (
                            <div className="space-y-2">
                                {tasks.map((task, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100">
                                                {index + 1}
                                            </div>
                                            <span className="text-sm text-slate-600 font-medium">{task.description}</span>
                                        </div>
                                        <button 
                                            onClick={() => removeTask(index)}
                                            className="text-slate-300 hover:text-red-400 transition-colors p-1"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-slate-400 italic text-center py-2 font-medium tracking-wide">No se han definido consignas especiales</p>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Notas Generales</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Instrucciones generales para la asignación..."
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-600 h-24 resize-none outline-none focus:border-[#065911] transition-all font-medium placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-slate-50">
                    <ITButton
                        variant="outlined"
                        color="secondary"
                        onClick={onClose}
                        className="!h-[42px] !px-6 !rounded-xl !border-slate-200 !text-slate-500 font-bold text-xs"
                    >
                        Cancelar
                    </ITButton>
                    <ITButton
                        onClick={handleSubmit}
                        disabled={!selectedLocationId || submitting}
                        className="!bg-[#065911] !h-[42px] !px-8 !rounded-xl font-bold text-xs shadow-lg shadow-emerald-50"
                    >
                        {submitting ? "Creando..." : "Crear Asignación"}
                    </ITButton>
                </div>
            </div>
        </ITDialog>
    );
};
