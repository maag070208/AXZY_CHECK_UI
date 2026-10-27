import { ITBadget, ITButton, ITCard, ITDataTable, ITDialog, ITFlex, ITGrid, ITInput, ITPage, ITText, ITTimePicker } from "@axzydev/axzy_ui_system";
import { useState, useCallback } from "react";
import { FaEdit, FaPlus, FaTrash, FaClock, FaSync } from "react-icons/fa";
import { Schedule, createSchedule, deleteSchedule, updateSchedule, getPaginatedSchedules } from "../SchedulesService";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";

const SchedulesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedSchedules(params);
  }, []);

  const refreshTable = () => setRefreshKey(prev => prev + 1);

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
    } else {
      setEditingSchedule(null);
      setName("");
      setStartTime("07:00");
      setEndTime("15:00");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, { name, startTime, endTime });
        dispatch(showToast({ message: "Horario actualizado correctamente", type: "success" }));
      } else {
        await createSchedule({ name, startTime, endTime });
        dispatch(showToast({ message: "Horario creado correctamente", type: "success" }));
      }
      refreshTable();
      closeModal();
    } catch (error: any) {
      const msg = error?.messages?.[0] || "Error al guardar el horario";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  const handleDelete = (id: number) => {
    setScheduleToDeleteId(id);
  };

  const confirmDelete = async () => {
    /* v8 ignore next -- guarda defensiva: el botón solo existe con un horario por eliminar */
    if (!scheduleToDeleteId) return;
    try {
      await deleteSchedule(scheduleToDeleteId);
      setScheduleToDeleteId(null);
      refreshTable();
      dispatch(showToast({ message: "Horario eliminado correctamente", type: "success" }));
    } catch (error: any) {
       const msg = error?.messages?.[0] || "Error al eliminar el horario";
       dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Directorio de Horarios"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Directorio de Horarios" }]}
      description="Gestión de turnos operativos, entradas, salidas y controles de asistencia"
      icon={<FaClock size={20} />}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITButton onClick={refreshTable} variant="icon-only" color="secondary" size="md" icon={<FaSync />} ariaLabel="Actualizar" title="Actualizar" />
          <ITButton onClick={() => openModal()} color="primary" size="md">
            <ITFlex align="center" gap={2}>Alta de horario<FaPlus /></ITFlex>
          </ITButton>
        </ITFlex>
      }
    >

      {/* Table Container */}
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          showViewToggle={false}
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={[
            { 
              key: "name", 
              label: "HORARIO", 
              type: "string", 
              sortable: false,
              render: (row: any) => (
                  <ITFlex align="center" gap={3} className="py-1">
                      <ITFlex align="center" justify="center" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {row.name.charAt(0)}
                      </ITFlex>
                      <ITFlex direction="column">
                        <ITFlex direction="column" className="font-bold text-slate-800 text-sm">{row.name}</ITFlex>
                        <ITFlex direction="column" className="text-[11px] text-slate-400 font-medium">ID: {row.id}</ITFlex>
                      </ITFlex>
                  </ITFlex>
              )
            },
            { 
              key: "startTime", 
              label: "ENTRADA", 
              type: "string", 
              render: (row: any) => (
                  <ITFlex align="center" gap={2} className="flex items-center gap-2 text-[var(--color-primary)] font-bold">
                      <FaClock className="text-xs opacity-50" />
                      <ITText as="span">{row.startTime}</ITText>
                  </ITFlex>
              )
            },
            { 
              key: "endTime", 
              label: "SALIDA", 
              type: "string",
              render: (row: any) => (
                  <ITFlex align="center" gap={2} className="flex items-center gap-2 text-slate-600 font-bold">
                      <FaClock className="text-xs opacity-30" />
                      <ITText as="span">{row.endTime}</ITText>
                  </ITFlex>
              )
            },
            { 
                key: "status", 
                label: "ESTADO", 
                type: "string",
                render: (row: any) => (
                    <ITBadget color={row.active ? "success" : "danger"} variant="filled" size="sm">
                      {row.active ? "Activo" : "Inactivo"}
                    </ITBadget>
                )
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <ITFlex gap={2}>
                  <ITButton
                      onClick={() => openModal(row)}
                      size="md"
                      color="secondary"
                      variant="icon-only"
                      icon={<FaEdit />}
                      ariaLabel="Editar"
                      title="Editar"
                  />
                  <ITButton
                      onClick={() => handleDelete(row.id)}
                      size="md"
                      color="danger"
                      variant="icon-only"
                      icon={<FaTrash />}
                      ariaLabel="Eliminar"
                      title="Eliminar"
                  />
                </ITFlex>
              ),
            },
          ]}
        />
      </ITFlex>

      {/* Modal */}
      <ITDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSchedule ? "Editar Horario" : "Nuevo Horario"}
        className="w-[480px] max-w-[95vw]"
      >
        <ITFlex direction="column" gap={4}>
          <ITCard className="rounded-2xl border-0! bg-white! shadow-none!" contentClassName="space-y-3 p-4!">
            <ITInput label="Nombre del horario" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => {}} placeholder="Ej. Matutino" />
            <ITGrid container columns={2} spacing={3}>
              <ITGrid item xs={6}><ITTimePicker label="Entrada" name="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} onBlur={() => {}} /></ITGrid>
              <ITGrid item xs={6}><ITTimePicker label="Salida" name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} onBlur={() => {}} /></ITGrid>
            </ITGrid>
          </ITCard>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={closeModal}>Cancelar</ITButton>
            <ITButton onClick={handleSave} color="primary">Guardar</ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {/* Delete Confirmation Modal */}
      <ITDialog 
        isOpen={!!scheduleToDeleteId} 
        onClose={() => setScheduleToDeleteId(null)} 
        title="Confirmar Eliminación"
      >
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">¿Estás seguro de eliminar este horario? Esta acción no se puede deshacer.</ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setScheduleToDeleteId(null)}>Cancelar</ITButton>
            <ITButton color="danger" onClick={confirmDelete}>Eliminar horario</ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default SchedulesPage;
