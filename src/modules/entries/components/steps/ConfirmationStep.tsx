export const ConfirmationStep = ({ formik }: { formik: any }) => {
    
    return (
      <div className="flex flex-col gap-4 p-4">
        <h3 className="text-lg font-semibold">Resumen de Entrada</h3>

        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <span className="font-medium text-gray-600">Marca:</span>
          <span>{formik.values.brand}</span>

          <span className="font-medium text-gray-600">Modelo:</span>
          <span>{formik.values.model}</span>

          <span className="font-medium text-gray-600">Color:</span>
          <span>{formik.values.color}</span>

          <span className="font-medium text-gray-600">Placas:</span>
          <span className="font-bold text-gray-800">
            {formik.values.plates}
          </span>

          <span className="font-medium text-gray-600">Kilometraje:</span>
          <span>{formik.values.mileage}</span>

          <span className="font-medium text-gray-600">Notas:</span>
          <span>{formik.values.notes || "-"}</span>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Fotos Cargadas:
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(formik.values.photos).map(([key, url]) => {
              if (!url) return null;
              const fullUrl = `http://localhost:4444${url}`;

              return (
                <div key={key} className="flex flex-col items-center">
                  <span className="text-xs font-semibold capitalize mb-1">
                    {key.replace("_", " ")}
                  </span>

                  <img
                    src={fullUrl}
                    alt={key}
                    className="w-full h-32 object-cover rounded-lg shadow-sm border border-gray-200"
                  />
                </div>
              );
            })}
          </div>
          {Object.values(formik.values.photos).every(url => !url) && <p className="text-sm text-gray-400 italic">No se han cargado fotos.</p>}
        </div>

        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
          Verifica los datos antes de registrar la entrada.
        </div>
      </div>
    );
};
