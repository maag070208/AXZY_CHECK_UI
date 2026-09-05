import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
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

const DEFAULT_ICON = "alert";

const PRESET_COLORS: string[] = [
  "#065911",
  "#059669",
  "#10B981",
  "#388E3C",
  "#0288D1",
  "#FBC02D",
  "#EF4444",
  "#E65100",
  "#7B1FA2",
  "#64748B",
];

/**
 * Create/edit modal for a catalog category (Incidencias / Mantenimiento /
 * Casa Club). Part of "3. CRUD de administración de catálogos". The icon is
 * hidden and defaults to `alert` (the APP fallback); only the color is picked
 * from a preset palette.
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
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(editCategory?.name || "");
      setValue(editCategory?.value || "");
      setColor(editCategory?.color || "");
      setIcon(editCategory?.icon || DEFAULT_ICON);
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
        ? await updateCategory(editCategory.id, {
            name: name.trim(),
            value: value.trim(),
            color: color || undefined,
            icon: icon || DEFAULT_ICON,
          })
        : await createCategory({
            name: name.trim(),
            value: value.trim(),
            type: catalogType,
            color: color || undefined,
            icon: icon || DEFAULT_ICON,
          });

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
    <ITDialog isOpen={isOpen} onClose={onClose} title={editCategory ? "Editar categoría" : "Nueva categoría"} className="!max-w-lg w-full">
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

        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => {
              const selected = color === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(selected ? "" : preset)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: preset }}
                  title={preset}
                >
                  {selected && <FaCheck size={14} className="text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>

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