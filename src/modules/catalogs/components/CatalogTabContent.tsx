import { ITButton, ITLoader } from '@axzydev/axzy_ui_system';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaExternalLinkAlt, FaPlus, FaPowerOff, FaSearch, FaSync, FaTimes, FaTrash } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { showToast } from '@app/core/store/toast/toast.slice';
import { IncidentCategory, IncidentType, CatalogType } from '../types/catalogs.types';
import {
    activateCategory,
    activateType,
    deleteCategory,
    deleteType,
    getCategories,
    getTypes,
} from '../services/CatalogManagementService';
import CategoryFormDialog from './CategoryFormDialog';
import TypeFormDialog from './TypeFormDialog';
import ConfirmDialog from './ConfirmDialog';
import SegmentedFilter from './SegmentedFilter';
import { useCatalogInvalidation } from '../hooks/useCatalogInvalidation';

type VisibilityMode = 'activas' | 'todas' | 'inactivas';

interface CatalogTabContentProps {
    type: CatalogType;
}

const CatalogTabContent = ({ type }: CatalogTabContentProps) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { invalidate } = useCatalogInvalidation();
    const [categories, setCategories] = useState<IncidentCategory[]>([]);
    const [types, setTypes] = useState<IncidentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [visibility, setVisibility] = useState<VisibilityMode>('activas');

    const [editingCategory, setEditingCategory] = useState<IncidentCategory | null>(null);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<IncidentType | null>(null);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [newTypeCategoryId, setNewTypeCategoryId] = useState<number | undefined>(undefined);
    const [pendingDeleteCategory, setPendingDeleteCategory] = useState<IncidentCategory | null>(null);
    const [pendingDeleteType, setPendingDeleteType] = useState<IncidentType | null>(null);
    const [pendingReactivateCategory, setPendingReactivateCategory] = useState<IncidentCategory | null>(null);
    const [pendingReactivateType, setPendingReactivateType] = useState<IncidentType | null>(null);

    // Para el filtro "inactivas" necesitamos pedirle a la API también las inactivas.
    const includeInactive = visibility !== 'activas';

    const loadData = useCallback(async () => {
        setLoading(true);
        const [catRes, typeRes] = await Promise.all([
            getCategories(type, includeInactive),
            getTypes({ type, includeInactive }),
        ]);
        if (catRes.success && Array.isArray(catRes.data)) {
            setCategories(catRes.data);
        } else {
            dispatch(showToast({ message: 'Error al cargar categorías', type: 'error' }));
        }
        if (typeRes.success && Array.isArray(typeRes.data)) {
            setTypes(typeRes.data);
        } else {
            dispatch(showToast({ message: 'Error al cargar tipos', type: 'error' }));
        }
        setLoading(false);
    }, [type, includeInactive, dispatch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const typesByCategory = useMemo(() => {
        const map = new Map<number, IncidentType[]>();
        for (const t of types) {
            const arr = map.get(t.categoryId) ?? [];
            arr.push(t);
            map.set(t.categoryId, arr);
        }
        return map;
    }, [types]);

    const visibilityFilteredCategories = useMemo(() => {
        if (visibility === 'activas') return categories.filter(c => c.active);
        if (visibility === 'inactivas') {
            // Mostrar categorías inactivas + categorías activas que tengan al menos un tipo inactivo,
            // para que un tipo inactivo dentro de una categoría activa siga siendo visible.
            return categories.filter(c => {
                if (!c.active) return true;
                const catTypes = typesByCategory.get(c.id) ?? [];
                return catTypes.some(t => !t.active);
            });
        }
        return categories;
    }, [categories, typesByCategory, visibility]);

    const filteredCategories = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return visibilityFilteredCategories;
        return visibilityFilteredCategories.filter(c =>
            c.name.toLowerCase().includes(term) || c.value.toLowerCase().includes(term),
        );
    }, [visibilityFilteredCategories, search]);

    // Cuando el modo es "activas" también filtramos los tipos inactivos anidados.
    const getVisibleTypes = (catId: number): IncidentType[] => {
        const all = typesByCategory.get(catId) ?? [];
        if (visibility === 'inactivas') return all.filter(t => !t.active);
        if (visibility === 'activas') return all.filter(t => t.active);
        return all;
    };

    const recordsBasePath = type === 'INCIDENT' ? '/incidents' : '/maintenance';

    const goToRecords = (categoryId: number, typeId?: number) => {
        const params = new URLSearchParams();
        params.set('categoryId', String(categoryId));
        if (typeId !== undefined) params.set('typeId', String(typeId));
        navigate(`${recordsBasePath}?${params.toString()}`);
    };

    const handleNewCategory = () => {
        setEditingCategory(null);
        setCategoryDialogOpen(true);
    };

    const handleEditCategory = (cat: IncidentCategory) => {
        setEditingCategory(cat);
        setCategoryDialogOpen(true);
    };

    const handleNewType = (categoryId: number) => {
        setEditingType(null);
        setNewTypeCategoryId(categoryId);
        setTypeDialogOpen(true);
    };

    const handleEditType = (t: IncidentType) => {
        setEditingType(t);
        setNewTypeCategoryId(undefined);
        setTypeDialogOpen(true);
    };

    const confirmDeleteCategory = async () => {
        if (!pendingDeleteCategory) return;
        const res = await deleteCategory(pendingDeleteCategory.id);
        setPendingDeleteCategory(null);
        if (res.success) {
            dispatch(showToast({ message: 'Categoría desactivada', type: 'success' }));
            invalidate();
            loadData();
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? 'Error al desactivar', type: 'error' }));
        }
    };

    const confirmReactivateCategory = async () => {
        if (!pendingReactivateCategory) return;
        const res = await activateCategory(pendingReactivateCategory.id);
        setPendingReactivateCategory(null);
        if (res.success) {
            dispatch(showToast({ message: 'Categoría reactivada', type: 'success' }));
            invalidate();
            loadData();
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? 'Error al reactivar', type: 'error' }));
        }
    };

    const confirmDeleteType = async () => {
        if (!pendingDeleteType) return;
        const res = await deleteType(pendingDeleteType.id);
        setPendingDeleteType(null);
        if (res.success) {
            dispatch(showToast({ message: 'Tipo desactivado', type: 'success' }));
            invalidate();
            loadData();
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? 'Error al desactivar', type: 'error' }));
        }
    };

    const confirmReactivateType = async () => {
        if (!pendingReactivateType) return;
        const res = await activateType(pendingReactivateType.id);
        setPendingReactivateType(null);
        if (res.success) {
            dispatch(showToast({ message: 'Tipo reactivado', type: 'success' }));
            invalidate();
            loadData();
        } else {
            dispatch(showToast({ message: res.messages?.[0] ?? 'Error al reactivar', type: 'error' }));
        }
    };

    const handleSuccess = () => {
        setCategoryDialogOpen(false);
        setTypeDialogOpen(false);
        setEditingCategory(null);
        setEditingType(null);
        setNewTypeCategoryId(undefined);
        loadData();
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 justify-between p-4 border-b border-slate-100">
                    <div className="relative w-full sm:w-72">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar categoría o tipo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full py-2 h-[42px] pl-10 pr-10 bg-white border border-slate-100 rounded-xl outline-none text-sm focus:border-emerald-500 transition-all shadow-sm font-medium text-slate-600"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                                <FaTimes size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <SegmentedFilter
                            value={visibility}
                            onChange={setVisibility}
                            options={[
                                { label: 'Activas', value: 'activas' },
                                { label: 'Todas', value: 'todas' },
                                { label: 'Inactivas', value: 'inactivas' },
                            ]}
                        />
                        <ITButton
                            onClick={loadData}
                            color="secondary"
                            variant="outlined"
                            className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                            size="small"
                        >
                            <FaSync className="text-xs text-slate-500" />
                            <span className="text-xs font-bold text-slate-500">Actualizar</span>
                        </ITButton>
                        <button
                            type="button"
                            onClick={handleNewCategory}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
                        >
                            <FaPlus className="text-xs" />
                            <span>Nueva categoría</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <ITLoader size="lg" />
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-500 font-medium">
                            {search
                                ? 'Sin resultados para la búsqueda.'
                                : visibility === 'inactivas'
                                    ? 'No hay categorías inactivas.'
                                    : visibility === 'activas'
                                        ? 'Aún no hay categorías activas. Crea la primera con el botón superior.'
                                        : 'Aún no hay categorías. Crea la primera con el botón superior.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredCategories.map(cat => {
                            const catTypes = getVisibleTypes(cat.id);
                            return (
                                <div key={cat.id} className={!cat.active ? 'bg-slate-50/60' : ''}>
                                    <div className="flex items-center gap-3 p-4">
                                        <span
                                            className="w-3 h-3 rounded-full shrink-0 border-2 border-white shadow-sm"
                                            style={{ backgroundColor: cat.color ?? '#64748B' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-800 text-sm">{cat.value}</h3>
                                                {!cat.active && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                                                        Inactiva
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                {cat.name} · {catTypes.length} tipos
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ITButton
                                                onClick={() => goToRecords(cat.id)}
                                                size="small"
                                                variant="ghost"
                                                className="!p-2 text-slate-400 hover:text-emerald-600"
                                                title={`Ver registros de ${type === 'INCIDENT' ? 'incidencias' : 'mantenimiento'}`}
                                            >
                                                <FaExternalLinkAlt size={12} />
                                            </ITButton>
                                            <ITButton
                                                onClick={() => handleEditCategory(cat)}
                                                size="small"
                                                variant="ghost"
                                                className="!p-2 text-slate-400 hover:text-slate-600"
                                                title="Editar categoría"
                                            >
                                                <FaEdit />
                                            </ITButton>
                                            {cat.active ? (
                                                <ITButton
                                                    onClick={() => setPendingDeleteCategory(cat)}
                                                    size="small"
                                                    variant="ghost"
                                                    className="!p-2 text-red-300 hover:text-red-500"
                                                    title="Desactivar categoría"
                                                >
                                                    <FaTrash />
                                                </ITButton>
                                            ) : (
                                                <ITButton
                                                    onClick={() => setPendingReactivateCategory(cat)}
                                                    size="small"
                                                    variant="ghost"
                                                    className="!p-2 text-emerald-400 hover:text-emerald-600"
                                                    title="Reactivar categoría"
                                                >
                                                    <FaPowerOff />
                                                </ITButton>
                                            )}
                                        </div>
                                    </div>

                                    {catTypes.length > 0 && (
                                        <div className="px-4 pb-4">
                                            <ul className="space-y-1">
                                                {catTypes.map(t => (
                                                    <li
                                                        key={t.id}
                                                        className={`flex items-center gap-3 pl-6 pr-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors ${!t.active ? 'opacity-60' : ''}`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color ?? '#64748B' }} />
                                                        <span className="flex-1 min-w-0">
                                                            <span className="text-sm text-slate-700">{t.value}</span>
                                                            <span className="text-xs text-slate-400 font-mono ml-2">{t.name}</span>
                                                            {!t.active && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 ml-2">
                                                                    Inactivo
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <ITButton
                                                                onClick={() => goToRecords(cat.id, t.id)}
                                                                size="small"
                                                                variant="ghost"
                                                                className="!p-1.5 text-slate-300 hover:text-emerald-600"
                                                                title={`Ver registros de este tipo`}
                                                            >
                                                                <FaExternalLinkAlt size={11} />
                                                            </ITButton>
                                                            <ITButton
                                                                onClick={() => handleEditType(t)}
                                                                size="small"
                                                                variant="ghost"
                                                                className="!p-1.5 text-slate-300 hover:text-slate-500"
                                                                title="Editar tipo"
                                                            >
                                                                <FaEdit size={12} />
                                                            </ITButton>
                                                            {t.active ? (
                                                                <ITButton
                                                                    onClick={() => setPendingDeleteType(t)}
                                                                    size="small"
                                                                    variant="ghost"
                                                                    className="!p-1.5 text-red-300 hover:text-red-500"
                                                                    title="Desactivar tipo"
                                                                >
                                                                    <FaTrash size={12} />
                                                                </ITButton>
                                                            ) : (
                                                                <ITButton
                                                                    onClick={() => setPendingReactivateType(t)}
                                                                    size="small"
                                                                    variant="ghost"
                                                                    className="!p-1.5 text-emerald-300 hover:text-emerald-500"
                                                                    title="Reactivar tipo"
                                                                >
                                                                    <FaPowerOff size={12} />
                                                                </ITButton>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {cat.active && (
                                        <div className="px-4 pb-4 pl-10">
                                            <button
                                                type="button"
                                                onClick={() => handleNewType(cat.id)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                                            >
                                                <FaPlus size={10} /> Agregar tipo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <CategoryFormDialog
                isOpen={categoryDialogOpen}
                onClose={() => setCategoryDialogOpen(false)}
                onSuccess={handleSuccess}
                category={editingCategory}
                type={type}
            />

            <TypeFormDialog
                isOpen={typeDialogOpen}
                onClose={() => setTypeDialogOpen(false)}
                onSuccess={handleSuccess}
                type={editingType}
                categories={categories.filter(c => c.active)}
                defaultCategoryId={newTypeCategoryId}
            />

            <ConfirmDialog
                open={!!pendingDeleteCategory}
                onClose={() => setPendingDeleteCategory(null)}
                onConfirm={confirmDeleteCategory}
                title="Desactivar categoría"
                message={`¿Desactivar "${pendingDeleteCategory?.value}"? También se desactivarán sus tipos. Los registros históricos se conservan.`}
                confirmLabel="Desactivar"
                variant="danger"
            />

            <ConfirmDialog
                open={!!pendingReactivateCategory}
                onClose={() => setPendingReactivateCategory(null)}
                onConfirm={confirmReactivateCategory}
                title="Reactivar categoría"
                message={`¿Reactivar "${pendingReactivateCategory?.value}" y todos sus tipos?`}
                confirmLabel="Reactivar"
                variant="success"
            />

            <ConfirmDialog
                open={!!pendingDeleteType}
                onClose={() => setPendingDeleteType(null)}
                onConfirm={confirmDeleteType}
                title="Desactivar tipo"
                message={`¿Desactivar el tipo "${pendingDeleteType?.value}"? Los registros históricos se conservan.`}
                confirmLabel="Desactivar"
                variant="danger"
            />

            <ConfirmDialog
                open={!!pendingReactivateType}
                onClose={() => setPendingReactivateType(null)}
                onConfirm={confirmReactivateType}
                title="Reactivar tipo"
                message={`¿Reactivar el tipo "${pendingReactivateType?.value}"?`}
                confirmLabel="Reactivar"
                variant="success"
            />
        </div>
    );
};

export default CatalogTabContent;
