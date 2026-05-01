import { ITButton, ITDatePicker, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { getPropertiesList, Property } from "@app/modules/properties/service/properties.service";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useMemo } from "react";

interface Props {
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export const InvitationForm = ({ onSubmit, onCancel }: Props) => {
    const [properties, setProperties] = useState<{label: string, value: string}[]>([]);
    const { data: invitationTypes } = useCatalog('invitation_type');

    useEffect(() => {
        getPropertiesList().then(res => {
            if (res.success && res.data) {
                setProperties(res.data.map((p: Property) => ({
                    label: `${p.identifier} - ${p.name}`,
                    value: String(p.id)
                })));
            }
        });
    }, []);

    const invitationTypeOptions = useMemo(() => {
        return invitationTypes.map(t => ({
            label: t.value,
            value: String(t.id)
        }));
    }, [invitationTypes]);

    const formik = useFormik({
        initialValues: {
            guestName: "",
            propertyId: "",
            typeId: "",
            dateRange: [new Date(), new Date(Date.now() + 86400000)], // default range from today to tomorrow
            notes: ""
        },
        validationSchema: Yup.object({
            guestName: Yup.string().required("El nombre del visitante es requerido"),
            propertyId: Yup.string().required("Debes asignar la propiedad destino"),
            typeId: Yup.string().required("Selecciona el tipo de acceso"),
            dateRange: Yup.array().test('has-end', 'Debe seleccionar un rango de fechas con inicio y fin', val => !!(val && val[0] && val[1]))
        }),
        onSubmit: (values) => {
            const payload = {
                guestName: values.guestName,
                propertyId: values.propertyId,
                typeId: values.typeId,
                notes: values.notes,
                validFrom: values.dateRange[0],
                validUntil: values.dateRange[1]
            };
            onSubmit(payload);
        },
    });

    return (
        <form onSubmit={formik.handleSubmit} className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Generar Nuevo Pase de Acceso</h3>
            
            <div className="space-y-6">
                <ITInput
                    label="Nombre Completo del Invitado"
                    name="guestName"
                    value={formik.values.guestName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.guestName}
                    touched={formik.touched.guestName}
                    placeholder="Ej. Luis Hernandez Silva"
                />

                <div className="grid grid-cols-2 gap-4">
                    <ITSelect
                        label="Destino (Propiedad)"
                        name="propertyId"
                        value={formik.values.propertyId}
                        onChange={formik.handleChange}
                        options={[{label: "Seleccionar propiedad...", value: ""}, ...properties]}
                        error={formik.errors.propertyId}
                        touched={formik.touched.propertyId}
                    />

                    <ITSelect
                        label="Tipo de Acceso"
                        name="typeId"
                        value={formik.values.typeId}
                        onChange={formik.handleChange}
                        options={invitationTypeOptions}
                        error={formik.errors.typeId}
                        touched={formik.touched.typeId}
                    />
                </div>

                <ITDatePicker
                    label="Rango de Vigencia del Pase"
                    name="dateRange"
                    value={formik.values.dateRange as any}
                    range
                    onChange={(e: any) => {
                        const val = e.target.value;
                        if (val) {
                            formik.setFieldValue("dateRange", val);
                        }
                    }}
                    error={formik.errors.dateRange as any}
                />

                <ITInput
                    label="Notas Adicionales / Referencias"
                    name="notes"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Auto civic blanco, viene a reparar tubería..."
                />
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <ITButton type="button" variant="outlined" color="secondary" onClick={onCancel}>
                    Cancelar
                </ITButton>
                <ITButton type="submit" variant="solid" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? "Emitiendo..." : "Generar Invitación QR"}
                </ITButton>
            </div>
        </form>
    );
};
