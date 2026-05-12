import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton, ITSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useRef, useState } from "react";
import { getZones, Zone } from "../service/zones.service";
import {
  getRecurring,
  RecurringConfiguration,
} from "../../recurring/service/recurring.service";

interface LocationFormData {
  name: string;
  zoneId: string;
  recurringConfigurationId: string;
  active: boolean;
}

interface Props {
  onSubmit: (data: LocationFormData) => void;
  onCancel: () => void;
  onSaveAndNew?: (data: LocationFormData) => Promise<void>;
  initialData?: {
    name: string;
    zoneId?: string;
    recurringConfigurationId?: string;
    active?: boolean;
  };
}

export const LocationForm = ({
  onSubmit,
  onCancel,
  initialData,
  onSaveAndNew,
}: Props) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [recurrentes, setRecurrentes] = useState<RecurringConfiguration[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [zonesRes, recurRes] = await Promise.all([
        getZones(),
        getRecurring(),
      ]);
      if (zonesRes.success) setZones(zonesRes.data || []);
      if (recurRes.success) setRecurrentes(recurRes.data || []);
    };
    fetchData();
  }, []);

  const formik = useFormik<LocationFormData>({
    initialValues: {
      name: initialData?.name || "",
      zoneId: initialData?.zoneId || "",
      recurringConfigurationId: initialData?.recurringConfigurationId || "",
      active: initialData?.active ?? true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      zoneId: Yup.string().required("Zona requerida"),
      recurringConfigurationId: Yup.string().required("Recurrente requerido"),
      active: Yup.boolean().required("Estatus requerido"),
    }),
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  const handleSaveAndNew = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length === 0) {
      if (onSaveAndNew) {
        await onSaveAndNew(formik.values);
        formik.setFieldValue("name", "");
        formik.setFieldTouched("name", false);
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 100);
      }
    } else {
      formik.setTouched({
        name: true,
        zoneId: true,
        recurringConfigurationId: true,
        active: true,
      });
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ITSelect
          label="Zona"
          name="zoneId"
          value={formik.values.zoneId}
          onChange={formik.handleChange}
          error={formik.errors.zoneId}
          touched={formik.touched.zoneId}
          options={zones.map((z) => ({ label: z.name, value: z.id }))}
        />

        <ITSelect
          label="Recurrente"
          name="recurringConfigurationId"
          value={formik.values.recurringConfigurationId}
          onChange={formik.handleChange}
          error={formik.errors.recurringConfigurationId}
          touched={formik.touched.recurringConfigurationId}
          options={recurrentes.map((r) => ({ label: r.title, value: r.id }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ITInput
            label="Nombre de la Locación"
            name="name"
            ref={nameInputRef}
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
            touched={formik.touched.name}
            placeholder="Ej: Acceso Principal, Bodega 1..."
            className="!py-2 !h-[42px] !rounded-xl"
          />
        </div>
        <div>
          <ITSelect
            label="Estatus"
            name="active"
            value={formik.values.active ? "true" : "false"}
            onChange={(e) =>
              formik.setFieldValue("active", e.target.value === "true")
            }
            error={formik.errors.active as any}
            touched={formik.touched.active}
            options={[
              { label: "Activo", value: "true" },
              { label: "Inactivo", value: "false" },
            ]}
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-1">
        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
          Vista previa del nombre completo
        </span>
        <p className="text-sm font-semibold text-emerald-800">
          {(() => {
            const zoneName =
              zones.find((z) => z.id === formik.values.zoneId)?.name ||
              "Sin Zona";
            const recurringName =
              recurrentes.find(
                (r) => r.id === formik.values.recurringConfigurationId,
              )?.title || "Sin Recurrente";
            const pureName = formik.values.name || "Nombre";
            return `${zoneName} - ${recurringName} - ${pureName}`;
          })()}
        </p>
      </div>

      <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
        <ITButton
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          type="button"
          label="Cancelar"
        />
        <div className="flex gap-3">
          {onSaveAndNew && !initialData && (
            <ITButton
              variant="outlined"
              color="primary"
              onClick={handleSaveAndNew}
              type="button"
              className="!border-emerald-200 !text-emerald-600 hover:!bg-emerald-50"
              label="Guardar y Nuevo"
            />
          )}
          <ITButton
            type="submit"
            color="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
            label={initialData ? "Actualizar" : "Guardar"}
          />
        </div>
      </div>
    </form>
  );
};
