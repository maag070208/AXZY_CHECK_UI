import React, { useEffect, useState } from "react";
import { ITButton, ITInput, ITDialog } from "axzy_ui_system";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { confirmAlert } from "react-confirm-alert"; 
import "react-confirm-alert/src/react-confirm-alert.css";
import { Schedule, getSchedules, updateSchedule, createSchedule, deleteSchedule } from "../SchedulesService";

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Horarios</h1>
        <ITButton onClick={() => openModal()} className="bg-blue-600 text-white flex items-center gap-2">
          <FaPlus /> Nuevo Horario
        </ITButton>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules && schedules.length > 0 ? schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.startTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.endTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                  <button onClick={() => openModal(schedule)} className="text-indigo-600 hover:text-indigo-900">
                    <FaEdit size={18} />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} className="text-red-600 hover:text-red-900">
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            )) : null}
            {(!schedules || schedules.length === 0) && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No hay horarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
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
              <label className="block text-sm font-medium text-gray-700">Inicio</label>
              <input
                type="time"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fin</label>
              <input
                type="time"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default SchedulesPage;
