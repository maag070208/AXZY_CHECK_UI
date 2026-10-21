import { ITBadget, ITButton, ITDialog, ITEmptyState, ITFlex, ITInput, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaPlus, FaSync, FaTrash } from "react-icons/fa";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useDispatch } from "react-redux";
import {
  CatalogCategory,
  CatalogType,
  createType,
  deleteType,
  getTypes,
  updateType,
} from "../services/CatalogAdminService";

export const CategoryTypesDialog = ({
  category,
  isOpen,
  onClose,
  onChanged,
}: {
  category: CatalogCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}) => {
  const dispatch = useDispatch();
  const [types, setTypes] = useState<CatalogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<{ type: CatalogType; action: "toggle" | "delete" } | null>(null);

  const load = async () => {
    if (!category) return;
    setLoading(true);
    try {
      const res = await getTypes(category.id);
      setTypes(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && category) void load();
  }, [isOpen, category?.id]);

  const add = async () => {
    if (!category || !name.trim() || !value.trim()) return;
    setSaving(true);
    try {
      const res = await createType({ name: name.trim().toUpperCase(), value: value.trim(), categoryId: category.id });
      if (!res.success) {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo agregar", type: "error" }));
        return;
      }
      setName("");
      setValue("");
      await load();
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    if (pending.action === "toggle") {
      await updateType(pending.type.id, { active: !pending.type.active });
    } else {
      await deleteType(pending.type.id);
    }
    setPending(null);
    await load();
    onChanged();
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={`Tipos · ${category?.value ?? ""}`} className="w-[640px] max-w-[95vw]">
      <ITFlex direction="column" gap={4}>
        <ITFlex align="end" gap={2} wrap="wrap" className="mb-4">
          <ITFlex direction="column" gap={1} className="min-w-[120px] flex-1">
            <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Código</ITText>
            <ITInput name="typeCode" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} onBlur={() => {}} />
          </ITFlex>
          <ITFlex direction="column" gap={1} className="min-w-[150px] flex-[2]">
            <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nombre</ITText>
            <ITInput name="typeValue" value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => {}} />
          </ITFlex>
          <ITButton color="primary" size="md" variant="icon-only" icon={<FaPlus />} onClick={add} disabled={saving || !name.trim() || !value.trim()} ariaLabel="Agregar tipo" />
        </ITFlex>

        <ITFlex align="center" justify="between" className="mb-2">
          <ITFlex align="center" gap={2}>
            <ITText as="p" className="text-xs font-bold text-slate-500">Tipos</ITText>
            <ITBadget color="secondary" variant="filled" size="sm">{types.length}</ITBadget>
          </ITFlex>
          <ITButton variant="icon-only" color="secondary" size="sm" icon={<FaSync />} onClick={load} ariaLabel="Actualizar" title="Actualizar" />
        </ITFlex>

        {loading ? (
          <ITFlex justify="center" className="py-8"><ITLoader /></ITFlex>
        ) : types.length === 0 ? (
          <ITEmptyState title="Sin tipos" description="Agrega el primer tipo de esta categoría." className="py-6" />
        ) : (
          <ITFlex direction="column" gap={2}>
            {types.map((type) => (
              <ITFlex key={type.id} align="center" gap={2} className="rounded-xl bg-slate-50/70 px-3 py-2">
                <ITFlex direction="column" className="min-w-0 flex-1">
                  <ITText as="p" className="text-xs font-bold text-slate-800">{type.value}</ITText>
                  <ITText as="p" className="font-mono text-[10px] text-slate-400">{type.name}</ITText>
                </ITFlex>
                <ITBadget color={type.active ? "success" : "secondary"} variant="filled" size="sm">{type.active ? "Activo" : "Inactivo"}</ITBadget>
                <ITButton variant="text" color={type.active ? "warning" : "success"} size="sm" onClick={() => setPending({ type, action: "toggle" })}>
                  {type.active ? "Desactivar" : "Activar"}
                </ITButton>
                <ITButton variant="icon-only" color="danger" size="sm" icon={<FaTrash size={11} />} onClick={() => setPending({ type, action: "delete" })} ariaLabel="Eliminar" title="Eliminar" />
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </ITFlex>

      <ITDialog
        isOpen={!!pending}
        onClose={() => setPending(null)}
        title={pending?.action === "delete" ? "Eliminar tipo" : pending?.type.active ? "Desactivar tipo" : "Activar tipo"}
        className="w-[440px] max-w-[95vw]"
      >
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
            {pending?.action === "delete"
              ? `¿Eliminar definitivamente "${pending.type.value}"? Esta acción no se puede deshacer.`
              : pending?.type.active
                ? `"${pending.type.value}" dejará de aparecer en los formularios. El historial se conserva.`
                : `"${pending?.type.value ?? ""}" volverá a estar disponible en los formularios.`}
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setPending(null)}>Cancelar</ITButton>
            <ITButton color={pending?.action === "delete" || pending?.type.active ? "danger" : "success"} onClick={confirmPending}>
              {pending?.action === "delete" ? "Eliminar" : pending?.type.active ? "Desactivar" : "Activar"}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITDialog>
  );
};
