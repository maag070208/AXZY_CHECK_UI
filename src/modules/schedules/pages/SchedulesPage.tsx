import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { ROLE_LABELS } from "@app/core/constants/roles.constants";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaClock,
  FaEdit,
  FaPlus,
  FaSync,
  FaTimes,
  FaToggleOff,
  FaToggleOn,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  Schedule,
  createSchedule,
  deleteSchedule,
  getPaginatedSchedules,
  getScheduleUsers,
  updateSchedule,
} from "../SchedulesService";

const SchedulesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  // Assigned Users Modal
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, activeFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedSchedules({
        ...params,
        filters: {
          ...params.filters,
          name: searchTerm,
          active: activeFilter,
        },
      });
    },
    [searchTerm, activeFilter],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  // Form State
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [active, setActive] = useState(true);

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setActive(schedule.active);
    } else {
      setEditingSchedule(null);
      setName("");
      setStartTime("07:00");
      setEndTime("15:00");
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, {
          name,
          startTime,
          endTime,
          active,
        });
        dispatch(
          showToast({
            message: "Horario actualizado correctamente",
            type: "success",
          }),
        );
      } else {
        await createSchedule({ name, startTime, endTime, active });
        dispatch(
          showToast({
            message: "Horario creado correctamente",
            type: "success",
          }),
        );
      }
      refreshTable();
      closeModal();
    } catch (error: any) {
      const msg =
        error.response?.data?.messages?.[0] || "Error al guardar el horario";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  const handleDelete = (id: string) => {
    setScheduleToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!scheduleToDeleteId) return;
    try {
      await deleteSchedule(scheduleToDeleteId);
      setScheduleToDeleteId(null);
      refreshTable();
      dispatch(
        showToast({
          message: "Horario eliminado correctamente",
          type: "success",
        }),
      );
    } catch (error: any) {
      const msg =
        error.response?.data?.messages?.[0] || "Error al eliminar el horario";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  const viewAssignedUsers = async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setLoadingUsers(true);
    try {
      const users = await getScheduleUsers(schedule.id);
      setAssignedUsers(users);
    } catch (error) {
      dispatch(
        showToast({ message: "Error al cargar usuarios", type: "error" }),
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <ModuleHeader
        icon={FaClock}
        title="Directorio de Horarios"
        subtitle="Gestión de turnos operativos, entradas, salidas y controles de asistencia"
        actions={
          <>
            <div className="w-64 relative">
              <ITInput
                placeholder="Buscar horario..."
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => {}}
                className="!py-2 !h-[42px] !rounded-xl !pr-10 bg-white shadow-sm border-slate-100"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            <ITTripleFilter
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { label: "Todos", value: "all" },
                { label: "Activos", value: "active" },
                { label: "Inactivos", value: "inactive" },
              ]}
            />

            <ITButton
              onClick={refreshTable}
              variant="outlined"
              color="secondary"
              className="h-[42px] !rounded-xl border-slate-200"
            >
              <div className="flex items-center gap-2">
                <FaSync
                  className={`text-xs ${refreshKey % 2 === 0 ? "" : "rotate-180"} transition-transform duration-500`}
                />
                <span className="text-xs font-bold">Actualizar</span>
              </div>
            </ITButton>

            <ITButton
              onClick={() => openModal()}
              color="primary"
              className="h-[42px] !rounded-xl px-6 bg-emerald-600 shadow-lg shadow-emerald-100"
            >
              <div className="flex items-center gap-2">
                <FaPlus className="text-xs" />
                <span className="font-bold">Nuevo Horario</span>
              </div>
            </ITButton>
          </>
        }
      />

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
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
                    <div className="font-bold text-slate-800 text-sm">
                      {row.name}
                    </div>
                  </div>
                </div>
              ),
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
              ),
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
              ),
            },
            {
              key: "users",
              label: "ASIGNADOS",
              render: (row: any) => (
                <button
                  onClick={() => viewAssignedUsers(row)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                    <FaUsers size={14} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 underline decoration-emerald-200 decoration-2 underline-offset-4">
                    {row._count?.users || 0} personas
                  </span>
                </button>
              ),
            },
            {
              key: "active",
              label: "ESTADO",
              render: (row: any) => (
                <ITBadget
                  label={row.active ? "ACTIVO" : "INACTIVO"}
                  color={row.active ? "success" : "danger"}
                />
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <div className="flex items-center gap-1">
                  <ITButton
                    onClick={() => openModal(row)}
                    size="small"
                    variant="ghost"
                    className="text-slate-400 hover:text-blue-600"
                    title="Editar"
                  >
                    <FaEdit size={14} />
                  </ITButton>
                  <ITButton
                    onClick={() => handleDelete(row.id)}
                    size="small"
                    variant="ghost"
                    className="text-slate-300 hover:text-red-500"
                    title="Eliminar"
                  >
                    <FaTrash size={14} />
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
      >
        <div className="p-4 w-[450px] mx-auto">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
            <ITInput
              label="Nombre del Horario"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {}}
              placeholder="Ej. Matutino"
              className="!rounded-xl border-slate-200 focus:border-emerald-400"
            />
            <div className="grid grid-cols-2 gap-6">
              <ITInput
                label="Entrada"
                name="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onBlur={() => {}}
                className="!rounded-xl border-slate-200"
              />
              <ITInput
                label="Salida"
                name="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                onBlur={() => {}}
                className="!rounded-xl border-slate-200"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${active ? "bg-emerald-100" : "bg-slate-100"}`}
                  >
                    {active ? (
                      <FaToggleOn className="text-emerald-600" />
                    ) : (
                      <FaToggleOff className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {active ? "Horario Activo" : "Horario Inactivo"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Estado de disponibilidad
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300 ${active ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${active ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <ITButton
              variant="ghost"
              onClick={closeModal}
              className="!rounded-xl"
            >
              Cancelar
            </ITButton>
            <ITButton
              onClick={handleSave}
              color="primary"
              className="!rounded-xl px-8 bg-emerald-600"
            >
              {editingSchedule ? "Guardar Cambios" : "Crear Horario"}
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
            ¿Estás seguro de eliminar este horario? Esta acción no se puede
            deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setScheduleToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              className="!bg-red-600 text-white"
              onClick={confirmDelete}
            >
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* View Users Modal */}
      <ITDialog
        isOpen={!!selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        title={`Personal Asignado - ${selectedSchedule?.name}`}
      >
        <div className="p-4 w-[500px]">
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <ITLoader />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Cargando personal...
              </p>
            </div>
          ) : assignedUsers.length > 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                {assignedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 border-b border-slate-200 last:border-0 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {u.name} {u.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {ROLE_LABELS[u.role?.name || ""] || u.role?.name || "Sin Rol"}
                        </p>
                      </div>
                    </div>
                    <ITBadget
                      label={u.active ? "ACTIVO" : "INACTIVO"}
                      color={u.active ? "success" : "danger"}
                    />
                  </div>
                ))}
              </div>
              <div className="p-4 bg-emerald-50 border-t border-emerald-100">
                <p className="text-[10px] text-emerald-700 font-black text-center uppercase tracking-widest">
                  Total: {assignedUsers.length} personas asignadas
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-4">
                <FaUsers size={30} />
              </div>
              <p className="text-slate-500 font-bold text-sm">
                Sin personal asignado
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Este horario no tiene usuarios vinculados aún.
              </p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <ITButton
              onClick={() => setSelectedSchedule(null)}
              color="secondary"
              variant="ghost"
              className="!rounded-xl"
            >
              Cerrar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default SchedulesPage;
