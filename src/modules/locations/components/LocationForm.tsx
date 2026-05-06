import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { getZones, Zone } from "../service/zones.service";

interface Props {
  onSubmit: (data: { aisle: string; spot: string; number: string; name?: string; zoneId?: number }) => void;
  onCancel: () => void;
  onSaveAndContinue?: (data: { aisle: string; spot: string; number: string; name?: string; zoneId?: number }) => void;
  initialData?: { aisle: string; spot: string; number: string; name: string; zoneId?: number };
}

export const LocationForm = ({ onSubmit, onCancel, initialData, onSaveAndContinue }: Props) => {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    const fetchZones = async () => {
      const res = await getZones();
      if (res.success) {
        setZones(res.data || []);
      }
    };
    fetchZones();
  }, []);

  const formik = useFormik({
    initialValues: {
      aisle: initialData?.aisle || "",
      spot: initialData?.spot || "",
      number: initialData?.number || "",
      zoneId: initialData?.zoneId || "",
    },
    validationSchema: Yup.object({
      aisle: Yup.string().required("Requerido"),
      spot: Yup.string().required("Requerido"),
      number: Yup.string().required("Requerido"),
      zoneId: Yup.string().required("Zona requerida"),
    }),
    onSubmit: (values) => {
      onSubmit({ ...values, zoneId: Number(values.zoneId) });
    },
  });

  const handleSaveAndContinue = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length === 0) {
      const values = { ...formik.values, zoneId: Number(formik.values.zoneId) };
      if (onSaveAndContinue) {
        onSaveAndContinue(values);
        
        // Auto-increment logic for next item
        const currentSpot = parseInt(values.spot);
        if (!isNaN(currentSpot)) {
            formik.setFieldValue("spot", (currentSpot + 1).toString());
        } else {
            formik.setFieldValue("spot", "");
        }
        formik.setFieldTouched("spot", false);
      }
    } else {
      formik.setTouched({
        aisle: true,
        spot: true,
        number: true,
        zoneId: true,
      });
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Zona</label>
          <select
            name="zoneId"
            value={formik.values.zoneId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`h-[42px] px-3 rounded-xl border ${
              formik.errors.zoneId && formik.touched.zoneId ? "border-red-500 bg-red-50" : "border-slate-200"
            } bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
          >
            <option value="">Selecciona una zona...</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          {formik.errors.zoneId && formik.touched.zoneId && (
            <span className="text-[10px] text-red-500 font-bold ml-1">{formik.errors.zoneId}</span>
          )}
        </div>

        <ITInput
          label="Sección / Pasillo"
          name="aisle"
          value={formik.values.aisle}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.aisle}
          touched={formik.touched.aisle}
          placeholder="Ej: A, SECC-1"
          className="!py-2 !h-[42px] !rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ITInput
          label="# Consecutivo / Cajón"
          name="spot"
          value={formik.values.spot}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.spot}
          touched={formik.touched.spot}
          placeholder="Ej: 101, B2"
          className="!py-2 !h-[42px] !rounded-xl"
        />
        <ITInput
          label="Referencia / Calle"
          name="number"
          value={formik.values.number}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.number}
          touched={formik.touched.number}
          placeholder="Ej: Calle Principal 123"
          className="!py-2 !h-[42px] !rounded-xl"
        />
      </div>
      
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
        <ITButton variant="outlined" color="secondary" onClick={onCancel} type="button" className="!rounded-xl px-6">
            Cancelar
        </ITButton>
        <div className="flex gap-3">
          {onSaveAndContinue && !initialData && (
             <ITButton 
                variant="outlined" 
                color="primary" 
                onClick={handleSaveAndContinue} 
                type="button"
                className="!rounded-xl px-6 !border-emerald-200 !text-emerald-600 hover:!bg-emerald-50"
             >
                Guardar y Continuar
             </ITButton>
          )}
          <ITButton type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 !rounded-xl px-8 shadow-lg shadow-emerald-100">
              {initialData ? 'Actualizar' : 'Guardar y Cerrar'}
          </ITButton>
        </div>
      </div>
    </form>
  );
};
