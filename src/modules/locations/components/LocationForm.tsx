import { useFormik } from "formik";
import * as Yup from "yup";
import { ITButton, ITChip, ITFlex, ITGrid, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { FaMapMarkerAlt } from "react-icons/fa";

interface Props {
  onSubmit: (data: { aisle: string; spot: string; number: string; name?: string }) => void;
  onCancel: () => void;
  initialData?: { aisle: string; spot: string; number: string; name: string };
}

export const LocationForm = ({ onSubmit, onCancel, initialData }: Props) => {
  const formik = useFormik({
    initialValues: {
      aisle: initialData?.aisle || "",
      spot: initialData?.spot || "",
      number: initialData?.number || "",
    },
    validationSchema: Yup.object({
      aisle: Yup.string().required("El pasillo es requerido"),
      spot: Yup.string().required("El cajón es requerido"),
      number: Yup.string().required("El número es requerido"),
    }),
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  const previewName = [formik.values.aisle, formik.values.spot, formik.values.number]
    .filter(Boolean)
    .join("-");

  return (
    <ITFlex direction="column" gap={5}>
      <ITFlex
        align="center"
        gap={3}
        className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <ITFlex
          align="center"
          justify="center"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
        >
          <FaMapMarkerAlt />
        </ITFlex>
        <ITFlex direction="column" className="min-w-0">
          <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Punto de control
          </ITText>
          <ITText as="p" className="text-[11px] text-slate-500 dark:text-slate-400">
            La sección, el consecutivo y la referencia forman el nombre de la ubicación.
          </ITText>
        </ITFlex>
      </ITFlex>

      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} sm={6}>
          <ITInput
            label="Sección"
            name="aisle"
            value={formik.values.aisle}
            onChange={formik.handleChange}
            onBlur={() => {}}
            error={formik.errors.aisle}
            touched={formik.touched.aisle}
            placeholder="Ej: A, SECC-1"
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITInput
            label="# Consecutivo"
            name="spot"
            value={formik.values.spot}
            onChange={formik.handleChange}
            onBlur={() => {}}
            error={formik.errors.spot}
            touched={formik.touched.spot}
            placeholder="Ej: 101, B2"
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITInput
            label="Referencia / Calle"
            name="number"
            value={formik.values.number}
            onChange={formik.handleChange}
            onBlur={() => {}}
            error={formik.errors.number}
            touched={formik.touched.number}
            placeholder="Ej: Calle Principal 123"
          />
        </ITGrid>
      </ITGrid>

      <ITFlex
        align="center"
        justify="between"
        gap={2}
        className="rounded-2xl bg-emerald-50/50 px-3 py-2 dark:bg-emerald-950/20"
      >
        <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Vista previa
        </ITText>
        <ITChip label={previewName || "Sin nombre"} color="success" size="sm" variant="soft" />
      </ITFlex>

      <ITFlex justify="end" gap={2} className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <ITButton color="secondary" variant="outlined" onClick={onCancel} type="button">
          Cancelar
        </ITButton>
        <ITButton color="primary" type="button" onClick={() => formik.handleSubmit()}>
          Guardar
        </ITButton>
      </ITFlex>
    </ITFlex>
  );
};
