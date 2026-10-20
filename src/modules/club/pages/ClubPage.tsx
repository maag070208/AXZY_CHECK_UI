import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDataTable, ITDialog, ITInput, ITLoader, ITPage , ITFlex } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { MediaCarousel } from "@core/components/MediaCarousel";
import { AgeBadge } from "@core/components/AgeBadge";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaCheckCircle, FaEye, FaFileAlt, FaFilePdf, FaFilter, FaGlassCheers, FaPlus, FaSync, FaTag, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import ClubCreateForm from "../components/ClubCreateForm";
import ClubReportModal from "../components/ClubReportModal";
import { deleteClub, deleteClubMedia, getPaginatedClubs, ClubItem, resolveClub } from "../services/ClubService";

const ClubPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdmin = auth.role === 'ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategoryId = searchParams.get('categoryId');
  const initialTypeId = searchParams.get('typeId');

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingClub, setViewingClub] = useState<ClubItem | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [clubToResolveId, setClubToResolveId] = useState<number | null>(null);
  const [clubToDelete, setClubToDelete] = useState<ClubItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(initialCategoryId ? Number(initialCategoryId) : null);
  const [typeFilter, setTypeFilter] = useState<number | null>(initialTypeId ? Number(initialTypeId) : null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: guardsCatalog, loading: loadingGuards } = useCatalog('guard');
  const { data: categoriesCatalog } = useCatalog('club_category');
  const { data: typesCatalog } = useCatalog('club_type');

  const clubTypeIds = useMemo(() =>
    categoriesCatalog
      .filter(c => c.type === 'CASA_CLUB')
      .map(c => Number(c.id)),
    [categoriesCatalog]
  );

  const clubTypes = useMemo(() =>
    typesCatalog.filter(t => clubTypeIds.includes(Number(t.categoryId))),
    [typesCatalog, clubTypeIds]
  );

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
    return getPaginatedClubs(params);
  }, []);

  const handleResolve = (id: number) => {
      setClubToResolveId(id);
  };

  const confirmResolve = async () => {
      if (!clubToResolveId) return;

      setResolvingId(clubToResolveId);
      const res = await resolveClub(clubToResolveId);
      setResolvingId(null);
      setClubToResolveId(null);

      if (res.success) {
          setRefreshKey(prev => prev + 1);
          if (viewingClub?.id === clubToResolveId) {
              setViewingClub(null);
          }
      } else {
          dispatch(showToast({ message: "Error al resolver el reporte", type: "error" }));
      }
  };

  const handleDelete = (club: ClubItem) => {
    setClubToDelete(club);
  };

  const confirmDelete = async () => {
    if (!clubToDelete) return;

    setDeletingId(clubToDelete.id);
    const res = await deleteClub(clubToDelete.id);
    setDeletingId(null);
    setClubToDelete(null);

    if (res.success) {
        dispatch(showToast({ message: "Reporte eliminado exitosamente", type: "success" }));
        setRefreshKey(prev => prev + 1);
    } else {
        dispatch(showToast({ message: "Error al eliminar el reporte", type: "error" }));
    }
  };

  const handleDeleteMedia = async (item: { key?: string; url: string }) => {
    if (!viewingClub) return;
    const key = item.key || item.url.split('/').pop();
    if (!key) return;

    const res = await deleteClubMedia(viewingClub.id, key);
    if (res.success) {
        dispatch(showToast({ message: "Archivo eliminado", type: "success" }));
        setViewingClub(prev => {
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
        label: "Reporte",
        type: "string",
        sortable: true,
        render: (row: ClubItem) => (
            <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 text-sky-500">
                    <FaGlassCheers className="text-xs" />
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
        render: (row: ClubItem) => (
            <div className="flex flex-col text-xs">
                <span className="font-medium text-slate-700">{dayjs(row.createdAt).format("DD/MM/YYYY")}</span>
                <span className="text-slate-400">{dayjs(row.createdAt).format("HH:mm")}</span>
            </div>
        )
    },
    {
        key: "age",
        label: "Días Abierta",
        type: "string",
        sortable: false,
        render: (row: ClubItem) => <AgeBadge createdAt={row.createdAt} />
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
        render: (row: ClubItem) => (
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
        render: (row: ClubItem) => (
            <ITBadget
                color={row.status === 'ATTENDED' ? 'success' : 'danger'}
                size="sm"
                variant="filled"
            >
                {row.status === 'ATTENDED' ? 'Atendido' : 'Pendiente'}
            </ITBadget>
        )
    },
    {
        key: "media",
        label: "Evidencia",
        type: "string",
        sortable: false,
        render: (row: ClubItem) => (
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
        actions: (row: ClubItem) => (
            <div className="flex items-center gap-2">
                <ITButton
                    onClick={() => setViewingClub(row)}
                    size="sm"
                    color='secondary'
                    variant="outlined"
                   
                    title="Ver detalles"
                >
                    <FaEye />
                </ITButton>
                {row.status === 'PENDING' && (
                    <ITButton
                        onClick={() => handleResolve(row.id)}
                        size="sm"
                        color='success'
                        variant="filled"
                       
                        title="Marcar como atendido"
                        disabled={resolvingId === row.id}
                    >
                        {resolvingId === row.id ? <ITLoader size="sm" /> : <FaCheck />}
                    </ITButton>
                )}
                {isAdmin && (
                    <ITButton
                        onClick={() => handleDelete(row)}
                        size="sm"
                        color='danger'
                        variant="outlined"
                       
                        title="Eliminar reporte"
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
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Gestión de Casa Club"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Reportes" }, { label: "Gestión de Casa Club" }]}
      description="Seguimiento y resolución de reportes de casa club"
      icon={<FaGlassCheers size={20} />}
      iconColor="#065911"
      actions={
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
                    <option value="ATTENDED">Atendidos</option>
                </select>
            </div>
            <ITButton
                onClick={() => setShowReportModal(true)}
                color="primary"
                variant="outlined"
               
                size="md"
                title="Generar reporte PDF de casa club"
            >
                <ITFlex align="center" gap={2}><FaFilePdf className="text-sm" />
                <span className="text-xs font-bold">Generar Reporte PDF</span></ITFlex>
            </ITButton>
            <ITButton
                onClick={() => setRefreshKey(prev => prev + 1)}
                color="secondary"
                variant="outlined"
               
                size="md"
                title="Actualizar datos"
            >
                <ITFlex align="center" gap={2}><FaSync className="text-xs text-slate-500" />
                <span className="text-xs font-bold text-slate-500">Refrescar</span></ITFlex>
            </ITButton>
            {isAdmin && (
                <ITButton
                    onClick={() => setShowCreateModal(true)}
                    color="primary"
                   
                    title="Nuevo reporte" size="md"
                >
                    <ITFlex align="center" gap={2}><FaPlus className="text-xs" /> NUEVO REPORTE
                </ITFlex></ITButton>
            )}
        </div>
      }
    >
      {activeCatalogLabel && (
        <div className="mb-4 flex items-center gap-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3">
          <FaTag className="text-sky-600" />
          <span className="text-sm">
            Filtrando por catálogo: <strong>{activeCatalogLabel}</strong>
          </span>
          <button
            type="button"
            onClick={clearCatalogFilters}
            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900"
          >
            <FaTimes size={12} /> Quitar filtro
          </button>
        </div>
      )}
      

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
            key={`${refreshKey}-${guardsCatalog?.length || 0}`}
            fetchData={memoizedFetch as any}
            columns={columns as any}
            externalFilters={externalFilters as any}
            title=""
        />
      </div>

    {viewingClub && (
      <ITDialog isOpen onClose={() => setViewingClub(null)} title="Detalle de Reporte" className="max-w-4xl max-h-[90vh] flex flex-col">
        <p className="text-sm text-slate-500 mb-4">Reportado el {dayjs(viewingClub.createdAt).format("DD [de] MMMM, YYYY [a las] HH:mm")}</p>
  
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  
                <div className="lg:col-span-8 space-y-8">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <span className="w-1 h-4 bg-sky-400 rounded-full block"></span>
                          {viewingClub.title}
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                          {viewingClub.description || "Sin descripción detallada."}
                      </p>
                   </div>
  
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-1 h-4 bg-indigo-500 rounded-full block"></span>
                          Evidencia
                      </h4>
                      {viewingClub.media && viewingClub.media.length > 0 &&
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                              {viewingClub.media.length} archivos
                          </span>
                      }
                    </div>
  
                    {viewingClub.media && viewingClub.media.length > 0 ? (
                      <MediaCarousel
                          media={viewingClub.media}
                          title={viewingClub.title}
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
  
                  {viewingClub.latitude && viewingClub.longitude && (
                     <section>
                       <div className="flex items-center justify-between mb-4">
                         <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                             <span className="w-1 h-4 bg-emerald-500 rounded-full block"></span>
                             Ubicación Reportada
                         </h4>
                       </div>
                       <GoogleMapComponent
                           lat={viewingClub.latitude}
                           lng={viewingClub.longitude}
                           height="300px"
                       />
                     </section>
                  )}
                </div>
  
                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                      <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Detalles del Reporte</h5>
  
                      <div className="space-y-4">
                          <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500">
                                  <FaUserShield />
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 font-medium">Reportado por</p>
                                  <p className="text-sm font-bold text-slate-800">{viewingClub.guard?.name} {viewingClub.guard?.lastName}</p>
                                  <p className="text-xs text-slate-500">@{viewingClub.guard?.username}</p>
                              </div>
                          </div>
  
                          <div className="w-full h-px bg-slate-50"></div>
  
                          <div className="flex items-start gap-4">
                               <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
                                  <FaGlassCheers />
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 font-medium">Categoría y Tipo</p>
                                  <p className="text-sm font-bold text-slate-800">
                                      {viewingClub.category?.value || 'General'}
                                  </p>
                                  {viewingClub.type && (
                                      <p className="text-xs text-slate-500">{viewingClub.type.value}</p>
                                  )}
                              </div>
                          </div>
  
                          {viewingClub.status === 'ATTENDED' && viewingClub.resolvedBy && (
                              <>
                                  <div className="w-full h-px bg-slate-50"></div>
                                  <div className="flex items-start gap-4">
                                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500">
                                          <FaCheckCircle />
                                      </div>
                                      <div>
                                          <p className="text-xs text-slate-400 font-medium">Atendido por</p>
                                          <p className="text-sm font-bold text-slate-800">{viewingClub.resolvedBy.name}</p>
                                          <p className="text-xs text-slate-500">
                                              {dayjs(viewingClub.resolvedAt).format("DD/MM/YYYY HH:mm")}
                                          </p>
                                      </div>
                                  </div>
                              </>
                          )}
                      </div>
                   </div>
  
                   {viewingClub.status === 'PENDING' && (
                       <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                          <h5 className="text-xs font-bold text-orange-800 mb-2">Acciones Pendientes</h5>
                          <p className="text-xs text-orange-700 mb-3">Este reporte requiere atención inmediata.</p>
                          <ITButton
                              onClick={() => handleResolve(viewingClub.id)}
                              variant='filled'
                              color="success"
                             
                          >
                              Marcar como Atendido
                          </ITButton>
                       </div>
                   )}
                </div>
  
              </div>
            </div>
      </ITDialog>
    )}

      <ITDialog
        isOpen={!!clubToResolveId}
        onClose={() => setClubToResolveId(null)}
        title="Confirmar Resolución"
      >
        <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheckCircle size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">¿Marcar como atendido?</h4>
            <p className="text-slate-500 text-sm mb-8">
                Esta acción registrará que el reporte ha sido resuelto y quedará marcado como completado en el sistema.
            </p>
            <div className="flex justify-center gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setClubToResolveId(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="filled" color="success" onClick={confirmResolve}>
                    Confirmar
                </ITButton>
            </div>
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!clubToDelete}
        onClose={() => setClubToDelete(null)}
        title="Eliminar Reporte"
      >
        <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTrash size={24} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">¿Estás completamente seguro?</h4>
            <p className="text-slate-500 text-sm mb-8">
                Esta acción es irreversible. Se eliminará el reporte <span className="font-bold text-slate-700">"{clubToDelete?.title}"</span> y toda su evidencia asociada.
            </p>
            <div className="flex justify-center gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setClubToDelete(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="filled" color="danger" onClick={confirmDelete}>
                    Eliminar permanentemente
                </ITButton>
            </div>
        </div>
      </ITDialog>

      <ClubCreateForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          setRefreshKey(prev => prev + 1);
        }}
        categoriesCatalog={categoriesCatalog}
        typesCatalog={clubTypes}
      />

      <ClubReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

    </ITPage>
  );
};
export default ClubPage;
