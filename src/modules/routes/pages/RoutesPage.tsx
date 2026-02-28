import { ITBadget, ITButton, ITLoader, ITTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { CreateRouteModal } from "../components/CreateRouteModal";
import { deleteRoute, getRoutesList } from "../services/RoutesService";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";

const RoutesPage = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);

  const fetchRoutes = async () => {
    setLoading(true);
    const res = await getRoutesList();
    if (res.success && res.data) {
      setRoutes(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDelete = (id: number) => {
    setRouteToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!routeToDeleteId) return;
    const res = await deleteRoute(routeToDeleteId);
    setRouteToDeleteId(null);
    if (res.success) {
      dispatch(showToast({ message: "Ruta eliminada", type: "success" }));
      fetchRoutes();
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
    <div className="p-6 bg-[#f6fbf4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Rutas de Servicio
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configuración de rutas y puntos de control
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-[#086f16] transition-colors"
        >
          <FaPlus className="text-xs" />
          <span>Nueva Ruta</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <ITLoader />
          </div>
        ) : (
          <ITTable
            data={routes}
            columns={[
              {
                key: "id",
                label: "ID",
                type: "number",
                sortable: true,
              },
              {
                key: "title",
                label: "Nombre de Ruta",
                type: "string",
                sortable: true,
                render: (row: any) => (
                  <div className="font-bold text-slate-700">{row.title}</div>
                ),
              },
              {
                key: "locations",
                label: "Ubicaciones",
                type: "string",
                render: (row: any) => (
                  <span className="text-slate-600 text-sm bg-slate-100 px-2 py-1 rounded">
                    {row.recurringLocations?.length || 0} Puntos de control
                  </span>
                ),
              },
              {
                key: "active",
                label: "Estado",
                type: "string",
                render: (row: any) => (
                  <ITBadget
                    color={row.active ? "success" : "danger"}
                    variant="filled"
                    size="small"
                  >
                    {row.active ? "ACTIVA" : "INACTIVA"}
                  </ITBadget>
                ),
              },
              {
                key: "actions",
                label: "Acciones",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex gap-2">
                    <ITButton
                      onClick={() => handleEdit(row)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      className="!p-2"
                      title="Editar"
                    >
                      <FaEdit />
                    </ITButton>
                    <ITButton
                      onClick={() => handleDelete(row.id)}
                      size="small"
                      color="danger"
                      variant="outlined"
                      className="!p-2"
                      title="Eliminar"
                    >
                      <FaTrash />
                    </ITButton>
                  </div>
                ),
              },
            ]}
            itemsPerPageOptions={[10, 20]}
            defaultItemsPerPage={20}
            title=""
          />
        )}
      </div>

      <CreateRouteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchRoutes}
        editConfig={editConfig}
      />

      {/* Confirm Delete Dialog */}
      <ITDialog isOpen={!!routeToDeleteId} onClose={() => setRouteToDeleteId(null)} title="Confirmar Eliminación">
        <div className="p-6">
            <p className="text-[#1b1b1f] text-base mb-6">
                ¿Estás seguro de eliminar esta ruta? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setRouteToDeleteId(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="solid" className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={confirmDelete}>
                    Eliminar
                </ITButton>
            </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default RoutesPage;
