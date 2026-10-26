import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITCard, ITDialog, ITFlex, ITInput, ITSearchSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaClipboardList, FaMapMarkerAlt, FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { getLocations, Location } from "../../locations/service/locations.service";
import { createAssignment } from "../service/guards.service";
import { PersonAvatar } from "@app/core/components/PersonAvatar";

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
        setTasks([...tasks, { description: tempTaskDesc, reqPhoto: false }]);
        setTempTaskDesc("");
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
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
        <ITDialog isOpen={isOpen} onClose={onClose} title="Nueva asignación" className="w-[600px] max-w-[95vw]">
            <ITFlex direction="column" gap={4}>
                <ITCard className="rounded-2xl border-0! bg-emerald-50/60! shadow-none!" contentClassName="p-3!">
                    <ITFlex align="center" gap={3}>
                        <PersonAvatar name={guardName} size={44} />
                        <ITFlex direction="column">
                            <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70">Guardia</ITText>
                            <ITText as="p" className="text-sm font-bold text-emerald-950 dark:text-emerald-100">{guardName}</ITText>
                            <ITText as="p" className="text-[10px] text-emerald-700/70">Tarea especial</ITText>
                        </ITFlex>
                    </ITFlex>
                </ITCard>

                <ITCard className="rounded-2xl border-0! bg-slate-50/70! shadow-none!" contentClassName="p-4!">
                    <ITFlex align="center" gap={2} className="mb-3">
                        <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 dark:bg-slate-800">
                            <FaMapMarkerAlt size={12} />
                        </ITFlex>
                        <ITText as="p" className="text-xs font-black text-slate-800 dark:text-slate-100">Punto de control</ITText>
                    </ITFlex>
                    <ITSearchSelect placeholder="Selecciona el punto de control..." options={locationOptions} value={selectedLocationId} onChange={(val) => setSelectedLocationId(val)} />
                </ITCard>

                <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-3 p-4!">
                    <ITFlex align="center" justify="between" gap={2}>
                        <ITFlex align="center" gap={2}>
                            <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                <FaClipboardList size={12} />
                            </ITFlex>
                            <ITText as="p" className="text-xs font-black text-slate-800 dark:text-slate-100">Consignas</ITText>
                        </ITFlex>
                        <ITBadget color="secondary" variant="filled" size="sm">{tasks.length}</ITBadget>
                    </ITFlex>

                    <ITFlex align="center" gap={2}>
                        <ITInput name="tempTaskDesc" placeholder="Describe la consigna..." value={tempTaskDesc} onChange={(e) => setTempTaskDesc(e.target.value)} onBlur={() => {}} size="md" />
                        <ITButton onClick={addTask} color="primary" size="md" variant="icon-only" icon={<FaPlus />} disabled={!tempTaskDesc.trim()} ariaLabel="Agregar consigna" title="Agregar consigna" />
                    </ITFlex>

                    {tasks.length > 0 ? (
                        <ITFlex direction="column" gap={1}>
                            {tasks.map((task, index) => (
                                <ITFlex key={index} align="center" gap={2} className="rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-900/40">
                                    <ITFlex align="center" justify="center" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-black text-slate-500 dark:bg-slate-800">{index + 1}</ITFlex>
                                    <ITText as="span" className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">{task.description}</ITText>
                                    <ITButton onClick={() => removeTask(index)} variant="icon-only" color="danger" size="sm" icon={<FaTrash size={11} />} ariaLabel="Quitar consigna" title="Quitar consigna" />
                                </ITFlex>
                            ))}
                        </ITFlex>
                    ) : (
                        <ITText as="p" className="py-2 text-center text-[11px] text-slate-400">Aún no hay consignas. Agrega la primera arriba.</ITText>
                    )}
                </ITCard>

                <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="p-4!">
                    <ITTextarea name="notes" label="Notas generales" rows={3} value={notes} onChange={(value) => setNotes(value)} placeholder="Instrucciones generales para la asignación..." />
                </ITCard>

                <ITFlex justify="end" gap={2}>
                    <ITButton variant="outlined" color="secondary" size="md" onClick={onClose}>Cancelar</ITButton>
                    <ITButton color="primary" size="md" onClick={handleSubmit} disabled={!selectedLocationId || submitting}>
                        {submitting ? "Creando..." : "Crear asignación"}
                    </ITButton>
                </ITFlex>
            </ITFlex>
        </ITDialog>
    );
};
