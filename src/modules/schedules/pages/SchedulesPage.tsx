import { ITButton, ITDialog, ITInput, ITTimePicker, ITDataTable, ITPage } from "@axzydev/axzy_ui_system";
import { useState, useCallback, useEffect, useMemo } from "react";
import { FaEdit, FaPlus, FaTrash, FaClock, FaSync, FaSearch, FaTimes } from "react-icons/fa";
import { Schedule, createSchedule, deleteSchedule, updateSchedule, getPaginatedSchedules } from "../SchedulesService";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";

const SchedulesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setRefreshKey(prev => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return { name: searchTerm };
  }, [searchTerm]);

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
      const msg = error.response?.data?.messages?.[0] || "Error al guardar el horario";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  const handleDelete = (id: number) => {
    setScheduleToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!scheduleToDeleteId) return;
    try {
      await deleteSchedule(scheduleToDeleteId);
      setScheduleToDeleteId(null);
      refreshTable();
      dispatch(showToast({ message: "Horario eliminado correctamente", type: "success" }));
    } catch (error: any) {
       const msg = error.response?.data?.messages?.[0] || "Error al eliminar el horario";
       dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Directorio de Horarios"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personal" }, { label: "Directorio de Horarios" }]}
      description="Gestión de turnos operativos, entradas, salidas y controles de asistencia"
      icon={<FaClock size={20} />}
      iconColor="#065911"
      actions={
<div className="flex items-center gap-3">
            <div className="relative">
                <ITInput
                    name="searchSchedule"
                    placeholder="Buscar horario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    containerClassName="w-64"
                    className="!pr-10 !py-2.5 !rounded-lg bg-white"
                />
                {searchTerm ? (
                    <FaTimes 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" 
                        onClick={() => setSearchTerm("")}
                    />
                ) : (
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                )}
            </div>

            <ITButton
               onClick={refreshTable}
               variant="outlined"
               color="secondary"
               className="!px-4 !py-2.5 !rounded-lg !border-slate-400 !text-slate-600 flex items-center gap-2 font-bold text-sm bg-white hover:bg-slate-50"
            >
              <FaSync className={refreshKey % 2 === 0 ? '' : 'rotate-180'} /> Actualizar
            </ITButton>

            <ITButton
               onClick={() => openModal()}
               color="primary"
               className="!px-6 !py-2.5 !rounded-lg !bg-[#065911] hover:!bg-[#04400c] font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              <FaPlus className="text-xs" /> Alta de Horario
            </ITButton>
        </div>
      }
    >

      {/* Table Container */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          key={refreshKey}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          columns={[
            { 
              key: "name", 
              label: "HORARIO", 
              type: "string", 
              sortable: true,
              render: (row: any) => (
                  <div className="flex items-center gap-3 py-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                        {row.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{row.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">ID: {row.id}</div>
                      </div>
                  </div>
              )
            },
            { 
              key: "startTime", 
              label: "ENTRADA", 
              type: "string", 
              render: (row: any) => (
                  <div className="flex items-center gap-2 text-[#065911] font-bold">
                      <FaClock className="text-xs opacity-50" />
                      <span>{row.startTime}</span>
                  </div>
              )
            },
            { 
              key: "endTime", 
              label: "SALIDA", 
              type: "string",
              render: (row: any) => (
                  <div className="flex items-center gap-2 text-slate-600 font-bold">
                      <FaClock className="text-xs opacity-30" />
                      <span>{row.endTime}</span>
                  </div>
              )
            },
            { 
                key: "status", 
                label: "ESTADO", 
                type: "string",
                render: (row: any) => (
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest ${row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {row.active ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </div>
                )
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <div className="flex gap-2">
                  <ITButton 
                      onClick={() => openModal(row)} 
                      size="sm"
                      color="primary"
                      variant="outlined"
                      title="Editar"
                  >
                    <FaEdit />
                  </ITButton>
                  <ITButton 
                      onClick={() => handleDelete(row.id)} 
                      size="sm"
                      color="danger"
                      variant="outlined"
                      title="Eliminar"
                  >
                    <FaTrash />
                  </ITButton>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modal */}
      <ITDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSchedule ? "Editar Horario" : "Nuevo Horario"}
        className="!w-full !max-w-md"
      >
        <div className="space-y-4">
            <ITInput
              label="Nombre del Horario"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {}}
              placeholder="Ej. Matutino"
            />
            <div className="grid grid-cols-2 gap-4">
                <ITTimePicker
                    label="Entrada"
                    name="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    onBlur={() => {}}
                />
                <ITTimePicker
                    label="Salida"
                    name="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    onBlur={() => {}}
                />
            </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <ITButton variant="outlined" color="secondary" onClick={closeModal}>
              Cancelar
            </ITButton>
            <ITButton onClick={handleSave} color="primary" className="!bg-[#065911]">
              Guardar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Delete Confirmation Modal */}
      <ITDialog 
        isOpen={!!scheduleToDeleteId} 
        onClose={() => setScheduleToDeleteId(null)} 
        title="Confirmar Eliminación"
      >
        <div className="p-4">
            <p className="text-slate-600 mb-6">
                ¿Estás seguro de eliminar este horario? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setScheduleToDeleteId(null)}>
                    Cancelar
                </ITButton>
                <ITButton className="!bg-red-600 text-white" onClick={confirmDelete}>
                    Eliminar
                </ITButton>
            </div>
        </div>
      </ITDialog>
    </ITPage>
  );
};

export default SchedulesPage;
