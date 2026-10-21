import { ITBadget, ITButton, ITCard, ITDataTable, ITDialog, ITEmptyState, ITFlex, ITGrid, ITLoader, ITProgress, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCheckDouble,
  FaChevronRight,
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

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

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

  const media = selectedAssignment?.kardex?.flatMap((k: any) => k.media || []).map((m: any) => ({
    ...m,
    url: m.url.startsWith("http") ? m.url : `${API_BASE_URL}${m.url.replace("/api/v1", "")}`,
  }));

  const completedTasks = selectedAssignment?.tasks.filter((task) => task.completed).length ?? 0;

  const Header = () => (
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
          {initials(guardName)}
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
  );

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={selectedAssignment ? "Detalle de asignación" : "Tareas asignadas"}
      className="w-[980px] h-[720px] max-w-[95vw] max-h-[90vh]"
    >
      <ITFlex direction="column" gap={4} className="min-h-0 overflow-y-auto px-2">
        <Header />

        {loading && !selectedAssignment && assignments.length === 0 ? (
          <ITFlex justify="center" className="py-16"><ITLoader /></ITFlex>
        ) : selectedAssignment ? (
          <ITFlex direction="column" gap={4}>
            <ITCard className="rounded-2xl border-0! bg-emerald-50/60! shadow-none!" contentClassName="p-4!">
              <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                <ITFlex align="center" gap={3}>
                  <ITFlex align="center" justify="center" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#065911] text-white"><FaMapMarkerAlt size={15} /></ITFlex>
                  <ITFlex direction="column">
                    <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70">Asignación #{selectedAssignment.id}</ITText>
                    <ITText as="p" className="text-lg font-black text-emerald-950 dark:text-emerald-100">{selectedAssignment.location?.name || "Sin ubicación"}</ITText>
                    <ITText as="p" className="text-[11px] text-emerald-700/70">Pasillo {selectedAssignment.location?.aisle ?? "—"} · {dayjs(selectedAssignment.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
                  </ITFlex>
                </ITFlex>
                <ITFlex direction="column" align="end" gap={1}>
                  <ITBadget color={statusColor(selectedAssignment.status) as any} variant="filled" size="sm">{statusTranslations[selectedAssignment.status]}</ITBadget>
                  <ITText as="p" className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{completedTasks}/{selectedAssignment.tasks.length} tareas</ITText>
                </ITFlex>
              </ITFlex>
            </ITCard>

            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12} lg={7}>
                <ITFlex direction="column" gap={4}>
                  <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-3 p-4!">
                    <ITFlex align="center" gap={2}>
                      <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"><FaImage size={12} /></ITFlex>
                      <ITText as="p" className="text-sm font-black text-slate-900 dark:text-white">Evidencia multimedia</ITText>
                    </ITFlex>
                    {media && media.length > 0 ? (
                      <MediaCarousel media={media} title="Evidencia de recorrido" />
                    ) : (
                      <ITEmptyState icon={<FaFileAlt />} title="Sin evidencia visual" description="No se adjuntaron fotos o videos." className="py-8" />
                    )}
                  </ITCard>

                  {selectedAssignment.notes && (
                    <ITCard className="rounded-2xl border-0! bg-amber-50! shadow-none!" contentClassName="space-y-1 p-4!">
                      <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-amber-700">Observaciones</ITText>
                      <ITText as="p" className="text-xs italic text-amber-800">“{selectedAssignment.notes}”</ITText>
                    </ITCard>
                  )}
                </ITFlex>
              </ITGrid>

              <ITGrid item xs={12} lg={5}>
                <ITFlex direction="column" gap={4}>
                  <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-2 p-4!">
                    <ITFlex align="center" justify="between" gap={2} className="mb-2">
                      <ITFlex align="center" gap={2}>
                        <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"><FaCheckCircle size={12} /></ITFlex>
                        <ITText as="p" className="text-sm font-black text-slate-900 dark:text-white">Lista de verificación</ITText>
                      </ITFlex>
                      <ITBadget color="secondary" variant="filled" size="sm">{completedTasks}/{selectedAssignment.tasks.length}</ITBadget>
                    </ITFlex>

                    {selectedAssignment.tasks.length === 0 ? (
                      <ITText as="p" className="py-4 text-center text-xs text-slate-400">Sin consignas registradas.</ITText>
                    ) : (
                      <ITFlex direction="column" gap={2} className="max-h-[300px] overflow-y-auto pr-1">
                        {selectedAssignment.tasks.map((task) => (
                          <ITCard
                            key={task.id}
                            className={`rounded-xl border shadow-none! ${task.completed ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20" : "border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20"}`}
                            contentClassName="p-0!"
                          >
                            <ITFlex align="center" gap={2.5} className="px-3 py-2">
                              <ITFlex align="center" justify="center" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${task.completed ? "bg-[#065911] text-white" : "border-2 border-amber-400 bg-white text-amber-600 dark:bg-slate-800"}`}>
                                {task.completed && <FaCheckCircle size={9} />}
                              </ITFlex>
                              <ITText as="span" className={`min-w-0 flex-1 text-[11px] ${task.completed ? "font-medium text-slate-500 line-through" : "font-bold text-slate-800 dark:text-slate-100"}`}>{task.description}</ITText>
                            </ITFlex>
                          </ITCard>
                        ))}
                      </ITFlex>
                    )}
                  </ITCard>

                  <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-3 p-4!">
                    <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado de la asignación</ITText>
                    <ITBadget color={statusColor(selectedAssignment.status) as any} variant="filled" size="sm">{statusTranslations[selectedAssignment.status]}</ITBadget>
                    <ITFlex direction="column" gap={1} className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-900/40">
                      <ITFlex justify="between">
                        <ITText as="span" className="text-[10px] font-bold text-slate-500">Progreso</ITText>
                        <ITText as="span" className="text-[10px] font-black text-slate-800 dark:text-slate-100">{completedTasks}/{selectedAssignment.tasks.length}</ITText>
                      </ITFlex>
                      <ITProgress value={completedTasks} max={Math.max(selectedAssignment.tasks.length, 1)} color="success" size="sm" />
                    </ITFlex>
                    {selectedAssignment.status === AssignmentStatus.UNDER_REVIEW && (
                      <ITButton color="success" size="md" onClick={() => handleApprove(selectedAssignment.id)} disabled={approvingId === selectedAssignment.id}>
                        <ITFlex align="center" gap={2}>{approvingId === selectedAssignment.id ? "Procesando..." : "Aprobar y finalizar"}<FaCheckDouble /></ITFlex>
                      </ITButton>
                    )}
                  </ITCard>
                </ITFlex>
              </ITGrid>
            </ITGrid>
          </ITFlex>
        ) : assignments.length > 0 ? (
          <ITFlex direction="column" gap={3} className="min-h-0 flex-1">
            <ITFlex align="center" justify="between" gap={2}>
              <ITFlex align="center" gap={2}>
                <ITText as="p" className="text-xs font-bold text-slate-500">Historial</ITText>
                <ITBadget color="secondary" variant="filled" size="sm">{assignments.length}</ITBadget>
              </ITFlex>
              <ITText as="span" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Selecciona una asignación</ITText>
            </ITFlex>

            <ITDataTable
              key={`${assignments.length}-${assignments[0].id}`}
              defaultItemsPerPage={5}
              itemsPerPageOptions={[5, 10, 20]}
              layout="fixed"
              density="compact"
              showViewToggle={false}
              onRowClick={(row: any) => setSelectedAssignment(row)}
              fetchData={async ({ page, limit }) => {
                const start = (page - 1) * limit;
                return { data: assignments.slice(start, start + limit), total: assignments.length };
              }}
              columns={[
                {
                  key: "location",
                  label: "UBICACIÓN",
                  type: "string",
                  sortable: false,
                  render: (row: Assignment) => (
                    <ITFlex align="center" gap={2}>
                      <ITFlex align="center" justify="center" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <FaMapMarkerAlt size={11} />
                      </ITFlex>
                      <ITFlex direction="column">
                        <ITText as="p" className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.location?.name || "Sin ubicación"}</ITText>
                        <ITText as="p" className="text-[10px] text-slate-400">Asignación #{row.id}</ITText>
                      </ITFlex>
                    </ITFlex>
                  ),
                },
                {
                  key: "createdAt",
                  label: "FECHA",
                  type: "string",
                  sortable: false,
                  render: (row: Assignment) => (
                    <ITText as="span" className="text-[11px] font-medium text-slate-500">{dayjs(row.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
                  ),
                },
                {
                  key: "tasks",
                  label: "TAREAS",
                  type: "string",
                  sortable: false,
                  render: (row: Assignment) => (
                    <ITText as="span" className="flex items-center gap-1 text-[11px] text-slate-500"><FaCheckCircle size={9} /> {row.tasks.length}</ITText>
                  ),
                },
                {
                  key: "status",
                  label: "ESTADO",
                  type: "string",
                  sortable: false,
                  render: (row: Assignment) => (
                    <ITBadget color={statusColor(row.status) as any} variant="filled" size="sm">{statusTranslations[row.status]}</ITBadget>
                  ),
                },
                {
                  key: "actions",
                  label: "VER",
                  type: "actions",
                  actions: (row: Assignment) => (
                    <ITButton variant="icon-only" color="secondary" size="sm" icon={<FaChevronRight />} onClick={() => setSelectedAssignment(row)} ariaLabel="Ver detalle" title="Ver detalle" />
                  ),
                },
              ] as any}
            />
          </ITFlex>
        ) : (
          <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="p-4!">
            <ITEmptyState icon={<FaClock />} title="Sin asignaciones" description="No hay registros de tareas especiales para este guardia todavía." className="py-10" />
          </ITCard>
        )}

      </ITFlex>
    </ITDialog>
  );
};
