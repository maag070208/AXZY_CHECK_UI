import { useState, useEffect } from "react";
import { ITDialog, ITButton, ITInput } from "axzy_ui_system";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import { createRoute, ILocationCreate, updateRoute } from "../services/RoutesService";
import { getLocations, Location } from "../../locations/service/locations.service";

interface CreateRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editConfig?: any; // If editing
}

export const CreateRouteModal = ({ isOpen, onClose, onSuccess, editConfig }: CreateRouteModalProps) => {
    const [title, setTitle] = useState("");
    const [addedLocations, setAddedLocations] = useState<ILocationCreate[]>([]);
    
    // Data sources
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    
    // UI Local State
    const [selectedLocId, setSelectedLocId] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
            if (editConfig) {
                // Map existing config to state
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
            } else {
                setTitle("");
                setAddedLocations([]);
            }
        }
    }, [isOpen, editConfig]);

    const fetchLocations = async () => {
        const res = await getLocations();
        if (res.success && res.data) {
            setAllLocations(res.data);
        }
    };

    const handleAddLocation = () => {
        if (!selectedLocId) return;
        const locIdNum = Number(selectedLocId);
        
        // Find existing
        if (addedLocations.find(l => l.locationId === locIdNum)) {
            alert("La ubicación ya está en la lista");
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

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Ingresa un nombre para la ruta");
            return;
        }
        if (addedLocations.length === 0) {
            alert("Agrega al menos una ubicación");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title,
                locations: addedLocations
            };
            
            let res;
            if (editConfig) {
                res = await updateRoute(editConfig.id, payload);
            } else {
                res = await createRoute(payload);
            }

            if (res.success) {
                alert("Guardado correctamente");
                onSuccess();
                onClose();
            } else {
                alert("Error al guardar: " + (res.messages?.join(", ") || ""));
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    // Filter locations not added
    const availableLocations = allLocations.filter(l => !addedLocations.find(al => al.locationId === l.id));

    return (
        <ITDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title={editConfig ? "Editar Ruta" : "Crear Nueva Ruta"}
            className="!w-full !max-w-4xl"
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <span className="bg-green-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Información General
                    </h3>
                    <ITInput
                         name="title"
                         label="Nombre de la Ruta / Ronda"
                         placeholder="Ej: Ronda Nocturna, Revisión Perimetral"
                         value={title}
                         onChange={(e) => setTitle(e.target.value)}
                         onBlur={() => {}}
                    />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <span className="bg-green-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        Agregar Ubicaciones
                    </h3>
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Ubicación</label>
                             <select
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                                value={selectedLocId}
                                onChange={(e) => setSelectedLocId(e.target.value)}
                             >
                                <option value="">-- Seleccione --</option>
                                {availableLocations.map(l => (
                                    <option key={l.id} value={l.id}>{l.name} ({l.aisle}-{l.number})</option>
                                ))}
                             </select>
                        </div>
                        <ITButton 
                            onClick={handleAddLocation} 
                            disabled={!selectedLocId}
                            color="primary"
                        >
                            <FaPlus className="mr-2" /> Agregar
                        </ITButton>
                    </div>
                </div>

                {addedLocations.length > 0 && (
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="bg-green-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                            Tareas por Ubicación
                        </h3>
                        
                        <div className="space-y-4">
                            {addedLocations.map((loc, idx) => (
                                <div key={loc.locationId} className="bg-white border p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b">
                                        <h4 className="font-bold text-slate-800">#{idx + 1} - {loc.locationName}</h4>
                                        <button onClick={() => handleRemoveLocation(idx)} className="text-red-500 hover:text-red-700">
                                            <FaTrash />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                        {loc.tasks.map((task, tIdx) => (
                                            <div key={tIdx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder={`Tarea ${tIdx + 1}`}
                                                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                                                    value={task.description}
                                                    onChange={(e) => handleTaskChange(idx, tIdx, e.target.value)}
                                                />
                                                <button onClick={() => handleRemoveTask(idx, tIdx)} className="text-red-400 hover:text-red-600">
                                                    <FaMinus />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => handleAddTask(idx)}
                                        className="text-sm text-green-700 font-medium hover:underline flex items-center gap-1"
                                    >
                                        <FaPlus size={10} /> Agregar Tarea
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <ITButton onClick={onClose} variant="text" color="secondary">Cancelar</ITButton>
                    <ITButton 
                        onClick={handleSave} 
                        color="primary"
                        disabled={loading || !title || addedLocations.length === 0}
                    >
                        {loading ? "Guardando..." : "Guardar Ruta"}
                    </ITButton>
                </div>

            </div>
        </ITDialog>
    );
};
