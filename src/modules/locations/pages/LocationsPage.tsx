import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation, Location } from "../service/locations.service";
import { LocationForm } from "../components/LocationForm";
import { ITButton, ITDialog, ITLoader, ITTable } from "axzy_ui_system";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { FaCar, FaPlus, FaQrcode, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import QRCode from "qrcode";

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

  const handleCreate = async (data: { aisle: string; spot: string; number: string }) => {
    await createLocation(data);
    setIsModalOpen(false);
    fetchLocations();
  };

  const handleEdit = async (data: { aisle: string; spot: string; number: string }) => {
      if (!editingLocation) return;
      const name = `${data.aisle}-${data.spot}-${data.number}`;
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
              alert("Por favor habilita los pop-ups para imprimir.");
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
          alert("Error al generar el código QR");
      }
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6 bg-[#f6fbf4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-[#1b1b1f] tracking-tight">Ubicaciones</h1>
           <p className="text-[#54634d] text-sm mt-1">Gestión de cajones y pasillos</p>
        </div>
        {user?.role !== "OPERATOR" && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-[#086f16] transition-colors"
            >
                <FaPlus className="text-xs" />
                <span>Nueva Ubicación</span>
            </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#e1e4d5] overflow-hidden">
        <ITTable
            data={locations as any[]}
            columns={[
                { key: "id", label: "ID", type: "number", sortable: true },
                { 
                    key: "name", 
                    label: "Ubicación", 
                    type: "string", 
                    sortable: true,
                    render: (row: Location) => (
                        <div className="font-bold text-[#1b1b1f]">{row.name}</div>
                    )
                },
                { key: "aisle", label: "Pasillo", type: "string", sortable: true },
                { key: "spot", label: "Cajón", type: "string", sortable: true },
                { key: "number", label: "Número", type: "string", sortable: true },
                {
                    key: "status",
                    label: "Estado",
                    type: "string",
                    sortable: true,
                    render: (row: Location) => (
                         <div className="flex items-center gap-2">
                             {row.entries && row.entries.length > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <FaCar /> Ocupado ({row.entries.length})
                                </span>
                             ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <FaCheckCircle /> Disponible
                                </span>
                             )}
                         </div>
                    )
                },
                {
                    key: "actions",
                    label: "Acciones",
                    type: "actions",
                    actions: (row: Location) => (
                        <div className="flex items-center gap-2">
                            <ITButton
                                onClick={() => handlePrintQR(row)}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                className="!p-2"
                                title="Imprimir QR"
                            >
                                <FaQrcode />
                            </ITButton>
                             {user?.role !== "OPERATOR" && (
                                 <>
                                    <ITButton
                                        onClick={() => setEditingLocation(row)}
                                        size="small"
                                        variant="ghost"
                                        className="!p-2 text-slate-500 hover:text-slate-700"
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </ITButton>
                                    <ITButton
                                        onClick={() => handleDelete(row)}
                                        size="small"
                                        variant="ghost"
                                        className="!p-2 text-red-400 hover:text-red-600"
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </ITButton>
                                 </>
                             )}
                        </div>
                    )
                }
            ]}
            itemsPerPageOptions={[10, 20, 50]}
            defaultItemsPerPage={10}
            title=""
        />
      </div>

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
                        <div key={entry.id} className="border rounded-lg p-3 flex gap-3 items-center bg-gray-50 border-[#e1e4d5]">
                            <div className="bg-[#f1f6eb] p-2.5 rounded-full text-[#065911]">
                                <FaCar />
                            </div>
                            <div>
                                <p className="font-bold text-[#1b1b1f]">{entry.brand} {entry.model}</p>
                                <p className="text-sm text-[#54634d]">Placas: <span className="font-mono font-bold">{entry.plates}</span></p>
                                <p className="text-xs text-gray-500">Color: {entry.color}</p>
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
