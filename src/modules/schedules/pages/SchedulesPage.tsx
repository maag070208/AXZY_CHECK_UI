import { ITButton, ITDialog, ITInput, ITLoader, ITTable } from "axzy_ui_system";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { Schedule, createSchedule, deleteSchedule, getSchedules, updateSchedule } from "../SchedulesService";

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      } else {
        await createSchedule({ name, startTime, endTime });
      }
      loadSchedules();
      closeModal();
    } catch (error) {
      alert("Error saving schedule");
    }
  };

  const handleDelete = (id: number) => {
    confirmAlert({
      title: "Eliminar Horario",
      message: "¿Estás seguro de eliminar este horario?",
      buttons: [
        {
          label: "Sí",
          onClick: async () => {
            await deleteSchedule(id);
            loadSchedules();
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  return (
    <div className="p-6 bg-[#f6fbf4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Horarios</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de turnos y horarios operativos</p>
        </div>
        
        <button
           onClick={() => openModal()}
           className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-[#086f16] transition-colors"
        >
          <FaPlus className="text-xs" /> Nuevo Horario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
             <div className="p-10 flex justify-center"><ITLoader /></div>
         ) : (
          <ITTable
            data={schedules}
            columns={[
              { 
                key: "name", 
                label: "Nombre", 
                type: "string", 
                sortable: true,
                render: (row: any) => (
                    <div className="font-bold text-slate-700">{row.name}</div>
                )
              },
              { 
                key: "startTime", 
                label: "Inicio", 
                type: "string", 
                render: (row: any) => (
                    <span className="text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {row.startTime}
                    </span>
                )
              },
              { 
                key: "endTime", 
                label: "Fin", 
                type: "string",
                render: (row: any) => (
                    <span className="text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {row.endTime}
                    </span>
                )
              },
              {
                key: "actions",
                label: "Acciones",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex gap-2">
                    <ITButton 
                        onClick={() => openModal(row)} 
                        size="small"
                        color="primary"
                        variant="outlined"
                        className="!p-2"
                        title="Editar"
                    >
                      <FaEdit />
                    </ITButton>
                    <ITButton 
                        onClick={() => handleDelete(row.id)} 
                        size="small"
                        color="danger"
                        variant="outlined"
                        className="!p-2"
                        title="Eliminar"
                    >
                      <FaTrash />
                    </ITButton>
                  </div>
                ),
              },
            ]}
            itemsPerPageOptions={[10, 20]}
            defaultItemsPerPage={20}
            title=""
          />
        )}
      </div>

      {/* Modal */}
      <ITDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSchedule ? "Editar Horario" : "Nuevo Horario"}
        className="!w-full !max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <ITInput
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {}}
              placeholder="Ej. Matutino"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input
                type="time"
                className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input
                type="time"
                className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-[#065911] text-white rounded-lg hover:bg-[#086f16] transition-colors font-medium">
              Guardar
            </button>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default SchedulesPage;
