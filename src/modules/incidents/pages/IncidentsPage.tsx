import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITAlert, ITBadget, ITButton, ITCard, ITDataTable, ITDialog, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { AgeBadge } from "@core/components/AgeBadge";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaCheckCircle, FaExclamationTriangle, FaEye, FaFileAlt, FaFilePdf, FaPlus, FaSync, FaTag, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useCan } from "@app/core/permissions/useCan";
import { P } from "@app/core/permissions/permissions.constants";
import { useSearchParams } from "react-router-dom";
import IncidentCreateForm from "../components/IncidentCreateForm";
import IncidentReportModal from "../components/IncidentReportModal";
import { deleteIncident, getPaginatedIncidents, Incident, resolveIncident } from "../services/IncidentService";
import { IncidentDetailDialog } from "../components/IncidentDetailDialog";

const IncidentsPage = () => {
    const dispatch = useDispatch();
      const can = useCan();
    const isAdmin = can(P.INCIDENT_RESOLVE);
    const canCreate = can(P.INCIDENT_CREATE);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategoryId = searchParams.get('categoryId');
    const initialTypeId = searchParams.get('typeId');

    const [refreshKey, setRefreshKey] = useState(0);
    const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [incidentToResolveId, setIncidentToResolveId] = useState<number | null>(null);
    const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
    const [categoryFilter, setCategoryFilter] = useState<number | null>(initialCategoryId ? Number(initialCategoryId) : null);
    const [typeFilter, setTypeFilter] = useState<number | null>(initialTypeId ? Number(initialTypeId) : null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const { data: categoriesCatalog } = useCatalog('incident_category');
    const { data: typesCatalog } = useCatalog('incident_type');

    const incidentTypeIds = useMemo(() =>
        categoriesCatalog
            .filter(c => c.type === 'INCIDENT')
            .map(c => Number(c.id)),
        [categoriesCatalog]
    );

    const incidentTypes = useMemo(() =>
        typesCatalog.filter(t => incidentTypeIds.includes(Number(t.categoryId))),
        [typesCatalog, incidentTypeIds]
    );

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, categoryFilter, typeFilter]);

    const externalFilters = useMemo(() => {
        const f: Record<string, string | number> = {};
        if (searchTerm && searchTerm.trim().length > 0) f.search = searchTerm.trim();
        if (statusFilter && statusFilter !== 'ALL') f.status = statusFilter;
        if (categoryFilter !== null) f.categoryId = categoryFilter;
        if (typeFilter !== null) f.typeId = typeFilter;
        return f;
    }, [searchTerm, statusFilter, categoryFilter, typeFilter]);

    const clearCatalogFilters = () => {
        setCategoryFilter(null);
        setTypeFilter(null);
        if (searchParams.get('categoryId') || searchParams.get('typeId')) {
            const next = new URLSearchParams(searchParams);
            next.delete('categoryId');
            next.delete('typeId');
            setSearchParams(next, { replace: true });
        }
    };

    const activeCatalogLabel = useMemo(() => {
        if (categoryFilter === null) return null;
        const cat = categoriesCatalog.find(c => Number(c.id) === categoryFilter);
        if (!cat) return null;
        if (typeFilter !== null) {
            const t = typesCatalog.find(t => Number(t.id) === typeFilter);
            return t ? `${cat.value} · ${t.value}` : cat.value;
        }
        return cat.value;
    }, [categoryFilter, typeFilter, categoriesCatalog, typesCatalog]);

    const memoizedFetch = useCallback((params: Record<string, unknown>) => {
        return getPaginatedIncidents(params);
    }, []);

    const handleResolve = (id: number) => {
        setIncidentToResolveId(id);
    };

    const confirmResolve = async () => {
        if (!incidentToResolveId) return;

        setResolvingId(incidentToResolveId);
        const res = await resolveIncident(incidentToResolveId);
        setResolvingId(null);
        setIncidentToResolveId(null);

        if (res.success) {
            setRefreshKey(prev => prev + 1);
            if (viewingIncident?.id === incidentToResolveId) {
                setViewingIncident(null);
            }
        } else {
            dispatch(showToast({ message: "Error al resolver incidencia", type: "error" }));
        }
    };

    const handleDelete = (incident: Incident) => {
        setIncidentToDelete(incident);
    };

    const confirmDelete = async () => {
        if (!incidentToDelete) return;

        setDeletingId(incidentToDelete.id);
        const res = await deleteIncident(incidentToDelete.id);
        setDeletingId(null);
        setIncidentToDelete(null);

        if (res.success) {
            dispatch(showToast({ message: "Incidencia eliminada exitosamente", type: "success" }));
            setRefreshKey(prev => prev + 1);
        } else {
            dispatch(showToast({ message: "Error al eliminar incidencia", type: "error" }));
        }
    };


    const columns = useMemo(() => [
        {
            key: "title",
            label: "Incidencia",
            type: "string",
            sortable: false,
            width: 350,
            render: (row: Incident) => (
                <ITFlex align="start" gap={3} className="flex items-start gap-3 min-w-0">
                    <ITFlex align="center" justify="center" className="mt-1 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                        <FaExclamationTriangle className="text-xs" />
                    </ITFlex>
                    <ITFlex direction="column" className="min-w-0 flex-1">
                        <ITText as="p" className="font-bold text-slate-800 truncate">{row.title}</ITText>
                        <ITFlex align="center" gap={1} className="min-w-0">
                            <ITBadget color="secondary" variant="filled" size="sm">
                                {row.category?.value || "General"}
                            </ITBadget>
                            {row.type && (
                                <ITBadget color="secondary" variant="filled" size="sm">
                                    {row.type.value}
                                </ITBadget>
                            )}
                        </ITFlex>
                    </ITFlex>
                </ITFlex>
            )
        },
        {
            key: "createdAt",
            label: "Reportado",
            type: "string",
            sortable: false,
            render: (row: Incident) => (
                <ITFlex direction="column" className="flex flex-col text-xs">
                    <ITText as="span" className="font-medium text-slate-700">{dayjs(row.createdAt).format("DD/MM/YYYY")}</ITText>
                    <ITText as="span" className="text-slate-400">{dayjs(row.createdAt).format("HH:mm")}</ITText>
                </ITFlex>
            )
        },
        {
            key: "age",
            label: "Días Abierta",
            type: "string",
            sortable: false,
            render: (row: Incident) => <AgeBadge createdAt={row.createdAt} />
        },
        {
            key: "guardId",
            label: "Reportado Por",
            type: "string",
            sortable: false,
            render: (row: Incident) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                    <FaUserShield className="text-slate-400" />
                    <ITFlex direction="column" className="flex flex-col">
                        <ITText as="span" className="text-sm font-medium text-slate-700">{row.guard?.name} {row.guard?.lastName}</ITText>
                    </ITFlex>
                </ITFlex>
            )
        },
        {
            key: "status",
            label: "Estado",
            type: "string",
            sortable: false,
            render: (row: Incident) => (
                <ITBadget
                    color={row.status === 'ATTENDED' ? 'success' : 'danger'}
                    size="sm"
                    variant="filled"
                >
                    {row.status === 'ATTENDED' ? 'Atendida' : 'Pendiente'}
                </ITBadget>
            )
        },
        {
            key: "media",
            label: "Evidencia",
            type: "string",
            sortable: false,
            render: (row: Incident) => (
                <ITFlex align="center" gap={1} className="flex items-center gap-1 text-slate-500">
                    {row.media && row.media.length > 0 ? (
                        <>
                            <FaFileAlt className="text-blue-400" />
                            <ITText as="span" className="text-xs font-medium">{row.media.length}</ITText>
                        </>
                    ) : (
                        <ITText as="span" className="text-xs text-slate-300">-</ITText>
                    )}
                </ITFlex>
            )
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: Incident) => (
                <ITFlex align="center" gap={2}>
                    <ITButton
                        onClick={() => setViewingIncident(row)}
                        size="md"
                        color="secondary"
                        variant="icon-only"
                        icon={<FaEye />}
                        ariaLabel="Ver detalles"
                        title="Ver detalles"
                    />
                    {isAdmin && row.status === 'PENDING' && (
                        <ITButton
                            onClick={() => handleResolve(row.id)}
                            size="md"
                            color="success"
                            variant="icon-only"
                            icon={resolvingId === row.id ? <ITLoader size="sm" /> : <FaCheck />}
                            ariaLabel="Marcar como atendida"
                            title="Marcar como atendida"
                            disabled={resolvingId === row.id}
                        />
                    )}
                    {isAdmin && (
                        <ITButton
                            onClick={() => handleDelete(row)}
                            size="md"
                            color="danger"
                            variant="icon-only"
                            icon={deletingId === row.id ? <ITLoader size="sm" /> : <FaTrash />}
                            ariaLabel="Eliminar incidencia"
                            title="Eliminar incidencia"
                            disabled={deletingId === row.id}
                        />
                    )}
                </ITFlex>
            )
        }
    ], [isAdmin, resolvingId, deletingId]);

    return (
        <ITPage
            className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
            noPadding
            title="Gestión de Incidencias"
            breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Reportes" }, { label: "Gestión de Incidencias" }]}
            description="Seguimiento y resolución de reportes de seguridad en sitio."
            icon={<FaExclamationTriangle size={20} />}
            actions={
                <ITFlex align="center" gap={2} wrap="wrap">
                    {isAdmin && (
                        <ITButton
                            onClick={() => setShowReportModal(true)}
                            color="danger"
                            variant="outlined"
                            size="md"
                        >
                            <ITFlex align="center" gap={2}>
                                Reporte
                                <FaFilePdf />
                            </ITFlex>
                        </ITButton>
                    )}
                    {canCreate && (
                        <ITButton onClick={() => setShowCreateModal(true)} color="primary" size="md">
                            <ITFlex align="center" gap={2}>Nuevo reporte<FaPlus /></ITFlex>
                        </ITButton>
                    )}
                </ITFlex>
            }
        >
            <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
                <ITCard className="rounded-3xl" contentClassName="p-4!">
                    <ITGrid container columns={12} spacing={3} className="items-end">
                        <ITGrid item xs={12} md={7}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Buscar</ITText>
                                <ITFlex align="center" gap={1}>
                                    <ITInput
                                        placeholder="Buscar por título..."
                                        name="search"
                                        value={searchTerm}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        onBlur={() => { }}
                                        iconLeft={<FaExclamationTriangle />}
                                        size="md"
                                    />
                                    {searchTerm && (
                                        <ITButton
                                            variant="icon-only"
                                            color="secondary"
                                            size="sm"
                                            icon={<FaTimes size={12} />}
                                            onClick={() => setSearchTerm("")}
                                            ariaLabel="Limpiar búsqueda"
                                            title="Limpiar búsqueda"
                                        />
                                    )}
                                </ITFlex>
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} md={4}>
                            <ITFlex direction="column" gap={1}>
                                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado</ITText>
                                <ITSearchSelect
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(String(value))}
                                    options={[
                                        { label: "Todos los estados", value: "ALL" },
                                        { label: "Pendientes", value: "PENDING" },
                                        { label: "Atendidas", value: "ATTENDED" },
                                    ]}
                                    clearable={false}
                                />
                            </ITFlex>
                        </ITGrid>
                        <ITGrid item xs={12} md={1}>
                            <ITFlex align="end" justify="end" gap={2} className="h-full">
                                <ITButton
                                    onClick={() => setRefreshKey(prev => prev + 1)}
                                    color="secondary"
                                    variant="icon-only"
                                    size="md"
                                    icon={<FaSync />}
                                    ariaLabel="Actualizar datos"
                                    title="Actualizar datos"
                                />
                            </ITFlex>
                        </ITGrid>
                    </ITGrid>
                </ITCard>

                {activeCatalogLabel && (
                    <ITAlert variant="success" icon={<FaTag />}>
                        <ITFlex align="center" justify="between" gap={3}>
                            <ITText as="span" className="text-sm">Filtrando por catálogo: <ITText as="span" className="font-bold">{activeCatalogLabel}</ITText></ITText>
                            <ITButton variant="text" color="success" size="md" onClick={clearCatalogFilters}>
                                Quitar filtro
                            </ITButton>
                        </ITFlex>
                    </ITAlert>
                )}

                <ITDataTable
                    defaultItemsPerPage={50}
                    itemsPerPageOptions={[25, 50, 100]}
                    layout="fixed"
                    density="compact"
                    showViewToggle={false}
                    virtualized
                    virtualizedMaxHeight={400}
                    rowHeight={50}
                    key={refreshKey}
                    fetchData={memoizedFetch as any}
                    columns={columns as any}
                    externalFilters={externalFilters as any}
                />
            </ITFlex>

            {viewingIncident && (
                <IncidentDetailDialog
                    incident={viewingIncident}
                    isAdmin={isAdmin}
                    onClose={() => setViewingIncident(null)}
                    onResolve={handleResolve}
                />
            )}

            {/* Confirm Resolve Dialog */}
            <ITDialog
                isOpen={!!incidentToResolveId}
                onClose={() => setIncidentToResolveId(null)}
                title="Confirmar Resolución"
            >
                <ITFlex direction="column" className="p-8 text-center">
                    <ITFlex align="center" justify="center" className="w-16 h-16 bg-[var(--color-primary-50)] text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheckCircle size={32} />
                    </ITFlex>
                    <ITText as="h4" className="text-xl font-bold text-slate-800 mb-2">¿Marcar como atendida?</ITText>
                    <ITText as="p" className="text-slate-500 text-sm mb-8">
                        Esta acción registrará que la incidencia ha sido resuelta y quedará marcada como completada en el sistema.
                    </ITText>
                    <ITFlex justify="center" gap={3} className="flex justify-center gap-3">
                        <ITButton variant="outlined" color="secondary" onClick={() => setIncidentToResolveId(null)}>
                            Cancelar
                        </ITButton>
                        <ITButton variant="filled" color="success" onClick={confirmResolve}>
                            Confirmar
                        </ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>

            {/* Confirm Delete Dialog */}
            <ITDialog
                isOpen={!!incidentToDelete}
                onClose={() => setIncidentToDelete(null)}
                title="Eliminar Incidencia"
            >
                <ITFlex direction="column" className="p-8 text-center">
                    <ITFlex align="center" justify="center" className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaTrash size={24} />
                    </ITFlex>
                    <ITText as="h4" className="text-xl font-bold text-slate-800 mb-2">¿Estás completamente seguro?</ITText>
                    <ITText as="p" className="text-slate-500 text-sm mb-8">
                        Esta acción es irreversible. Se eliminará el reporte <ITText as="span" className="font-bold text-slate-700">"{incidentToDelete?.title}"</ITText> y toda su evidencia asociada.
                    </ITText>
                    <ITFlex justify="center" gap={3} className="flex justify-center gap-3">
                        <ITButton variant="outlined" color="secondary" onClick={() => setIncidentToDelete(null)}>
                            Cancelar
                        </ITButton>
                        <ITButton variant="filled" color="danger" onClick={confirmDelete}>
                            Eliminar permanentemente
                        </ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>

            {/* Create Incident Modal */}
            <IncidentCreateForm
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    setRefreshKey(prev => prev + 1);
                }}
                categoriesCatalog={categoriesCatalog.filter(c => c.type === 'INCIDENT')}
                typesCatalog={incidentTypes}
            />

            {/* Report PDF Modal */}
            <IncidentReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
            />

        </ITPage>
    );
};
export default IncidentsPage;
