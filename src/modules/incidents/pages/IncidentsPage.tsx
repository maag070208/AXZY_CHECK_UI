import { ITBadget, ITButton, ITLoader, ITTable } from "axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FaCheck, FaCheckCircle, FaExclamationTriangle, FaEye, FaFileAlt, FaUserShield, FaSync } from "react-icons/fa";
import { getIncidents, Incident, resolveIncident } from "../services/IncidentService";
import { MediaCarousel } from "@core/components/MediaCarousel";

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    const res = await getIncidents();
    if (res.success && res.data) {
        setIncidents(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleResolve = async (id: number) => {
      if (confirm('¿Estás seguro de marcar esta incidencia como atendida?')) {
          setResolvingId(id);
          const res = await resolveIncident(id);
          setResolvingId(null);
          if (res.success) {
              fetchIncidents();
              if (viewingIncident?.id === id) {
                  setViewingIncident(null); // Close modal if open
              }
          } else {
              alert("Error al resolver incidencia");
          }
      }
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6 bg-[#f6fbf4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Incidencias</h1>
           <p className="text-slate-500 text-sm mt-1">Gestión y seguimiento de reportes de seguridad</p>
        </div>
        <button 
            onClick={() => fetchIncidents()}
            className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-[#086f16] transition-colors"
        >
            <FaSync className="text-xs" />
            <span>Actualizar</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ITTable
            data={incidents as any[]}
            columns={[
            { key: "id", label: "ID", type: "number", sortable: true },
            { 
                key: "title", 
                label: "Incidencia", 
                type: "string", 
                sortable: true,
                render: (row: Incident) => (
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                            <FaExclamationTriangle className="text-xs" />
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
                render: (row: Incident) => (
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
                render: (row: Incident) => (
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
                render: (row: Incident) => (
                    <ITBadget 
                        color={row.status === 'ATTENDED' ? 'success' : 'danger'} 
                        size="small" 
                        variant="filled"
                    >
                        {row.status === 'ATTENDED' ? 'Atendida' : 'Pendiente'}
                    </ITBadget>
                )
            },
            { 
                key: "media", 
                label: "Evidencia", 
                type: "string", 
                sortable: false, 
                render: (row: Incident) => (
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
                actions: (row: Incident) => (
                    <div className="flex items-center gap-2">
                        <ITButton
                            onClick={() => setViewingIncident(row)}
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
                                title="Marcar como atendida"
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

    {viewingIncident && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setViewingIncident(null)}
        />
    
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
          
          <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100 z-10">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-slate-800">Detalle de Incidencia</h3>
                  <ITBadget 
                      color={viewingIncident.status === 'ATTENDED' ? 'success' : 'danger'} 
                      size="small"
                  >
                      {viewingIncident.status === 'ATTENDED' ? 'Atendida' : 'Pendiente'}
                  </ITBadget>
               </div>
               <p className="text-sm text-slate-500">Reportado el {dayjs(viewingIncident.createdAt).format("DD [de] MMMM, YYYY [a las] HH:mm")}</p>
            </div>
            <button 
              onClick={() => setViewingIncident(null)} 
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
                        {viewingIncident.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingIncident.description || "Sin descripción detallada."}
                    </p>
                 </div>

                {/* Multimedia Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-indigo-500 rounded-full block"></span>
                        Evidencia
                    </h4>
                    {viewingIncident.media && viewingIncident.media.length > 0 && 
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                            {viewingIncident.media.length} archivos
                        </span>
                    }
                  </div>
    
                  {viewingIncident.media && viewingIncident.media.length > 0 ? (
                    <MediaCarousel media={viewingIncident.media} title={viewingIncident.title} />
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
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500">
                                <FaUserShield />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Reportado por</p>
                                <p className="text-sm font-bold text-slate-800">{viewingIncident.guard?.name} {viewingIncident.guard?.lastName}</p>
                                <p className="text-xs text-slate-500">@{viewingIncident.guard?.username}</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-50"></div>

                        <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
                                <FaExclamationTriangle />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Categoría</p>
                                <p className="text-sm font-bold text-slate-800">{viewingIncident.category}</p>
                            </div>
                        </div>

                        {viewingIncident.status === 'ATTENDED' && viewingIncident.resolvedBy && (
                            <>
                                <div className="w-full h-px bg-slate-50"></div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">Atendido por</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingIncident.resolvedBy.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {dayjs(viewingIncident.resolvedAt).format("DD/MM/YYYY HH:mm")}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                 </div>

                 {viewingIncident.status === 'PENDING' && (
                     <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <h5 className="text-xs font-bold text-orange-800 mb-2">Acciones Pendientes</h5>
                        <p className="text-xs text-orange-700 mb-3">Esta incidencia requiere atención inmediata.</p>
                        <ITButton 
                            onClick={() => handleResolve(viewingIncident.id)}
                            color="success"
                            className="w-full justify-center"
                        >
                            Marcar como Atendida
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
export default IncidentsPage;
