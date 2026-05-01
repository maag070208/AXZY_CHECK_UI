import { ITButton, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ResidentUser, uploadResidentImage } from "../services/residents.service";
import { useEffect, useState } from "react";
import { getPropertiesList, Property } from "@app/modules/properties/service/properties.service";
import { FaCheck, FaIdCard, FaSpinner, FaUpload } from "react-icons/fa";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useDispatch } from "react-redux";

interface ResidentFormProps {
    initialData?: ResidentUser | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export const ResidentForm = ({ initialData, onSubmit, onCancel }: ResidentFormProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [properties, setProperties] = useState<{label: string, value: string}[]>([]);
    const [uploadingFront, setUploadingFront] = useState(false);
    const [uploadingBack, setUploadingBack] = useState(false);
    const dispatch = useDispatch();

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

    const formik = useFormik({
        initialValues: {
            // User Schema
            name: initialData?.name || "",
            lastName: initialData?.lastName || "",
            username: initialData?.username || "",
            password: "",
            propertyId: initialData?.propertyId ? String(initialData.propertyId) : "",
            
            // Resident Profile Schema
            firstName: initialData?.residentProfile?.firstName || "",
            fatherLastName: initialData?.residentProfile?.fatherLastName || "",
            motherLastName: initialData?.residentProfile?.motherLastName || "",
            phoneNumber: initialData?.residentProfile?.phoneNumber || "",
            email: initialData?.residentProfile?.email || "",
            emergencyContact: initialData?.residentProfile?.emergencyContact || "",
            emergencyPhone: initialData?.residentProfile?.emergencyPhone || "",
            ineFrontUrl: initialData?.residentProfile?.ineFrontUrl || "",
            ineBackUrl: initialData?.residentProfile?.ineBackUrl || "",
            notes: initialData?.residentProfile?.notes || ""
        },
        validationSchema: Yup.object({
            name: Yup.string().required("El nombre es requerido"),
            lastName: Yup.string().required("Los apellidos son requeridos"),
            username: Yup.string().required("Usuario de acceso requerido"),
            password: initialData ? Yup.string() : Yup.string().required("Contraseña de acceso requerida"),
            propertyId: Yup.string(),
            phoneNumber: Yup.string()
                .required("Teléfono requerido")
                .matches(/^\d{10}$/, "El teléfono móvil debe tener exactamente 10 dígitos"),
            emergencyPhone: Yup.string()
                .matches(/^\d{10}$/, { message: "El teléfono de emergencia debe tener exactamente 10 dígitos", excludeEmptyString: true })
        }),
        onSubmit: (values) => {
            const payload = { ...values };
            if (!payload.password) {
                delete (payload as any).password;
            }
            onSubmit(payload);
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (side === 'front') setUploadingFront(true);
        else setUploadingBack(true);

        try {
            const url = await uploadResidentImage(file);
            if (url) {
                formik.setFieldValue(side === 'front' ? 'ineFrontUrl' : 'ineBackUrl', url);
                dispatch(showToast({ message: "Foto cargada exitosamente", type: "success" }));
            } else {
                dispatch(showToast({ message: "Error al subir imagen", type: "error" }));
            }
        } catch (err) {
            dispatch(showToast({ message: "Error de red al subir imagen", type: "error" }));
        } finally {
            if (side === 'front') setUploadingFront(false);
            else setUploadingBack(false);
        }
    };

    const steps = [
        {
            label: "Datos Personales",
            content: (
                <div className="flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ITInput
                            label="Nombres de Pila"
                            name="name"
                            value={formik.values.name}
                            onChange={(e) => {
                                formik.handleChange(e);
                                formik.setFieldValue("firstName", e.target.value);
                            }}
                            onBlur={formik.handleBlur}
                            error={formik.errors.name}
                            touched={formik.touched.name}
                            placeholder="Ej. Juan Carlos"
                        />
                        <ITInput
                            label="Apellidos"
                            name="lastName"
                            value={formik.values.lastName}
                            onChange={(e) => {
                                formik.handleChange(e);
                                const parts = e.target.value.split(" ");
                                formik.setFieldValue("fatherLastName", parts[0] || "");
                                formik.setFieldValue("motherLastName", parts.slice(1).join(" ") || "");
                            }}
                            onBlur={formik.handleBlur}
                            error={formik.errors.lastName}
                            touched={formik.touched.lastName}
                            placeholder="Ej. Perez Hernandez"
                        />
                        <ITInput
                            label="Teléfono Móvil"
                            name="phoneNumber"
                            value={formik.values.phoneNumber}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.phoneNumber}
                            touched={formik.touched.phoneNumber}
                            placeholder="Ej. 5551234567"
                            maxLength={10}
                        />
                        <ITInput
                            label="Correo Electrónico (Opcional)"
                            name="email"
                            type="email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Ej. juan@correo.com"
                        />
                    </div>
                </div>
            )
        },
        {
            label: "Asignación y Acceso",
            content: (
                <div className="flex flex-col gap-4 p-4">
                    <ITSelect
                        label="Propiedad Asignada"
                        name="propertyId"
                        value={formik.values.propertyId}
                        onChange={formik.handleChange}
                        options={[{label: "Sin propiedad (Asignar después)", value: ""}, ...properties]}
                        error={formik.errors.propertyId}
                        touched={formik.touched.propertyId}
                    />
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2 mb-2">
                        <div className="flex items-center gap-2 mb-3">
                            <FaIdCard className="text-emerald-600" />
                            <h4 className="font-bold text-slate-800 text-sm">Credenciales de la App Vecinal</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Ingresa el usuario y la contraseña segura con la cual el residente podrá iniciar sesión en la app vecinal, levantar mantenimientos y estar al tanto de notificaciones.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ITInput
                                label="Usuario (App)"
                                name="username"
                                value={formik.values.username}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.errors.username}
                                touched={formik.touched.username}
                                placeholder="Ej. jperez123"
                            />
                            <ITInput
                                label="Contraseña (App)"
                                name="password"
                                type="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.errors.password}
                                touched={formik.touched.password}
                                placeholder={initialData ? "Dejar vacío para no cambiar" : "Contraseña segura"}
                            />
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: "Seguridad y Contactos",
            content: (
                <div className="flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ITInput
                            label="Contacto de Emergencia"
                            name="emergencyContact"
                            value={formik.values.emergencyContact}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Ej. Maria Martinez (Esposa)"
                        />
                        <ITInput
                            label="Teléfono de Emergencia"
                            name="emergencyPhone"
                            value={formik.values.emergencyPhone}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.emergencyPhone}
                            touched={formik.touched.emergencyPhone}
                            placeholder="Ej. 5559876543"
                            maxLength={10}
                        />
                    </div>
                </div>
            )
        },
        {
            label: "Identificación Oficial",
            content: (
                <div className="flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* INE Frontal */}
                        <div className="relative group rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 overflow-hidden bg-slate-50 transition-all">
                            {formik.values.ineFrontUrl ? (
                                <div className="relative aspect-video w-full bg-slate-900">
                                    <img src={formik.values.ineFrontUrl} alt="INE Frontal" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform">
                                            <FaUpload /> Cambiar Frente
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'front')} disabled={uploadingFront}/>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center p-8 aspect-video cursor-pointer">
                                    {uploadingFront ? <FaSpinner className="animate-spin text-2xl text-emerald-500 mb-2" /> : <FaUpload className="text-2xl text-slate-300 mb-2 group-hover:text-emerald-500 transition-colors" />}
                                    <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">Subir INE Frontal</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'front')} disabled={uploadingFront}/>
                                </label>
                            )}
                        </div>

                        {/* INE Reverso */}
                        <div className="relative group rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 overflow-hidden bg-slate-50 transition-all">
                            {formik.values.ineBackUrl ? (
                                <div className="relative aspect-video w-full bg-slate-900">
                                    <img src={formik.values.ineBackUrl} alt="INE Reverso" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform">
                                            <FaUpload /> Cambiar Reverso
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'back')} disabled={uploadingBack}/>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center p-8 aspect-video cursor-pointer">
                                    {uploadingBack ? <FaSpinner className="animate-spin text-2xl text-emerald-500 mb-2" /> : <FaUpload className="text-2xl text-slate-300 mb-2 group-hover:text-emerald-500 transition-colors" />}
                                    <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">Subir INE Reverso</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'back')} disabled={uploadingBack}/>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <ITInput
                            label="Notas Administrativas"
                            name="notes"
                            value={formik.values.notes}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Observaciones internas, notas de recepción, etc."
                        />
                    </div>
                </div>
            )
        }
    ];

    const validateCurrentStep = async () => {
        const errors = await formik.validateForm();
        const touchedObj: any = {};
        
        let hasError = false;

        if (currentStep === 0) {
            ['name', 'lastName', 'phoneNumber'].forEach(field => {
                if ((errors as any)[field]) {
                    touchedObj[field] = true;
                    hasError = true;
                }
            });
        }

        if (currentStep === 1) {
            ['username', ...(!initialData ? ['password'] : [])].forEach(field => {
                if ((errors as any)[field]) {
                    touchedObj[field] = true;
                    hasError = true;
                }
            });
        }

        if (hasError) {
            formik.setTouched({ ...formik.touched, ...touchedObj });
            return false;
        }

        return true;
    };

    const handleNext = async () => {
        const isValid = await validateCurrentStep();
        if (!isValid) {
            dispatch(showToast({ message: "Por favor, completa los campos requeridos", type: "error" }));
            return;
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            formik.submitForm();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="w-full">
            {/* Stepper Header */}
            <div className="flex justify-between mb-10 px-6 mt-6 relative">
                {/* Progress Line Background */}
                <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 -z-0 mx-auto px-12" style={{ width: 'calc(100% - 4rem)', left: '2rem' }} />
                
                {/* Active Progress Line */}
                <div 
                    className="absolute top-5 left-0 h-[2px] bg-emerald-500 transition-all duration-500 ease-in-out -z-0" 
                    style={{ 
                        width: `calc(${(currentStep / (steps.length - 1)) * 100}% - ${currentStep === 0 ? '0px' : '2rem'})`,
                        left: '2rem'
                    }} 
                />

                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                            index === currentStep ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-110' : 
                            index < currentStep ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-400'
                        }`}>
                            {index < currentStep ? <FaCheck className="text-xs" /> : index + 1}
                        </div>
                        <div className="absolute -bottom-7 w-max">
                            <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 ${index === currentStep ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[300px] mt-10">
                {steps[currentStep].content}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between px-4 pt-6 pb-2 border-t border-slate-100 mt-4 rounded-b-xl">
                <div>
                     {currentStep === 0 ? (
                        <ITButton type="button" color="secondary" variant="outlined" onClick={onCancel}>Cancelar</ITButton>
                     ) : (
                        <ITButton type="button" color="secondary" variant="outlined" onClick={handleBack}>Atrás</ITButton>
                     )}
                </div>
                <ITButton 
                    type="button" 
                    onClick={handleNext} 
                    disabled={formik.isSubmitting}
                    className={currentStep === steps.length - 1 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                >
                    {currentStep === steps.length - 1 ? (
                        formik.isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Confirmar Registro')
                    ) : 'Siguiente'}
                </ITButton>
            </div>
        </div>
    );
};
