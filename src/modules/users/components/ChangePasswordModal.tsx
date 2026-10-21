import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ITButton, ITCard, ITFlex, ITInput, ITLoader, ITText } from "@axzydev/axzy_ui_system";
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
    <ITFlex direction="column" gap={4}>
      {loading && <ITFlex justify="center" className="py-2"><ITLoader size="sm" /></ITFlex>}

      <ITCard className="rounded-2xl border-0! bg-amber-50! shadow-none!" contentClassName="p-4!">
        <ITText as="p" className="text-xs leading-relaxed text-amber-800">
          Estás cambiando la contraseña de <ITText as="span" className="font-bold">{user.username}</ITText>. No se requiere la contraseña anterior.
        </ITText>
      </ITCard>

      <ITInput label="Nueva contraseña" name="newPassword" type="password" value={formik.values.newPassword} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.errors.newPassword} />
      <ITInput label="Confirmar contraseña" name="confirmPassword" type="password" value={formik.values.confirmPassword} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.errors.confirmPassword} />

      <ITFlex justify="end" gap={2}>
        <ITButton variant="outlined" color="secondary" onClick={onCancel}>Cancelar</ITButton>
        <ITButton onClick={formik.submitForm} disabled={loading} color="warning">Cambiar contraseña</ITButton>
      </ITFlex>
    </ITFlex>
  );
};
