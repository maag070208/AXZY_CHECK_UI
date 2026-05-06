import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog } from "@axzydev/axzy_ui_system";
import React, { useEffect, useState } from "react";
import { FaClock } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import { updateUser } from "../../users/services/UserService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export const QuickScheduleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      getSchedules().then((data) => setSchedules(data));
      setSelectedScheduleId(user?.scheduleId?.toString() || "");
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!selectedScheduleId) {
      dispatch(
        showToast({ message: "Selecciona un horario", type: "warning" }),
      );
      return;
    }

    setLoading(true);
    const res = await updateUser(user.id, {
      scheduleId: Number(selectedScheduleId),
    });
    setLoading(false);

    if (res.success) {
      dispatch(showToast({ message: "Horario actualizado", type: "success" }));
      onSuccess();
    } else {
      dispatch(
        showToast({
          message: res.error || "Error al actualizar",
          type: "error",
        }),
      );
    }
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Horario"
      className="max-w-md w-full"
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            {user?.name.charAt(0)}
            {user?.lastName?.charAt(0) || ""}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Guardia
            </p>
            <p className="font-bold text-slate-700">
              {user?.name} {user?.lastName}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FaClock className="text-indigo-500" /> SELECCIONAR TURNO
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full h-[45px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
            >
              <option value="">Sin horario</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={onClose}
            className="flex-1 !rounded-xl"
            disabled={loading}
          >
            CANCELAR
          </ITButton>
          <ITButton
            onClick={handleSave}
            className="flex-1 !rounded-xl !bg-indigo-600 hover:!bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-100"
          >
            GUARDAR CAMBIOS
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
