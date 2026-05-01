import { ITButton, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Property } from "../service/properties.service";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useMemo } from "react";

interface PropertyFormProps {
    initialData?: Property | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export const PropertyForm = ({ initialData, onSubmit, onCancel }: PropertyFormProps) => {
    const { data: pTypes } = useCatalog('property_type');
    const { data: pStatuses } = useCatalog('property_status');

    const propertyTypeOptions = useMemo(() => {
        return pTypes.map(t => ({ label: t.value, value: String(t.id) }));
    }, [pTypes]);

    const propertyStatusOptions = useMemo(() => {
        return pStatuses.map(s => ({ label: s.value, value: String(s.id) }));
    }, [pStatuses]);

    const formik = useFormik({
        initialValues: {
            identifier: initialData?.identifier || "",
            name: initialData?.name || "",
            typeId: initialData?.typeId || "",
            statusId: initialData?.statusId || "",
            mainStreet: initialData?.mainStreet || "",
            betweenStreets: initialData?.betweenStreets || "",
            latitude: initialData?.latitude || "",
            longitude: initialData?.longitude || "",
        },
        validationSchema: Yup.object({
            identifier: Yup.string().required("El identificador es obligatorio"),
            name: Yup.string().required("El nombre/referencia es obligatorio"),
            mainStreet: Yup.string().required("La calle principal es obligatoria"),
            typeId: Yup.string().required("El tipo es obligatorio"),
            statusId: Yup.string().required("El estado es obligatorio"),
            latitude: Yup.number().required("Debes ubicar la propiedad en el mapa"),
            longitude: Yup.number().required("Debes ubicar la propiedad en el mapa"),
        }),
        onSubmit: (values) => {
            onSubmit(values);
        },
    });

    const handleLocationSelect = (lat: number, lng: number) => {
        formik.setFieldValue("latitude", lat);
        formik.setFieldValue("longitude", lng);
    };

    return (
        <form onSubmit={formik.handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ITInput
                    label="Identificador Único"
                    name="identifier"
                    value={formik.values.identifier}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.identifier}
                    touched={formik.touched.identifier}
                    placeholder="Ej. CASA-01, DEP-102"
                />
                
                <ITInput
                    label="Nombre / Referencia"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.name}
                    touched={formik.touched.name}
                    placeholder="Ej. Casa de la Familia Perez"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ITSelect
                    label="Tipo de Propiedad"
                    name="typeId"
                    value={String(formik.values.typeId)}
                    onChange={formik.handleChange}
                    options={propertyTypeOptions}
                    error={formik.errors.typeId}
                    touched={formik.touched.typeId}
                />

                <ITInput
                    label="Calle Principal"
                    name="mainStreet"
                    value={formik.values.mainStreet}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.mainStreet}
                    touched={formik.touched.mainStreet}
                    placeholder="Ej. Av. Universidad"
                />
            </div>

            <ITInput
                label="Entre Calles (Opcional)"
                name="betweenStreets"
                value={formik.values.betweenStreets}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Ej. Entre Madero y Juarez"
            />

            <ITSelect
                label="Estado de Ocupación"
                name="statusId"
                value={String(formik.values.statusId)}
                onChange={formik.handleChange}
                options={propertyStatusOptions}
                error={formik.errors.statusId}
                touched={formik.touched.statusId}
            />

            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="flex flex-col">
                        <span>Ubicar en el mapa</span>
                        {(formik.errors.latitude || formik.errors.longitude) && formik.submitCount > 0 && (
                            <span className="text-red-500 font-bold lowercase">Debes seleccionar un punto</span>
                        )}
                    </div>
                    <div className="flex gap-4 lowercase font-medium text-slate-500">
                        <span>Lat: <span className="text-emerald-600 font-mono">{formik.values.latitude ? Number(formik.values.latitude).toFixed(6) : "---"}</span></span>
                        <span>Lng: <span className="text-emerald-600 font-mono">{formik.values.longitude ? Number(formik.values.longitude).toFixed(6) : "---"}</span></span>
                    </div>
                </div>
                
                <div className={`relative group rounded-xl overflow-hidden border ${formik.errors.latitude && formik.submitCount > 0 ? 'border-red-300' : 'border-slate-200'}`}>
                    <GoogleMapComponent
                        lat={formik.values.latitude ? Number(formik.values.latitude) : 32.4608}
                        lng={formik.values.longitude ? Number(formik.values.longitude) : -116.9247}
                        isEditable={true}
                        onLocationSelect={handleLocationSelect}
                        height="280px"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-[10px] font-bold text-emerald-600 pointer-events-none group-hover:opacity-100 transition-opacity">
                        Haz click para marcar ubicación
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <ITButton type="button" variant="outlined" color="secondary" onClick={onCancel}>
                    Cancelar
                </ITButton>
                <ITButton type="submit" variant="solid" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {initialData ? "Actualizar" : "Guardar"}
                </ITButton>
            </div>
        </form>
    );
};
