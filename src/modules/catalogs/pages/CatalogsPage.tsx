import { showToast } from "@app/core/store/toast/toast.slice";
import { ITAlert, ITButton, ITEmptyState, ITPage, ITTripleFilter } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaExclamationTriangle,
  FaLayerGroup,
  FaListUl,
  FaPlus,
  FaSearch,
  FaSync,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { CatalogCategoryCard } from "../components/CatalogCategoryCard";
import { CatalogDeleteDialog, type CatalogDeleteTarget } from "../components/CatalogDeleteDialog";
import { CategoryFormModal } from "../components/CategoryFormModal";
import { TypeFormModal } from "../components/TypeFormModal";
import {
  CATALOG_META,
  CATALOG_ORDER,
  cx,
  normalizeSearch,
  pluralize,
} from "../components/catalogVisuals";
import {
  type CatalogAdminType,
  type CatalogCategory,
  type CatalogType,
  deleteCategory,
  deleteType,
  getCategories,
  getTypes,
  reorderCategories,
  reorderTypes,
  updateCategory,
  updateType,
} from "../services/CatalogAdminService";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Todas", value: "all" },
  { label: "Activas", value: "active" },
  { label: "Inactivas", value: "inactive" },
];

const getErrorMessage = (error: unknown, fallback: string): string => {
  const result = error as { messages?: string[]; message?: string };
  return result?.messages?.[0] || result?.message || fallback;
};

/**
 * "3. Catálogo de incidencias → CRUD de catálogos". Lets ADMIN manage the
 * three independent type catalogs (Incidencias / Mantenimiento / Casa Club)
 * without depending on a development ticket: create, edit, activate,
 * deactivate, reorder and delete categories and their types. Deleting with
 * history soft-disables the record instead of removing it permanently.
 */
