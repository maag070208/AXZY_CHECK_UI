import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { showToast } from "@app/core/store/toast/toast.slice";
import { translateScanType } from "@app/core/utils/status.utils";
import { ITBadget, ITButton, ITDataTable, ITDatePicker } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBook, FaEye, FaFileAlt, FaLayerGroup, FaMapMarkerAlt, FaSync, FaTimesCircle, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import { getUsers } from "../../users/services/UserService";
import { deleteKardexEntry, deleteKardexMedia, getPaginatedKardex, KardexEntry } from "../services/KardexService";

const KardexPage = () => {
    const today = useMemo(() => dayjs().tz("America/Tijuana").toDate(), []);
    const [selectedDate, setSelectedDate] = useState<any>([today, today]);
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [guards, setGuards] = useState<any[]>([]);
    const dispatch = useDispatch();
    
    /* State for viewing details */
    const [viewingEntry, setViewingEntry] = useState<KardexEntry | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch filters data (Users)
    useEffect(() => {
        getUsers().then(res => {
            if (res.success && res.data) {
                const onlyGuards = res.data.filter((u: any) => 
                    u.role === 'GUARD' || u.role === 'SHIFT_GUARD' || u.role === 'MANTENIMIENTO'
                );
                setGuards(onlyGuards);
            }
        });
    }, []);

    const externalFilters = useMemo(() => {
        const filters: any = {};
        if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
            filters.date = [
                   dayjs(selectedDate[0]).tz("America/Tijuana").startOf("day").format(),
                   dayjs(selectedDate[1]).tz("America/Tijuana").endOf("day").format(),
                 ];
        }
        if (searchTerm && searchTerm.trim().length > 0) {
            filters.search = searchTerm.trim();
        }
        return filters;
    }, [selectedDate, searchTerm]);

    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedKardex(params);
    }, []);

    const handleDelete = async (row: any) => {
        if (!window.confirm("¿Deseas eliminar este registro permanentemente?")) return;
        const res = await deleteKardexEntry(row.id);
        if (res.success) {
            dispatch(showToast({ message: "Registro eliminado", type: "success" }));
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleDeleteMedia = async (item: any) => {
        if (!viewingEntry) return;
        const key = item.key || item.url.split('/').pop();
        if (!key) return;

        const res = await deleteKardexMedia(viewingEntry.id, key);
        if (res.success) {
            dispatch(showToast({ message: "Archivo eliminado", type: "success" }));
            setViewingEntry(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    media: prev.media?.filter((m: any) => (m.key || m.url.split('/').pop()) !== key)
                };
            });
            setRefreshKey(prev => prev + 1);
        }
    };

    const columns = useMemo(() => [
        { key: "id", label: "ID", type: "number", sortable: true },
        { 
            key: "timestamp", 
            label: "Fecha/Hora", 
            type: "string", 
            sortable: true, 
            render: (row: any) => dayjs(row.timestamp).format("DD/MM/YYYY HH:mm") 
        },
        { 
            key: "userId", 
            label: "Usuario", 
            type: "string", 
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{row.user?.name} {row.user?.lastName || ''}</span>
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
                <div className="flex items-center gap-2">
                    <ITButton
                        onClick={() => setViewingEntry(row)}
                        size="small"
                        color='secondary'
                        variant="outlined"
                        className="!p-2"
                    >
                        <FaEye />
                    </ITButton>
                </div>
            )
        }
    ], [guards, handleDelete]);

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <FaBook className="text-indigo-500" />
              Kardex
           </h1>
           <p className="text-slate-500 text-sm mt-1">Historial de actividades y reportes en tiempo real</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Filtrar por Guardia</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] min-w-[260px] shadow-sm">
                    <FaUser className="text-slate-300 text-xs mr-2" />
                    <input 
                        type="text"
                        placeholder="Nombre de guardia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
                    />
                    {searchTerm.length > 0 && (
                        <button 
                            onClick={() => setSearchTerm("")}
                            className="text-slate-300 hover:text-red-400 transition-all"
                            title="Limpiar búsqueda"
                        >
                            <FaTimesCircle className="text-xs" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Periodo</label>
                <div className="flex items-center gap-3">
                    <ITDatePicker
                        label=""
                        name="date"
                        value={selectedDate as any}
                        range
                        onChange={(e) => {
                        const val = e.target.value as any;
                        if (Array.isArray(val)) {
                            const parsedDates = val.map((d) => (d ? new Date(d) : null));
                            setSelectedDate(parsedDates);
                            if (parsedDates[0] && parsedDates[1]) {
                                setRefreshKey(prev => prev + 1);
                            }
                        } else if (val) {
                            const date = new Date(val);
                            setSelectedDate([date, date]);
                            setRefreshKey(prev => prev + 1);
                        } else {
                            setSelectedDate(null);
                            setRefreshKey(prev => prev + 1);
                        }
                        }}
                        className="text-sm text-slate-600 outline-none font-medium h-[42px] !border-slate-200"
                    />
                    <ITButton
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        color="secondary"
                        variant="outlined"
                        className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                        size="small"
                        title="Actualizar tabla"
                    >
                        <FaSync className={`text-xs text-slate-500`} />
                        <span className="text-xs font-bold text-slate-600">Refrescar</span>
                    </ITButton>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
            key={refreshKey}
            columns={columns as any}
            fetchData={memoizedFetch as any}
            externalFilters={externalFilters}
            defaultItemsPerPage={10}
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
                      <MediaCarousel 
                        media={viewingEntry.media as any} 
                        title="Evidencia" 
                        onDelete={handleDeleteMedia}
                      />
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
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                              <h4 className="text-sm font-bold text-slate-800">Observaciones</h4>
                          </div>
                          <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
                              {viewingEntry.notes ? `${viewingEntry.notes.split('\n').filter(l => l.trim()).length} notas` : 'Vacío'}
                          </span>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200/60">
                          {viewingEntry.notes ? (
                              <div className="space-y-2.5">
                                  {viewingEntry.notes.split('\n').map((line, i) => {
                                      if (line.trim().startsWith('[ ]') || line.trim().startsWith('[x]')) {
                                          const isChecked = line.trim().startsWith('[x]');
                                          const text = line.replace(/\[.\]/, '').trim();
                                          return (
                                              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-50/50 transition-all">
                                                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                      isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                                                  }`}>
                                                      {isChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                  </div>
                                                  <span className={`text-sm ${isChecked ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{text}</span>
                                              </div>
                                          );
                                      }
                                      if (line.trim().startsWith('---')) return <hr key={i} className="my-4 border-slate-100" />;
                                      if (!line.trim()) return <div key={i} className="h-2"></div>;
                                      return (
                                          <p key={i} className="text-sm text-slate-700 leading-relaxed pl-2 border-l-2 border-emerald-500/20">{line}</p>
                                      );
                                  })}
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                                  <FaFileAlt className="text-2xl mb-2 opacity-20" />
                                  <span className="text-sm font-medium">Sin observaciones registradas</span>
                              </div>
                          )}
                      </div>
                  </section>
                </div>
      
                <div className="lg:col-span-4 space-y-6">
                   {viewingEntry.latitude && viewingEntry.longitude ? (
                       <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                           <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                               <FaMapMarkerAlt className="text-indigo-400" />
                               Ubicación de Escaneo
                           </h5>
                           <GoogleMapComponent 
                               lat={Number(viewingEntry.latitude)} 
                               lng={Number(viewingEntry.longitude)} 
                               height="200px"
                           />
                           <div className="mt-3">
                               <p className="text-[10px] text-slate-400 font-medium italic">
                                   GPS: {viewingEntry.latitude.toFixed(6)}, {viewingEntry.longitude.toFixed(6)}
                               </p>
                           </div>
                       </div>
                   ) : null}

                   <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                      <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Detalles del Reporte</h5>
                      <div className="space-y-4">
                          <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500"><FaUser /></div>
                              <div>
                                  <p className="text-xs text-slate-400 font-medium">Realizado por</p>
                                  <p className="text-sm font-bold text-slate-800">{viewingEntry.user?.name} {viewingEntry.user?.lastName || ''}</p>
                                  <p className="text-xs text-slate-500">{viewingEntry.user?.username}</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500"><FaMapMarkerAlt /></div>
                              <div>
                                  <p className="text-xs text-slate-400 font-medium">Ubicación</p>
                                  <p className="text-sm font-bold text-slate-800">{viewingEntry.location?.name}</p>
                                  <p className="text-xs text-slate-500">Pasillo {viewingEntry.location?.aisle}</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  viewingEntry.scanType === 'ASSIGNMENT' ? 'bg-blue-50 text-blue-500' : 
                                  viewingEntry.scanType === 'RECURRING' ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-500'
                              }`}><FaLayerGroup /></div>
                              <div>
                                  <p className="text-xs text-slate-400 font-medium">Clasificación</p>
                                  <p className="text-sm font-bold text-slate-800">{translateScanType(viewingEntry.scanType)}</p>
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
