import { ITBadget, ITButton, ITCard, ITDialog, ITEmptyState, ITFlex, ITGrid, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCheckDouble,
  FaClock,
  FaFileAlt,
  FaImage,
  FaMapMarkerAlt,
  FaSync,
} from "react-icons/fa";
import { getAllAssignmentsByGuard, updateAssignmentStatus } from "../service/guards.service";
import { Assignment, AssignmentStatus } from "../types/guards.types";
import dayjs from "dayjs";
import { MediaCarousel } from "@app/core/components/MediaCarousel";

const API_BASE_URL = "http://localhost:4444";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: number;
  guardName: string;
}

const statusTranslations: Record<AssignmentStatus, string> = {
  [AssignmentStatus.PENDING]: "Pendiente",
  [AssignmentStatus.CHECKING]: "En proceso",
  [AssignmentStatus.UNDER_REVIEW]: "Bajo revisión",
  [AssignmentStatus.REVIEWED]: "Revisado",
  [AssignmentStatus.ANOMALY]: "Anomalía",
  [AssignmentStatus.COMPLETED]: "Completado",
  [AssignmentStatus.CANCELLED]: "Cancelado",
};

const statusColor = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.REVIEWED: return "success";
    case AssignmentStatus.PENDING: return "warning";
    case AssignmentStatus.ANOMALY: return "danger";
    case AssignmentStatus.CHECKING: return "primary";
    case AssignmentStatus.UNDER_REVIEW: return "success";
    default: return "secondary";
  }
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
      if (selectedAssignment) {
        const updated = res.data.find((a) => a.id === selectedAssignment.id);
        if (updated) setSelectedAssignment(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) fetchAssignments();
    else setSelectedAssignment(null);
  }, [isOpen, guardId]);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    const res = await updateAssignmentStatus(id, AssignmentStatus.REVIEWED);
    if (res.success) await fetchAssignments();
    setApprovingId(null);
  };

  const initials = guardName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const media = selectedAssignment?.kardex?.flatMap((k: any) => k.media || []).map((m: any) => ({
    ...m,
    url: m.url.startsWith("http") ? m.url : `${API_BASE_URL}${m.url.replace("/api/v1", "")}`,
  }));

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={selectedAssignment ? "Detalle de asignación" : "Tareas asignadas"}
      className={`${selectedAssignment ? "w-[1000px]" : "w-[780px]"} max-w-[95vw] max-h-[90vh]`}
    >
      <ITFlex direction="column" gap={4}>
        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
          <ITFlex align="center" gap={2}>
            {selectedAssignment && (
              <ITButton
                variant="icon-only"
                color="secondary"
                size="md"
                icon={<FaArrowLeft />}
                onClick={() => setSelectedAssignment(null)}
                ariaLabel="Volver al historial"
                title="Volver al historial"
              />
            )}
            <ITFlex align="center" justify="center" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#065911] text-xs font-black text-white">
              {initials}
            </ITFlex>
            <ITFlex direction="column">
              <ITText as="p" className="text-sm font-black text-slate-900 dark:text-white">{guardName}</ITText>
              <ITText as="p" className="text-[11px] text-slate-400">
                {selectedAssignment ? `Asignación #${selectedAssignment.id}` : "Historial de tareas especiales"}
              </ITText>
            </ITFlex>
          </ITFlex>
          <ITButton
            variant="icon-only"
            color="secondary"
            size="md"
            icon={<FaSync />}
            onClick={fetchAssignments}
            disabled={loading}
            ariaLabel="Actualizar"
            title="Actualizar"
          />
        </ITFlex>

        {loading && !selectedAssignment && assignments.length === 0 ? (
          <ITFlex justify="center" className="py-16">
            <ITLoader />
          </ITFlex>
        ) : selectedAssignment ? (
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} lg={8}>
              <ITFlex direction="column" gap={4}>
                <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-3 p-4!">
                  <ITFlex align="center" gap={2}>
                    <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <FaImage size={12} />
                    </ITFlex>
                    <ITText as="h3" className="text-sm font-black text-slate-900 dark:text-white">Evidencia multimedia</ITText>
                  </ITFlex>
                  {media && media.length > 0 ? (
                    <MediaCarousel media={media} title="Evidencia de recorrido" />
                  ) : (
                    <ITEmptyState icon={<FaFileAlt />} title="Sin evidencia visual" description="No se adjuntaron fotos o videos." className="py-8" />
                  )}
                </ITCard>

                <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-3 p-4!">
                  <ITFlex align="center" gap={2}>
                    <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <FaCheckCircle size={12} />
                    </ITFlex>
                    <ITText as="h3" className="text-sm font-black text-slate-900 dark:text-white">Lista de verificación</ITText>
                  </ITFlex>
                  {selectedAssignment.tasks.length === 0 ? (
                    <ITText as="p" className="py-4 text-center text-xs text-slate-400">Sin consignas registradas.</ITText>
                  ) : (
                    selectedAssignment.tasks.map((task) => (
                      <ITFlex key={task.id} align="center" gap={2} className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-900/40">
                        <ITFlex align="center" justify="center" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${task.completed ? "bg-[#065911] text-white" : "bg-white text-slate-300 dark:bg-slate-800"}`}>
                          {task.completed && <FaCheckCircle size={9} />}
                        </ITFlex>
                        <ITText as="span" className={`min-w-0 flex-1 text-xs ${task.completed ? "font-medium text-slate-400 line-through" : "font-semibold text-slate-700 dark:text-slate-200"}`}>
                          {task.description}
                        </ITText>
                        {task.completedAt && (
                          <ITText as="span" className="shrink-0 text-[10px] text-slate-400">{dayjs(task.completedAt).format("HH:mm")}</ITText>
                        )}
                      </ITFlex>
                    ))
                  )}
                  {selectedAssignment.notes && (
                    <ITFlex className="rounded-xl bg-amber-50/70 p-3 dark:bg-amber-950/20">
                      <ITText as="p" className="text-xs italic text-amber-800 dark:text-amber-300">“{selectedAssignment.notes}”</ITText>
                    </ITFlex>
                  )}
                </ITCard>
              </ITFlex>
            </ITGrid>

            <ITGrid item xs={12} lg={4}>
              <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-4 p-4!">
                <ITFlex direction="column" gap={0.5}>
                  <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ubicación</ITText>
                  <ITText as="p" className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedAssignment.location?.name}</ITText>
                  <ITText as="p" className="text-[11px] text-slate-400">Pasillo {selectedAssignment.location?.aisle}</ITText>
                </ITFlex>
                <ITFlex direction="column" gap={0.5}>
                  <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado</ITText>
                  <ITBadget color={statusColor(selectedAssignment.status) as any} variant="filled" size="sm">{statusTranslations[selectedAssignment.status]}</ITBadget>
                </ITFlex>
                <ITFlex direction="column" gap={0.5}>
                  <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Registro</ITText>
                  <ITText as="p" className="text-xs font-semibold text-slate-700 dark:text-slate-200">{dayjs(selectedAssignment.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
                </ITFlex>
                {selectedAssignment.status === AssignmentStatus.UNDER_REVIEW && (
                  <ITButton
                    color="success"
                    size="md"
                    onClick={() => handleApprove(selectedAssignment.id)}
                    disabled={approvingId === selectedAssignment.id}
                  >
                    <ITFlex align="center" gap={2}>
                      {approvingId === selectedAssignment.id ? "Procesando..." : "Aprobar y finalizar"}
                      <FaCheckDouble />
                    </ITFlex>
                  </ITButton>
                )}
              </ITCard>
            </ITGrid>
          </ITGrid>
        ) : assignments.length > 0 ? (
          <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-2 p-3!">
            <ITFlex align="center" justify="between" gap={2}>
              <ITFlex align="center" gap={2}>
                <ITText as="p" className="text-xs font-bold text-slate-500">Asignaciones</ITText>
                <ITBadget color="secondary" variant="filled" size="sm">{assignments.length}</ITBadget>
              </ITFlex>
              <ITText as="span" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Ubicación · Fecha · Tareas</ITText>
            </ITFlex>
            {assignments.map((assignment) => (
              <ITCard
                key={assignment.id}
                onClick={() => setSelectedAssignment(assignment)}
                className="rounded-xl border-0! bg-slate-50/70! shadow-none! transition-colors hover:bg-slate-100!"
                contentClassName="p-3!"
              >
                <ITGrid container columns={12} spacing={2} className="items-center">
                  <ITGrid item xs={12} sm={5}>
                    <ITFlex align="center" gap={2}>
                      <ITFlex align="center" justify="center" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 dark:bg-slate-800">
                        <FaMapMarkerAlt size={11} />
                      </ITFlex>
                      <ITFlex direction="column" className="min-w-0">
                        <ITText as="p" className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{assignment.location?.name || "Sin ubicación"}</ITText>
                        <ITText as="p" className="text-[10px] text-slate-400">Asignación #{assignment.id}</ITText>
                      </ITFlex>
                    </ITFlex>
                  </ITGrid>
                  <ITGrid item xs={6} sm={3}>
                    <ITText as="p" className="text-[11px] font-medium text-slate-500">{dayjs(assignment.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
                  </ITGrid>
                  <ITGrid item xs={3} sm={2}>
                    <ITText as="p" className="flex items-center gap-1 text-[11px] text-slate-500"><FaCheckCircle size={9} /> {assignment.tasks.length}</ITText>
                  </ITGrid>
                  <ITGrid item xs={3} sm={2}>
                    <ITFlex justify="end">
                      <ITBadget color={statusColor(assignment.status) as any} variant="filled" size="sm">{statusTranslations[assignment.status]}</ITBadget>
                    </ITFlex>
                  </ITGrid>
                </ITGrid>
              </ITCard>
            ))}
          </ITCard>
        ) : (
          <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="p-4!">
            <ITEmptyState
              icon={<FaClock />}
              title="Sin asignaciones"
              description="No hay registros de tareas especiales para este guardia todavía."
              className="py-10"
            />
          </ITCard>
        )}

        <ITFlex justify="end">
          <ITButton variant="outlined" color="secondary" size="md" onClick={onClose}>Cerrar historial</ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
