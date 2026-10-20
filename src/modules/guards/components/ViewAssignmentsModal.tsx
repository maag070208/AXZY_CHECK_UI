import { ITBadget, ITButton, ITDialog, ITFlex, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaMapMarkerAlt, FaSync, FaImage, FaCheckDouble, FaChevronRight, FaArrowLeft, FaLayerGroup, FaFileAlt } from "react-icons/fa";
import { getAllAssignmentsByGuard, updateAssignmentStatus } from "../service/guards.service";
import { Assignment, AssignmentStatus } from "../types/guards.types";
import dayjs from "dayjs";
import { MediaCarousel } from "@app/core/components/MediaCarousel";

// Fallback for API Base URL if constant is missing
const API_BASE_URL = 'http://localhost:4444'; 

interface Props {
    isOpen: boolean;
    onClose: () => void;
    guardId: number;
    guardName: string;
}

const statusTranslations: Record<AssignmentStatus, string> = {
    [AssignmentStatus.PENDING]: "PENDIENTE",
    [AssignmentStatus.CHECKING]: "EN PROCESO",
    [AssignmentStatus.UNDER_REVIEW]: "BAJO REVISIÓN",
    [AssignmentStatus.REVIEWED]: "REVISADO",
    [AssignmentStatus.ANOMALY]: "ANOMALÍA",
    [AssignmentStatus.COMPLETED]: "COMPLETADO",
    [AssignmentStatus.CANCELLED]: "CANCELADO",
};

