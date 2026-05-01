import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { createUser, updateUser, User } from "../services/UserService";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import { FaCheck, FaUser, FaShieldAlt, FaClipboardCheck, FaClock } from "react-icons/fa";

interface Props {
  userToEdit?: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateUserWizard: React.FC<Props> = ({ userToEdit, onCancel, onSuccess }) => {
  const isEditing = !!userToEdit;
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const { data: roles } = useCatalog('role');

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const roleOptions = useMemo(() => {
    return roles.map(r => ({ label: r.value, value: String(r.id) }));
  }, [roles]);

  const formik = useFormik({
    initialValues: {
      name: userToEdit?.name || "",
      lastName: userToEdit?.lastName || "",
      username: userToEdit?.username || "",
      password: "",
      confirmPassword: "",
      roleId: userToEdit?.roleId ? String(userToEdit.roleId) : "",
      scheduleId: userToEdit?.scheduleId ? String(userToEdit.scheduleId) : "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      lastName: Yup.string().required("Los apellidos son requeridos"),
      username: Yup.string().required("El nombre de usuario es requerido"),
      password: isEditing 
        ? Yup.string().notRequired() 
        : Yup.string().min(6, "Mínimo 6 caracteres").required("La contraseña es requerida"),
      confirmPassword: isEditing 
        ? Yup.string().notRequired() 
        : Yup.string()
        .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
        .required("Debes confirmar la contraseña"),
      roleId: Yup.string().required("Selecciona un rol"),
      scheduleId: Yup.string().when("roleId", {
        is: (val: string) => {
            const role = roles.find(r => String(r.id) === val);
            return role?.name === "GUARD" || role?.name === "SHIFT" || role?.name === "MAINT";
        },
        then: () => Yup.string().required("El horario es obligatorio para personal operativo"),
        otherwise: () => Yup.string().notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      try {
        let res;
        if (isEditing && userToEdit) {
            res = await updateUser(userToEdit.id, {
              name: values.name,
              lastName: values.lastName,
              username: values.username,
              roleId: Number(values.roleId),
              scheduleId: values.scheduleId ? Number(values.scheduleId) : undefined
            });
        } else {
            res = await createUser({
              name: values.name,
              lastName: values.lastName,
              username: values.username,
              password: values.password,
              roleId: Number(values.roleId),
              scheduleId: values.scheduleId ? Number(values.scheduleId) : undefined
            });
        }

        if (res.success) {
          dispatch(showToast({ message: isEditing ? "Usuario editado correctamente" : "Usuario creado correctamente", type: "success" }));
          onSuccess();
        } else {
          dispatch(showToast({ message: res.messages?.[0] || "Error al procesar usuario", type: "error" }));
        }
      } catch (error: any) {
        // Axios service throws the TResult directly on error
        const message = error?.messages?.[0] || "Ocurrió un error inesperado";
        dispatch(showToast({ message, type: "error" }));
      }
    },
  });

  const isOperationalRole = useMemo(() => {
    const selectedRole = roles.find(r => String(r.id) === String(formik.values.roleId));
    if (!selectedRole) return false;
    return selectedRole.name === 'GUARD' || selectedRole.name === 'SHIFT' || selectedRole.name === 'MAINT';
  }, [roles, formik.values.roleId]);

  const steps = [
    {
      label: "Identidad",
      icon: <FaUser />,
      content: (
        <div className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITInput
                    label="Nombre(s)"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.name}
                    touched={formik.touched.name}
                    placeholder="Ej. Roberto"
                />
                <ITInput
                    label="Apellidos"
                    name="lastName"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.lastName}
                    touched={formik.touched.lastName}
                    placeholder="Ej. Garcia Lopez"
                />
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <FaUser size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-700">Identificador de Usuario</h4>
                    <p className="text-xs text-slate-400 mb-4">Este será el alias único con el que el usuario se identificará en el sistema.</p>
                    <ITInput
                        label=""
                        name="username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.username}
                        touched={formik.touched.username}
                        placeholder="Ej. rgarcia"
                        className="!bg-white"
                    />
                </div>
            </div>
        </div>
      ),
    },
    {
      label: "Acceso y Rol",
      icon: <FaShieldAlt />,
      content: (
        <div className="flex flex-col gap-6 p-6">
            <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Configuración de Seguridad</label>
                <ITSelect
                    label="Rol Administrativo"
                    name="roleId"
                    value={formik.values.roleId}
                    onChange={formik.handleChange}
                    options={roleOptions}
                    error={formik.errors.roleId}
                    touched={formik.touched.roleId}
                />
                
                {!isEditing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                        <ITInput
                            label="Contraseña Temporal"
                            name="password"
                            type="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.password}
                            touched={formik.touched.password}
                            placeholder="Mínimo 6 caracteres"
                            className="!bg-white"
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
                            placeholder="Repite la contraseña"
                            className="!bg-white"
                        />
                    </div>
                )}
            </div>

            {isOperationalRole && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                        <FaClock className="text-emerald-500" />
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Horario Laboral</label>
                    </div>
                    <ITSelect
                        label=""
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
      icon: <FaClipboardCheck />,
      content: (
        <div className="flex flex-col gap-6 p-6">
            <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <FaClipboardCheck size={120} />
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-6">Resumen del Perfil</h3>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-black text-lg">
                            {formik.values.name.charAt(0)}{formik.values.lastName.charAt(0)}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</div>
                            <div className="text-lg font-bold text-slate-700">{formik.values.name} {formik.values.lastName}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100/50">
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Usuario</div>
                            <div className="text-sm font-bold text-slate-600">@{formik.values.username}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rol</div>
                            <div className="text-sm font-bold text-slate-600">
                                {roles.find(r => String(r.id) === formik.values.roleId)?.value || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {isOperationalRole && (
                        <div className="pt-4 border-t border-slate-100/50">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Turno Asignado</div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                <FaClock className="text-emerald-500" />
                                {schedules.find(s => String(s.id) === formik.values.scheduleId)?.name || 'Sin seleccionar'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center font-medium">Al confirmar, el usuario tendrá acceso inmediato según los permisos de su rol.</p>
        </div>
      ),
    },
  ];

  const validateCurrentStep = async () => {
    const errors = await formik.validateForm();
    const touchedObj: any = {};
    let hasError = false;

    if (currentStep === 0) {
        ['name', 'lastName', 'username'].forEach(field => {
            if ((errors as any)[field]) {
                touchedObj[field] = true;
                hasError = true;
            }
        });
    }

    if (currentStep === 1) {
        ['roleId', ...(!isEditing ? ['password', 'confirmPassword'] : []), ...(isOperationalRole ? ['scheduleId'] : [])].forEach(field => {
            if ((errors as any)[field]) {
                touchedObj[field] = true;
                hasError = true;
            }
        });
    }

    if (hasError) {
        formik.setTouched({ ...formik.touched, ...touchedObj });
        return false;
    }
    return true;
  };

  const handleNext = async () => {
      const isValid = await validateCurrentStep();
      if (!isValid) {
          dispatch(showToast({ message: "Revisa los campos obligatorios", type: "error" }));
          return;
      }

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
        {/* Stepper Header (Exactly like Resident) */}
        <div className="flex justify-between mb-10 px-6 mt-6 relative">
            {/* Progress Line Background */}
            <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 -z-0 mx-auto px-12" style={{ width: 'calc(100% - 4rem)', left: '2rem' }} />
            
            {/* Active Progress Line */}
            <div 
                className="absolute top-5 left-0 h-[2px] bg-emerald-500 transition-all duration-500 ease-in-out -z-0" 
                style={{ 
                    width: `calc(${(currentStep / (steps.length - 1)) * 100}% - ${currentStep === 0 ? '0px' : '2rem'})`,
                    left: '2rem'
                }} 
            />

            {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                        index === currentStep ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-110' : 
                        index < currentStep ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-400'
                    }`}>
                        {index < currentStep ? <FaCheck className="text-xs" /> : index + 1}
                    </div>
                    <div className="absolute -bottom-7 w-max">
                        <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 ${index === currentStep ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {step.label}
                        </span>
                    </div>
                </div>
            ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] mt-10">
            {steps[currentStep].content}
        </div>

        {/* Navigation Buttons (Exactly like Resident) */}
        <div className="flex justify-between px-4 pt-6 pb-2 border-t border-slate-100 mt-4 rounded-b-xl">
            <div>
                 {currentStep === 0 ? (
                    <ITButton type="button" color="secondary" variant="outlined" onClick={onCancel}>Cancelar</ITButton>
                 ) : (
                    <ITButton type="button" color="secondary" variant="outlined" onClick={handleBack}>Atrás</ITButton>
                 )}
            </div>
            <ITButton 
                type="button" 
                onClick={handleNext} 
                disabled={formik.isSubmitting}
                className={currentStep === steps.length - 1 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
                {currentStep === steps.length - 1 ? (
                    formik.isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Confirmar Registro')
                ) : 'Siguiente'}
            </ITButton>
        </div>
    </div>
  );
};
