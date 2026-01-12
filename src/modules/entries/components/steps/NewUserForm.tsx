import { createUser } from "@app/modules/users/services/UserService";
import { ITButton, ITInput } from "axzy_ui_system";
import { useFormik } from "formik";
import * as Yup from "yup";

interface Props {
  onCancel: () => void;
  onSuccess: (user: any) => void;
}

export const NewUserForm = ({ onCancel, onSuccess }: Props) => {
  const formik = useFormik({
    initialValues: {
      name: "",
      paternalSurname: "",
      maternalSurname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      paternalSurname: Yup.string().required("Apellido paterno requerido"),
      maternalSurname: Yup.string().required("Apellido materno requerido"),
      email: Yup.string().email("Email inválido").required("Email requerido"),
      password: Yup.string()
        .min(6, "Mínimo 6 caracteres")
        .required("Contraseña requerida"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), undefined], "Las contraseñas no coinciden")
        .required("Confirmar contraseña es requerido"),
    }),
    onSubmit: async (values) => {
      const res = await createUser({
        name: values.name,
        lastName: `${values.paternalSurname} ${values.maternalSurname}`,
        email: values.email,
        password: values.password,
        role: "USER",
      });

      if (res.success && res.data) onSuccess(res.data);
      else alert("Error al crear usuario: " + (res.message  || "Desconocido"));
    },
  });

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-3">
      <h3 className="font-semibold text-gray-800">Nuevo Cliente</h3>

      <ITInput
        name="name"
        label="Nombre"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.name}
        touched={formik.touched.name}
      />

      <div className="grid grid-cols-2 gap-4">
        <ITInput
          name="paternalSurname"
          label="Apellido Paterno"
          value={formik.values.paternalSurname}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.paternalSurname}
          touched={formik.touched.paternalSurname}
        />

        <ITInput
          name="maternalSurname"
          label="Apellido Materno"
          value={formik.values.maternalSurname}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.maternalSurname}
          touched={formik.touched.maternalSurname}
        />
      </div>

      <ITInput
        name="email"
        label="Correo Electrónico"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.email}
        touched={formik.touched.email}
      />

      <div className="grid grid-cols-2 gap-4">
        <ITInput
          name="password"
          label="Contraseña"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.password}
          touched={formik.touched.password}
        />

        <ITInput
          name="confirmPassword"
          label="Confirmar Contraseña"
          type="password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.confirmPassword}
          touched={formik.touched.confirmPassword}
        />
      </div>

      <div className="flex gap-2 mt-2">
        <ITButton onClick={formik.submitForm} disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Guardando..." : "Guardar Cliente"}
        </ITButton>

        <ITButton color="secondary" onClick={onCancel}>
          Cancelar
        </ITButton>
      </div>
    </div>
  );
};
