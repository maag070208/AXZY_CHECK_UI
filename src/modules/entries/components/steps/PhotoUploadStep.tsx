import { ITDropfile } from "axzy_ui_system";

export enum FileTypeEnum {
  JPG = "image/jpg",
  JPEG = "image/jpeg",
  PNG = "image/png",
}

interface PhotoUploadStepProps {
  title: string;
  categories: { key: string; label: string }[];
  onUpload: (category: string, file: File) => void;
  formik: any;
}

export const PhotoUploadStep = ({
  title,
  categories,
  onUpload,
  formik,
}: PhotoUploadStepProps) => {

  return (
    <div className="p-2">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div key={cat.key}>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {cat.label}
            </label>

            <ITDropfile
              onFileSelect={(file: File | null) => {
                if (!file) formik.setFieldValue(`photos.${cat.key}`, null);
              }}
              onSubmit={(file: File) => onUpload(cat.key, file)}
              acceptedFileTypes={[
                FileTypeEnum.JPG,
                FileTypeEnum.JPEG,
                FileTypeEnum.PNG,
              ]}
              containerClassName="!p-4 !w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors"
              initialPreviewUrl={
                formik.values.photos?.[cat.key]
                  ? `http://localhost:4444${formik.values.photos[cat.key]}`
                  : null
              }
            />

            {formik.values.photos?.[cat.key] && (
              <p className="text-xs text-green-600 mt-1 font-semibold">
                ✓ Imagen guardada
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
