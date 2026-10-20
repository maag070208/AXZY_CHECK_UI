import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITSearchSelect , ITFlex } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { FaClock, FaEye, FaEyeSlash, FaMagic, FaShieldAlt, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import { createUser, updateUser, User } from "../services/UserService";
import { getVisibleRoles } from "../utils/role.utils";

interface Props {
  userToEdit?: User;
  onCancel: () => void;
  onSuccess: () => void;
}

/** Roles que operan en campo y por tanto necesitan horario. */
const OPERATIONAL_ROLES = ["GUARD", "SHIFT", "MAINT"];

const randomPassword = (length = 10) => {
  // Sin caracteres ambiguos (0/O, 1/l/I) para poder dictarla sin errores.
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

const Section = ({ icon, title, hint, children }: { icon: ReactNode; title: string; hint?: string; children: ReactNode }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[11px]">{icon}</span>
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
      {hint && <span className="text-[11px] text-slate-400 font-medium">· {hint}</span>}
    </div>
    {children}
  </section>
);

/** Alta y edición de usuarios en una sola vista (antes era un asistente de 3 pasos). */
export const CreateUserWizard: React.FC<Props> = ({ userToEdit, onCancel, onSuccess }) => {
  const isEditing = !!userToEdit;
  const dispatch = useDispatch();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const { data: roles } = useCatalog("role");
  const visibleRoles = useMemo(() => getVisibleRoles(roles), [roles]);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const isOperationalRoleId = (roleId: string) => {
    const role = visibleRoles.find((r) => String(r.id) === roleId);
    return !!role && OPERATIONAL_ROLES.includes(role.name);
  };

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
      name: Yup.string().trim().required("El nombre es requerido"),
      lastName: Yup.string().trim().required("Los apellidos son requeridos"),
      username: Yup.string().trim().required("El usuario es requerido"),
      password: isEditing
        ? Yup.string().notRequired()
        : Yup.string().min(6, "Mínimo 6 caracteres").required("La contraseña es requerida"),
      confirmPassword: isEditing
        ? Yup.string().notRequired()
        : Yup.string().oneOf([Yup.ref("password")], "Las contraseñas no coinciden").required("Confirma la contraseña"),
      roleId: Yup.string().required("Selecciona un rol"),
      scheduleId: Yup.string().when("roleId", {
        is: (val: string) => isOperationalRoleId(val),
        then: (s) => s.required("El horario es obligatorio para personal operativo"),
        otherwise: (s) => s.notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      const base = {
        name: values.name.trim(),
        lastName: values.lastName.trim(),
        username: values.username.trim(),
        roleId: Number(values.roleId),
        scheduleId: isOperationalRoleId(values.roleId) && values.scheduleId ? Number(values.scheduleId) : undefined,
      };
      try {
        const res =
          isEditing && userToEdit
            ? await updateUser(userToEdit.id, base)
            : await createUser({ ...base, password: values.password });

        if (res.success) {
          dispatch(showToast({ message: isEditing ? "Usuario editado correctamente" : "Usuario creado correctamente", type: "success" }));
          onSuccess();
        } else {
          dispatch(showToast({ message: res.messages?.[0] || "Error al procesar usuario", type: "error" }));
        }
      } catch (error: any) {
        // El servicio de axios lanza el TResult directamente.
        dispatch(showToast({ message: error?.messages?.[0] || "Ocurrió un error inesperado", type: "error" }));
      }
    },
  });

  const needsSchedule = useMemo(() => {
    const role = visibleRoles.find((r) => String(r.id) === formik.values.roleId);
    return !!role && OPERATIONAL_ROLES.includes(role.name);
  }, [visibleRoles, formik.values.roleId]);
  const scheduleOptions = useMemo(
    () => schedules.map((s) => ({ label: `${s.name} (${s.startTime} - ${s.endTime})`, value: String(s.id) })),
    [schedules],
  );

  const fieldProps = (name: "name" | "lastName" | "username" | "password" | "confirmPassword") => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.errors[name],
    touched: formik.touched[name],
  });

  const generate = () => {
    const pwd = randomPassword();
    formik.setFieldValue("password", pwd);
    formik.setFieldValue("confirmPassword", pwd);
    setShowPassword(true);
  };

  const roleError = formik.touched.roleId && formik.errors.roleId;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="w-full">
      <div className="px-6 py-5 space-y-6">
        <Section icon={<FaUser />} title="Datos personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ITInput label="Nombre(s)" placeholder="Ej. Roberto" {...fieldProps("name")} />
            <ITInput label="Apellidos" placeholder="Ej. García López" {...fieldProps("lastName")} />
          </div>
          <div className="mt-4">
            <ITInput label="Usuario" placeholder="Ej. rgarcia" {...fieldProps("username")} />
            <p className="text-[11px] text-slate-400 mt-1.5">Alias único con el que inicia sesión.</p>
          </div>
        </Section>

        <Section icon={<FaShieldAlt />} title="Acceso" hint={isEditing ? "la contraseña se cambia desde la tabla" : "contraseña temporal"}>
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Rol</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rol">
              {visibleRoles.map((r) => {
                const on = String(r.id) === formik.values.roleId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      formik.setFieldValue("roleId", String(r.id));
                      formik.setFieldTouched("roleId", true, false);
                    }}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                      on
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                  >
                    {r.value}
                  </button>
                );
              })}
            </div>
            {roleError && <p className="text-xs text-red-500 mt-1.5">{formik.errors.roleId}</p>}
          </div>

          {!isEditing && (
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ITInput
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  {...fieldProps("password")}
                />
                <ITInput
                  label="Confirmar contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  {...fieldProps("confirmPassword")}
                />
              </div>
              <div className="mt-3 flex items-center gap-4">
                <ITButton type="button" variant="text" color="primary" size="md" onClick={generate} className="!p-0 gap-1.5 font-bold text-emerald-700 hover:text-emerald-800">
                  <ITFlex align="center" gap={2}><FaMagic size={11} /> Generar contraseña segura
                </ITFlex></ITButton>
                <ITButton type="button" variant="text" color="gray" size="sm" onClick={() => setShowPassword((v) => !v)} className="!p-0 gap-1.5 font-bold text-slate-500 hover:text-slate-700">
                  {showPassword ? <FaEyeSlash size={12} /> : <FaEye size={12} />} {showPassword ? "Ocultar" : "Mostrar"}
                </ITButton>
              </div>
            </div>
          )}
        </Section>

        {needsSchedule && (
          <Section icon={<FaClock />} title="Horario laboral" hint="requerido para personal operativo">
            <ITSearchSelect
              label=""
              name="scheduleId"
              placeholder="Selecciona un horario"
              value={formik.values.scheduleId}
              onChange={(val) => formik.setFieldValue("scheduleId", val)}
              options={scheduleOptions}
              error={formik.errors.scheduleId}
              touched={formik.touched.scheduleId}
            />
          </Section>
        )}
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
        <ITButton type="button" color="secondary" variant="outlined" onClick={onCancel} disabled={formik.isSubmitting}>
          Cancelar
        </ITButton>
        <ITButton type="submit" disabled={formik.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {formik.isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear usuario"}
        </ITButton>
      </div>
    </form>
  );
};
