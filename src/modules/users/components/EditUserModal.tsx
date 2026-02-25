import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton, ITLoader, ITSelect } from "@axzydev/axzy_ui_system";
import { updateUser, User } from "../services/UserService";

interface Props {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

import { getSchedules, Schedule } from "../../schedules/SchedulesService";

export const EditUserModal: React.FC<Props> = ({ user, onCancel, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);

  React.useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const formik = useFormik({
    initialValues: {
      name: user.name,
      lastName: user.lastName,
      username: user.username,
      shiftStart: user.shiftStart || "",
      shiftEnd: user.shiftEnd || "",
      scheduleId: user.scheduleId ? String(user.scheduleId) : "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Requerido"),
      lastName: Yup.string().required("Requerido"),
      username: Yup.string().required("Requerido"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      const res = await updateUser(user.id, {
        name: values.name,
        lastName: values.lastName,
        username: values.username,
        shiftStart: values.shiftStart,
        shiftEnd: values.shiftEnd,
        scheduleId: values.scheduleId ? Number(values.scheduleId) : undefined
      });
      setLoading(false);

      if (res.success) {
        onSuccess();
      } else {
        alert("Error al actualizar usuario");
      }
    },
  });

  return (
    <div className="flex flex-col gap-6 p-4">
      {loading && <ITLoader />}
      
      <div className="grid grid-cols-2 gap-4">
          <ITInput
            label="Nombre"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
          />
          <ITInput
            label="Apellido"
            name="lastName"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.lastName}
          />
      </div>

      <ITInput
        label="Nombre de Usuario"
        name="username"
        value={formik.values.username}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.username}
      />

      {(user.role === 'GUARD' || user.role === 'SHIFT_GUARD') && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Horario de Turno</h4>
             <ITSelect
                label="Horario Asignado"
                name="scheduleId"
                value={formik.values.scheduleId}
                onChange={formik.handleChange}
                options={schedules.map(s => ({ label: `${s.name} (${s.startTime} - ${s.endTime})`, value: String(s.id) }))}
            />
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <ITButton variant="outlined" color="secondary" onClick={onCancel}>Cancelar</ITButton>
        <ITButton onClick={formik.submitForm} disabled={loading}>Guardar Cambios</ITButton>
      </div>
    </div>
  );
};
