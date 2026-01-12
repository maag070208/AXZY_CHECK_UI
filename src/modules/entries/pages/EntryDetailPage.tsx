import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEntryById, VehicleEntry } from "../service/entries.service";
import { ITButton, ITLoader } from "axzy_ui_system";

const EntryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<VehicleEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
        if (!id) return;
        setLoading(true);
        const res = await getEntryById(Number(id));
        if (res.success && res.data) {
            setEntry(res.data);
        }
        setLoading(false);
    };
    fetchEntry();
  }, [id]);

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;
  if (!entry) return <div className="p-10">Entrada no encontrada</div>;

  const baseURL = import.meta.env.VITE_BASE_URL?.replace('/api/v1', '') || 'http://localhost:4444';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Detalle de Entrada: {entry.entryNumber}</h1>
        <ITButton color="secondary" onClick={() => navigate(-1)}>Volver</ITButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Información del Vehículo</h2>
            <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold">Placas:</span> {entry.plates}</div>
                <div><span className="font-bold">Marca:</span> {entry.brand}</div>
                <div><span className="font-bold">Modelo:</span> {entry.model}</div>
                <div><span className="font-bold">Color:</span> {entry.color}</div>
                <div><span className="font-bold">Kilometraje:</span> {entry.mileage}</div>
                <div><span className="font-bold">Ubicación Actual:</span> {entry.location?.name}</div>
                <div><span className="font-bold">Estatus:</span> {entry.status}</div>
                <div><span className="font-bold">Fecha Entrada:</span> {new Date(entry.entryDate).toLocaleString()}</div>
            </div>
            {entry.notes && (
                <div className="mt-4">
                    <span className="font-bold">Notas:</span>
                    <p className="bg-gray-50 p-2 rounded">{entry.notes}</p>
                </div>
            )}
        </div>

        <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Evidencia Fotográfica</h2>
            <div className="grid grid-cols-2 gap-4">
                {entry.photos?.map(photo => (
                    <div key={photo.id} className="border rounded p-2">
                        <span className="text-xs font-bold uppercase block mb-1">{photo.category}</span>
                        <img 
                            src={`${baseURL}${photo.imageUrl}`} 
                            alt={photo.category} 
                            className="w-full h-40 object-cover rounded hover:opacity-90 cursor-pointer"
                            onClick={() => window.open(`${baseURL}${photo.imageUrl}`, '_blank')}
                        />
                    </div>
                ))}
            </div>
        </div>
      </div>

      {entry.assignments && entry.assignments.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold border-b pb-4 mb-4">Historial de Movimientos</h2>
              <div className="space-y-6">
                  {entry.assignments.map((assignment, index) => (
                      <div key={assignment.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                              <div className={`w-4 h-4 rounded-full ${assignment.type === 'MOVEMENT' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                              {index < (entry.assignments || []).length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                          </div>
                          <div>
                              <div className="text-xs text-gray-500">{new Date(assignment.createdAt).toLocaleString()}</div>
                              <h3 className="font-bold text-gray-800">
                                  {assignment.type === 'MOVEMENT' ? 'Movimiento de Vehículo' : 'Entrega de Vehículo'}
                              </h3>
                              <p className="text-gray-600">
                                  {assignment.type === 'MOVEMENT' 
                                      ? `Movido a ${assignment.targetLocation?.name || 'Ubicación Desconocida'}` 
                                      : 'Vehículo entregado al cliente'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 bg-gray-50 p-1 px-2 rounded w-fit">
                                  <span className="text-xs text-gray-500 font-semibold">Operador:</span>
                                  <span className="text-xs text-gray-700">
                                      {assignment.operator ? `${assignment.operator.name} ${assignment.operator.lastName || ''}` : 'Operador'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      </div>
  );
};

export default EntryDetailPage;
