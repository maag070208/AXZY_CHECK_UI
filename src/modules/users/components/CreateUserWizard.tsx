import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITSelect, ITStepper, ITButton } from "axzy_ui_system";
import { createUser } from "../services/UserService";

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateUserWizard: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const formik = useFormik({
    initialValues: {
      name: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "OPERATOR",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Requerido"),
      lastName: Yup.string().required("Requerido"),
      email: Yup.string().email("Email inválido").required("Requerido"),
      password: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
        .required("Requerido"),
      role: Yup.string().required("Requerido"),
    }),
    onSubmit: async (values) => {
      // Final submit
      const res = await createUser({
        name: values.name,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role,
      });

      if (res.success) {
        onSuccess();
      } else {
        alert("Error al crear usuario");
      }
    },
  });

  const steps = [
    {
      label: "Datos Personales",
      content: (
        <div className="flex flex-col gap-4 p-4">
          <ITInput
            label="Nombre"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
            touched={formik.touched.name}
          />
          <ITInput
            label="Apellido"
            name="lastName"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.lastName}
            touched={formik.touched.lastName}
          />
          <ITInput
            label="Email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email}
          />
        </div>
      ),
    },
    {
      label: "Seguridad y Rol",
      content: (
        <div className="flex flex-col gap-4 p-4">
          <ITInput
            label="Contraseña"
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.password}
            touched={formik.touched.password}
          />
          <ITInput
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.confirmPassword}
            touched={formik.touched.confirmPassword}
          />
          <ITSelect
            label="Rol"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
            options={[
              { label: "Operador", value: "OPERATOR" },
              { label: "Líder", value: "LIDER" },
              { label: "Administrador", value: "ADMIN" },
              { label: "Usuario", value: "USER" },
            ]}
            error={formik.errors.role}
            touched={formik.touched.role}
          />
        </div>
      ),
    },
    {
      label: "Confirmación",
      content: (
        <div className="flex flex-col gap-4 p-4">
          <h3 className="text-lg font-semibold">Resumen de Datos</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium text-gray-600">Nombre:</span>
            <span>{formik.values.name} {formik.values.lastName}</span>
            <span className="font-medium text-gray-600">Email:</span>
            <span>{formik.values.email}</span>
            <span className="font-medium text-gray-600">Rol:</span>
            <span>{formik.values.role}</span>
          </div>
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
             Por favor verifica que la información sea correcta antes de confirmar.
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <ITStepper
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onFinish={formik.submitForm}
        allowClickToJump={false}
      />
      <div className="flex justify-start mt-4"> 
         {/* Custom cancel button outside stepper if needed, or use layout */}
         <ITButton color="secondary" onClick={onCancel} className="mt-4">Cancelar Todo</ITButton>
      </div>
    </div>
  );
};
