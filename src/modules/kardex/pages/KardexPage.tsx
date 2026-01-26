import { useEffect, useState } from "react";
import { getKardex, KardexEntry } from "../services/KardexService";
import { ITButton, ITLoader, ITBadget, ITTable } from "axzy_ui_system";
import dayjs from "dayjs";
import { FaMapMarkerAlt, FaUser, FaFileAlt, FaLayerGroup, FaEye, FaSync } from "react-icons/fa";
import { translateScanType } from "@app/core/utils/status.utils";
import { MediaCarousel } from "@app/core/components/MediaCarousel";

const KardexPage = () => {
  const [kardexEntries, setKardexEntries] = useState<KardexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  /* State for viewing details */
  const [viewingEntry, setViewingEntry] = useState<KardexEntry | null>(null);

  const fetchKardex = async () => {
    setLoading(true);
    const res = await getKardex({});
    if (res.success && res.data) {
        setKardexEntries(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKardex();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6 bg-[#f6fbf4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Kardex</h1>
           <p className="text-slate-500 text-sm mt-1">Historial de actividades y reportes en tiempo real</p>
        </div>
        <button 
            onClick={() => fetchKardex()} 
            className="flex items-center gap-2 bg-[#065911] text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-[#086f16] transition-colors"
        >
            <FaSync className="text-xs" />
            <span>Actualizar</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ITTable
            data={kardexEntries as any[]}
            columns={[
            { key: "id", label: "ID", type: "number", sortable: true },
            { 
                key: "timestamp", 
                label: "Fecha/Hora", 
                type: "string", 
                sortable: true, 
                render: (row: any) => dayjs(row.timestamp).format("DD/MM/YYYY HH:mm") 
            },
            { 
                key: "user", 
                label: "Usuario", 
                type: "string", 
                sortable: false, 
                render: (row: any) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{row.user?.name} {row.user?.lastName}</span>
                        <span className="text-xs text-slate-400">{row.user?.username}</span>
                    </div>
                )
            },
            { 
                key: "location", 
                label: "Ubicación", 
                type: "string", 
                sortable: false, 
                render: (row: any) => (
                    <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-indigo-400 text-xs" />
                        <span>{row.location?.name}</span>
                    </div>
                )
            },
            { 
                key: "scanType", 
                label: "Tipo", 
                type: "string", 
                sortable: true,
                render: (row: any) => (
                    <ITBadget 
                        color={row.scanType === 'ASSIGNMENT' ? 'success' : row.scanType === 'RECURRING' ? 'warning' : 'primary'} 
                        size="small"
                        variant="filled"
                    >
                        {translateScanType(row.scanType)}
                    </ITBadget>
                )
            },
            { 
                key: "media", 
                label: "Multimedia", 
                type: "string", 
                sortable: false, 
                render: (row: any) => (
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
                actions: (row: any) => (
                    <ITButton
                        onClick={() => setViewingEntry(row)}
                        size="small"
                        color='secondary'
                        variant="outlined"
                        className="!p-2"
                    >
                    <FaEye />
                    </ITButton>
                )
            }
            ]}
            itemsPerPageOptions={[10, 20, 50]}
            defaultItemsPerPage={20}
            title=""
        />
      </div>

    {viewingEntry && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setViewingEntry(null)}
        />
    
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
          
          <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100 z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h3 className="text-2xl font-bold text-slate-800">Detalle de Actividad</h3>
                 <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">#{viewingEntry.id}</span>
              </div>
              <p className="text-sm text-slate-500">Registrado el {dayjs(viewingEntry.timestamp).format("DD [de] MMMM, YYYY [a las] HH:mm a")}</p>
            </div>
            <button 
              onClick={() => setViewingEntry(null)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-8 space-y-8">
                {/* Multimedia Section - Prominent */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-indigo-500 rounded-full block"></span>
                        Evidencia Multimedia
                    </h4>
                    {viewingEntry.media && viewingEntry.media.length > 0 && 
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                            {viewingEntry.media.length} elementos
                        </span>
                    }
                  </div>
    
                  {viewingEntry.media && viewingEntry.media.length > 0 ? (
                    <MediaCarousel media={viewingEntry.media} title="Evidencia" />
                  ) : (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FaFileAlt className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">Sin evidencia adjunta</p>
                      <p className="text-xs text-slate-400">El usuario no subió fotos ni videos en este reporte.</p>
                    </div>
                  )}
                </section>
<section className="space-y-3">
    {/* Encabezado mejorado */}
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
            <div className="relative">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V7z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-400/20 blur-sm rounded-full"></div>
            </div>
            <h4 className="text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
                Observaciones
            </h4>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-full border border-emerald-200/60">
            {viewingEntry.notes ? `${viewingEntry.notes.split('\n').filter(l => l.trim()).length} notas` : 'Vacío'}
        </span>
    </div>

    {/* Contenedor con efectos modernos */}
    <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400/10 via-teal-400/5 to-sky-400/10 blur rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative bg-white/95 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-slate-200/60 hover:border-emerald-200/60 transition-all duration-300 hover:shadow-emerald-100/30 hover:shadow-xl">
            {viewingEntry.notes ? (
                <div className="space-y-2.5">
                    {viewingEntry.notes.split('\n').map((line, i) => {
                        // Checklist mejorada
                        if (line.trim().startsWith('[ ]') || line.trim().startsWith('[x]')) {
                            const isChecked = line.trim().startsWith('[x]');
                            const text = line.replace(/\[.\]/, '').trim();
                            return (
                                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200 group/item">
                                    <div className={`relative mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                        isChecked 
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-400 border-emerald-500 shadow-emerald-200 shadow-sm' 
                                            : 'bg-white border-slate-300 group-hover/item:border-emerald-300'
                                    }`}>
                                        {isChecked && (
                                            <svg className="w-3 h-3 text-white animate-pulse-once" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm leading-relaxed transition-all duration-200 ${
                                        isChecked 
                                            ? 'text-slate-700 font-medium line-through decoration-emerald-300 decoration-2' 
                                            : 'text-slate-600 group-hover/item:text-slate-800'
                                    }`}>
                                        {text}
                                    </span>
                                </div>
                            );
                        }
                        
                        // Headers con diseño moderno
                        if (line.trim().startsWith('---')) {
                            const headerText = line.replace(/---/g, '').trim();
                            return (
                                <div key={i} className="relative py-3 my-1">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200/60"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            {headerText}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        
                        // Líneas vacías
                        if (!line.trim()) return <div key={i} className=""></div>;
                        
                        // Texto regular con bullet
                        return (
                            <div key={i} className="flex items-start gap-3 p-1 group/text">
                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-60 group-hover/text:opacity-100 transition-opacity"></div>
                                <p className="text-sm text-slate-700 leading-relaxed group-hover/text:text-slate-800 transition-colors">
                                    {line}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 mb-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200/60">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Sin observaciones registradas</span>
                    <span className="text-xs text-slate-300 mt-1">Agrega notas usando el formato checklist [ ] o [x]</span>
                </div>
            )}
        </div>
    </div>
</section>
              </div>
    
              <div className="lg:col-span-4 space-y-6">
                 {/* Metadata Cards */}
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Detalles del Reporte</h5>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500">
                                <FaUser />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Realizado por</p>
                                <p className="text-sm font-bold text-slate-800">{viewingEntry.user?.name}</p>
                                <p className="text-xs text-slate-500">{viewingEntry.user?.username}</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-50"></div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Ubicación</p>
                                <p className="text-sm font-bold text-slate-800">{viewingEntry.location?.name}</p>
                                <p className="text-xs text-slate-500">Pasillo {viewingEntry.location?.aisle}</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-50"></div>

                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                viewingEntry.scanType === 'ASSIGNMENT' ? 'bg-blue-50 text-blue-500' : 
                                viewingEntry.scanType === 'RECURRING' ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-500'
                            }`}>
                                <FaLayerGroup />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Clasificación</p>
                                <p className="text-sm font-bold text-slate-800">{translateScanType(viewingEntry.scanType)}</p>
                                <div className="mt-1">
                                  <ITBadget 
                                      color={viewingEntry.scanType === 'ASSIGNMENT' ? 'success' : viewingEntry.scanType === 'RECURRING' ? 'warning' : 'primary'} 
                                      variant="outlined"
                                      size="small"
                                  >
                                      {viewingEntry.scanType === 'ASSIGNMENT' ? 'Tarea Programada' : 
                                       viewingEntry.scanType === 'RECURRING' ? 'Ronda de Rutina' : 'Registro Manual'}
                                  </ITBadget>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};

export default KardexPage;
