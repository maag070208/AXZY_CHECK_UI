import { ITBadget, ITButton, ITLoader, ITTable } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FaCheck, FaCheckCircle, FaEye, FaFileAlt, FaUserShield, FaSync, FaWrench } from "react-icons/fa";
import { getMaintenances, Maintenance, resolveMaintenance } from "../services/MaintenanceService";
import { MediaCarousel } from "@core/components/MediaCarousel";

const MaintenancesPage = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMaintenance, setViewingMaintenance] = useState<Maintenance | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchMaintenances = async () => {
    setLoading(true);
    const res = await getMaintenances();
    if (res.success && res.data) {
        setMaintenances(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const handleResolve = async (id: number) => {
      if (confirm('¿Estás seguro de marcar este reporte de mantenimiento como atendido?')) {
          setResolvingId(id);
          const res = await resolveMaintenance(id);
          setResolvingId(null);
          if (res.success) {
              fetchMaintenances();
              if (viewingMaintenance?.id === id) {
                  setViewingMaintenance(null); // Close modal if open
              }
          } else {
              alert("Error al resolver mantenimiento");
          }
      }
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6 bg-[#f6fbf4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mantenimientos</h1>
           <p className="text-slate-500 text-sm mt-1">Gestión y seguimiento de reportes de mantenimiento</p>
        </div>
        <button 
            onClick={() => fetchMaintenances()}
            className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm  transition-colors"
        >
            <FaSync className="text-xs" />
            <span>Actualizar</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ITTable
            data={maintenances as any[]}
            columns={[
            { key: "id", label: "ID", type: "number", sortable: true },
            { 
                key: "title", 
                label: "Mantenimiento", 
                type: "string", 
                sortable: true,
                render: (row: Maintenance) => (
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-500">
                            <FaWrench className="text-xs" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{row.title}</p>
                            <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                                {row.category}
                            </span>
                        </div>
                    </div>
                )
            },
            {
                key: "createdAt",
                label: "Reportado",
                type: "string",
                sortable: true,
                render: (row: Maintenance) => (
                    <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-700">{dayjs(row.createdAt).format("DD/MM/YYYY")}</span>
                        <span className="text-slate-400">{dayjs(row.createdAt).format("HH:mm")}</span>
                    </div>
                )
            },
            { 
                key: "guard", 
                label: "Reportado Por", 
                type: "string", 
                sortable: false,
                render: (row: Maintenance) => (
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
                render: (row: Maintenance) => (
                    <ITBadget 
                        color={row.status === 'ATTENDED' ? 'success' : 'warning'} 
                        size="small" 
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
                render: (row: Maintenance) => (
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
                actions: (row: Maintenance) => (
                    <div className="flex items-center gap-2">
                        <ITButton
                            onClick={() => setViewingMaintenance(row)}
                            size="small"
                            color='secondary'
                            variant="outlined"
                            className="!p-2"
                            title="Ver detalles"
                        >
                            <FaEye />
                        </ITButton>
                        {row.status === 'PENDING' && (
                            <ITButton
                                onClick={() => handleResolve(row.id)}
                                size="small"
                                color='success'
                                variant="filled"
                                className="!p-2"
                                title="Marcar como atendido"
                                disabled={resolvingId === row.id}
                            >
                                {resolvingId === row.id ? <ITLoader size="sm" /> : <FaCheck />}
                            </ITButton>
                        )}
                    </div>
                )
            }
            ]}
            itemsPerPageOptions={[10, 20, 50]}
            defaultItemsPerPage={20}
            title=""
        />
      </div>

    {viewingMaintenance && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setViewingMaintenance(null)}
        />
    
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
          
          <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100 z-10">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-slate-800">Detalle de Mantenimiento</h3>
                  <ITBadget 
                      color={viewingMaintenance.status === 'ATTENDED' ? 'success' : 'warning'} 
                      size="small"
                  >
                      {viewingMaintenance.status === 'ATTENDED' ? 'Atendido' : 'Pendiente'}
                  </ITBadget>
               </div>
               <p className="text-sm text-slate-500">Reportado el {dayjs(viewingMaintenance.createdAt).format("DD [de] MMMM, YYYY [a las] HH:mm")}</p>
            </div>
            <button 
              onClick={() => setViewingMaintenance(null)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 space-y-8">
                 {/* Descripción */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-400 rounded-full block"></span>
                        {viewingMaintenance.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingMaintenance.description || "Sin descripción detallada."}
                    </p>
                 </div>

                {/* Multimedia Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-500 rounded-full block"></span>
                        Evidencia
                    </h4>
                    {viewingMaintenance.media && viewingMaintenance.media.length > 0 && 
                        <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-bold">
                            {viewingMaintenance.media.length} archivos
                        </span>
                    }
                  </div>
    
                  {viewingMaintenance.media && viewingMaintenance.media.length > 0 ? (
                    <MediaCarousel media={viewingMaintenance.media} title={viewingMaintenance.title} />
                  ) : (
                    <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                      <FaFileAlt className="text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-400">Sin evidencia adjunta</p>
                    </div>
                  )}
                </section>
              </div>
    
              <div className="lg:col-span-4 space-y-6">
                 {/* Metadata Cards */}
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Detalles del Reporte</h5>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-500">
                                <FaUserShield />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Reportado por</p>
                                <p className="text-sm font-bold text-slate-800">{viewingMaintenance.guard?.name} {viewingMaintenance.guard?.lastName}</p>
                                <p className="text-xs text-slate-500">@{viewingMaintenance.guard?.username}</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-50"></div>

                        <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
                                <FaWrench />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Categoría</p>
                                <p className="text-sm font-bold text-slate-800">{viewingMaintenance.category}</p>
                            </div>
                        </div>

                        {viewingMaintenance.status === 'ATTENDED' && viewingMaintenance.resolvedBy && (
                            <>
                                <div className="w-full h-px bg-slate-50"></div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">Atendido por</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingMaintenance.resolvedBy.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {dayjs(viewingMaintenance.resolvedAt).format("DD/MM/YYYY HH:mm")}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                 </div>

                 {viewingMaintenance.status === 'PENDING' && (
                     <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <h5 className="text-xs font-bold text-orange-800 mb-2">Acciones Pendientes</h5>
                        <p className="text-xs text-orange-700 mb-3">Este mantenimiento requiere atención.</p>
                        <ITButton 
                            onClick={() => handleResolve(viewingMaintenance.id)}
                            color="success"
                            className="w-full justify-center"
                        >
                            Marcar como Atendido
                        </ITButton>
                     </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};
export default MaintenancesPage;
