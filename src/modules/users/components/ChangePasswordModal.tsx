import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import { resetPassword, User } from "../services/UserService";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";

interface Props {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ user, onCancel, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      newPassword: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Las contraseñas no coinciden")
        .required("Requerido"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      const res = await resetPassword(user.id, values.newPassword);
      setLoading(false);

      if (res.success) {
        dispatch(showToast({ message: "Contraseña cambiada correctamente", type: "success" }));
        onSuccess();
      } else {
        dispatch(showToast({ message: "Error al cambiar contraseña", type: "error" }));
      }
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Title Header */}
      <div className="mb-4 px-4 text-center mt-2">
          <h2 className="text-2xl font-bold text-slate-800">
              Cambiar Contraseña
          </h2>
          <p className="text-sm text-slate-500 mt-1">
              Asigna una nueva contraseña de acceso
          </p>
      </div>

      {loading && <ITLoader />}
      
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
        <p className="text-sm text-orange-800">
            Estás cambiando la contraseña para el usuario <strong>{user.username}</strong>. 
            Esta acción no requiere la contraseña anterior.
        </p>
      </div>

      <ITInput
        label="Nueva Contraseña"
        name="newPassword"
        type="password"
        value={formik.values.newPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.newPassword}
      />
      <ITInput
        label="Confirmar Contraseña"
        name="confirmPassword"
        type="password"
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.confirmPassword}
      />

      <div className="flex justify-end gap-3 mt-4">
        <ITButton variant="outlined" color="secondary" onClick={onCancel}>Cancelar</ITButton>
        <ITButton onClick={formik.submitForm} disabled={loading} color="warning">Cambiar Contraseña</ITButton>
      </div>
    </div>
  );
};
