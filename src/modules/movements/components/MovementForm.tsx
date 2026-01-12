import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton } from "axzy_ui_system";

interface Props {
  onSubmit: (data: { entryId: number; toLocationId: number }) => void;
  onCancel: () => void;
}

export const MovementForm = ({ onSubmit, onCancel }: Props) => {
  const formik = useFormik({
    initialValues: {
      entryId: "",
      locationId: "",
    },
    validationSchema: Yup.object({
      entryId: Yup.number().typeError("Debe ser numérico").required("ID de entrada requerido"),
      locationId: Yup.number().typeError("Debe ser numérico").required("ID de ubicación requerido"),
    }),
    onSubmit: (values) => {
      onSubmit({
        entryId: Number(values.entryId),
        toLocationId: Number(values.locationId),
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">Ingrese los IDs (Temporal)</p>
      
      <ITInput
        label="ID Entrada (Vehículo)"
        name="entryId"
        value={formik.values.entryId}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.entryId}
        touched={formik.touched.entryId}
        placeholder="Ej: 1"
      />
      
      <ITInput
        label="ID Nueva Ubicación"
        name="locationId"
        value={formik.values.locationId}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.locationId}
        touched={formik.touched.locationId}
        placeholder="Ej: 5"
      />

      <div className="flex justify-end gap-2 mt-4">
        <ITButton color="secondary" onClick={onCancel} type="button">Cancelar</ITButton>
        <ITButton type="submit">Guardar</ITButton>
      </div>
    </form>
  );
};
