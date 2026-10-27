import { ITBadget, ITButton, ITCard, ITDialog, ITEmptyState, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaEdit, FaLayerGroup, FaListUl, FaPlus, FaPowerOff, FaSync, FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { CategoryFormModal } from "../components/CategoryFormModal";
import { CategoryTypesDialog } from "../components/CategoryTypesDialog";
import { CatalogDeleteDialog, type CatalogDeleteTarget } from "../components/CatalogDeleteDialog";
import { CATALOG_ORDER, pluralize } from "../components/catalogVisuals";
import {
  type CatalogAdminType,
  type CatalogCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/CatalogAdminService";
import {
  createGenericCatalogItem,
  listGenericCatalog,
  updateGenericCatalogItem,
  type GenericCatalogItem,
  type GenericCatalogKey,
  deleteGenericCatalogItem,
  GENERIC_CATALOGS,
} from "../services/GenericCatalogService";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Todas", value: "all" },
  { label: "Activas", value: "active" },
  { label: "Inactivas", value: "inactive" },
];

const REPORT_META: Record<string, { label: string; description: string }> = {
  INCIDENT: { label: "Incidencias", description: "Categorías y tipos de reportes de seguridad y convivencia." },
  MAINTENANCE: { label: "Mantenimiento", description: "Categorías y tipos de trabajos preventivos y correctivos." },
  CASA_CLUB: { label: "Casa Club", description: "Categorías y tipos de actividades y reservas." },
};

const BASE_META: Record<string, { label: string; description: string }> = Object.fromEntries(
  GENERIC_CATALOGS.map((c) => [c.key, { label: c.label, description: c.description }]),
);

const ALL_TABS = [
  ...CATALOG_ORDER.map((key) => ({ key, label: REPORT_META[key].label, kind: "report" as const })),
  ...GENERIC_CATALOGS.map((c) => ({ key: c.key, label: c.label, kind: "base" as const })),
];

const CatalogsPage = () => {
  const dispatch = useDispatch();
  const [activeKey, setActiveKey] = useState<string>("INCIDENT");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CatalogCategory | null>(null);
  const [typesCategory, setTypesCategory] = useState<CatalogCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogDeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [baseRows, setBaseRows] = useState<GenericCatalogItem[]>([]);
  const [baseLoading, setBaseLoading] = useState(false);
  const [baseFormOpen, setBaseFormOpen] = useState(false);
  const [baseEdit, setBaseEdit] = useState<GenericCatalogItem | null>(null);
  const [baseName, setBaseName] = useState("");
  const [baseValue, setBaseValue] = useState("");
  const [baseSaving, setBaseSaving] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingToggle, setPendingToggle] = useState<
    | { kind: "category"; item: CatalogCategory }
    | { kind: "base"; item: GenericCatalogItem }
    | null
  >(null);

  const tab = ALL_TABS.find((t) => t.key === activeKey) ?? ALL_TABS[0];
  const isReport = tab.kind === "report";
  const activeReport = (isReport ? activeKey : "INCIDENT") as CatalogAdminType;

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBase = useCallback(async (key: GenericCatalogKey) => {
    setBaseLoading(true);
    try {
      const res = await listGenericCatalog(key);
      setBaseRows(res.data ?? []);
    } finally {
      setBaseLoading(false);
    }
  }, []);

  const loadCounts = useCallback(async () => {
    const entries = await Promise.all(
      GENERIC_CATALOGS.map(async (c) => {
        try {
          const res = await listGenericCatalog(c.key);
          return [c.key, (res.data ?? []).length] as const;
        } catch {
          return [c.key, 0] as const;
        }
      }),
    );
    setCounts(Object.fromEntries(entries));
  }, []);

  useEffect(() => { void loadCategories(); void loadCounts(); }, [loadCategories, loadCounts]);
  useEffect(() => {
    if (!isReport) void loadBase(activeKey as GenericCatalogKey);
    setStatusFilter("all");
  }, [activeKey, isReport, loadBase]);

  const reportCounts = useMemo(() => {
    const result: Record<string, number> = {};
    CATALOG_ORDER.forEach((key) => { result[key] = categories.filter((c) => c.type === key).length; });
    return result;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === activeKey)
      .filter((c) => (statusFilter === "all" ? true : statusFilter === "active" ? c.active : !c.active))
      .sort((a, b) => a.order - b.order);
  }, [categories, activeKey, statusFilter]);

  const filteredBase = useMemo(() => {
    return [...baseRows].sort((a, b) => a.order - b.order);
  }, [baseRows]);

  const openNew = () => {
    if (isReport) {
      setEditCategory(null);
      setCategoryModalOpen(true);
    } else {
      setBaseEdit(null);
      setBaseName("");
      setBaseValue("");
      setBaseFormOpen(true);
    }
  };

  const openEditBase = (row: GenericCatalogItem) => {
    setBaseEdit(row);
    setBaseName(row.name);
    setBaseValue(row.value);
    setBaseFormOpen(true);
  };

  const saveBase = async () => {
    if (!baseName.trim() || !baseValue.trim()) return;
    setBaseSaving(true);
    try {
      const key = activeKey as GenericCatalogKey;
      const res: any = baseEdit
        ? await updateGenericCatalogItem(key, baseEdit.id, { name: baseName.trim().toUpperCase(), value: baseValue.trim() })
        : await createGenericCatalogItem(key, { name: baseName.trim().toUpperCase(), value: baseValue.trim() });
      if (res.success === false) {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo guardar", type: "error" }));
        return;
      }
      setBaseFormOpen(false);
      await loadBase(key);
      await loadCounts();
    } finally {
      setBaseSaving(false);
    }
  };

  const removeBase = async (row: GenericCatalogItem) => {
    const res: any = await deleteGenericCatalogItem(activeKey as GenericCatalogKey, row.id);
    if (res.success === false) {
      dispatch(showToast({ message: res.messages?.[0] || "No se pudo eliminar", type: "error" }));
      return;
    }
    await loadBase(activeKey as GenericCatalogKey);
    await loadCounts();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = deleteTarget.kind === "category"
        ? await deleteCategory(deleteTarget.category.id)
        : await Promise.resolve({ success: true } as any);
      if (!res.success) {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo eliminar", type: "error" }));
        return;
      }
      setDeleteTarget(null);
      await loadCategories();
      dispatch(showToast({ message: "Catálogo actualizado", type: "success" }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Catálogos"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Catálogos" }]}
      description="Catálogos base: categorías, tipos, propiedades, invitaciones y parentescos."
      icon={<FaLayerGroup size={20} />}
      actions={
        <ITButton variant="icon-only" color="secondary" size="md" icon={<FaSync />} onClick={() => { void loadCategories(); void loadCounts(); if (!isReport) void loadBase(activeKey as GenericCatalogKey); }} ariaLabel="Actualizar" title="Actualizar" />
      }
    >
      <ITFlex direction="column" gap={4} className="w-full pb-10 pt-5">
        <ITFlex align="center" gap={1} wrap="wrap" className="border-b border-slate-200">
          {ALL_TABS.map((item) => {
            const selected = item.key === activeKey;
            const count = item.kind === "report" ? reportCounts[item.key] ?? 0 : counts[item.key] ?? 0;
            return (
              <ITFlex key={item.key} direction="column" align="center" className="min-w-0">
                <ITButton
                  variant="text"
                  color={selected ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => {
                    setActiveKey(item.key);
                    (document.activeElement as HTMLElement | null)?.blur();
                  }}
                  className="rounded-none! border-0! px-3! pb-2! focus:outline-none!"
                >
                  {item.label} ({count})
                </ITButton>
                <ITFlex className={`h-0.5 w-full rounded-full ${selected ? "bg-[var(--color-primary)]" : "bg-transparent"}`} />
              </ITFlex>
            );
          })}
        </ITFlex>

        <ITCard className="rounded-3xl" contentClassName="p-5!">
          <ITFlex align="start" justify="between" gap={3} wrap="wrap" className="mb-5">
            <ITFlex direction="column">
              <ITText as="h2" className="text-base font-black text-slate-900 dark:text-white">{tab.label}</ITText>
              <ITText as="p" className="text-xs text-slate-500">{isReport ? REPORT_META[activeKey]?.description : BASE_META[activeKey]?.description}</ITText>
            </ITFlex>
            <ITFlex align="end" gap={2} wrap="wrap">
              {isReport && (
                <ITFlex direction="column" gap={1}>
                  <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado</ITText>
                  <ITSearchSelect value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)} options={STATUS_OPTIONS} clearable={false} />
                </ITFlex>
              )}
              <ITButton color="primary" size="md" onClick={openNew}>
                <ITFlex align="center" gap={2}>Nuevo<FaPlus /></ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>

          <ITFlex direction="column" className="overflow-hidden rounded-2xl border border-slate-100">
            <ITGrid container columns={12} className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
              <ITGrid item xs={6}><ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nombre</ITText></ITGrid>
              <ITGrid item xs={2}><ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Orden</ITText></ITGrid>
              <ITGrid item xs={2}><ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Activo</ITText></ITGrid>
              <ITGrid item xs={2}><ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Acciones</ITText></ITGrid>
            </ITGrid>

            {isReport ? (
              loading ? (
                <ITFlex justify="center" className="py-12"><ITLoader /></ITFlex>
              ) : filteredCategories.length === 0 ? (
                <ITEmptyState title="Sin categorías" description="Crea la primera categoría de este catálogo." className="py-10" />
              ) : (
                filteredCategories.map((category) => (
                  <ITGrid key={category.id} container columns={12} className="items-center border-b border-slate-100 px-3 py-3 last:border-b-0">
                    <ITGrid item xs={6}>
                      <ITFlex direction="column">
                        <ITText as="p" className="text-xs font-bold text-slate-800 dark:text-slate-100">{category.value}</ITText>
                        <ITText as="p" className="font-mono text-[10px] text-slate-400">{category.name} · {pluralize(category._count?.types ?? 0, "tipo", "tipos")}</ITText>
                      </ITFlex>
                    </ITGrid>
                    <ITGrid item xs={2}><ITText as="span" className="text-xs text-slate-500">{category.order}</ITText></ITGrid>
                    <ITGrid item xs={2}><ITBadget color={category.active ? "success" : "secondary"} variant="filled" size="sm">{category.active ? "Activo" : "Inactivo"}</ITBadget></ITGrid>
                    <ITGrid item xs={2}>
                      <ITFlex align="center" gap={1}>
                        <ITButton variant="icon-only" color="secondary" size="sm" icon={<FaListUl size={11} />} onClick={() => setTypesCategory(category)} ariaLabel="Tipos" title="Tipos" />
                        <ITButton variant="icon-only" color="warning" size="sm" icon={<FaEdit size={11} />} onClick={() => { setEditCategory(category); setCategoryModalOpen(true); }} ariaLabel="Editar" title="Editar" />
                        <ITButton variant="icon-only" color={category.active ? "secondary" : "success"} size="sm" icon={<FaPowerOff size={11} />} onClick={() => setPendingToggle({ kind: "category", item: category })} ariaLabel={category.active ? "Desactivar" : "Activar"} title={category.active ? "Desactivar" : "Activar"} />
                        <ITButton variant="icon-only" color="danger" size="sm" icon={<FaTrash size={11} />} onClick={() => setDeleteTarget({ kind: "category", category })} ariaLabel="Eliminar" title="Eliminar" />
                      </ITFlex>
                    </ITGrid>
                  </ITGrid>
                ))
              )
            ) : baseLoading ? (
              <ITFlex justify="center" className="py-12"><ITLoader /></ITFlex>
            ) : filteredBase.length === 0 ? (
              <ITEmptyState title="Sin valores" description="Agrega el primer valor de este catálogo." className="py-10" />
            ) : (
              filteredBase.map((row) => (
                <ITGrid key={row.id} container columns={12} className="items-center border-b border-slate-100 px-3 py-3 last:border-b-0">
                  <ITGrid item xs={6}>
                    <ITFlex direction="column">
                      <ITText as="p" className="text-xs font-bold text-slate-800 dark:text-slate-100">{row.value}</ITText>
                      <ITText as="p" className="font-mono text-[10px] text-slate-400">{row.name}</ITText>
                    </ITFlex>
                  </ITGrid>
                  <ITGrid item xs={2}><ITText as="span" className="text-xs text-slate-500">{row.order}</ITText></ITGrid>
                  <ITGrid item xs={2}><ITBadget color={row.active ? "success" : "secondary"} variant="filled" size="sm">{row.active ? "Activo" : "Inactivo"}</ITBadget></ITGrid>
                  <ITGrid item xs={2}>
                    <ITFlex align="center" gap={1}>
                      <ITButton variant="icon-only" color="warning" size="sm" icon={<FaEdit size={11} />} onClick={() => openEditBase(row)} ariaLabel="Editar" title="Editar" />
                      <ITButton variant="icon-only" color={row.active ? "secondary" : "success"} size="sm" icon={<FaPowerOff size={11} />} onClick={() => setPendingToggle({ kind: "base", item: row })} ariaLabel={row.active ? "Desactivar" : "Activar"} title={row.active ? "Desactivar" : "Activar"} />
                      <ITButton variant="icon-only" color="danger" size="sm" icon={<FaTrash size={11} />} onClick={() => removeBase(row)} ariaLabel="Eliminar" title="Eliminar" disabled={row.isSystem} />
                    </ITFlex>
                  </ITGrid>
                </ITGrid>
              ))
            )}
          </ITFlex>
        </ITCard>
      </ITFlex>

      <CategoryFormModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={() => { setCategoryModalOpen(false); void loadCategories(); }}
        catalogType={activeReport}
        editCategory={editCategory}
      />

      <CategoryTypesDialog
        category={typesCategory}
        isOpen={!!typesCategory}
        onClose={() => setTypesCategory(null)}
        onChanged={() => void loadCategories()}
      />

      <CatalogDeleteDialog
        target={deleteTarget}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ITDialog
        isOpen={!!pendingToggle}
        onClose={() => setPendingToggle(null)}
        title={
          pendingToggle
            ? `${pendingToggle.item.active ? "Desactivar" : "Activar"} ${pendingToggle.kind === "category" ? "categoría" : "valor"}`
            : ""
        }
        className="w-[440px] max-w-[95vw]"
      >
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
            {pendingToggle?.item.active
              ? `"${pendingToggle.item.value}" dejará de estar disponible en la app. El historial se conserva y puedes reactivarlo después.`
              : `"${pendingToggle?.item.value}" volverá a estar disponible en la app.`}
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setPendingToggle(null)}>Cancelar</ITButton>
            <ITButton
              color={pendingToggle?.item.active ? "danger" : "success"}
              onClick={async () => {
                if (!pendingToggle) return;
                if (pendingToggle.kind === "category") {
                  await updateCategory(pendingToggle.item.id, { active: !pendingToggle.item.active });
                  await loadCategories();
                } else {
                  await updateGenericCatalogItem(activeKey as GenericCatalogKey, pendingToggle.item.id, { active: !pendingToggle.item.active });
                  await loadBase(activeKey as GenericCatalogKey);
                }
                setPendingToggle(null);
              }}
            >
              {pendingToggle?.item.active ? "Desactivar" : "Activar"}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog isOpen={baseFormOpen} onClose={() => setBaseFormOpen(false)} title={baseEdit ? `Editar ${tab.label}` : `Nuevo ${tab.label}`} className="w-[480px] max-w-[95vw]">
        <ITFlex direction="column" gap={4}>
          <ITGrid container columns={2} spacing={3}>
            <ITGrid item xs={6}><ITInput name="baseCode" label="Código" value={baseName} onChange={(e) => setBaseName(e.target.value.toUpperCase())} onBlur={() => {}} /></ITGrid>
            <ITGrid item xs={6}><ITInput name="baseValue" label="Nombre" value={baseValue} onChange={(e) => setBaseValue(e.target.value)} onBlur={() => {}} /></ITGrid>
          </ITGrid>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setBaseFormOpen(false)}>Cancelar</ITButton>
            <ITButton color="primary" onClick={saveBase} disabled={baseSaving || !baseName.trim() || !baseValue.trim()}>{baseSaving ? "Guardando..." : "Guardar"}</ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default CatalogsPage;
