import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton } from "axzy_ui_system";

interface Props {
  onSubmit: (data: { entryId: number; notes: string }) => void;
  onCancel: () => void;
}

export const ExitForm = ({ onSubmit, onCancel }: Props) => {
  const formik = useFormik({
    initialValues: {
      entryId: "",
      notes: "",
    },
    validationSchema: Yup.object({
      entryId: Yup.number().typeError("Debe ser numérico").required("ID de entrada requerido"),
      notes: Yup.string(),
    }),
    onSubmit: (values) => {
      onSubmit({
        entryId: Number(values.entryId),
        notes: values.notes,
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
       <p className="text-sm text-gray-500">Ingrese ID de Entrada (Temporal)</p>
      
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
        label="Notas de Salida"
        name="notes"
        type="textarea"
        value={formik.values.notes}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.notes}
        touched={formik.touched.notes}
      />

      <div className="flex justify-end gap-2 mt-4">
        <ITButton color="secondary" onClick={onCancel} type="button">Cancelar</ITButton>
        <ITButton type="submit">Confirmar Salida</ITButton>
      </div>
    </form>
  );
};
