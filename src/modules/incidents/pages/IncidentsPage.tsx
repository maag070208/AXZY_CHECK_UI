import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDataTable, ITDialog, ITInput, ITLoader } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { MediaCarousel } from "@core/components/MediaCarousel";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaCheckCircle, FaExclamationTriangle, FaEye, FaFileAlt, FaFilePdf, FaFilter, FaPlus, FaSync, FaTag, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import IncidentCreateForm from "../components/IncidentCreateForm";
import IncidentReportModal from "../components/IncidentReportModal";
import { deleteIncident, deleteIncidentMedia, getPaginatedIncidents, Incident, resolveIncident } from "../services/IncidentService";

const IncidentsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdmin = auth.role === 'ADMIN';
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

  const { data: guardsCatalog, loading: loadingGuards } = useCatalog('guard');
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

  useEffect(() => {
    console.log('[IncidentsPage] guardsCatalog updated:', guardsCatalog);
  }, [guardsCatalog]);

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

  const handleDeleteMedia = async (item: { key?: string; url: string }) => {
    if (!viewingIncident) return;
    const key = item.key || item.url.split('/').pop();
    if (!key) return;

    const res = await deleteIncidentMedia(viewingIncident.id, key);
    if (res.success) {
        dispatch(showToast({ message: "Archivo eliminado", type: "success" }));
        setViewingIncident(prev => {
            if (!prev) return null;
            return {
                ...prev,
                media: prev.media?.filter((m) => (m.key || m.url.split('/').pop()) !== key)
            };
        });
        setRefreshKey(prev => prev + 1);
    }
  };

  const columns = useMemo(() => [
    { key: "id", label: "ID", type: "number", sortable: true },
    {
        key: "title",
        label: "Incidencia",
        type: "string",
        sortable: true,
        render: (row: Incident) => (
            <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                    <FaExclamationTriangle className="text-xs" />
                </div>
                <div>
                    <p className="font-bold text-slate-800 line-clamp-1">{row.title}</p>
                    <div className="flex gap-1 items-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">
                            {row.category?.value || 'General'}
                        </span>
                        {row.type && (
                            <span className="text-[10px] font-medium text-slate-400">
                                • {row.type.value}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        )
    },
    {
        key: "createdAt",
        label: "Reportado",
        type: "string",
        sortable: true,
        render: (row: Incident) => (
            <div className="flex flex-col text-xs">
                <span className="font-medium text-slate-700">{dayjs(row.createdAt).format("DD/MM/YYYY")}</span>
                <span className="text-slate-400">{dayjs(row.createdAt).format("HH:mm")}</span>
            </div>
        )
    },
    {
        key: "guardId",
        label: "Reportado Por",
        type: "string",
        sortable: false,
        filter: "catalog",
        catalogOptions: {
            data: guardsCatalog || [],
            loading: loadingGuards
        },
        render: (row: Incident) => (
            <div className="flex items-center gap-2">
                <FaUserShield className="text-slate-400" />
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{row.guard?.name} {row.guard?.lastName}</span>
                </div>
            </div>
        )
    },
    {
        key: "status",
        label: "Estado",
        type: "string",
        sortable: true,
        render: (row: Incident) => (
            <ITBadget
                color={row.status === 'ATTENDED' ? 'success' : 'danger'}
                size="small"
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
            <div className="flex items-center gap-1 text-slate-500">
                {row.media && row.media.length > 0 ? (
                    <>
                        <FaFileAlt className="text-blue-400" />
                        <span className="text-xs font-medium">{row.media.length}</span>
                    </>
                ) : (
                    <span className="text-xs text-slate-300">-</span>
                )}
            </div>
        )
    },
    {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: Incident) => (
            <div className="flex items-center gap-2">
                <ITButton
                    onClick={() => setViewingIncident(row)}
                    size="small"
                    color='secondary'
                    variant="outlined"
                    className="!p-2"
                    title="Ver detalles"
                >
                    <FaEye />
                </ITButton>
                {row.status === 'PENDING' && (
                    <ITButton
                        onClick={() => handleResolve(row.id)}
                        size="small"
                        color='success'
                        variant="filled"
                        className="!p-2"
                        title="Marcar como atendida"
                        disabled={resolvingId === row.id}
                    >
                        {resolvingId === row.id ? <ITLoader size="sm" /> : <FaCheck />}
                    </ITButton>
                )}
                {isAdmin && (
                    <ITButton
                        onClick={() => handleDelete(row)}
                        size="small"
                        color='danger'
                        variant="outlined"
                        className="!p-2 text-red-500 hover:!bg-red-50 border-red-200"
                        title="Eliminar incidencia"
                        disabled={deletingId === row.id}
                    >
                        {deletingId === row.id ? <ITLoader size="sm" /> : <FaTrash />}
                    </ITButton>
                )}
            </div>
        )
    }
  ], [isAdmin, resolvingId, deletingId]);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      {activeCatalogLabel && (
        <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3">
          <FaTag className="text-emerald-600" />
          <span className="text-sm">
            Filtrando por catálogo: <strong>{activeCatalogLabel}</strong>
          </span>
          <button
            type="button"
            onClick={clearCatalogFilters}
            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            <FaTimes size={12} /> Quitar filtro
          </button>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500" />
              Gestión de Incidencias
           </h1>
           <p className="text-slate-500 text-sm mt-1">Seguimiento y resolución de reportes de seguridad en sitio</p>
        </div>
        <div className="flex gap-3 items-center">
            <div className="w-64 relative">
                <ITInput
                    placeholder="Buscar por título..."
                    name="search"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    onBlur={() => {}}
                    className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                        <FaTimes size={14} />
                    </button>
                )}
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2">
                <FaFilter className="text-slate-400 text-xs mr-2" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none min-w-[120px]"
                >
                    <option value="ALL">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="ATTENDED">Atendidas</option>
                </select>
            </div>
            <ITButton
                onClick={() => setShowReportModal(true)}
                color="primary"
                variant="outlined"
                className="h-[42px] px-4 !rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all flex items-center gap-2"
                size="small"
                title="Generar reporte PDF de incidencias"
            >
                <FaFilePdf className="text-sm" />
                <span className="text-xs font-bold">Generar Reporte PDF</span>
            </ITButton>
            <ITButton
                onClick={() => setRefreshKey(prev => prev + 1)}
                color="secondary"
                variant="outlined"
                className="h-[42px] px-4 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                size="small"
                title="Actualizar datos"
            >
                <FaSync className="text-xs text-slate-500" />
                <span className="text-xs font-bold text-slate-500">Refrescar</span>
            </ITButton>
            {isAdmin && (
                <ITButton
                    onClick={() => setShowCreateModal(true)}
                    color="primary"
                    variant="filled"
                    className="h-[42px] px-4 !rounded-xl transition-all flex items-center gap-2"
                    size="small"
                    title="Nuevo reporte"
                >
                    <FaPlus className="text-xs" />
                    <span className="text-xs font-bold">Nuevo Reporte</span>
                </ITButton>
            )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
            key={`${refreshKey}-${guardsCatalog?.length || 0}`}
            fetchData={memoizedFetch as any}
            columns={columns as any}
            externalFilters={externalFilters as any}
            defaultItemsPerPage={10}
            title=""
        />
      </div>

    {viewingIncident && (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-12 sm:pt-20">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={() => setViewingIncident(null)}
        />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">

          <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100 z-10">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-slate-800">Detalle de Incidencia</h3>
                  <ITBadget
                      color={viewingIncident.status === 'ATTENDED' ? 'success' : 'danger'}
                      size="small"
                  >
                      {viewingIncident.status === 'ATTENDED' ? 'Atendida' : 'Pendiente'}
                  </ITBadget>
               </div>
               <p className="text-sm text-slate-500">Reportado el {dayjs(viewingIncident.createdAt).format("DD [de] MMMM, YYYY [a las] HH:mm")}</p>
            </div>
            <button
              onClick={() => setViewingIncident(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              <div className="lg:col-span-8 space-y-8">
                 {/* Descripción */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-400 rounded-full block"></span>
                        {viewingIncident.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingIncident.description || "Sin descripción detallada."}
                    </p>
                 </div>

                {/* Multimedia Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-indigo-500 rounded-full block"></span>
                        Evidencia
                    </h4>
                    {viewingIncident.media && viewingIncident.media.length > 0 &&
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                            {viewingIncident.media.length} archivos
                        </span>
                    }
                  </div>

                  {viewingIncident.media && viewingIncident.media.length > 0 ? (
                    <MediaCarousel
                        media={viewingIncident.media}
                        title={viewingIncident.title}
                        showDelete={isAdmin}
                        onDelete={handleDeleteMedia}
                    />
                  ) : (
                    <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                      <FaFileAlt className="text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-400">Sin evidencia adjunta</p>
                    </div>
                  )}
                </section>

                {/* Location Section */}
                {viewingIncident.latitude && viewingIncident.longitude && (
                   <section>
                     <div className="flex items-center justify-between mb-4">
                       <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                           <span className="w-1 h-4 bg-emerald-500 rounded-full block"></span>
                           Ubicación Reportada
                       </h4>
                     </div>
                     <GoogleMapComponent
                         lat={viewingIncident.latitude}
                         lng={viewingIncident.longitude}
                         height="300px"
                     />
                   </section>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                 {/* Metadata Cards */}
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Detalles del Reporte</h5>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500">
                                <FaUserShield />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Reportado por</p>
                                <p className="text-sm font-bold text-slate-800">{viewingIncident.guard?.name} {viewingIncident.guard?.lastName}</p>
                                <p className="text-xs text-slate-500">@{viewingIncident.guard?.username}</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-50"></div>

                        <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
                                <FaExclamationTriangle />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Categoría y Tipo</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {viewingIncident.category?.value || 'General'}
                                </p>
                                {viewingIncident.type && (
                                    <p className="text-xs text-slate-500">{viewingIncident.type.value}</p>
                                )}
                            </div>
                        </div>

                        {viewingIncident.status === 'ATTENDED' && viewingIncident.resolvedBy && (
                            <>
                                <div className="w-full h-px bg-slate-50"></div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">Atendido por</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingIncident.resolvedBy.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {dayjs(viewingIncident.resolvedAt).format("DD/MM/YYYY HH:mm")}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                 </div>

                 {viewingIncident.status === 'PENDING' && (
                     <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <h5 className="text-xs font-bold text-orange-800 mb-2">Acciones Pendientes</h5>
                        <p className="text-xs text-orange-700 mb-3">Esta incidencia requiere atención inmediata.</p>
                        <ITButton
                            onClick={() => handleResolve(viewingIncident.id)}
                            variant='filled'
                            color="success"
                            className="w-full justify-center"
                        >
                            Marcar como Atendida
                        </ITButton>
                     </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </div>
    )}

      {/* Confirm Resolve Dialog */}
      <ITDialog
        isOpen={!!incidentToResolveId}
        onClose={() => setIncidentToResolveId(null)}
        title="Confirmar Resolución"
      >
        <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheckCircle size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">¿Marcar como atendida?</h4>
            <p className="text-slate-500 text-sm mb-8">
                Esta acción registrará que la incidencia ha sido resuelta y quedará marcada como completada en el sistema.
            </p>
            <div className="flex justify-center gap-3">
                <ITButton variant="outlined" color="secondary" className="px-6" onClick={() => setIncidentToResolveId(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="filled" color="success" className="px-8" onClick={confirmResolve}>
                    Confirmar
                </ITButton>
            </div>
        </div>
      </ITDialog>

      {/* Confirm Delete Dialog */}
      <ITDialog
        isOpen={!!incidentToDelete}
        onClose={() => setIncidentToDelete(null)}
        title="Eliminar Incidencia"
      >
        <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTrash size={24} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">¿Estás completamente seguro?</h4>
            <p className="text-slate-500 text-sm mb-8">
                Esta acción es irreversible. Se eliminará el reporte <span className="font-bold text-slate-700">"{incidentToDelete?.title}"</span> y toda su evidencia asociada.
            </p>
            <div className="flex justify-center gap-3">
                <ITButton variant="outlined" color="secondary" className="px-6" onClick={() => setIncidentToDelete(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="filled" color="danger" className="px-8" onClick={confirmDelete}>
                    Eliminar permanentemente
                </ITButton>
            </div>
        </div>
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

    </div>
  );
};
export default IncidentsPage;
