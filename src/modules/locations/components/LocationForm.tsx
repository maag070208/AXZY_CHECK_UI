import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton } from "axzy_ui_system";

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

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <ITInput
        label="Pasillo"
        name="aisle"
        value={formik.values.aisle}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.aisle}
        touched={formik.touched.aisle}
        placeholder="Ej: A"
      />
      <ITInput
        label="Cajón"
        name="spot"
        value={formik.values.spot}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.spot}
        touched={formik.touched.spot}
        placeholder="Ej: 101"
      />
      <ITInput
        label="Número"
        name="number"
        value={formik.values.number}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.number}
        touched={formik.touched.number}
        placeholder="Ej: 1"
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <ITButton color="secondary" onClick={onCancel} type="button">Cancelar</ITButton>
        <ITButton type="submit">Guardar</ITButton>
      </div>
    </form>
  );
};
