import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDataTable, ITDialog, ITFlex, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaRoute, FaSearch, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { CreateRouteModal } from "../components/CreateRouteModal";
import { deleteRoute, getPaginatedRoutes } from "../services/RoutesService";

const RoutesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setRefreshKey(prev => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return { title: searchTerm };
  }, [searchTerm]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedRoutes(params);
  }, []);

  const refreshTable = () => setRefreshKey(prev => prev + 1);

  const handleDelete = (id: number) => {
    setRouteToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!routeToDeleteId) return;
    const res = await deleteRoute(routeToDeleteId);
    setRouteToDeleteId(null);
    if (res.success) {
      dispatch(showToast({ message: "Ruta eliminada", type: "success" }));
      refreshTable();
    } else {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  const handleEdit = (route: any) => {
    setEditConfig(route);
    setIsCreateModalOpen(true);
  };

  const handleCreate = () => {
    setEditConfig(null);
    setIsCreateModalOpen(true);
  };

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Gestión de Rutas"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Gestión de Rutas" }]}
      description="Gestión de recorridos y puntos de control (Catálogo de Rondas)"
      icon={<FaRoute size={20} />}
      iconColor="#065911"
      actions={
<ITFlex align="center" gap={3} className="flex items-center gap-3">
            <ITFlex direction="column" className="w-64 relative">
                <ITInput
                    name="searchRoute"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!py-2.5 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
                />
                {searchTerm ? (
                    <ITButton
                        variant="icon-only"
                        color="gray"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        icon={<FaTimes size={14} />}
                       
                    />
                ) : (
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-200" />
                )}
            </ITFlex>

            <ITButton
               onClick={refreshTable}
               variant="outlined"
               color="secondary"
              
               size="md"
               title="Actualizar datos"
            >
              <ITFlex align="center" gap={2}><FaSync className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? '' : 'rotate-180'}`} /> 
              <ITText as="span" className="text-xs font-bold text-slate-500">Refrescar</ITText></ITFlex>
            </ITButton>

            <ITButton
               onClick={handleCreate}
               color="primary"
               size="md"
            >
              <ITFlex align="center" gap={2}><FaPlus className="text-xs" /> AGREGAR RUTA
            </ITFlex></ITButton>
        </ITFlex>
      }
    >

      <ITFlex direction="column" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={400}
          rowHeight={50}
          key={refreshKey}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          title=""
          columns={[
            {
              key: "id",
              label: "ID",
              type: "number",
              sortable: false,
              render: (row: any) => (
                <ITFlex direction="column" className="text-xs font-bold text-slate-400 py-4">
                  #{row.id}
                </ITFlex>
              ),
            },
            {
              key: "title",
              label: "NOMBRE / REFERENCIA",
              type: "string",
              sortable: false,
              render: (row: any) => (
                <ITFlex align="start" gap={3} className="flex items-start gap-3">
                    <ITFlex align="center" justify="center" className="mt-1 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-[#065911]">
                        <FaRoute className="text-xs" />
                    </ITFlex>
                    <ITFlex direction="column">
                        <ITText as="p" className="font-bold text-slate-800 line-clamp-1 uppercase">{row.title}</ITText>
                        <ITFlex align="center" gap={1} className="flex gap-1 items-center">
                            <ITText as="span" className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">
                                RUTA DE SERVICIO
                            </ITText>
                        </ITFlex>
                    </ITFlex>
                </ITFlex>
              ),
            },
            {
              key: "locations",
              label: "UBICACIÓN / PUNTOS",
              type: "string",
              render: (row: any) => (
                <ITFlex direction="column" className="flex flex-col py-2">
                    <ITText as="span" className="font-bold text-slate-700 text-xs leading-tight uppercase">
                        {row.recurringLocations?.[0]?.location?.name || 'SIN UBICACIÓN'}
                    </ITText>
                    <ITText as="span" className="text-slate-400 text-[10px] font-medium">
                        {row.recurringLocations?.length || 0} Puntos registrados en sistema
                    </ITText>
                </ITFlex>
              ),
            },
            {
              key: "active",
              label: "ESTADO",
              type: "string",
              render: (row: any) => (
                <ITText as="span" className={`px-3 py-1 rounded-full text-[10px] font-bold border ${row.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {row.active ? "ACTIVA" : "INACTIVA"}
                </ITText>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                  <ITButton 
                    onClick={() => handleEdit(row)}
                    variant="outlined" 
                    color="secondary"
                    size="sm" 
                   
                    title="Editar"
                  >
                    <FaEdit size={14} className="text-slate-500" />
                  </ITButton>
                  <ITButton 
                    onClick={() => handleDelete(row.id)}
                    color="danger" 
                    variant="outlined" 
                    size="sm" 
                   
                    title="Eliminar"
                  >
                    <FaTrash size={14} />
                  </ITButton>
                </ITFlex>
              ),
            },
          ]}
        />
      </ITFlex>

      <CreateRouteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refreshTable}
        editConfig={editConfig}
      />

      {/* Confirm Delete Dialog */}
      <ITDialog isOpen={!!routeToDeleteId} onClose={() => setRouteToDeleteId(null)} title="Eliminar Registro">
        <ITFlex direction="column" className="p-6">
            <ITText as="p" className="text-slate-600 mb-6 text-sm">
                ¿Estás seguro de eliminar esta ruta de servicio? Esta acción no se puede deshacer.
            </ITText>
            <ITFlex justify="end" gap={3} className="flex justify-end gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setRouteToDeleteId(null)}>
                    Cancelar
                </ITButton>
                <ITButton onClick={confirmDelete}>
                    Eliminar permanentemente
                </ITButton>
            </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default RoutesPage;
