import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  type CatalogCategory,
  type CatalogType,
  createType,
  updateType,
} from "../services/CatalogAdminService";
import { getCategoryColor, getCategoryTint } from "./catalogVisuals";

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
  const categoryOptions = categories.map((category) => ({
    label: category.active ? category.value : `${category.value} (inactiva)`,
    value: String(category.id),
  }));

  useEffect(() => {
    if (isOpen) {
      setName(editType?.name || "");
      setValue(editType?.value || "");
      setCategoryId(editType?.categoryId || defaultCategoryId);
    }
  }, [isOpen, editType, defaultCategoryId]);

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const selectedColor = selectedCategory
    ? getCategoryColor(selectedCategory.color, selectedCategory.type)
    : "#64748B";

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
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editType ? "Editar tipo" : "Nuevo tipo"}
      className="!w-full !max-w-md !overflow-visible"
    >
      <div className="p-6">
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={getCategoryTint(selectedColor)}
            >
              <FaLayerGroup size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Categoría seleccionada
              </p>
              <p className="truncate text-[13px] font-bold text-slate-700">
                {selectedCategory?.value || "Selecciona una categoría"}
              </p>
            </div>
            {selectedCategory && !selectedCategory.active && (
              <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-500">
                Inactiva
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <ITInput
              name="name"
              label="Nombre interno (código)"
              value={name}
              onChange={(e: any) => setName(e.target.value.toUpperCase())}
              onBlur={() => {}}
              placeholder="EJ. MASCOTA_SIN_CORREA"
              maxLength={60}
              required
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              Identificador único del tipo. Se guarda en mayúsculas.
            </p>
          </div>

          <div>
            <ITInput
              name="value"
              label="Texto visible"
              value={value}
              onChange={(e: any) => setValue(e.target.value)}
              onBlur={() => {}}
              placeholder="Ej. Infracción por mascotas"
              maxLength={80}
              required
            />
            <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              Aparecerá en el formulario de la app cuando se elija esta categoría.
            </p>
          </div>

          <ITSearchSelect
            name="categoryId"
            label="Categoría"
            options={categoryOptions}
            value={String(categoryId)}
            onChange={(val) => setCategoryId(Number(val))}
            required
            clearable={false}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={loading}
           
          >
            Cancelar
          </ITButton>
          <ITButton
            color="primary"
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !value.trim()}
           
          >
            {loading ? "Guardando..." : editType ? "Guardar cambios" : "Crear tipo"}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
