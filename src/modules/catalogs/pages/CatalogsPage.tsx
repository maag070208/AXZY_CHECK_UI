import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaLayerGroup,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { CategoryFormModal } from "../components/CategoryFormModal";
import { TypeFormModal } from "../components/TypeFormModal";
import {
  CatalogAdminType,
  CatalogCategory,
  CatalogType,
  deleteCategory,
  deleteType,
  getCategories,
  getTypes,
} from "../services/CatalogAdminService";

const TAB_OPTIONS: { label: string; value: CatalogAdminType }[] = [
  { label: "Incidencias", value: "INCIDENT" },
  { label: "Mantenimiento", value: "MAINTENANCE" },
  { label: "Casa Club", value: "CASA_CLUB" },
];

/**
 * "3. Catálogo de incidencias → CRUD de catálogos". Lets ADMIN manage the
 * three independent type catalogs (Incidencias / Mantenimiento / Casa Club)
 * without depending on a development ticket: create, edit and delete
 * categories and their types. Deleting with history soft-disables the record
 * instead of removing it permanently.
 */
const CatalogsPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<CatalogAdminType>("INCIDENT");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [typesByCategory, setTypesByCategory] = useState<Record<number, CatalogType[]>>({});

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CatalogCategory | null>(null);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeModalCategoryId, setTypeModalCategoryId] = useState<number | null>(null);
  const [editType, setEditType] = useState<CatalogType | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "category" | "type";
    id: number;
    active: boolean;
    label: string;
  } | null>(null);

  const loadCategories = useCallback(async (type: CatalogAdminType) => {
    setLoading(true);
    const res = await getCategories(type);
    setLoading(false);
    if (res.success && res.data) {
      setCategories(res.data);
    } else {
      dispatch(showToast({ message: "No se pudieron cargar las categorías", type: "error" }));
    }
  }, [dispatch]);

  useEffect(() => {
    setExpandedId(null);
    loadCategories(activeTab);
  }, [activeTab, loadCategories]);

  const loadTypes = async (categoryId: number) => {
    const res = await getTypes(categoryId);
    if (res.success && res.data) {
      setTypesByCategory((prev) => ({ ...prev, [categoryId]: res.data! }));
    }
  };

  const toggleExpand = (categoryId: number) => {
    const next = expandedId === categoryId ? null : categoryId;
    setExpandedId(next);
    if (next && !typesByCategory[next]) {
      loadTypes(next);
    }
  };

  // ---- Category actions ----

  const handleDeleteCategory = async (id: number) => {
    const res = await deleteCategory(id);
    setDeleteTarget(null);
    if (res.success) {
      dispatch(showToast({ message: res.data?.message || "Categoría eliminada", type: "success" }));
      loadCategories(activeTab);
    } else {
      dispatch(showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" }));
    }
  };

  // ---- Type actions ----

  const handleDeleteType = async (categoryId: number, id: number) => {
    const res = await deleteType(id);
    setDeleteTarget(null);
    if (res.success) {
      dispatch(showToast({ message: res.data?.message || "Tipo eliminado", type: "success" }));
      loadTypes(categoryId);
      loadCategories(activeTab);
    } else {
      dispatch(showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" }));
    }
  };

  const visibleCategories = categories.filter((c) =>
    statusFilter === "all" ? true : statusFilter === "active" ? c.active : !c.active,
  );

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <FaLayerGroup className="text-[#065911]" />
            Catálogos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra los tipos de incidencia de Incidencias, Mantenimiento y Casa Club sin depender de un
            ticket de desarrollo.
          </p>
        </div>

        <ITButton
          onClick={() => {
            setEditCategory(null);
            setCategoryModalOpen(true);
          }}
          color="primary"
          className="h-[42px] !px-6 !py-2.5 !rounded-xl !bg-[#065911] hover:!bg-[#04400c] font-bold text-xs flex items-center gap-2 shadow-sm"
        >
          <FaPlus className="text-xs" /> AGREGAR CATEGORÍA
        </ITButton>
      </div>

      {/* @axzydev/axzy_ui_system has no tabs/filter primitive, so this uses plain
          ITButton toggles instead. */}
      <div className="mb-3 flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border border-slate-100 w-fit">
        {TAB_OPTIONS.map((tab) => (
          <ITButton
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            color={activeTab === tab.value ? "primary" : "secondary"}
            variant={activeTab === tab.value ? "filled" : "outlined"}
            size="small"
            className="!rounded-lg !px-4"
          >
            {tab.label}
          </ITButton>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Estado:</span>
        {(
          [
            { label: "Todas", value: "all" },
            { label: "Activas", value: "active" },
            { label: "Inactivas", value: "inactive" },
          ] as const
        ).map((opt) => (
          <ITButton
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            color={statusFilter === opt.value ? "primary" : "secondary"}
            variant={statusFilter === opt.value ? "filled" : "outlined"}
            size="small"
            className="!rounded-lg !px-3"
          >
            {opt.label}
          </ITButton>
        ))}
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Cargando...</p>}
        {!loading && visibleCategories.length === 0 && (
          <p className="text-sm text-slate-400">
            {categories.length === 0
              ? "No hay categorías en este catálogo todavía."
              : "No hay categorías con ese estado."}
          </p>
        )}

        {visibleCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <button
                className="flex items-center gap-3 text-left flex-1"
                onClick={() => toggleExpand(category.id)}
              >
                {category.color && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <div>
                  <p className="font-bold text-slate-800">{category.value}</p>
                  <p className="text-xs text-slate-400">
                    {category._count?.types || 0} tipo(s) · {category.name}
                  </p>
                </div>
                {!category.active && <ITBadget label="Inactiva" color="danger" variant="filled" />}
                {expandedId === category.id ? (
                  <FaChevronUp className="text-slate-300 ml-2" />
                ) : (
                  <FaChevronDown className="text-slate-300 ml-2" />
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <ITButton
                  onClick={() => {
                    setEditCategory(category);
                    setCategoryModalOpen(true);
                  }}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  className="!rounded-lg !p-2"
                  title="Editar"
                >
                  <FaEdit size={14} />
                </ITButton>
                <ITButton
                  onClick={() =>
                    setDeleteTarget({ kind: "category", id: category.id, active: category.active, label: category.value })
                  }
                  variant="outlined"
                  color="danger"
                  size="small"
                  className="!rounded-lg !p-2 text-red-500 border-red-200"
                  title="Eliminar"
                >
                  <FaTrash size={14} />
                </ITButton>
              </div>
            </div>

            {expandedId === category.id && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipos</p>
                  <ITButton
                    onClick={() => {
                      setEditType(null);
                      setTypeModalCategoryId(category.id);
                      setTypeModalOpen(true);
                    }}
                    variant="outlined"
                    color="primary"
                    size="small"
                    className="!rounded-lg"
                  >
                    <div className="flex items-center gap-1">
                      <FaPlus size={10} /> Agregar tipo
                    </div>
                  </ITButton>
                </div>

                <div className="space-y-2">
                  {(typesByCategory[category.id] || []).map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">{type.value}</p>
                        {!type.active && <ITBadget label="Inactivo" color="danger" variant="filled" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ITButton
                          onClick={() => {
                            setEditType(type);
                            setTypeModalCategoryId(category.id);
                            setTypeModalOpen(true);
                          }}
                          variant="outlined"
                          color="secondary"
                          size="small"
                          className="!rounded-lg !p-1.5"
                          title="Editar"
                        >
                          <FaEdit size={12} />
                        </ITButton>
                        <ITButton
                          onClick={() =>
                            setDeleteTarget({ kind: "type", id: type.id, active: type.active, label: type.value })
                          }
                          variant="outlined"
                          color="danger"
                          size="small"
                          className="!rounded-lg !p-1.5 text-red-500 border-red-200"
                          title="Eliminar"
                        >
                          <FaTrash size={12} />
                        </ITButton>
                      </div>
                    </div>
                  ))}
                  {(typesByCategory[category.id] || []).length === 0 && (
                    <p className="text-xs text-slate-400">Sin tipos todavía.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <CategoryFormModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={() => loadCategories(activeTab)}
        catalogType={activeTab}
        editCategory={editCategory}
      />

      {typeModalCategoryId !== null && (
        <TypeFormModal
          isOpen={typeModalOpen}
          onClose={() => setTypeModalOpen(false)}
          onSuccess={() => {
            loadTypes(typeModalCategoryId);
            loadCategories(activeTab);
          }}
          categories={categories}
          defaultCategoryId={typeModalCategoryId}
          editType={editType}
        />
      )}

      <ITDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.active ? "Desactivar registro" : "Eliminar permanentemente"}
        className="!max-w-md w-full"
      >
        <div className="p-6">
          {deleteTarget?.active ? (
            <p className="text-slate-600 mb-6 text-sm">
              <span className="font-bold text-slate-800">"{deleteTarget.label}"</span> se{" "}
              <span className="font-bold">desactivará</span>: deja de estar disponible para nuevos registros, pero
              conserva su historial y puede seguir viéndose aquí. ¿Deseas continuar?
            </p>
          ) : (
            <p className="text-slate-600 mb-6 text-sm">
              <span className="font-bold text-slate-800">"{deleteTarget?.label}"</span> ya está desactivada. Al
              confirmar se eliminará{" "}
              <span className="font-bold text-red-600">permanentemente</span> de la base de datos
              {deleteTarget?.kind === "category" ? " junto con sus tipos asociados" : ""}, y los registros históricos
              dejarán de referenciarla. Esta acción <span className="font-bold">no se puede deshacer</span>. ¿Deseas
              continuar?
            </p>
          )}
          <div className="flex justify-end gap-3">
            <ITButton variant="outlined" color="secondary" onClick={() => setDeleteTarget(null)} className="!rounded-lg">
              Cancelar
            </ITButton>
            <ITButton
              className="!bg-red-600 text-white !rounded-lg"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.kind === "category") {
                  handleDeleteCategory(deleteTarget.id);
                } else {
                  const categoryId = expandedId as number;
                  handleDeleteType(categoryId, deleteTarget.id);
                }
              }}
            >
              {deleteTarget?.active ? "Desactivar" : "Eliminar permanentemente"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default CatalogsPage;
