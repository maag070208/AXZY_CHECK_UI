import {
  ITButton,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaAddressBook,
  FaEdit,
  FaEnvelope,
  FaPhone,
  FaPlus,
  FaTrash,
  FaUserPlus,
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
  initialContact?: ResidentContact | null;
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
        const res = initialData
          ? await updateResidentContact(initialData.id, values)
          : await createResidentContact(residentId, values);

        if (res.success) {
          dispatch(
            showToast({
              message: initialData ? "Contacto actualizado" : "Contacto agregado",
              type: "success",
            }),
          );
          onSubmitSuccess();
        }
      } catch {
        dispatch(showToast({ message: "Error al guardar contacto", type: "error" }));
      }
    },
  });

  return (
    <ITFlex direction="column" gap={4} className="p-5">
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12}>
          <ITInput
            label="Nombre completo"
            name="name"
            placeholder="Ej. Juan Pérez"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
            touched={formik.touched.name}
            required
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
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
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITInput
            label="Email (opcional)"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email}
          />
        </ITGrid>
      </ITGrid>

      <ITFlex justify="end" gap={2}>
        <ITButton type="button" variant="outlined" color="secondary" onClick={onCancel}>
          Cancelar
        </ITButton>
        <ITButton
          color="primary"
          onClick={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar contacto" : "Guardar contacto"}
        </ITButton>
      </ITFlex>
    </ITFlex>
  );
};

export const ResidentContactsManager = ({ resident, isOpen, initialContact, onClose }: Props) => {
  const [contacts, setContacts] = useState<ResidentContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingContact, setEditingContact] = useState<ResidentContact | null>(null);
  const dispatch = useDispatch();

  const fetchContacts = useCallback(async () => {
    if (!resident) return;
    setLoading(true);
    try {
      const res = await getResidentContacts(resident.id);
      if (res.success) setContacts(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [resident]);

  useEffect(() => {
    if (isOpen && resident) {
      fetchContacts();
      if (initialContact) {
        setEditingContact(initialContact);
        setView("form");
      }
    }
    if (!isOpen) {
      setView("list");
      setEditingContact(null);
    }
  }, [isOpen, resident, initialContact, fetchContacts]);

  const handleOpenForm = (contact?: ResidentContact) => {
    setEditingContact(contact || null);
    setView("form");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este contacto?")) return;
    try {
      const res = await deleteResidentContact(id);
      if (res.success) {
        dispatch(showToast({ message: "Contacto eliminado", type: "success" }));
        fetchContacts();
      }
    } catch {
      dispatch(showToast({ message: "Error al eliminar contacto", type: "error" }));
    }
  };

  const title = (
    <ITFlex align="center" gap={3}>
      <ITFlex
        align="center"
        justify="center"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
      >
        {view === "list" ? <FaAddressBook /> : <FaUserPlus />}
      </ITFlex>
      <ITFlex direction="column">
        <ITText as="h3" className="text-lg font-black text-slate-900 dark:text-white">
          {view === "list" ? "Agenda de contactos" : editingContact ? "Editar contacto" : "Nuevo contacto"}
        </ITText>
        <ITText as="p" className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {resident?.name} {resident?.lastName || ""}
        </ITText>
      </ITFlex>
    </ITFlex>
  );

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title as any}
      className={view === "list" ? "w-[680px] max-w-[95vw]" : "w-[560px] max-w-[95vw]"}
    >
      {view === "list" ? (
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" justify="between" gap={3} className="rounded-2xl bg-slate-50/70 p-3 dark:bg-slate-900/40">
            <ITText as="p" className="text-xs text-slate-500">
              Contactos frecuentes para generar pases más rápido.
            </ITText>
            <ITButton color="primary" size="md" icon={<FaPlus />} onClick={() => handleOpenForm()}>
              Nuevo contacto
            </ITButton>
          </ITFlex>

          {loading ? (
            <ITFlex justify="center" className="py-12">
              <ITLoader />
            </ITFlex>
          ) : contacts.length > 0 ? (
            <ITFlex direction="column" gap={2}>
              {contacts.map((contact) => (
                <ITFlex
                  key={contact.id}
                  align="center"
                  gap={3}
                  className="rounded-xl bg-slate-50/60 p-3 dark:bg-slate-900/40"
                >
                  <ITFlex
                    align="center"
                    justify="center"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#065911] text-xs font-black text-white"
                  >
                    {contact.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                  </ITFlex>

                  <ITFlex direction="column" className="min-w-0 flex-1">
                    <ITText as="p" className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                      {contact.name}
                    </ITText>
                    <ITFlex align="center" gap={2} wrap="wrap">
                      {contact.phone && (
                        <ITText as="span" className="flex items-center gap-1 text-[11px] text-slate-500">
                          <FaPhone size={9} /> {contact.phone}
                        </ITText>
                      )}
                      {contact.email && (
                        <ITText as="span" className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                          <FaEnvelope size={9} /> {contact.email}
                        </ITText>
                      )}
                    </ITFlex>
                  </ITFlex>

                  <ITFlex align="center" gap={1}>
                    <ITButton
                      onClick={() => handleOpenForm(contact)}
                      size="md"
                      variant="icon-only"
                      color="secondary"
                      icon={<FaEdit />}
                      ariaLabel="Editar contacto"
                      title="Editar contacto"
                    />
                    <ITButton
                      onClick={() => handleDelete(contact.id)}
                      size="md"
                      variant="icon-only"
                      color="danger"
                      icon={<FaTrash />}
                      ariaLabel="Eliminar contacto"
                      title="Eliminar contacto"
                    />
                  </ITFlex>
                </ITFlex>
              ))}
            </ITFlex>
          ) : (
            <ITFlex direction="column" align="center" gap={3} className="py-10">
              <ITEmptyState
                icon={<FaAddressBook />}
                title="Sin contactos registrados"
                description="Agrega contactos para generarles pases de acceso."
                className="py-2"
              />
              <ITButton color="primary" size="md" icon={<FaPlus />} onClick={() => handleOpenForm()}>
                Agregar el primero
              </ITButton>
            </ITFlex>
          )}
        </ITFlex>
      ) : (
        resident && (
          <ResidentContactForm
            initialData={editingContact}
            residentId={resident.id}
            onCancel={() => setView("list")}
            onSubmitSuccess={() => {
              setView("list");
              fetchContacts();
            }}
          />
        )
      )}
    </ITDialog>
  );
};
