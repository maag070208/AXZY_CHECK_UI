import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDataTable, ITDialog, ITFlex, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCar, FaSearchLocation, FaEdit, FaPlus, FaQrcode, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { LocationForm } from "../components/LocationForm";
import { createLocation, deleteLocation, getPaginatedLocations, Location, updateLocation } from "../service/locations.service";

const LocationsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search to trigger refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  /* Filters/Modals State */
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedLocations(params);
  }, []);

  const externalFilters = useMemo(() => {
    return { name: searchTerm };
  }, [searchTerm]);

  const handleCreate = async (data: { aisle: string; spot: string; number: string }) => {
    await createLocation(data);
    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = async (data: { aisle: string; spot: string; number: string }) => {
      if (!editingLocation) return;
      const name = `${data.aisle}-${data.spot}-${data.number}`;
      await updateLocation(editingLocation.id, { ...data, name });
      setEditingLocation(null);
      setRefreshKey(prev => prev + 1);
  };

  const handleDelete = (location: Location) => {
      setLocationToDelete(location);
  };

  const confirmDelete = async () => {
      if (!locationToDelete) return;
      try {
          const res = await deleteLocation(locationToDelete.id);
          setLocationToDelete(null);
          if (res && res.success) {
               dispatch(showToast({ message: "Ubicación eliminada correctamente", type: "success" }));
               setRefreshKey(prev => prev + 1);
          } else {
               dispatch(showToast({ message: res?.messages?.join(", ") || "Error al eliminar", type: "error" }));
          }
      } catch (e: any) {
          dispatch(showToast({ message: e.message || "Error al eliminar", type: "error" }));
      }
  };

  const handlePrintQR = async (location: Location) => {
      try {
          // Generate QR Code
          // We can encode the ID or a specific JSON structure depending on what the scanner expects.
          // For now, assuming simply the ID or Name is sufficient.
          const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
              id: location.id,
              type: 'LOCATION'
          }), { width: 300 });

          // Open print window
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
              dispatch(showToast({ message: "Por favor habilita los pop-ups para imprimir.", type: "warning" }));
              return;
          }

          printWindow.document.write(`
              <html>
                  <head>
                      <style>
                          body {
                              display: flex;
                              flex-direction: column;
                              align-items: center;
                              justify-content: center;
                              height: 100vh;
                              margin: 0;
                              font-family: Arial, sans-serif;
                          }
                          .container {
                              text-align: center;
                              border: 2px solid #000;
                              padding: 40px;
                              border-radius: 20px;
                          }
                          img {
                              margin-bottom: 20px;
                          }
                          h1 {
                              font-size: 32px;
                              margin: 0;
                          }
                          p {
                              font-size: 18px;
                              color: #555;
                          }
                      </style>
                  </head>
                  <body>
                      <div class="container">
                          <img src="${qrDataUrl}" alt="QR Code" />
                          <h1>${location.name}</h1>
                      </div>
                      <script>
                          window.onload = function() {
                              window.print();
                              window.onafterprint = function() {
                                  window.close();
                              }
                          }
                      </script>
                  </body>
              </html>
          `);
          printWindow.document.close();

      } catch (error) {
          console.error("Error generating QR", error);
          dispatch(showToast({ message: "Error al generar el código QR", type: "error" }));
      }
  };

  const columns = useMemo(() => [
      { 
          key: "id", 
          label: "ID", 
          type: "number", 
          sortable: true,
          render: (row: any) => (
              <ITFlex direction="column" className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block text-xs">
                  {row.id}
              </ITFlex>
          )
      },
      { 
          key: "name", 
          label: "Ubicación", 
          type: "string", 
          sortable: true,
          render: (row: Location) => (
              <ITFlex direction="column" className="font-bold text-slate-800">{row.name}</ITFlex>
          )
      },
      { 
          key: "aisle", 
          label: "Sección", 
          type: "string", 
          sortable: true,
          render: (row: any) => <ITFlex direction="column" className="text-slate-600 font-medium">{row.aisle}</ITFlex>
      },
      { 
          key: "spot", 
          label: "# Consecutivo", 
          type: "string", 
          sortable: true,
          render: (row: any) => <ITFlex direction="column" className="text-slate-500">{row.spot}</ITFlex>
      },
      { 
          key: "number", 
          label: "Referencia", 
          type: "string", 
          sortable: true,
          render: (row: any) => <ITFlex direction="column" className="text-xs text-slate-400 italic">{row.number}</ITFlex>
      },
      {
          key: "actions",
          label: "Acciones",
          type: "actions",
          actions: (row: Location) => (
              <ITFlex align="center" gap={2} className="flex items-center gap-2">
                  <ITButton
                      onClick={() => handlePrintQR(row)}
                      size="sm"
                      variant="outlined"
                      color="primary"
                     
                      title="Imprimir QR"
                  >
                      <FaQrcode />
                  </ITButton>
                   {user?.role !== "OPERATOR" && (
                       <>
                          <ITButton
                              onClick={() => setEditingLocation(row)}
                              size="sm"
                              variant="ghost"
                             
                              title="Editar"
                          >
                              <FaEdit />
                          </ITButton>
                          <ITButton
                              onClick={() => handleDelete(row)}
                              size="sm"
                              variant="ghost"
                             
                              title="Eliminar"
                          >
                              <FaTrash />
                          </ITButton>
                       </>
                   )}
              </ITFlex>
          )
      }
  ], [user]);

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Ubicaciones"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Ubicaciones" }]}
      description="Gestión de zonas y puntos de control"
      icon={<FaSearchLocation size={20} />}
      iconColor="#065911"
      actions={
<ITFlex align="center" gap={3} className="flex items-center gap-3">
            <ITFlex direction="column" className="w-64 relative">
                <ITInput
                    placeholder="Buscar por nombre..."
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {}}
                    className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
                />
                {searchTerm && (
                    <ITButton
                        variant="icon-only"
                        color="gray"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        icon={<FaTimes size={14} />}
                        title="Limpiar búsqueda"
                       
                    />
                )}
            </ITFlex>
            <ITButton
                onClick={() => setRefreshKey(prev => prev + 1)}
                color="secondary"
                variant="outlined"
               
                size="md"
                title="Actualizar tabla"
            >
                <ITFlex align="center" gap={2}><FaSync className={`text-xs text-slate-500`} />
                <ITText as="span" className="text-xs font-bold text-slate-500">Actualizar</ITText></ITFlex>
            </ITButton>
            {user?.role !== "OPERATOR" && (
                <ITButton
                    onClick={() => setIsModalOpen(true)}
                    color="primary"
                    size="md"
                >
                    <ITFlex align="center" gap={2}><FaPlus className="text-xs" /> NUEVA UBICACIÓN
                </ITFlex></ITButton>
            )}
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
            columns={columns as any}
            fetchData={memoizedFetch as any}
            externalFilters={externalFilters}
        />
      </ITFlex>

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
        <ITFlex direction="column" className="p-4">
            {viewingLocation?.entries && viewingLocation.entries.length > 0 ? (
                <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {viewingLocation.entries.map((entry: any) => (
                        <div key={entry.id} className="border rounded-lg p-3 flex gap-3 items-center bg-gray-50 border-[#e1e4d5]">
                            <ITFlex direction="column" className="bg-[#f1f6eb] p-2.5 rounded-full text-[#065911]">
                                <FaCar />
                            </ITFlex>
                            <ITFlex direction="column">
                                <ITText as="p" className="font-bold text-[#1b1b1f]">{entry.brand} {entry.model}</ITText>
                                <ITText as="p" className="text-sm text-[#54634d]">Placas: <ITText as="span" className="font-mono font-bold">{entry.plates}</ITText></ITText>
                                <ITText as="p" className="text-xs text-gray-500">Color: {entry.color}</ITText>
                            </ITFlex>
                        </div>
                    ))}
                </ITFlex>
            ) : (
                <ITFlex direction="column" className="text-center py-10 text-gray-500">
                    <ITText as="p">No hay vehículos en esta zona.</ITText>
                </ITFlex>
            )}
            <ITFlex justify="end" className="mt-6 flex justify-end">
                <ITButton color="secondary" onClick={() => setViewingLocation(null)}>Cerrar</ITButton>
            </ITFlex>
        </ITFlex>
      </ITDialog>

      {/* Delete Confirmation Modal */}
      <ITDialog isOpen={!!locationToDelete} onClose={() => setLocationToDelete(null)} title="Confirmar Eliminación">
        <ITFlex direction="column" className="p-6">
            <ITText as="p" className="text-[#1b1b1f] text-base mb-6">
                ¿Estás seguro de que deseas eliminar la zona <ITText as="span" className="font-bold text-red-600">{locationToDelete?.name}</ITText>? Esta acción no se puede deshacer.
            </ITText>
            <ITFlex justify="end" gap={3} className="flex justify-end gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setLocationToDelete(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="solid" onClick={confirmDelete}>
                    Eliminar
                </ITButton>
            </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default LocationsPage;
