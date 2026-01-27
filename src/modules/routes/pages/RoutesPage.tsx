import { useEffect, useState } from "react";
import { getRoutesList, deleteRoute } from "../services/RoutesService";
import { ITBadget, ITButton, ITTable, ITLoader } from "axzy_ui_system";
import { FaEdit, FaTrash, FaPlus, FaMapMarkedAlt } from "react-icons/fa";
import { CreateRouteModal } from "../components/CreateRouteModal";

const RoutesPage = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);

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

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta ruta?")) {
      const res = await deleteRoute(id);
      if (res.success) {
        alert("Ruta eliminada");
        fetchRoutes();
      } else {
        alert("Error al eliminar");
      }
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
    </div>
  );
};

export default RoutesPage;
