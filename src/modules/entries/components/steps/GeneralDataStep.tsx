import { ITInput, ITSelect } from "axzy_ui_system";

export const GeneralDataStep = ({
  locations,
  formik,
}: {
  formik: any;
  locations: { value: string; label: string }[];
}) => {
  return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-3">
        <ITSelect
          label="Ubicación (Opcional - Automático si se deja vacío)"
          name="locationId"
          options={locations}
          value={formik.values.locationId}
          onChange={formik.handleChange}
          error={formik.errors.locationId as string}
          touched={formik.touched.locationId as boolean}
        />

        <ITInput
          label="Marca"
          name="brand"
          value={formik.values.brand}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.brand as string}
          touched={formik.touched.brand as boolean}
          required
        />

        <ITInput
          label="Modelo"
          name="model"
          value={formik.values.model}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.model as string}
          touched={formik.touched.model as boolean}
          required
        />

        <ITInput
          label="Color"
          name="color"
          value={formik.values.color}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.color as string}
          touched={formik.touched.color as boolean}
          required
        />

        <ITInput
          label="Placas"
          name="plates"
          value={formik.values.plates}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.plates as string}
          touched={formik.touched.plates as boolean}
          required
        />

        <ITInput
          label="Kilometraje"
          name="mileage"
          type="number"
          value={formik.values.mileage}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        <ITInput
          label="Notas"
          name="notes"
          type="textarea"
          value={formik.values.notes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.notes as string}
          touched={formik.touched.notes as boolean}
        />
      </div>
  );
};
