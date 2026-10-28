import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaFilePdf, FaPlus, FaRoute, FaSearch, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { CreateRouteModal } from "../components/CreateRouteModal";
import { deleteRoute, getPaginatedRoutes } from "../services/RoutesService";
import { downloadLocationQRsPdf } from "@core/utils/locationQRsPdf";

const RoutesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => ({ title: searchTerm }), [searchTerm]);

  const memoizedFetch = useCallback((params: any) => getPaginatedRoutes(params), []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleDelete = (id: number) => setRouteToDeleteId(id);

  const confirmDelete = async () => {
    /* v8 ignore next -- guarda defensiva: el botón solo existe con una ruta por eliminar */
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

  const handleDownloadQrPdf = (route: any) => {
    try {
      const unique = new Map<number, { id: number; name: string }>();
      (route.recurringLocations ?? []).forEach((rl: any) => {
        const location = rl.location;
        if (location?.id && location?.name) {
          unique.set(location.id, { id: location.id, name: location.name });
        }
      });

      const locations = [...unique.values()];
      if (locations.length === 0) {
        dispatch(showToast({ message: "Esta ruta no tiene ubicaciones", type: "warning" }));
        return;
      }

      downloadLocationQRsPdf(locations, route.title);
      dispatch(
        showToast({
          message: `${locations.length} QRs en PDF`,
          type: "success",
        }),
      );
    } catch {
      dispatch(showToast({ message: "No se pudo generar el PDF", type: "error" }));
    }
  };

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      noPadding
      title="Gestión de Rutas"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Gestión de Rutas" }]}
      description="Gestión de recorridos y puntos de control (Catálogo de Rondas)"
      icon={<FaRoute size={20} />}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap" justify="end" className="w-full justify-end">
          <ITFlex align="center" gap={1} className="w-64 shrink-0">
            <ITInput
              name="searchRoute"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {}}
              iconLeft={<FaSearch />}
              size="md"
            />
            {searchTerm && (
              <ITButton
                variant="icon-only"
                color="secondary"
                size="sm"
                onClick={() => setSearchTerm("")}
                icon={<FaTimes size={12} />}
                ariaLabel="Limpiar búsqueda"
                title="Limpiar búsqueda"
              />
            )}
          </ITFlex>

          <ITButton
            onClick={refreshTable}
            variant="icon-only"
            color="secondary"
            size="md"
            icon={<FaSync />}
            ariaLabel="Actualizar datos"
            title="Actualizar datos"
          />

          <ITButton onClick={handleCreate} color="primary" size="md" icon={<FaPlus />}>
            Agregar ruta
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
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
          externalFilters={externalFilters}
          title=""
          columns={[
            {
              key: "id",
              label: "ID",
              type: "number",
              sortable: false,
              render: (row: any) => (
                <ITText as="span" className="inline-flex rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  #{row.id}
                </ITText>
              ),
            },
            {
              key: "title",
              label: "NOMBRE / REFERENCIA",
              type: "string",
              sortable: false,
              render: (row: any) => (
                <ITFlex align="start" gap={3}>
                  <ITFlex
                    align="center"
                    justify="center"
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[var(--color-primary)] dark:bg-emerald-950/30 dark:text-emerald-400"
                  >
                    <FaRoute size={12} />
                  </ITFlex>
                  <ITFlex direction="column" gap={1}>
                    <ITText as="p" className="line-clamp-1 font-bold uppercase text-slate-800 dark:text-slate-100">
                      {row.title}
                    </ITText>
                    <ITText as="span" className="w-fit rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      RUTA DE SERVICIO
                    </ITText>
                  </ITFlex>
                </ITFlex>
              ),
            },
            {
              key: "locations",
              label: "UBICACIÓN / PUNTOS",
              type: "string",
              render: (row: any) => (
                <ITFlex direction="column">
                  <ITText as="span" className="text-xs font-bold uppercase leading-tight text-slate-700 dark:text-slate-200">
                    {row.recurringLocations?.[0]?.location?.name || "SIN UBICACIÓN"}
                  </ITText>
                  <ITText as="span" className="text-[10px] font-medium text-slate-400">
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
                <ITBadget color={row.active ? "success" : "secondary"} variant="filled" size="sm">
                  {row.active ? "ACTIVA" : "INACTIVA"}
                </ITBadget>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <ITFlex align="center" gap={2}>
                  <ITButton
                    onClick={() => handleDownloadQrPdf(row)}
                    variant="icon-only"
                    color="secondary"
                    size="md"
                    icon={<FaFilePdf />}
                    ariaLabel="Descargar QRs"
                    title="Descargar QRs en PDF"
                  />
                  <ITButton
                    onClick={() => handleEdit(row)}
                    variant="icon-only"
                    color="secondary"
                    size="md"
                    icon={<FaEdit />}
                    ariaLabel="Editar"
                    title="Editar"
                  />
                  <ITButton
                    onClick={() => handleDelete(row.id)}
                    color="danger"
                    variant="icon-only"
                    size="md"
                    icon={<FaTrash />}
                    ariaLabel="Eliminar"
                    title="Eliminar"
                  />
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

      <ITDialog isOpen={!!routeToDeleteId} onClose={() => setRouteToDeleteId(null)} title="Eliminar ruta">
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
            ¿Estás seguro de eliminar esta ruta de servicio? Esta acción no se puede deshacer.
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setRouteToDeleteId(null)}>
              Cancelar
            </ITButton>
            <ITButton color="danger" onClick={confirmDelete}>
              Eliminar ruta
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default RoutesPage;