const CatalogsPage = () => {
  const dispatch = useDispatch();

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<CatalogAdminType>("INCIDENT");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [typesByCategory, setTypesByCategory] = useState<Record<number, CatalogType[]>>({});
  const [typesLoading, setTypesLoading] = useState<Record<number, boolean>>({});
  const [typesError, setTypesError] = useState<Record<number, string | null>>({});
  const [typeQueries, setTypeQueries] = useState<Record<number, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CatalogCategory | null>(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeModalCategoryId, setTypeModalCategoryId] = useState<number | null>(null);
  const [editType, setEditType] = useState<CatalogType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogDeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCatalogs = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await getCategories();
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
          setLoadError(null);
          setLastSync(new Date());
        } else {
          const message = res.messages?.[0] || "No se pudieron cargar los catálogos";
          setLoadError(message);
          if (silent) dispatch(showToast({ message, type: "error" }));
        }
      } catch (error) {
        const message = getErrorMessage(error, "No se pudieron cargar los catálogos");
        setLoadError(message);
        if (silent) dispatch(showToast({ message, type: "error" }));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  const loadTypesFor = useCallback(
    async (categoryId: number, force = false) => {
      if (!force && typesByCategory[categoryId]) return;
      if (typesLoading[categoryId]) return;

      setTypesLoading((prev) => ({ ...prev, [categoryId]: true }));
      setTypesError((prev) => ({ ...prev, [categoryId]: null }));

      try {
        const res = await getTypes(categoryId);
        if (res.success && Array.isArray(res.data)) {
          setTypesByCategory((prev) => ({ ...prev, [categoryId]: res.data }));
        } else {
          const message = res.messages?.[0] || "No se pudieron cargar los tipos";
          setTypesError((prev) => ({ ...prev, [categoryId]: message }));
          dispatch(showToast({ message, type: "error" }));
        }
      } catch (error) {
        const message = getErrorMessage(error, "No se pudieron cargar los tipos");
        setTypesError((prev) => ({ ...prev, [categoryId]: message }));
        dispatch(showToast({ message, type: "error" }));
      } finally {
        setTypesLoading((prev) => ({ ...prev, [categoryId]: false }));
      }
    },
    [dispatch, typesByCategory, typesLoading],
  );

  const categoriesByType = useMemo(() => {
    const grouped: Record<CatalogAdminType, CatalogCategory[]> = {
      INCIDENT: [],
      MAINTENANCE: [],
      CASA_CLUB: [],
    };

    categories.forEach((category) => {
      if (category.type in grouped) {
        grouped[category.type as CatalogAdminType].push(category);
      }
    });

    CATALOG_ORDER.forEach((type) => {
      grouped[type].sort((a, b) => a.order - b.order || a.value.localeCompare(b.value, "es"));
    });

    return grouped;
  }, [categories]);

  const tabCategories = categoriesByType[activeTab];
  const meta = CATALOG_META[activeTab];

  const activeCount = useMemo(
    () => tabCategories.filter((category) => category.active).length,
    [tabCategories],
  );
  const inactiveCount = tabCategories.length - activeCount;
  const totalTypes = useMemo(
    () => tabCategories.reduce((total, category) => total + (category._count?.types ?? 0), 0),
    [tabCategories],
  );

  const tabCounts = useMemo(
    () => ({
      INCIDENT: categoriesByType.INCIDENT.length,
      MAINTENANCE: categoriesByType.MAINTENANCE.length,
      CASA_CLUB: categoriesByType.CASA_CLUB.length,
    }),
    [categoriesByType],
  );

  const visibleCategories = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return tabCategories.filter((category) => {
      if (statusFilter === "active" && !category.active) return false;
      if (statusFilter === "inactive" && category.active) return false;
      if (!query) return true;
      return (
        normalizeSearch(category.value).includes(query) ||
        normalizeSearch(category.name).includes(query)
      );
    });
  }, [tabCategories, statusFilter, searchTerm]);

  const hasFilters = statusFilter !== "all" || searchTerm.trim().length > 0;
  const allVisibleExpanded =
    visibleCategories.length > 0 &&
    visibleCategories.every((category) => expandedIds.includes(category.id));

  const openCreateCategory = () => {
    setEditCategory(null);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: CatalogCategory) => {
    setEditCategory(category);
    setCategoryModalOpen(true);
  };

  const openCreateType = (category: CatalogCategory) => {
    setEditType(null);
    setTypeModalCategoryId(category.id);
    setTypeModalOpen(true);
  };

  const openEditType = (category: CatalogCategory, type: CatalogType) => {
    setEditType(type);
    setTypeModalCategoryId(type.categoryId || category.id);
    setTypeModalOpen(true);
  };

  const handleTogglePanel = (category: CatalogCategory) => {
    if (expandedIds.includes(category.id)) {
      setExpandedIds((prev) => prev.filter((id) => id !== category.id));
      setTypeQueries((prev) => ({ ...prev, [category.id]: "" }));
      return;
    }

    setExpandedIds((prev) => [...prev, category.id]);
    void loadTypesFor(category.id);
  };

  const handleToggleExpandAll = () => {
    if (allVisibleExpanded) {
      const visibleIds = new Set(visibleCategories.map((category) => category.id));
      setExpandedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }

    const idsToOpen = visibleCategories.map((category) => category.id);
    setExpandedIds((prev) => Array.from(new Set([...prev, ...idsToOpen])));
    visibleCategories.forEach((category) => {
      if (!typesByCategory[category.id]) void loadTypesFor(category.id);
    });
  };

  const handleRefresh = async () => {
    await loadCatalogs({ silent: true });
    const openIds = expandedIds;
    await Promise.all(openIds.map((id) => loadTypesFor(id, true)));
  };

  const handleCategorySaved = () => {
    void loadCatalogs({ silent: true });
  };

  const handleTypeSaved = () => {
    Object.keys(typesByCategory).forEach((categoryId) => {
      void loadTypesFor(Number(categoryId), true);
    });
    void loadCatalogs({ silent: true });
  };

  const handleToggleCategory = async (category: CatalogCategory) => {
    const nextActive = !category.active;
    setBusyKey(`cat-${category.id}`);
    try {
      const res = await updateCategory(category.id, { active: nextActive });
      if (res.success) {
        setCategories((prev) =>
          prev.map((item) => (item.id === category.id ? { ...item, active: nextActive } : item)),
        );
        dispatch(
          showToast({
            message: nextActive ? "Categoría reactivada" : "Categoría desactivada",
            type: "success",
          }),
        );
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo actualizar la categoría",
            type: "error",
          }),
        );
      }
    } catch (error) {
      dispatch(
        showToast({ message: getErrorMessage(error, "No se pudo actualizar la categoría"), type: "error" }),
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleType = async (category: CatalogCategory, type: CatalogType) => {
    const nextActive = !type.active;
    setBusyKey(`type-${type.id}`);
    try {
      const res = await updateType(type.id, { active: nextActive });
      if (res.success) {
        setTypesByCategory((prev) => ({
          ...prev,
          [category.id]: (prev[category.id] ?? []).map((item) =>
            item.id === type.id ? { ...item, active: nextActive } : item,
          ),
        }));
        dispatch(
          showToast({
            message: nextActive ? "Tipo reactivado" : "Tipo desactivado",
            type: "success",
          }),
        );
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo actualizar el tipo",
            type: "error",
          }),
        );
      }
    } catch (error) {
      dispatch(
        showToast({ message: getErrorMessage(error, "No se pudo actualizar el tipo"), type: "error" }),
      );
    } finally {
      setBusyKey(null);
    }
  };

  /**
   * Reorders only the categories the user can currently see, keeping the
   * hidden ones in their original slots (used when a status/search filter is
   * active).
   */
  const handleMoveCategory = async (category: CatalogCategory, direction: -1 | 1) => {
    const fullList = categoriesByType[activeTab];
    const visibleIds = new Set(visibleCategories.map((item) => item.id));
    const visiblePositions = fullList
      .map((item, index) => (visibleIds.has(item.id) ? index : -1))
      .filter((index) => index >= 0);
    const visibleList = visiblePositions.map((index) => fullList[index]);
    const currentIndex = visibleList.findIndex((item) => item.id === category.id);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= visibleList.length) return;

    const reorderedVisible = [...visibleList];
    [reorderedVisible[currentIndex], reorderedVisible[nextIndex]] = [
      reorderedVisible[nextIndex],
      reorderedVisible[currentIndex],
    ];

    const reorderedFull = [...fullList];
    visiblePositions.forEach((position, index) => {
      reorderedFull[position] = reorderedVisible[index];
    });

    setBusyKey(`cat-${category.id}`);
    setCategories((prev) =>
      prev.map((item) => {
        const newOrder = reorderedFull.findIndex((row) => row.id === item.id);
        return newOrder >= 0 ? { ...item, order: newOrder } : item;
      }),
    );

    try {
      const res = await reorderCategories(reorderedFull.map((item) => item.id));
      if (!res.success) {
        throw new Error(res.messages?.[0] || "No se pudo guardar el orden");
      }
    } catch (error) {
      dispatch(
        showToast({ message: getErrorMessage(error, "No se pudo guardar el orden"), type: "error" }),
      );
      await loadCatalogs({ silent: true });
    } finally {
      setBusyKey(null);
    }
  };

  const handleMoveType = async (
    category: CatalogCategory,
    type: CatalogType,
    direction: -1 | 1,
  ) => {
    const fullList = typesByCategory[category.id] ?? [];
    const query = normalizeSearch(typeQueries[category.id] ?? "");
    const visibleList = query
      ? fullList.filter(
          (item) =>
            normalizeSearch(item.value).includes(query) ||
            normalizeSearch(item.name).includes(query),
        )
      : fullList;
    const visibleIds = new Set(visibleList.map((item) => item.id));
    const visiblePositions = fullList
      .map((item, index) => (visibleIds.has(item.id) ? index : -1))
      .filter((index) => index >= 0);
    const currentIndex = visibleList.findIndex((item) => item.id === type.id);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= visibleList.length) return;

    const reorderedVisible = [...visibleList];
    [reorderedVisible[currentIndex], reorderedVisible[nextIndex]] = [
      reorderedVisible[nextIndex],
      reorderedVisible[currentIndex],
    ];

    const reorderedFull = [...fullList];
    visiblePositions.forEach((position, index) => {
      reorderedFull[position] = reorderedVisible[index];
    });

    setBusyKey(`type-${type.id}`);
    setTypesByCategory((prev) => ({ ...prev, [category.id]: reorderedFull }));

    try {
      const res = await reorderTypes(reorderedFull.map((item) => item.id));
      if (!res.success) {
        throw new Error(res.messages?.[0] || "No se pudo guardar el orden");
      }
    } catch (error) {
      dispatch(
        showToast({ message: getErrorMessage(error, "No se pudo guardar el orden"), type: "error" }),
      );
      await loadTypesFor(category.id, true);
    } finally {
      setBusyKey(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res =
        deleteTarget.kind === "category"
          ? await deleteCategory(deleteTarget.category.id)
          : await deleteType(deleteTarget.type.id);

      if (!res.success) {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo completar la acción",
            type: "error",
          }),
        );
        return;
      }

      const message =
        typeof res.data?.message === "string"
          ? res.data.message
          : deleteTarget.kind === "category"
            ? "Categoría actualizada"
            : "Tipo actualizado";

      dispatch(showToast({ message, type: "success" }));

      if (deleteTarget.kind === "category") {
        const categoryId = deleteTarget.category.id;
        setExpandedIds((prev) => prev.filter((id) => id !== categoryId));
        setTypesByCategory((prev) => {
          const next = { ...prev };
          delete next[categoryId];
          return next;
        });
      } else {
        await loadTypesFor(deleteTarget.category.id, true);
      }

      setDeleteTarget(null);
      await loadCatalogs({ silent: true });
    } catch (error) {
      dispatch(
        showToast({ message: getErrorMessage(error, "No se pudo completar la acción"), type: "error" }),
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteTarget = () => {
    void handleConfirmDelete();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const emptyTitle = searchTerm.trim()
    ? "Sin coincidencias"
    : statusFilter === "active"
      ? "No hay categorías activas"
      : statusFilter === "inactive"
        ? "No hay categorías inactivas"
        : `Aún no hay categorías en ${meta.label}`;

  const emptyDescription = searchTerm.trim()
    ? `Ninguna categoría coincide con “${searchTerm.trim()}”. Prueba con otro nombre o código.`
    : statusFilter !== "all"
      ? "Cambia el filtro de estado para ver el resto de las categorías."
      : `Crea la primera categoría para clasificar los registros de ${meta.label} en la app.`;

  const statusCounts: Record<StatusFilter, number> = {
    all: tabCategories.length,
    active: activeCount,
    inactive: inactiveCount,
  };

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Catálogos"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Catálogos" }]}
      description="Define las categorías y tipos con los que la app clasifica incidencias, mantenimiento y actividades de Casa Club."
      icon={<FaLayerGroup size={20} />}
      iconColor="#065911"
      actions={
        <div className="flex items-center gap-2.5">
          <ITButton
            onClick={() => void handleRefresh()}
            variant="outlined"
            color="secondary"
            disabled={refreshing || loading}
            className="!h-[42px] !rounded-xl !border-slate-200 !bg-white !px-3.5 !text-xs !font-bold !text-slate-500 hover:!bg-slate-50"
            title="Actualizar catálogos"
            ariaLabel="Actualizar catálogos"
          >
            <span className="flex items-center gap-2">
              <FaSync className={cx("text-[11px]", refreshing && "animate-spin")} />
              <span className="hidden sm:!inline">Actualizar</span>
            </span>
          </ITButton>
          <ITButton
            onClick={openCreateCategory}
            color="primary"
            className="!h-[42px] !rounded-xl !bg-[#065911] !px-5 !text-xs !font-bold shadow-sm hover:!bg-[#04400c]"
          >
            <span className="flex items-center gap-2">
              <FaPlus size={10} /> Nueva categoría
            </span>
          </ITButton>
        </div>
      }
    >
      {loadError && categories.length > 0 && (
        <div className="mb-4">
          <ITAlert variant="error" title="No se pudieron sincronizar los catálogos">
            {loadError}
          </ITAlert>
        </div>
      )}

      {/* Catalog switcher + filters */}
      <section className="mb-5 overflow-hidden rounded-2xl   bg-white shadow-sm">
        <div className="flex flex-col gap-3 !p-3.5 sm:!p-4 xl:!flex-row xl:items-center xl:justify-between">
          <div
            role="tablist"
            aria-label="Tipo de catálogo"
            className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 xl:!w-auto"
          >
            {CATALOG_ORDER.map((type) => {
              const tabMeta = CATALOG_META[type];
              const TabIcon = tabMeta.icon;
              const selected = activeTab === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  title={tabMeta.description}
                  onClick={() => setActiveTab(type)}
                  className={cx(
                    "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[10.5px] font-bold transition-all sm:gap-2 sm:px-3 sm:text-[11px] xl:!flex-none",
                    selected
                      ? "bg-white text-[#065911] shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
                  )}
                >
                  <TabIcon
                    size={11}
                    className={cx(
                      "hidden sm:!block",
                      selected ? "text-[#065911]" : "text-slate-400",
                    )}
                  />
                  {tabMeta.label}
                  <span
                    className={cx(
                      "hidden rounded-full px-1.5 py-0.5 text-[9.5px] font-black sm:!inline-flex",
                      selected ? "bg-[#065911]/10 text-[#065911]" : "bg-slate-200/80 text-slate-500",
                    )}
                  >
                    {tabCounts[type]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:!w-60">
              <FaSearch
                size={10}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar categoría..."
                aria-label="Buscar categoría o código"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-8 text-[11.5px] font-medium text-slate-600 outline-none transition-colors placeholder:text-slate-400 focus:border-[#065911]/40 focus:bg-white focus:ring-2 focus:ring-[#065911]/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <FaTimes size={9} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-[9px] font-black uppercase tracking-widest text-slate-400 md:!inline">
                Estado
              </span>
              <ITTripleFilter<StatusFilter>
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS.map((option) => ({
                  label: `${option.label} ${statusCounts[option.value]}`,
                  value: option.value,
                }))}
                color="primary"
                className="!h-9 !rounded-xl !p-0.5"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleExpandAll}
              disabled={visibleCategories.length === 0}
              aria-expanded={allVisibleExpanded}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10.5px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaChevronDown
                size={9}
                className={cx("transition-transform duration-200", allVisibleExpanded && "rotate-180")}
              />
              {allVisibleExpanded ? "Contraer" : "Expandir"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
            <FaLayerGroup size={10} className="text-slate-400" />
            {hasFilters
              ? `${visibleCategories.length} de ${pluralize(tabCategories.length, "categoría", "categorías")}`
              : pluralize(tabCategories.length, "categoría", "categorías")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
            <FaListUl size={10} className="text-slate-400" />
            {pluralize(totalTypes, "tipo", "tipos")}
          </span>
          <span className="hidden h-3 w-px bg-slate-200 sm:!block" />
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {pluralize(activeCount, "activa", "activas")}
          </span>
          <span
            className={cx(
              "inline-flex items-center gap-1.5 text-[10.5px] font-semibold",
              inactiveCount > 0 ? "text-rose-500" : "text-slate-400",
            )}
          >
            <span
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                inactiveCount > 0 ? "bg-rose-400" : "bg-slate-300",
              )}
            />
            {pluralize(inactiveCount, "inactiva", "inactivas")}
          </span>
          {hasFilters && visibleCategories.length > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] font-bold text-[#065911] underline decoration-[#065911]/30 underline-offset-2 transition-colors hover:text-[#04400c]"
            >
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            {refreshing ? (
              <>
                <FaSyncAlt size={9} className="animate-spin" /> Actualizando...
              </>
            ) : lastSync ? (
              `Actualizado ${lastSync.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            ) : (
              "Sin sincronizar"
            )}
          </span>
        </div>
      </section>

      {loading && categories.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:!grid-cols-2 2xl:!grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-[132px] animate-pulse rounded-2xl border border-slate-200/70 bg-white shadow-sm"
            />
          ))}
        </div>
      ) : loadError && categories.length === 0 ? (
        <div className="rounded-2xl   bg-white p-3 shadow-sm">
          <ITEmptyState
            icon={<FaExclamationTriangle size={30} className="text-amber-400" />}
            title="No se pudieron cargar los catálogos"
            description={loadError}
            action={
              <ITButton
                color="primary"
                onClick={() => void loadCatalogs()}
                className="!rounded-xl !bg-[#065911] hover:!bg-[#04400c]"
              >
                Reintentar
              </ITButton>
            }
          />
        </div>
      ) : visibleCategories.length === 0 ? (
        <div className="rounded-2xl   bg-white p-3 shadow-sm">
          <ITEmptyState
            icon={<FaLayerGroup size={30} className="text-slate-300" />}
            title={emptyTitle}
            description={emptyDescription}
            action={
              hasFilters ? (
                <ITButton
                  variant="outlined"
                  color="secondary"
                  onClick={clearFilters}
                  className="!rounded-xl"
                >
                  Limpiar filtros
                </ITButton>
              ) : (
                <ITButton
                  color="primary"
                  onClick={openCreateCategory}
                  className="!rounded-xl !bg-[#065911] hover:!bg-[#04400c]"
                >
                  <span className="flex items-center gap-2">
                    <FaPlus size={10} /> Nueva categoría
                  </span>
                </ITButton>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:!grid-cols-2 2xl:!grid-cols-3">
          {visibleCategories.map((category) => {
            const fullIndex = tabCategories.findIndex((item) => item.id === category.id);
            return (
              <CatalogCategoryCard
                key={category.id}
                category={category}
                expanded={expandedIds.includes(category.id)}
                types={typesByCategory[category.id]}
                typesLoading={Boolean(typesLoading[category.id])}
                typesError={typesError[category.id] ?? null}
                typeQuery={typeQueries[category.id] ?? ""}
                busyKey={busyKey}
                isFirst={fullIndex <= 0}
                isLast={fullIndex === tabCategories.length - 1}
                onToggle={() => handleTogglePanel(category)}
                onEditCategory={() => openEditCategory(category)}
                onToggleCategory={() => void handleToggleCategory(category)}
                onMoveCategory={(direction) => void handleMoveCategory(category, direction)}
                onDeleteCategory={() => setDeleteTarget({ kind: "category", category })}
                onAddType={() => openCreateType(category)}
                onEditType={(type) => openEditType(category, type)}
                onToggleType={(type) => void handleToggleType(category, type)}
                onMoveType={(type, direction) => void handleMoveType(category, type, direction)}
                onDeleteType={(type) => setDeleteTarget({ kind: "type", type, category })}
                onTypeQueryChange={(value) =>
                  setTypeQueries((prev) => ({ ...prev, [category.id]: value }))
                }
                onReloadTypes={() => void loadTypesFor(category.id, true)}
              />
            );
          })}
        </div>
      )}

      <CategoryFormModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={handleCategorySaved}
        catalogType={activeTab}
        editCategory={editCategory}
      />

      {typeModalCategoryId !== null && (
        <TypeFormModal
          isOpen={typeModalOpen}
          onClose={() => setTypeModalOpen(false)}
          onSuccess={handleTypeSaved}
          categories={tabCategories}
          defaultCategoryId={typeModalCategoryId}
          editType={editType}
        />
      )}

      <CatalogDeleteDialog
        target={deleteTarget}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteTarget}
      />
    </ITPage>
  );
};

export default CatalogsPage;
