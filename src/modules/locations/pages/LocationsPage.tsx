import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation, Location } from "../service/locations.service";
import { LocationsTable } from "../components/LocationsTable";
import { LocationForm } from "../components/LocationForm";
import { ITButton, ITDialog, ITLoader } from "axzy_ui_system";

  /* ... existing imports ... */
  import { useSelector } from "react-redux";
  import { AppState } from "@app/core/store/store";

  const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useSelector((state: AppState) => state.auth);

  /* Filters/Modals State */
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    const res = await getLocations();
    if (res.success && res.data) {
        setLocations(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (data: { aisle: string; spot: string }) => {
    await createLocation(data);
    setIsModalOpen(false);
    fetchLocations();
  };

  const handleEdit = async (data: { aisle: string; spot: string }) => {
      if (!editingLocation) return;
      // Name is auto-generated in backend usually, but here we can pass it if we want custom
      // For now just pass aisle/spot and let backend handle name or keep it simple
      const name = `${data.aisle}-${data.spot}`;
      await updateLocation(editingLocation.id, { ...data, name });
      setEditingLocation(null);
      fetchLocations();
  };

  const handleDelete = async (location: Location) => {
      if (confirm(`¿Estás seguro de eliminar la zona ${location.name}?`)) {
          try {
              await deleteLocation(location.id);
              fetchLocations();
          } catch (e: any) {
              alert(e.message || "Error al eliminar");
          }
      }
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Ubicaciones</h1>
        {user?.role !== "OPERATOR" && (
            <ITButton onClick={() => setIsModalOpen(true)}>Nueva Ubicación</ITButton>
        )}
      </div>

      <LocationsTable 
        data={locations} 
        onViewCars={(loc) => setViewingLocation(loc)}
        onEdit={(loc) => setEditingLocation(loc)}
        onDelete={(loc) => handleDelete(loc)}
      />

      {/* Create Modal */}
      <ITDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Locación">
        <LocationForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </ITDialog>

      {/* Edit Modal */}
      <ITDialog isOpen={!!editingLocation} onClose={() => setEditingLocation(null)} title="Editar Locación">
        {editingLocation && (
            <LocationForm 
                initialData={editingLocation}
                onSubmit={handleEdit} 
                onCancel={() => setEditingLocation(null)} 
            />
        )}
      </ITDialog>

        {/* View Cars Modal */}
      <ITDialog 
        isOpen={!!viewingLocation} 
        onClose={() => setViewingLocation(null)} 
        title={`Autos en ${viewingLocation?.name}`}
        className="max-w-3xl w-full"
      >
        <div className="p-4">
            {viewingLocation?.entries && viewingLocation.entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {viewingLocation.entries.map((entry: any) => (
                        <div key={entry.id} className="border rounded-lg p-3 flex gap-3 items-center bg-gray-50">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                <span className="material-icons">directions_car</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{entry.brand} {entry.model}</p>
                                <p className="text-sm text-gray-600">Placas: <span className="font-mono font-bold">{entry.plates}</span></p>
                                <p className="text-xs text-gray-500">Color: {entry.color}</p>
                                <div className="mt-1">
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{entry.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>No hay vehículos en esta zona.</p>
                </div>
            )}
            <div className="mt-6 flex justify-end">
                <ITButton color="secondary" onClick={() => setViewingLocation(null)}>Cerrar</ITButton>
            </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default LocationsPage;
