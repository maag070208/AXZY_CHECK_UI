import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { createUser, updateUser, User } from "../services/UserService";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import {
  FaCheck,
  FaUser,
  FaShieldAlt,
  FaClipboardCheck,
  FaClock,
  FaToggleOff,
  FaToggleOn,
  FaArrowLeft,
  FaArrowRight,
  FaSave,
  FaUserCheck,
  FaIdCard,
  FaKey,
  FaUserTag,
} from "react-icons/fa";

interface Props {
  userToEdit?: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateUserWizard: React.FC<Props> = ({
  userToEdit,
  onCancel,
  onSuccess,
}) => {
  const isEditing = !!userToEdit;
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const { data: roles } = useCatalog("role");

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const roleOptions = useMemo(() => {
    return roles.map((r) => ({ label: r.value, value: String(r.id) }));
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
      active: userToEdit?.active ?? true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      lastName: Yup.string().required("Los apellidos son requeridos"),
      username: Yup.string().required("El nombre de usuario es requerido"),
      password: isEditing
        ? Yup.string().notRequired()
        : Yup.string()
            .min(6, "Mínimo 6 caracteres")
            .required("La contraseña es requerida"),
      confirmPassword: isEditing
        ? Yup.string().notRequired()
        : Yup.string()
            .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
            .required("Debes confirmar la contraseña"),
      roleId: Yup.string().required("Selecciona un rol"),
      scheduleId: Yup.string().when("roleId", {
        is: (val: string) => {
          const role = roles.find((r) => String(r.id) === val);
          return (
            role?.name === "GUARD" ||
            role?.name === "SHIFT" ||
            role?.name === "MAINT"
          );
        },
        then: () =>
          Yup.string().required(
            "El horario es obligatorio para personal operativo",
          ),
        otherwise: () => Yup.string().notRequired(),
      }),
      active: Yup.boolean().required(),
    }),
    onSubmit: async (values) => {
      try {
        let res;
        if (isEditing && userToEdit) {
          res = await updateUser(userToEdit.id, {
            name: values.name,
            lastName: values.lastName,
            username: values.username,
            roleId: values.roleId,
            scheduleId: values.scheduleId || undefined,
            active: values.active,
          });
        } else {
          res = await createUser({
            name: values.name,
            lastName: values.lastName,
            username: values.username,
            password: values.password,
            roleId: values.roleId,
            scheduleId: values.scheduleId || undefined,
            active: values.active,
          });
        }

        if (res.success) {
          dispatch(
            showToast({
              message: isEditing
                ? "Usuario editado correctamente"
                : "Usuario creado correctamente",
              type: "success",
            }),
          );
          onSuccess();
        } else {
          dispatch(
            showToast({
              message: res?.error || "Error al procesar usuario",
              type: "error",
            }),
          );
        }
      } catch (error: any) {
        const message = error?.error || "Ocurrió un error inesperado";
        dispatch(showToast({ message, type: "error" }));
      }
    },
  });

  const isOperationalRole = useMemo(() => {
    const selectedRole = roles.find(
      (r) => String(r.id) === String(formik.values.roleId),
    );
    if (!selectedRole) return false;
    return (
      selectedRole.name === "GUARD" ||
      selectedRole.name === "SHIFT" ||
      selectedRole.name === "MAINT"
    );
  }, [roles, formik.values.roleId]);

  const steps = [
    {
      label: "Identidad",
      icon: <FaUser />,
      content: (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
                <FaIdCard className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Información Personal
                </h3>
                <p className="text-sm text-slate-500">
                  Datos básicos del usuario
                </p>
              </div>
            </div>

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
                className="!rounded-xl border-slate-200 focus:border-emerald-400"
              />
              <ITInput
                label="Apellidos"
                name="lastName"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.lastName}
                touched={formik.touched.lastName}
                placeholder="Ej. García López"
                className="!rounded-xl border-slate-200 focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center shadow-lg shadow-slate-200">
                <FaUserCheck className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Credenciales de Acceso
                </h3>
                <p className="text-sm text-slate-500">
                  Nombre de usuario único para el sistema
                </p>
              </div>
            </div>

            <ITInput
              label="Nombre de usuario"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.username}
              touched={formik.touched.username}
              placeholder="Ej. rgarcia"
              className="!rounded-xl border-slate-200 focus:border-slate-400"
            />
          </div>
        </div>
      ),
    },
    {
      label: "Acceso y Rol",
      icon: <FaShieldAlt />,
      content: (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg">
                <FaUserTag className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Configuración de Seguridad
                </h3>
                <p className="text-sm text-slate-500">
                  Rol y permisos del usuario
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <ITSelect
                label="Rol del usuario"
                name="roleId"
                value={formik.values.roleId}
                onChange={formik.handleChange}
                options={roleOptions}
                error={formik.errors.roleId}
                touched={formik.touched.roleId}
                className="rounded-xl"
              />

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-all duration-300 ${formik.values.active ? "bg-emerald-100" : "bg-red-100"}`}
                    >
                      {formik.values.active ? (
                        <FaToggleOn className="text-emerald-600 text-2xl" />
                      ) : (
                        <FaToggleOff className="text-red-600 text-2xl" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-bold ${formik.values.active ? "text-emerald-700" : "text-red-700"}`}
                      >
                        {formik.values.active
                          ? "Cuenta Activa"
                          : "Cuenta Inactiva"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formik.values.active
                          ? "El usuario puede acceder al sistema"
                          : "Acceso restringido al sistema"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      formik.setFieldValue("active", !formik.values.active)
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                      formik.values.active ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                        formik.values.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-100">
                  <FaKey className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Contraseña Temporal
                  </h3>
                  <p className="text-sm text-slate-500">
                    Configuración inicial de acceso
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITInput
                  label="Nueva contraseña"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.password}
                  touched={formik.touched.password}
                  placeholder="Mínimo 6 caracteres"
                  className="!rounded-xl"
                />
                <ITInput
                  label="Confirmar contraseña"
                  name="confirmPassword"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.confirmPassword}
                  touched={formik.touched.confirmPassword}
                  placeholder="Repite la contraseña"
                  className="!rounded-xl"
                />
              </div>
            </div>
          )}

          {isOperationalRole && (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg">
                  <FaClock className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Horario Laboral
                  </h3>
                  <p className="text-sm text-slate-500">
                    Turno asignado al personal operativo
                  </p>
                </div>
              </div>

              <ITSelect
                label="Seleccionar horario"
                name="scheduleId"
                value={formik.values.scheduleId}
                onChange={formik.handleChange}
                options={schedules.map((s) => ({
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                  value: String(s.id),
                }))}
                error={formik.errors.scheduleId}
                touched={formik.touched.scheduleId}
                className="!rounded-xl"
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
        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
          <div className="bg-white rounded-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
                <FaClipboardCheck className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Revisar y Confirmar
                </h3>
                <p className="text-sm text-slate-500">
                  Verifica que toda la información sea correcta
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xl font-bold border-2 border-white shadow-md">
                    {formik.values.name.charAt(0)}
                    {formik.values.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Nombre completo
                    </p>
                    <p className="text-xl font-bold text-slate-800">
                      {formik.values.name} {formik.values.lastName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Usuario
                    </p>
                    <p className="text-base font-semibold text-gray-700">
                      @{formik.values.username}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Rol
                    </p>
                    <p className="text-base font-semibold text-gray-700">
                      {roles.find((r) => String(r.id) === formik.values.roleId)
                        ?.value || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Estado
                    </p>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        formik.values.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${formik.values.active ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                      ></span>
                      {formik.values.active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
                </div>

                {isOperationalRole && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Horario asignado
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
                      <FaClock className="text-teal-600" />
                      <span className="font-semibold text-gray-700">
                        {schedules.find(
                          (s) => String(s.id) === formik.values.scheduleId,
                        )?.name || "Sin seleccionar"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs text-emerald-700 text-center font-medium">
                  ⚡ Al confirmar, el usuario recibirá acceso inmediato según
                  los permisos de su rol
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const validateCurrentStep = async () => {
    const errors = await formik.validateForm();
    const touchedObj: any = {};
    let hasError = false;

    if (currentStep === 0) {
      ["name", "lastName", "username"].forEach((field) => {
        if ((errors as any)[field]) {
          touchedObj[field] = true;
          hasError = true;
        }
      });
    }

    if (currentStep === 1) {
      [
        "roleId",
        ...(!isEditing ? ["password", "confirmPassword"] : []),
        ...(isOperationalRole ? ["scheduleId"] : []),
      ].forEach((field) => {
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
      dispatch(
        showToast({ message: "Revisa los campos obligatorios", type: "error" }),
      );
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
    <div className="w-[600px] mx-auto">
      {/* Stepper Header */}
      <div className="relative mb-12 px-10">
        <div className="flex justify-between items-center relative z-10">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 relative z-10 ${
                  index === currentStep
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-110"
                    : index < currentStep
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-white border-2 border-slate-200 text-slate-400"
                }`}
              >
                {index < currentStep ? (
                  <FaCheck className="text-base" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="absolute top-14">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      index === currentStep ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`w-12 h-1 rounded-full transition-all duration-300 ${
                      index <= currentStep
                        ? "bg-emerald-500"
                        : "bg-slate-100"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 rounded-full mx-16">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-2 mb-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {steps[currentStep].content}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <ITButton
          type="button"
          onClick={currentStep === 0 ? onCancel : handleBack}
          variant="ghost"
          className="group flex items-center gap-2 px-6 py-3 !rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <FaArrowLeft className="text-sm group-hover:transform group-hover:-translate-x-1 transition-transform" />
            <span>{currentStep === 0 ? "Cancelar" : "Atrás"}</span>
          </div>
        </ITButton>

        <ITButton
          type="button"
          onClick={handleNext}
          disabled={formik.isSubmitting}
          className="group !px-8 !py-3 !rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            {currentStep === steps.length - 1 ? (
              <>
                {formik.isSubmitting ? (
                  "Guardando..."
                ) : (
                  <>
                    <FaSave className="text-lg" />
                    <span>{isEditing ? "Guardar Cambios" : "Confirmar Registro"}</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span>Siguiente</span>
                <FaArrowRight className="text-sm group-hover:transform group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </ITButton>
      </div>
    </div>
  );
};
