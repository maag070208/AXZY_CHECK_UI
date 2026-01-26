import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITSelect, ITButton, ITTimePicker } from "axzy_ui_system";
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
      username: "",
      password: "",
      confirmPassword: "",
      role: "OPERATOR",
      shiftStart: "",
      shiftEnd: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Requerido"),
      lastName: Yup.string().required("Requerido"),
      username: Yup.string().required("Requerido"),
      password: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
        .required("Requerido"),
        role: Yup.string().required("Requerido"),
      shiftStart: Yup.string().when("role", {
        is: (val: string) => val === "GUARD" || val === "SHIFT_GUARD",
        then: () => Yup.string().required("Requerido para guardias"),
        otherwise: () => Yup.string().notRequired(),
      }),
      shiftEnd: Yup.string().when("role", {
        is: (val: string) => val === "GUARD" || val === "SHIFT_GUARD",
        then: () => Yup.string().required("Requerido para guardias"),
        otherwise: () => Yup.string().notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      // Final submit
      const res = await createUser({
        name: values.name,
        lastName: values.lastName,
        username: values.username,
        password: values.password,
        role: values.role,
        shiftStart: values.shiftStart,
        shiftEnd: values.shiftEnd,
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
            label="Nombre de Usuario"
            name="username"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.username}
            touched={formik.touched.username}
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
              { label: "Guardia", value: "GUARD" },
              { label: "Guardia de Turno", value: "SHIFT_GUARD" },
              { label: "Administrador", value: "ADMIN" },
              { label: "Usuario", value: "USER" },
            ]}
            error={formik.errors.role}
            touched={formik.touched.role}
          />
          
          {(formik.values.role === 'GUARD' || formik.values.role === 'SHIFT_GUARD') && (
            <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <ITTimePicker
                    label="Inicio de Turno"
                    name="shiftStart"
                    value={formik.values.shiftStart}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.shiftStart}
                />
                <ITTimePicker
                    label="Fin de Turno"
                    name="shiftEnd"
                    value={formik.values.shiftEnd}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.shiftEnd}
                />
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Confirmación",
      content: (
        <div className="flex flex-col gap-4 p-4">
          <h3 className="text-lg font-semibold">Resumen de Datos</h3>
          <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-4 rounded-lg">
            <span className="font-medium text-slate-600">Nombre:</span>
            <span className="text-slate-900">{formik.values.name} {formik.values.lastName}</span>
            <span className="font-medium text-slate-600">Usuario:</span>
            <span className="text-slate-900">{formik.values.username}</span>
            <span className="font-medium text-slate-600">Rol:</span>
            <span className="text-slate-900">{formik.values.role}</span>
            {(formik.values.role === 'GUARD' || formik.values.role === 'SHIFT_GUARD') && (
                <>
                    <span className="font-medium text-slate-600">Turno:</span>
                    <span className="text-slate-900">{formik.values.shiftStart} - {formik.values.shiftEnd}</span>
                </>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
             Por favor verifica que la información sea correcta antes de confirmar.
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
      // Basic validation trigger could go here if needed, but Formik handles it on submit usually.
      // For wizard, we might want to validate current step fields.
      // Simple implementation: just move next for now, Formik validates on submit.
      // Ideally check errors for fields in current step.
      if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
      } else {
          formik.submitForm();
      }
  };

  const handleBack = () => {
      if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
      }
  };

  return (
    <div className="w-full">
        {/* Stepper Header */}
        <div className="flex justify-between mb-8 px-4">
            {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-200 ${
                        index === currentStep ? 'border-indigo-600 bg-indigo-600 text-white' : 
                        index < currentStep ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-300 text-gray-400'
                    }`}>
                        {index + 1}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${index === currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {step.label}
                    </span>
                    {index < steps.length - 1 && (
                        <div className="hidden md:block absolute w-full h-0.5 bg-gray-200 top-4 left-1/2 -z-10" />
                    )}
                </div>
            ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">
            {steps[currentStep].content}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between px-4 pt-4 border-t border-slate-100">
            <div>
                 {currentStep === 0 ? (
                    <ITButton color="secondary" variant="outlined" onClick={onCancel}>Cancelar</ITButton>
                 ) : (
                    <ITButton color="secondary" variant="outlined" onClick={handleBack}>Atrás</ITButton>
                 )}
            </div>
            <ITButton 
                onClick={handleNext} 
                disabled={formik.isSubmitting}
            >
                {currentStep === steps.length - 1 ? (
                    formik.isSubmitting ? 'Guardando...' : 'Confirmar y Crear'
                ) : 'Siguiente'}
            </ITButton>
        </div>
    </div>
  );
};