export const ViewAssignmentsModal = ({ isOpen, onClose, guardId, guardName }: Props) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    const fetchAssignments = async () => {
        setLoading(true);
        const res = await getAllAssignmentsByGuard(guardId);
        if (res.success && res.data) {
            setAssignments(res.data);
            
            // If we are viewing a specific assignment, update its data too
            if (selectedAssignment) {
                const updated = res.data.find(a => a.id === selectedAssignment.id);
                if (updated) setSelectedAssignment(updated);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchAssignments();
        } else {
            setSelectedAssignment(null);
        }
    }, [isOpen, guardId]);

    const handleApprove = async (id: number) => {
        setApprovingId(id);
        const res = await updateAssignmentStatus(id, AssignmentStatus.REVIEWED);
        if (res.success) {
            await fetchAssignments();
        }
        setApprovingId(null);
    };

    const getStatusColor = (status: AssignmentStatus) => {
        switch (status) {
            case AssignmentStatus.REVIEWED: return "success";
            case AssignmentStatus.PENDING: return "warning";
            case AssignmentStatus.ANOMALY: return "danger";
            case AssignmentStatus.CHECKING: return "primary";
            case AssignmentStatus.UNDER_REVIEW: return "success";
            default: return "secondary";
        }
    };

    return (
        <ITDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title={selectedAssignment ? `Detalle de Asignación` : `Tareas Asignadas - ${guardName}`}
            className="!max-w-5xl w-full"
        >
            <ITFlex direction="column" className="p-0 flex flex-col h-[80vh]">
                {/* Header Section */}
                <ITFlex align="center" justify="between" className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <ITFlex align="center" gap={4} className="flex items-center gap-4">
                        {selectedAssignment && (
                            <ITButton
                                variant="icon-only"
                                color="gray"
                                onClick={() => setSelectedAssignment(null)}
                                icon={<FaArrowLeft />}
                               
                            />
                        )}
                        <ITFlex direction="column">
                            <ITText as="h4" className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                {selectedAssignment ? (
                                    <>
                                        <ITText as="span" className="text-slate-400 text-sm font-medium">#{selectedAssignment.id}</ITText>
                                        {selectedAssignment.location?.name}
                                    </>
                                ) : (
                                    <>
                                        <FaClock className="text-[#065911] text-sm" />
                                        Historial de Asignaciones
                                    </>
                                )}
                            </ITText>
                            <ITText as="p" className="text-[11px] text-slate-400 font-medium">
                                {selectedAssignment 
                                    ? dayjs(selectedAssignment.createdAt).format("DD [de] MMMM, YYYY [HH:mm]") 
                                    : `Listado completo para ${guardName}`}
                            </ITText>
                        </ITFlex>
                    </ITFlex>
                    <ITFlex align="center" gap={2} className="flex items-center gap-2">
                        <ITButton
                            variant="icon-only"
                            color="gray"
                            onClick={fetchAssignments}
                            disabled={loading}
                            icon={<FaSync className={loading ? "animate-spin" : ""} />}
                           
                        />
                    </ITFlex>
                </ITFlex>

                {/* Content Area */}
                <ITFlex direction="column" className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
                    {loading && !selectedAssignment && !assignments.length ? (
                        <ITFlex justify="center" className="py-20 flex justify-center"><ITLoader /></ITFlex>
                    ) : selectedAssignment ? (
                        /* DETAIL VIEW */
                        <ITFlex direction="column" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Left Column: Multimedia and Tasks */}
                            <ITFlex direction="column" className="lg:col-span-8 space-y-8">
                                {/* Multimedia */}
                                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <ITFlex align="center" justify="between" className="flex items-center justify-between mb-4">
                                        <ITText as="h5" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <FaImage className="text-indigo-500" />
                                            Evidencia Multimedia
                                        </ITText>
                                        {selectedAssignment.kardex?.some((k: any) => k.media?.length) && (
                                            <ITText as="span" className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">
                                                Registrada
                                            </ITText>
                                        )}
                                    </ITFlex>

                                    {selectedAssignment.kardex?.flatMap((k: any) => k.media || []).length ? (
                                        <MediaCarousel 
                                            media={selectedAssignment.kardex.flatMap((k: any) => k.media || []).map((m: any) => ({
                                                ...m,
                                                url: m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url.replace('/api/v1', '')}`
                                            }))} 
                                            title="Evidencia de Recorrido" 
                                        />
                                    ) : (
                                        <ITFlex direction="column" align="center" justify="center" className="py-12 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50">
                                            <FaFileAlt className="text-slate-200 text-3xl mb-3" />
                                            <ITText as="p" className="text-sm font-medium text-slate-500">Sin evidencia visual</ITText>
                                            <ITText as="p" className="text-[10px] text-slate-400">No se adjuntaron fotos o videos en este reporte.</ITText>
                                        </ITFlex>
                                    )}
                                </section>

                                {/* Tasks Checklist */}
                                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <ITText as="h5" className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
                                        <FaCheckCircle className="text-[#065911]" />
                                        Lista de Verificación
                                    </ITText>
                                    
                                    <ITFlex direction="column" className="space-y-3">
                                        {selectedAssignment.tasks.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-all">
                                                <ITFlex align="center" gap={3} className="flex items-center gap-3">
                                                    <ITFlex direction="column" className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                        task.completed 
                                                            ? 'bg-[#065911] border-[#065911] shadow-md shadow-[#065911]/20' 
                                                            : 'border-slate-200 bg-white'
                                                    }`}>
                                                        {task.completed && <FaCheckCircle className="text-white text-[10px]" />}
                                                    </ITFlex>
                                                    <ITText as="span" className={`text-sm ${task.completed ? 'text-slate-500 line-through font-medium' : 'text-slate-700 font-bold'}`}>
                                                        {task.description}
                                                    </ITText>
                                                </ITFlex>
                                                {task.completedAt && (
                                                    <ITFlex direction="column" align="end" className="flex flex-col items-end">
                                                        <ITText as="span" className="text-[10px] font-bold text-slate-400">COMPLETADA</ITText>
                                                        <ITText as="span" className="text-[10px] text-slate-400">{dayjs(task.completedAt).format("HH:mm")}</ITText>
                                                    </ITFlex>
                                                )}
                                            </div>
                                        ))}
                                    </ITFlex>

                                    {selectedAssignment.notes && (
                                        <ITFlex direction="column" className="mt-8 pt-6 border-t border-slate-50">
                                            <ITText as="h6" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Observaciones Adicionales</ITText>
                                            <ITFlex direction="column" className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                                                <ITText as="p" className="text-sm text-slate-600 italic leading-relaxed">"{selectedAssignment.notes}"</ITText>
                                            </ITFlex>
                                        </ITFlex>
                                    )}
                                </section>
                            </ITFlex>

                            {/* Right Column: Metadata */}
                            <ITFlex direction="column" className="lg:col-span-4 space-y-6">
                                <ITFlex direction="column" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                                    <ITText as="h5" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-6">Resumen de Asignación</ITText>
                                    
                                    <ITFlex direction="column" className="space-y-6">
                                        <ITFlex align="start" gap={4} className="flex items-start gap-4">
                                            <ITFlex align="center" justify="center" className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-sm">
                                                <FaMapMarkerAlt />
                                            </ITFlex>
                                            <ITFlex direction="column">
                                                <ITText as="p" className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ubicación</ITText>
                                                <ITText as="p" className="text-sm font-bold text-slate-800">{selectedAssignment.location?.name}</ITText>
                                                <ITText as="p" className="text-xs text-slate-500">Pasillo {selectedAssignment.location?.aisle}</ITText>
                                            </ITFlex>
                                        </ITFlex>

                                        <ITFlex align="start" gap={4} className="flex items-start gap-4">
                                            <ITFlex align="center" justify="center" className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-sm">
                                                <FaLayerGroup />
                                            </ITFlex>
                                            <ITFlex direction="column">
                                                <ITText as="p" className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Estado Actual</ITText>
                                                <ITFlex direction="column" className="mt-1">
                                                    <ITBadget 
                                                        color={getStatusColor(selectedAssignment.status)} 
                                                        variant="filled"
                                                        size="sm"
                                                        className="!rounded-full !px-3 !py-1 font-bold text-[10px]"
                                                    >
                                                        {statusTranslations[selectedAssignment.status]}
                                                    </ITBadget>
                                                </ITFlex>
                                            </ITFlex>
                                        </ITFlex>

                                        <ITFlex align="start" gap={4} className="flex items-start gap-4">
                                            <ITFlex align="center" justify="center" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500 shadow-sm border border-slate-100">
                                                <FaCalendarAlt />
                                            </ITFlex>
                                            <ITFlex direction="column">
                                                <ITText as="p" className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Fecha de Registro</ITText>
                                                <ITText as="p" className="text-sm font-bold text-slate-800">{dayjs(selectedAssignment.createdAt).format("DD/MM/YYYY")}</ITText>
                                                <ITText as="p" className="text-xs text-slate-500">{dayjs(selectedAssignment.createdAt).format("HH:mm")} hrs</ITText>
                                            </ITFlex>
                                        </ITFlex>
                                    </ITFlex>

                                    {/* Action Button */}
                                    {selectedAssignment.status === AssignmentStatus.UNDER_REVIEW && (
                                        <ITFlex direction="column" className="mt-10">
                                            <ITButton 
                                               
                                                onClick={() => handleApprove(selectedAssignment.id)}
                                                disabled={approvingId === selectedAssignment.id} size="md"
                                            >
                                                <ITFlex align="center" gap={2}><FaCheckDouble fontSize={18} />
                                                <ITText as="span" className="font-bold tracking-tight">
                                                    {approvingId === selectedAssignment.id ? "PROCESANDO..." : "APROBAR Y FINALIZAR"}
                                                </ITText></ITFlex>
                                            </ITButton>
                                        </ITFlex>
                                    )}
                                </ITFlex>
                            </ITFlex>
                        </ITFlex>
                    ) : assignments.length > 0 ? (
                        /* LIST VIEW */
                        <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in duration-300">
                            {assignments.map((assignment) => (
                                <div 
                                    key={assignment.id} 
                                    className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group hover:border-[#065911]/30"
                                    onClick={() => setSelectedAssignment(assignment)}
                                >
                                    <ITFlex align="start" justify="between" className="flex justify-between items-start mb-4">
                                        <ITFlex align="center" gap={4} className="flex items-center gap-4">
                                            <ITFlex direction="column" className={`p-3 rounded-xl transition-all ${
                                                assignment.status === AssignmentStatus.UNDER_REVIEW 
                                                    ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' 
                                                    : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                            }`}>
                                                <FaMapMarkerAlt />
                                            </ITFlex>
                                            <ITFlex direction="column">
                                                <ITText as="h5" className="font-bold text-slate-800 group-hover:text-[#065911] transition-colors">{assignment.location?.name || "Sin Ubicación"}</ITText>
                                                <ITText as="p" className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                                                    <FaCalendarAlt size={10} />
                                                    {dayjs(assignment.createdAt).format("DD/MM/YYYY HH:mm")}
                                                </ITText>
                                            </ITFlex>
                                        </ITFlex>
                                        <ITBadget color={getStatusColor(assignment.status)} size="sm" variant="filled" className="!px-3 !py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            {statusTranslations[assignment.status]}
                                        </ITBadget>
                                    </ITFlex>
                                    
                                    <ITFlex align="center" justify="between" className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                                        <ITFlex align="center" gap={2} className="flex items-center gap-2">
                                            <ITFlex className="flex -space-x-2">
                                                {assignment.tasks.slice(0, 3).map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-[#065911]/10 border-2 border-white flex items-center justify-center text-[10px] text-[#065911] font-bold">
                                                        <FaCheckCircle size={8} />
                                                    </div>
                                                ))}
                                                {assignment.tasks.length > 3 && (
                                                    <ITFlex align="center" justify="center" className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] text-slate-500 font-bold">
                                                        +{assignment.tasks.length - 3}
                                                    </ITFlex>
                                                )}
                                            </ITFlex>
                                            <ITText as="span" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{assignment.tasks.length} Tareas</ITText>
                                        </ITFlex>
                                        <ITFlex direction="column" className="text-slate-300 group-hover:text-[#065911] group-hover:translate-x-1 transition-all">
                                            <FaChevronRight size={14} />
                                        </ITFlex>
                                    </ITFlex>
                                </div>
                            ))}
                        </ITFlex>
                    ) : (
                        <ITFlex direction="column" className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <FaExclamationTriangle className="mx-auto text-slate-200 mb-4" size={48} />
                            <ITText as="h5" className="text-slate-600 font-bold text-lg">Sin asignaciones</ITText>
                            <ITText as="p" className="text-slate-400 text-sm max-w-xs mx-auto">No hay registros de tareas especiales para este guardia todavía.</ITText>
                        </ITFlex>
                    )}
                </ITFlex>

                {/* Footer Section */}
                <ITFlex justify="end" className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end sticky bottom-0 z-10">
                    <ITButton variant="outlined" color="secondary" onClick={onClose}>
                        Cerrar Historial
                    </ITButton>
                </ITFlex>
            </ITFlex>
        </ITDialog>
    );
};
