import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaBan, FaCheck } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  type CatalogAdminType,
  type CatalogCategory,
  createCategory,
  updateCategory,
} from "../services/CatalogAdminService";
import {
  CATALOG_META,
  cx,
  getCategoryColor,
  getCategoryIcon,
  getCategoryTint,
} from "./catalogVisuals";

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
  "#3B82F6",
  "#0EA5E9",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#E65100",
  "#7B1FA2",
  "#64748B",
];

/**
 * Create/edit modal for a catalog category (Incidencias / Mantenimiento /
 * Casa Club). Part of "3. CRUD de administración de catálogos". The icon is
 * hidden and defaults to `alert` (the APP fallback); only the color is picked
 * from a preset palette. A live preview shows how the category will look.
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

  const meta = CATALOG_META[catalogType];

  useEffect(() => {
    if (isOpen) {
      setName(editCategory?.name || "");
      setValue(editCategory?.value || "");
      setColor(editCategory?.color || "");
      setIcon(editCategory?.icon || DEFAULT_ICON);
    }
  }, [isOpen, editCategory]);

  const previewColor = getCategoryColor(color, catalogType);
  const PreviewIcon = getCategoryIcon(icon);
  const customColor = Boolean(color) && !PRESET_COLORS.some((preset) => preset.toLowerCase() === color.toLowerCase());

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
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editCategory ? "Editar categoría" : "Nueva categoría"}
      className="!w-full !max-w-lg"
    >
      <ITFlex direction="column" className="p-6">
        <ITFlex direction="column" className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.accent }} />
          Catálogo de {meta.label}
        </ITFlex>

        {/* Live preview of the resulting card */}
        <ITFlex direction="column" className="mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <ITFlex align="center" gap={3} className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={getCategoryTint(previewColor)}
            >
              <PreviewIcon size={18} />
            </span>
            <ITFlex direction="column" className="min-w-0 flex-1">
              <ITText as="p" className="truncate text-sm font-black text-slate-800">
                {value.trim() || "Nombre de la categoría"}
              </ITText>
              <ITFlex align="center" gap={2} className="mt-1 flex items-center gap-2">
                <ITText as="span" className="max-w-[160px] truncate rounded bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200">
                  {name.trim() || "CODIGO_INTERNO"}
                </ITText>
                <ITText as="span" className="text-[10px] font-medium text-slate-400">{editCategory?._count?.types ?? 0} tipos</ITText>
              </ITFlex>
            </ITFlex>
            <ITText as="span" className="shrink-0 text-[8.5px] font-black uppercase tracking-widest text-slate-300">
              Vista previa
            </ITText>
          </ITFlex>
        </ITFlex>

        <ITFlex direction="column" className="space-y-4">
          <ITFlex direction="column">
            <ITInput
              name="name"
              label="Nombre interno (código)"
              value={name}
              onChange={(e: any) => setName(e.target.value.toUpperCase())}
              onBlur={() => {}}
              placeholder="EJ. POOL_ENTRY"
              maxLength={60}
              required
            />
            <ITText as="p" className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              Identificador único que usa la app. Se guarda en mayúsculas.
            </ITText>
          </ITFlex>

          <ITFlex direction="column">
            <ITInput
              name="value"
              label="Texto visible"
              value={value}
              onChange={(e: any) => setValue(e.target.value)}
              onBlur={() => {}}
              placeholder="Ej. Ingreso a la alberca"
              maxLength={80}
              required
            />
            <ITText as="p" className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              Es el nombre que verán los guardias y administradores.
            </ITText>
          </ITFlex>

          <ITFlex direction="column">
            <ITFlex align="center" justify="between" className="mb-2 flex items-center justify-between">
              <ITText as="p" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Color de identificación
              </ITText>
              <ITText as="span" className="font-mono text-[9.5px] font-semibold uppercase text-slate-400">
                {color || "Sin color"}
              </ITText>
            </ITFlex>
            <ITFlex align="center" className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setColor("")}
                aria-label="Sin color"
                title="Sin color"
                className={cx(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white text-slate-300 transition-transform hover:scale-110",
                  !color ? "border-[#065911] ring-2 ring-[#065911]/15" : "border-slate-200",
                )}
              >
                <FaBan size={10} />
              </button>

              {customColor && (
                <button
                  type="button"
                  onClick={() => setColor(color)}
                  aria-label={`Color actual ${color}`}
                  title={color}
                  className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[#065911] ring-offset-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  <FaCheck size={10} className="text-white drop-shadow" />
                </button>
              )}

              {PRESET_COLORS.map((preset) => {
                const selected = color.toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(selected ? "" : preset)}
                    aria-label={`Color ${preset}`}
                    title={preset}
                    className={cx(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110",
                      selected ? "ring-2 ring-[#065911] ring-offset-2" : "ring-1 ring-black/5",
                    )}
                    style={{ backgroundColor: preset }}
                  >
                    {selected && <FaCheck size={10} className="text-white drop-shadow" />}
                  </button>
                );
              })}
            </ITFlex>
          </ITFlex>
        </ITFlex>

        <ITFlex justify="end" className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
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
            {loading ? "Guardando..." : editCategory ? "Guardar cambios" : "Crear categoría"}
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
