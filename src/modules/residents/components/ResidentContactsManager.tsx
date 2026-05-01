import { ITButton, ITDialog, ITLoader, ITInput } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaPhone,
  FaEnvelope,
  FaUserPlus,
  FaAddressBook,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  ResidentContact,
  ResidentUser,
  getResidentContacts,
  createResidentContact,
  updateResidentContact,
  deleteResidentContact,
} from "../services/residents.service";

interface Props {
  resident: ResidentUser | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormProps {
    initialData?: ResidentContact | null;
    residentId: number;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

const ResidentContactForm = ({ initialData, residentId, onSubmitSuccess, onCancel }: FormProps) => {
    const dispatch = useDispatch();
    
    const formik = useFormik({
        initialValues: {
            name: initialData?.name || "",
            phone: initialData?.phone || "",
            email: initialData?.email || "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("El nombre es requerido"),
            phone: Yup.string(),
            email: Yup.string().email("Email inválido"),
        }),
        onSubmit: async (values) => {
            try {
                let res;
                if (initialData) {
                    res = await updateResidentContact(initialData.id, values);
                } else {
                    res = await createResidentContact(residentId, values);
                }

                if (res.success) {
                    dispatch(showToast({ 
                        message: initialData ? "Contacto actualizado" : "Contacto agregado", 
                        type: "success" 
                    }));
                    onSubmitSuccess();
                }
            } catch (error) {
                dispatch(showToast({ message: "Error al guardar contacto", type: "error" }));
            }
        }
    });

    return (
        <form onSubmit={formik.handleSubmit} className="p-6">
            <div className="space-y-4">
                <ITInput
                    label="Nombre Completo"
                    name="name"
                    placeholder="Ej. Juan Pérez"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.name}
                    touched={formik.touched.name}
                    required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ITInput
                        label="Teléfono"
                        name="phone"
                        placeholder="55 1234 5678"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.phone}
                        touched={formik.touched.phone}
                    />
                    <ITInput
                        label="Email (Opcional)"
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.email}
                        touched={formik.touched.email}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-10">
                <ITButton
                    type="button"
                    variant="outlined"
                    onClick={onCancel}
                    className="rounded-xl"
                >
                    Cancelar
                </ITButton>
                <ITButton
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="bg-emerald-600 text-white px-8 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                    {formik.isSubmitting ? "Guardando..." : (initialData ? "Actualizar" : "Guardar Contacto")}
                </ITButton>
            </div>
        </form>
    );
};

export const ResidentContactsManager = ({
  resident,
  isOpen,
  onClose,
}: Props) => {
  const [contacts, setContacts] = useState<ResidentContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingContact, setEditingContact] = useState<ResidentContact | null>(
    null,
  );

  const dispatch = useDispatch();

  const fetchContacts = useCallback(async () => {
    if (!resident) return;
    setLoading(true);
    try {
      const res = await getResidentContacts(resident.id);
      if (res.success) {
        setContacts(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [resident]);

  useEffect(() => {
    if (isOpen && resident) {
      fetchContacts();
    }
    if (!isOpen) {
        setView('list'); // Reset view on close
    }
  }, [isOpen, resident, fetchContacts]);

  const handleOpenForm = (contact?: ResidentContact) => {
    setEditingContact(contact || null);
    setView('form');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este contacto?")) return;
    try {
      const res = await deleteResidentContact(id);
      if (res.success) {
        dispatch(showToast({ message: "Contacto eliminado", type: "success" }));
        fetchContacts();
      }
    } catch (error) {
      dispatch(
        showToast({ message: "Error al eliminar contacto", type: "error" }),
      );
    }
  };

  const title = (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 transition-all">
            {view === 'list' ? <FaAddressBook /> : <FaUserPlus />}
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800">
                {view === 'list' ? "Agenda de Contactos" : (editingContact ? "Editar Contacto" : "Nuevo Contacto")}
            </h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {resident?.name} {resident?.lastName || ""}
            </p>
        </div>
    </div>
  );

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title as any}
      className={view === 'list' ? "w-[800px] max-w-[95vw]" : "w-[500px] max-w-[95vw]"}
    >
      <div className="p-0 transition-all duration-300">
        {view === 'list' ? (
            <>
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <p className="text-slate-500 text-sm">
                        Gestiona los contactos frecuentes para que el residente genere pases
                        más rápido.
                    </p>
                    <ITButton
                        onClick={() => handleOpenForm()}
                        className="bg-emerald-600 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        size="small"
                    >
                        <FaPlus /> Nuevo Contacto
                    </ITButton>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                        <ITLoader />
                        </div>
                    ) : contacts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contacts.map((contact) => (
                            <div
                            key={contact.id}
                            className="group bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-100 transition-all duration-300"
                            >
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <span className="text-sm font-bold uppercase">
                                    {contact.name.charAt(0)}
                                </span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenForm(contact)}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    title="Editar"
                                >
                                    <FaEdit size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(contact.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Eliminar"
                                >
                                    <FaTrash size={14} />
                                </button>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-800 uppercase tracking-tighter mb-2 group-hover:text-emerald-700 transition-colors">
                                {contact.name}
                            </h4>

                            <div className="space-y-1.5">
                                {contact.phone && (
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-[10px]">
                                    <FaPhone />
                                    </div>
                                    {contact.phone}
                                </div>
                                )}
                                {contact.email && (
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-[10px]">
                                    <FaEnvelope />
                                    </div>
                                    {contact.email}
                                </div>
                                )}
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-3xl py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                            <FaUserPlus className="text-3xl text-slate-200" />
                        </div>
                        <p className="font-bold text-slate-600 text-lg">
                            Sin contactos registrados
                        </p>
                        <p className="text-sm max-w-[280px] text-center mt-1">
                            Los contactos guardados facilitan la creación de pases por parte
                            del residente.
                        </p>
                        <ITButton
                            onClick={() => handleOpenForm()}
                            variant="ghost"
                            className="mt-6 text-emerald-600 font-bold"
                        >
                            <FaPlus className="mr-2" /> Agregar el primero
                        </ITButton>
                        </div>
                    )}
                </div>
            </>
        ) : (
            resident && (
                <ResidentContactForm 
                    initialData={editingContact}
                    residentId={resident.id}
                    onCancel={() => setView('list')}
                    onSubmitSuccess={() => {
                        setView('list');
                        fetchContacts();
                    }}
                />
            )
        )}
      </div>
    </ITDialog>
  );
};
