import { ITBadget, ITButton, ITCard, ITDialog, ITEmptyState, ITFlex, ITInput, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaPlus, FaSync, FaTrash } from "react-icons/fa";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useDispatch } from "react-redux";
import {
  createGenericCatalogItem,
  deleteGenericCatalogItem,
  GenericCatalogItem,
  GenericCatalogKey,
  listGenericCatalog,
  updateGenericCatalogItem,
} from "../services/GenericCatalogService";

export const GenericCatalogModal = ({
  catalogKey,
  label,
  isOpen,
  onClose,
  onChanged,
}: {
  catalogKey: GenericCatalogKey;
  label: string;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}) => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState<GenericCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listGenericCatalog(catalogKey);
      setRows(res.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, catalogKey]);

  const handleCreate = async () => {
    if (!name.trim() || !value.trim()) return;
    setSaving(true);
    try {
      const res: any = await createGenericCatalogItem(catalogKey, { name: name.trim().toUpperCase(), value: value.trim() });
      if (res.success === false) {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo crear", type: "error" }));
      } else {
        setName("");
        setValue("");
        await load();
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (row: GenericCatalogItem) => {
    const res: any = await updateGenericCatalogItem(catalogKey, row.id, { active: !row.active });
    if (res.success === false) {
      dispatch(showToast({ message: res.messages?.[0] || "No se pudo actualizar", type: "error" }));
      return;
    }
    await load();
    onChanged();
  };

  const removeRow = async (row: GenericCatalogItem) => {
    const res: any = await deleteGenericCatalogItem(catalogKey, row.id);
    if (res.success === false) {
      dispatch(showToast({ message: res.messages?.[0] || "No se pudo eliminar", type: "error" }));
      return;
    }
    await load();
    onChanged();
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={label} className="w-[640px] max-w-[95vw] max-h-[90vh]">
      <ITFlex direction="column" gap={4}>
        <ITCard className="rounded-2xl border-0! bg-slate-50/70! shadow-none!" contentClassName="p-3!">
          <ITFlex align="end" gap={2} wrap="wrap">
            <ITFlex direction="column" gap={1} className="min-w-[130px] flex-1">
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Código</ITText>
              <ITInput name="catalogCode" value={name} onChange={(event) => setName(event.target.value.toUpperCase())} placeholder="CASA" onBlur={() => {}} size="md" />
            </ITFlex>
            <ITFlex direction="column" gap={1} className="min-w-[160px] flex-[2]">
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Etiqueta</ITText>
              <ITInput name="catalogValue" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Casa" onBlur={() => {}} size="md" />
            </ITFlex>
            <ITButton color="primary" size="md" icon={<FaPlus />} onClick={handleCreate} disabled={saving || !name.trim() || !value.trim()} ariaLabel="Agregar valor" title="Agregar valor" />
          </ITFlex>
        </ITCard>

        <ITFlex align="center" justify="between" gap={2}>
          <ITFlex align="center" gap={2}>
            <ITText as="p" className="text-xs font-bold text-slate-500">Valores</ITText>
            <ITBadget color="secondary" variant="filled" size="sm">{rows.length}</ITBadget>
          </ITFlex>
          <ITButton variant="icon-only" color="secondary" size="sm" icon={<FaSync />} onClick={load} ariaLabel="Actualizar" title="Actualizar" />
        </ITFlex>

        {loading ? (
          <ITFlex justify="center" className="py-10"><ITLoader /></ITFlex>
        ) : rows.length === 0 ? (
          <ITEmptyState title="Sin valores" description="Agrega el primer valor de este catálogo." className="py-8" />
        ) : (
          <ITFlex direction="column" gap={1}>
            {rows.map((row) => (
              <ITFlex key={row.id} align="center" gap={2} className="rounded-xl bg-slate-50/70 px-3 py-2">
                <ITFlex direction="column" className="min-w-0 flex-1">
                  <ITText as="p" className="text-xs font-bold text-slate-800 dark:text-slate-100">{row.value}</ITText>
                  <ITText as="p" className="font-mono text-[10px] text-slate-400">{row.name}</ITText>
                </ITFlex>
                <ITBadget color={row.active ? "success" : "secondary"} variant="filled" size="sm">{row.active ? "Activo" : "Inactivo"}</ITBadget>
                <ITButton variant="text" color={row.active ? "warning" : "success"} size="sm" onClick={() => toggle(row)}>
                  {row.active ? "Desactivar" : "Activar"}
                </ITButton>
                {!row.isSystem && (
                  <ITButton variant="icon-only" color="danger" size="sm" icon={<FaTrash size={11} />} onClick={() => removeRow(row)} ariaLabel="Eliminar" title="Eliminar" />
                )}
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </ITFlex>
    </ITDialog>
  );
};
