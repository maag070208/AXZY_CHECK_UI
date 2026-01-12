// No content to replace, just verifying.
// Actually I need to make sure imports in EntryForm are correct for UserSelectionStep?
// Existing import: import { UserSelectionStep } from "./steps/UserSelectionStep"; -> Correct.
// I modified UserSelectionStep in Step 1466 to ACCEPT onVehicleSelected.
// I modified EntryForm in Step 1467 to PASS it.
// All good.

import { ITButton, ITStepper } from "axzy_ui_system";
import { FormikProvider, useFormik } from "formik";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Yup from "yup";
import { getLocations } from "../../locations/service/locations.service";
import { getUsers } from "../../users/services/UserService";
import { uploadFile } from "../service/entries.service";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { GeneralDataStep } from "./steps/GeneralDataStep";
import { PhotoUploadStep } from "./steps/PhotoUploadStep";
import { UserSelectionStep } from "./steps/UserSelectionStep";

interface Props {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  userId?: number;
  operatorUserId: number;
}

export const EntryForm = ({
  onSubmit,
  onCancel,
  userId,
  operatorUserId,
}: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  // Separate state for visual file feedback (File objects)
  const [fileObjects, setFileObjects] = useState<{
    [key: string]: File | null;
  }>({
    frontal: null,
    trasera: null,
    lateral_derecho: null,
    lateral_izquierdo: null,
    interior: null,
    extras: null,
  });

  const [locations, setLocations] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    userId || null
  );
  const [users, setUsers] = useState<
    { value: string; label: string; data: any }[]
  >([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    getUsers().then((res) => {
      if (res.success && res.data) {
        setUsers(
          res.data
            .filter((u) => u.role === "USER")
            .map((u) => ({
              value: String(u.id),
              label: `${u.name} ${u.lastName} (${u.email})`,
              data: u,
            }))
        );
      }
    });
  }, []);

  useEffect(() => {
    getLocations().then((res) => {
      if (res.success && res.data) {
        setLocations(
          res.data
            //.filter((l: any) => !l.isOccupied)
            .map((l: any) => ({
              value: String(l.id),
              label: l.name, // e.g. "Zona A"
            }))
        );
      }
    });
  }, []);

  const formik = useFormik({
    initialValues: {
      locationId: "",
      brand: "",
      model: "",
      color: "",
      plates: "",
      mileage: "",
      notes: "",
      photos: {
        frontal: "",
        trasera: "",
        lateral_derecho: "",
        lateral_izquierdo: "",
        interior: "",
        extras: "",
      },
    },
    validationSchema: Yup.object({
      locationId: Yup.string().required("La ubicación es requerida"),
      vehicleTypeId: Yup.string().required("El tipo de vehículo es requerido"),
      brand: Yup.string().required("La marca es requerida"),
      model: Yup.string().required("El modelo es requerido"),
      color: Yup.string().required("El color es requerido"),
      plates: Yup.string().required("Las placas son requeridas"),
      mileage: Yup.number()
        .typeError("Debe ser un número")
        .required("El kilometraje es requerido"),
      notes: Yup.string(),
    }),
    onSubmit: (values) => {
      const formData = new FormData();
      formData.append("userId", String(selectedUserId));
      formData.append("operatorUserId", String(operatorUserId));

      if (values.locationId) formData.append("locationId", values.locationId);

      formData.append("brand", values.brand);
      formData.append("model", values.model);
      formData.append("color", values.color);
      formData.append("plates", values.plates);

      if (values.mileage) formData.append("mileage", String(values.mileage));
      if (values.notes) formData.append("notes", values.notes);

      const photosPayload: { category: string; imageUrl: string }[] = [];

      Object.keys(values.photos).forEach((key) => {
        const url = (values.photos as any)[key];
        if (url) photosPayload.push({ category: key, imageUrl: url });
      });

      formData.append("photos", JSON.stringify(photosPayload));

      onSubmit(formData);
    },
  });

  const handleUpload = useCallback(
    async (category: string, file: File) => {
      try {
        const res = await uploadFile(file);

        if (res.success && res.data) {
          formik.setFieldValue(`photos.${category}`, res.data.url);
          setFileObjects((prev) => ({ ...prev, [category]: file }));
        } else {
          alert("Error al subir imagen");
        }
      } catch {
        alert("Error de conexión al subir imagen");
      }
    },
    [formik]
  );

  const steps = useMemo(
    () => [
      {
        label: "Cliente",
        content: (
          <UserSelectionStep 
             isCreatingUser={isCreatingUser}
             setIsCreatingUser={setIsCreatingUser}
             selectedUserId={selectedUserId}
             setSelectedUserId={setSelectedUserId}
             users={users}
             onUserCreated={(user) => {
                  const newItem = {
                    value: String(user.id),
                    label: `${user.name} ${user.lastName} (${user.email})`,
                    data: user,
                  };
                  setUsers((prev) => [...prev, newItem]);
                  setSelectedUserId(user.id);
                  setIsCreatingUser(false);
             }}
             onVehicleSelected={(vehicle) => {
                 const newPhotos = { ...formik.values.photos } as any;
                 
                 if (vehicle.photos && Array.isArray(vehicle.photos)) {
                     vehicle.photos.forEach((p: any) => {
                         if (p.category && p.imageUrl) {
                             newPhotos[p.category] = p.imageUrl;
                         }
                     });
                 }

                 formik.setValues({
                    ...formik.values,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    color: vehicle.color,
                    plates: vehicle.plates,
                    photos: newPhotos
                 });
                 // Optional: Auto advance or notify
                 setCurrentStep(1); // Auto-jump to next step for convenience
             }}
          />
        ),
      },
      {
        label: "Datos Generales",
        content: <GeneralDataStep formik={formik} locations={locations} />,
      },
      {
        label: "Exterior",
        content: (
          <PhotoUploadStep
            title="Fotos Exteriores"
            categories={[
              { key: "frontal", label: "Frontal" },
              { key: "trasera", label: "Trasera" },
            ]}
            onUpload={handleUpload}
            formik={formik}
          />
        ),
      },
      {
        label: "Laterales",
        content: (
          <PhotoUploadStep
            title="Fotos Laterales"
            categories={[
              { key: "lateral_derecho", label: "Lateral Derecho" },
              { key: "lateral_izquierdo", label: "Lateral Izquierdo" },
            ]}
            onUpload={handleUpload}
            formik={formik}
          />
        ),
      },
      {
        label: "Otros",
        content: (
          <PhotoUploadStep
            title="Interior y Extras"
            categories={[
              { key: "interior", label: "Interior" },
              { key: "extras", label: "Extras" },
            ]}
            onUpload={handleUpload}
            formik={formik}
          />
        ),
      },
      {
        label: "Confirmación",
        content: <ConfirmationStep formik={formik} />,
      },
    ],
    [isCreatingUser, users, selectedUserId, locations, handleUpload, formik]
  );

  const handleStepChange = useCallback((newStep: number) => {
    if (currentStep === 0 && newStep > 0 && !selectedUserId) {
      alert("Debe seleccionar un cliente");
      return;
    }
    setCurrentStep(newStep);
  }, [currentStep, selectedUserId]);

  return (
    <div className="w-full h-[650px] flex flex-col">
      <FormikProvider value={formik}>
        <div className="flex-1 overflow-y-auto">
          <ITStepper
            steps={steps}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onFinish={formik.submitForm}
            allowClickToJump={false}
          />
        </div>
      </FormikProvider>

      <div className="flex justify-start mt-4 px-4 py-2 border-t border-gray-100">
        <ITButton color="secondary" onClick={onCancel} type="button">
          Cancelar
        </ITButton>
      </div>
    </div>
  );
};