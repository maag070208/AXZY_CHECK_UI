import { ITBadget, ITButton, ITDialog, ITFlex, ITGrid, ITInput, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaPowerOff, FaSync, FaTrash } from "react-icons/fa";
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

export const GenericCatalogTable = ({ catalogKey, label, onChanged }: { catalogKey: GenericCatalogKey; label: string; onChanged: () => void }) => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState<GenericCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GenericCatalogItem | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listGenericCatalog(catalogKey);
      setRows(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [catalogKey]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setValue("");
    setDialogOpen(true);
  };

  const openEdit = (item: GenericCatalogItem) => {
    setEditing(item);
    setName(item.name);
    setValue(item.value);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!name.trim() || !value.trim()) return;
    setSaving(true);
    try {
      const res: any = editing
        ? await updateGenericCatalogItem(catalogKey, editing.id, { name: name.trim().toUpperCase(), value: value.trim() })
        : await createGenericCatalogItem(catalogKey, { name: name.trim().toUpperCase(), value: value.trim() });
      if (res.success === false) {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo guardar", type: "error" }));
        return;
      }
      setDialogOpen(false);
      await load();
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: GenericCatalogItem) => {
    const res: any = await updateGenericCatalogItem(catalogKey, item.id, { active: !item.active });
    if (res.success === false) {
      dispatch(showToast({ message: res.messages?.[0] || "No se pudo actualizar", type: "error" }));
      return;
    }
    await load();
    onChanged();
  };

  const remove = async (item: GenericCatalogItem) => {
    const res: any = await deleteGenericCatalogItem(catalogKey, item.id);
    if (res.success === false) {
      dispatch(showToast({ message: res.messages?.[0] || "No se pudo eliminar", type: "error" }));
      return;
    }
    await load();
    onChanged();
  };

  return (
    <>
      <ITFlex align="center" justify="between" gap={2} className="mb-3">
        <ITFlex align="center" gap={2}>
          <ITText as="p" className="text-xs font-bold text-slate-500">Valores</ITText>
          <ITBadget color="secondary" variant="filled" size="sm">{rows.length}</ITBadget>
        </ITFlex>
        <ITFlex align="center" gap={2}>
          <ITButton variant="icon-only" color="secondary" size="sm" icon={<FaSync />} onClick={load} ariaLabel="Actualizar" title="Actualizar" />
          <ITButton color="primary" size="sm" onClick={openNew}>
            <ITFlex align="center" gap={2}>Nuevo<FaPlus /></ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      {loading ? (
        <ITFlex justify="center" className="py-10"><ITLoader /></ITFlex>
      ) : (
        <ITFlex direction="column" gap={1}>
          {rows.map((item) => (
            <ITFlex key={item.id} align="center" gap={3} className="rounded-xl bg-slate-50/70 px-3 py-2.5">
              <ITFlex direction="column" className="min-w-0 flex-1">
                <ITText as="p" className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.value}</ITText>
                <ITText as="p" className="font-mono text-[10px] text-slate-400">{item.name}</ITText>
              </ITFlex>
              <ITBadget color={item.active ? "success" : "secondary"} variant="filled" size="sm">{item.active ? "Activo" : "Inactivo"}</ITBadget>
              <ITButton variant="icon-only" color={item.active ? "secondary" : "success"} size="sm" icon={<FaPowerOff size={11} />} onClick={() => toggle(item)} ariaLabel={item.active ? "Desactivar" : "Activar"} title={item.active ? "Desactivar" : "Activar"} />
              <ITButton variant="icon-only" color="warning" size="sm" icon={<FaEdit size={11} />} onClick={() => openEdit(item)} ariaLabel="Editar" title="Editar" />
              <ITButton variant="icon-only" color="danger" size="sm" icon={<FaTrash size={11} />} onClick={() => remove(item)} ariaLabel="Eliminar" title="Eliminar" disabled={item.isSystem} />
            </ITFlex>
          ))}
          {rows.length === 0 && <ITText as="p" className="py-8 text-center text-xs text-slate-400">Sin valores registrados.</ITText>}
        </ITFlex>
      )}

      <ITDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? `Editar ${label}` : `Nuevo ${label}`} className="w-[480px] max-w-[95vw]">
        <ITFlex direction="column" gap={4}>
          <ITGrid container columns={2} spacing={3}>
            <ITGrid item xs={6}><ITInput name="code" label="Código" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} onBlur={() => {}} /></ITGrid>
            <ITGrid item xs={6}><ITInput name="value" label="Etiqueta" value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => {}} /></ITGrid>
          </ITGrid>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setDialogOpen(false)}>Cancelar</ITButton>
            <ITButton color="primary" onClick={save} disabled={saving || !name.trim() || !value.trim()}>{saving ? "Guardando..." : "Guardar"}</ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </>
  );
};
