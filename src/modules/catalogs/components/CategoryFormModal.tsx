import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  CatalogAdminType,
  CatalogCategory,
  createCategory,
  updateCategory,
} from "../services/CatalogAdminService";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  catalogType: CatalogAdminType;
  editCategory?: CatalogCategory | null;
}

/**
 * Create/edit modal for a catalog category (Incidencias / Mantenimiento /
 * Casa Club). Part of "3. CRUD de administración de catálogos".
 */
export const CategoryFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  catalogType,
  editCategory,
}: CategoryFormModalProps) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(editCategory?.name || "");
      setValue(editCategory?.value || "");
      setColor(editCategory?.color || "");
      setIcon(editCategory?.icon || "");
    }
  }, [isOpen, editCategory]);

  const handleSubmit = async () => {
    if (!name.trim() || !value.trim()) {
      dispatch(showToast({ message: "Nombre y valor son requeridos", type: "error" }));
      return;
    }

    setLoading(true);
    try {
      const res = editCategory
        ? await updateCategory(editCategory.id, { name: name.trim(), value: value.trim(), color, icon })
        : await createCategory({ name: name.trim(), value: value.trim(), type: catalogType, color, icon });

      if (!res.success) {
        dispatch(showToast({ message: res.messages?.[0] || "Error inesperado", type: "error" }));
        return;
      }

      dispatch(
        showToast({
          message: editCategory ? "Categoría actualizada" : "Categoría creada",
          type: "success",
        }),
      );
      onSuccess();
      onClose();
    } catch (error) {
      const result = error as { messages?: string[] };
      dispatch(showToast({ message: result?.messages?.[0] || "Error de conexión", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={editCategory ? "Editar categoría" : "Nueva categoría"}>
      <div className="p-6 space-y-4">
        <ITInput
          name="name"
          label="Nombre interno (código)"
          value={name}
          onChange={(e: any) => setName(e.target.value.toUpperCase())}
          onBlur={() => {}}
          placeholder="EJ. POOL_ENTRY"
        />
        <ITInput
          name="value"
          label="Texto visible"
          value={value}
          onChange={(e: any) => setValue(e.target.value)}
          onBlur={() => {}}
          placeholder="Ej. Ingreso a la alberca"
        />
        <ITInput
          name="color"
          label="Color (opcional, hex)"
          value={color}
          onChange={(e: any) => setColor(e.target.value)}
          onBlur={() => {}}
          placeholder="#065911"
        />
        <ITInput
          name="icon"
          label="Ícono (opcional, nombre mdi)"
          value={icon}
          onChange={(e: any) => setIcon(e.target.value)}
          onBlur={() => {}}
          placeholder="alert-circle"
        />

        <div className="flex justify-end gap-3 pt-2">
          <ITButton variant="outlined" color="secondary" onClick={onClose} className="!rounded-lg">
            Cancelar
          </ITButton>
          <ITButton color="primary" onClick={handleSubmit} disabled={loading} className="!rounded-lg">
            {loading ? "Guardando..." : "Guardar"}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
