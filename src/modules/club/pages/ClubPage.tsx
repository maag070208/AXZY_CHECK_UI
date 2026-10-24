import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITAlert, ITBadget, ITButton, ITCard, ITDataTable, ITDialog, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { AgeBadge } from "@core/components/AgeBadge";
import { ReportDetailDialog } from "@core/components/ReportDetailDialog";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaCheckCircle, FaEye, FaFileAlt, FaFilePdf, FaGlassCheers, FaPlus, FaSync, FaTag, FaTimes, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useCan } from "@app/core/permissions/useCan";
import { P } from "@app/core/permissions/permissions.constants";
import { useSearchParams } from "react-router-dom";
import ClubCreateForm from "../components/ClubCreateForm";
import ClubReportModal from "../components/ClubReportModal";
import { deleteClub, deleteClubMedia, getPaginatedClubs, ClubItem, resolveClub } from "../services/ClubService";

const ClubPage = () => {
  const dispatch = useDispatch();
  const can = useCan();
  const isAdmin = can(P.CLUB_RESOLVE);
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
    {
        key: "title",
        label: "Reporte",
        type: "string",
        sortable: false,
        width: 350,
        render: (row: ClubItem) => (
            <ITFlex align="start" gap={3} className="flex items-start gap-3 min-w-0">
                <ITFlex align="center" justify="center" className="mt-1 w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 text-sky-500">
                    <FaGlassCheers className="text-xs" />
                </ITFlex>
                <ITFlex direction="column" className="min-w-0 flex-1">
                    <ITText as="p" className="font-bold text-slate-800 truncate">{row.title}</ITText>
                    <ITFlex align="center" gap={1} className="min-w-0">
                        <ITBadget color="secondary" variant="filled" size="sm">{row.category?.value || "General"}</ITBadget>
                        {row.type && <ITBadget color="secondary" variant="filled" size="sm">{row.type.value}</ITBadget>}
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
        render: (row: ClubItem) => (
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
        render: (row: ClubItem) => <AgeBadge createdAt={row.createdAt} />
    },
    {
        key: "guardId",
        label: "Reportado Por",
        type: "string",
        sortable: false,
        render: (row: ClubItem) => (
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
        actions: (row: ClubItem) => (
            <ITFlex align="center" gap={2}>
                <ITButton
                    onClick={() => setViewingClub(row)}
                    size="md"
                    color="secondary"
                    variant="icon-only"
                    icon={<FaEye />}
                    ariaLabel="Ver detalles"
                    title="Ver detalles"
                />
                {row.status === 'PENDING' && (
                    <ITButton
                        onClick={() => handleResolve(row.id)}
                        size="md"
                        color="success"
                        variant="icon-only"
                        icon={resolvingId === row.id ? <ITLoader size="sm" /> : <FaCheck />}
                        ariaLabel="Marcar como atendido"
                        title="Marcar como atendido"
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
                        ariaLabel="Eliminar reporte"
                        title="Eliminar reporte"
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
      title="Gestión de Casa Club"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Reportes" }, { label: "Gestión de Casa Club" }]}
      description="Seguimiento y resolución de reportes de casa club."
      icon={<FaGlassCheers size={20} />}
      iconColor="#065911"
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITButton onClick={() => setShowReportModal(true)} color="danger" variant="outlined" size="md">
            <ITFlex align="center" gap={2}>Reporte<FaFilePdf /></ITFlex>
          </ITButton>
          {isAdmin && (
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
                  <ITInput placeholder="Buscar por título..." name="search" value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} onBlur={() => {}} iconLeft={<FaGlassCheers />} size="md" />
                  {searchTerm && (
                    <ITButton variant="icon-only" color="secondary" size="sm" icon={<FaTimes size={12} />} onClick={() => setSearchTerm("")} ariaLabel="Limpiar búsqueda" title="Limpiar búsqueda" />
                  )}
                </ITFlex>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado</ITText>
                <ITSearchSelect value={statusFilter} onChange={(value) => setStatusFilter(String(value))} options={[{ label: "Todos los estados", value: "ALL" }, { label: "Pendientes", value: "PENDING" }, { label: "Atendidos", value: "ATTENDED" }]} clearable={false} />
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={12} md={1}>
              <ITFlex align="end" justify="end" className="h-full">
                <ITButton onClick={() => setRefreshKey(prev => prev + 1)} color="secondary" variant="icon-only" size="md" icon={<FaSync />} ariaLabel="Actualizar datos" title="Actualizar datos" />
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITCard>

        {activeCatalogLabel && (
          <ITAlert variant="success" icon={<FaTag />}>
            <ITFlex align="center" justify="between" gap={3}>
              <ITText as="span" className="text-sm">Filtrando por catálogo: <ITText as="span" className="font-bold">{activeCatalogLabel}</ITText></ITText>
              <ITButton variant="text" color="success" size="md" onClick={clearCatalogFilters}>Quitar filtro</ITButton>
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

    {viewingClub && (
      <ReportDetailDialog
        kind="club"
        report={viewingClub}
        categoryLabel={viewingClub.category?.value || "General"}
        typeLabel={viewingClub.type?.value}
        isAdmin={isAdmin}
        onClose={() => setViewingClub(null)}
        onResolve={() => handleResolve(viewingClub.id)}
        onDeleteMedia={handleDeleteMedia}
      />
    )}

      <ITDialog
        isOpen={!!clubToResolveId}
        onClose={() => setClubToResolveId(null)}
        title="Confirmar Resolución"
      >
        <ITFlex direction="column" className="p-8 text-center">
            <ITFlex align="center" justify="center" className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheckCircle size={32} />
            </ITFlex>
            <ITText as="h4" className="text-xl font-bold text-slate-800 mb-2">¿Marcar como atendido?</ITText>
            <ITText as="p" className="text-slate-500 text-sm mb-8">
                Esta acción registrará que el reporte ha sido resuelto y quedará marcado como completado en el sistema.
            </ITText>
            <ITFlex justify="center" gap={3} className="flex justify-center gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setClubToResolveId(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="filled" color="success" onClick={confirmResolve}>
                    Confirmar
                </ITButton>
            </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={!!clubToDelete}
        onClose={() => setClubToDelete(null)}
        title="Eliminar Reporte"
      >
        <ITFlex direction="column" className="p-8 text-center">
            <ITFlex align="center" justify="center" className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTrash size={24} />
            </ITFlex>
            <ITText as="h4" className="text-xl font-bold text-slate-800 mb-2">¿Estás completamente seguro?</ITText>
            <ITText as="p" className="text-slate-500 text-sm mb-8">
                Esta acción es irreversible. Se eliminará el reporte <ITText as="span" className="font-bold text-slate-700">"{clubToDelete?.title}"</ITText> y toda su evidencia asociada.
            </ITText>
            <ITFlex justify="center" gap={3} className="flex justify-center gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setClubToDelete(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="filled" color="danger" onClick={confirmDelete}>
                    Eliminar permanentemente
                </ITButton>
            </ITFlex>
        </ITFlex>
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
