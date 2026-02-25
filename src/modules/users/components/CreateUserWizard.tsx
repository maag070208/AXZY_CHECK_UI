import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITSelect, ITButton } from "@axzydev/axzy_ui_system";
import { createUser } from "../services/UserService";

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

import { getSchedules, Schedule } from "../../schedules/SchedulesService";

import { FaEye, FaEyeSlash } from "react-icons/fa";

export const CreateUserWizard: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

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
      scheduleId: "",
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
      scheduleId: Yup.string().when("role", {
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
        scheduleId: values.scheduleId ? Number(values.scheduleId) : undefined
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
            <div className="relative">
            <ITInput
            label="Contraseña"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.password}
            touched={formik.touched.password}
          />
           <button
            type="button"
            className="absolute right-3 top-[2.7rem] text-slate-500 hover:text-slate-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
          </div>
          <div className="relative">
          <ITInput
            label="Confirmar Contraseña"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.confirmPassword}
            touched={formik.touched.confirmPassword}
          />
          <button
            type="button"
            className="absolute right-3 top-[2.7rem] text-slate-500 hover:text-slate-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
          </div>
          <ITSelect
            label="Rol"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
            options={[
              { label: "Guardia", value: "GUARD" },
              { label: "Guardia de Turno", value: "SHIFT_GUARD" },
              { label: "Administrador", value: "ADMIN" },
            ]}
            error={formik.errors.role}
            touched={formik.touched.role}
          />
          
          {(formik.values.role === 'GUARD' || formik.values.role === 'SHIFT_GUARD') && (
            <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <ITSelect
                    label="Horario Asignado"
                    name="scheduleId"
                    value={formik.values.scheduleId}
                    onChange={formik.handleChange}
                    options={schedules.map(s => ({ label: `${s.name} (${s.startTime} - ${s.endTime})`, value: String(s.id) }))}
                    error={formik.errors.scheduleId}
                    touched={formik.touched.scheduleId}
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
                    <span className="text-slate-900">
                        {
                            schedules.find(s => String(s.id) === formik.values.scheduleId) 
                            ? `${schedules.find(s => String(s.id) === formik.values.scheduleId)?.startTime} - ${schedules.find(s => String(s.id) === formik.values.scheduleId)?.endTime}`
                            : 'No seleccionado'
                        }
                    </span>
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
