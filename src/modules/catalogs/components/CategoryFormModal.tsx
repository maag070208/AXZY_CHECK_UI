import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITCard, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  type CatalogAdminType,
  type CatalogCategory,
  createCategory,
  updateCategory,
} from "../services/CatalogAdminService";
import { CATALOG_META, getCategoryIcon } from "./catalogVisuals";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  catalogType: CatalogAdminType;
  editCategory?: CatalogCategory | null;
}

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
  const [loading, setLoading] = useState(false);
  const meta = CATALOG_META[catalogType];
  const MetaIcon = getCategoryIcon(editCategory?.icon || "alert");

  useEffect(() => {
    if (isOpen) {
      setName(editCategory?.name || "");
      setValue(editCategory?.value || "");
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
        ? await updateCategory(editCategory.id, { name: name.trim(), value: value.trim() })
        : await createCategory({ name: name.trim(), value: value.trim(), type: catalogType });

      if (!res.success) {
        dispatch(showToast({ message: res.messages?.[0] || "Error inesperado", type: "error" }));
        return;
      }

      dispatch(showToast({ message: editCategory ? "Categoría actualizada" : "Categoría creada", type: "success" }));
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
      className="w-[560px] max-w-[95vw]"
    >
      <ITFlex direction="column" gap={4}>
        <ITCard className="rounded-2xl border-0! bg-emerald-50/60! shadow-none!" contentClassName="p-4!">
          <ITFlex align="center" gap={3}>
            <ITFlex align="center" justify="center" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#065911] text-white">
              <MetaIcon size={16} />
            </ITFlex>
            <ITFlex direction="column" className="min-w-0 flex-1">
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70">Catálogo de {meta.label}</ITText>
              <ITText as="p" className="truncate text-sm font-black text-emerald-950 dark:text-emerald-100">
                {value.trim() || "Nueva categoría"}
              </ITText>
              <ITText as="p" className="font-mono text-[10px] uppercase text-emerald-700/70">
                {name.trim() || "CODIGO_INTERNO"}
                {editCategory ? ` · ${editCategory._count?.types ?? 0} tipos` : ""}
              </ITText>
            </ITFlex>
          </ITFlex>
        </ITCard>

        <ITFlex direction="column" gap={3}>
          <ITInput
            name="name"
            label="Código interno"
            value={name}
            onChange={(e: any) => setName(e.target.value.toUpperCase())}
            onBlur={() => {}}
            placeholder="EJ. POOL_ENTRY"
            maxLength={60}
            required
          />
          <ITInput
            name="value"
            label="Nombre visible"
            value={value}
            onChange={(e: any) => setValue(e.target.value)}
            onBlur={() => {}}
            placeholder="Ej. Ingreso a la alberca"
            maxLength={80}
            required
          />
        </ITFlex>

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={onClose} disabled={loading}>Cancelar</ITButton>
          <ITButton color="primary" onClick={handleSubmit} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
