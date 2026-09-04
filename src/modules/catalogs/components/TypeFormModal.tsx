import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CatalogCategory, CatalogType, createType, updateType } from "../services/CatalogAdminService";

interface TypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CatalogCategory[];
  defaultCategoryId: number;
  editType?: CatalogType | null;
}

/**
 * Create/edit modal for a catalog type (tipo de incidencia) under a category.
 * Part of "3. CRUD de administración de catálogos".
 */
export const TypeFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  defaultCategoryId,
  editType,
}: TypeFormModalProps) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState<number>(defaultCategoryId);
  const [loading, setLoading] = useState(false);

  // ITSearchSelect expects { label, value } — map numeric category ids to
  // strings so the value prop resolves correctly.
  const categoryOptions = categories.map((c) => ({ label: c.value, value: String(c.id) }));

  useEffect(() => {
    if (isOpen) {
      setName(editType?.name || "");
      setValue(editType?.value || "");
      setCategoryId(editType?.categoryId || defaultCategoryId);
    }
  }, [isOpen, editType, defaultCategoryId]);

  const handleSubmit = async () => {
    if (!name.trim() || !value.trim()) {
      dispatch(showToast({ message: "Nombre y valor son requeridos", type: "error" }));
      return;
    }

    setLoading(true);
    try {
      const res = editType
        ? await updateType(editType.id, { name: name.trim(), value: value.trim(), categoryId })
        : await createType({ name: name.trim(), value: value.trim(), categoryId });

      if (!res.success) {
        dispatch(showToast({ message: res.messages?.[0] || "Error inesperado", type: "error" }));
        return;
      }

      dispatch(showToast({ message: editType ? "Tipo actualizado" : "Tipo creado", type: "success" }));
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
    <ITDialog isOpen={isOpen} onClose={onClose} title={editType ? "Editar tipo" : "Nuevo tipo de incidencia"} className="!overflow-visible">
      <div className="p-6 space-y-4">
        <ITInput
          name="name"
          label="Nombre interno (código)"
          value={name}
          onChange={(e: any) => setName(e.target.value.toUpperCase())}
          onBlur={() => {}}
          placeholder="EJ. MASCOTA_SIN_CORREA"
        />
        <ITInput
          name="value"
          label="Texto visible"
          value={value}
          onChange={(e: any) => setValue(e.target.value)}
          onBlur={() => {}}
          placeholder="Ej. Infracción por mascotas"
        />
        <ITSearchSelect
          name="categoryId"
          label="Categoría"
          options={categoryOptions}
          value={String(categoryId)}
          onChange={(val) => setCategoryId(Number(val))}
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
