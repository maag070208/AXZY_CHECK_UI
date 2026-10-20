import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { showToast } from "@app/core/store/toast/toast.slice";
import { translateScanType } from "@app/core/utils/status.utils";
import { ITBadget, ITButton, ITDataTable, ITDatePicker, ITDialog, ITFlex, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
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
        { key: "id", label: "ID", type: "number", sortable: false },
        { 
            key: "timestamp", 
            label: "Fecha/Hora", 
            type: "string", 
            sortable: false, 
            render: (row: any) => dayjs(row.timestamp).format("DD/MM/YYYY HH:mm") 
        },
        { 
            key: "userId", 
            label: "Usuario", 
            type: "string", 
            render: (row: any) => (
                <ITFlex direction="column" className="flex flex-col">
                    <ITText as="span" className="font-medium text-slate-700">{row.user?.name} {row.user?.lastName || ''}</ITText>
                    <ITText as="span" className="text-xs text-slate-400">{row.user?.username}</ITText>
                </ITFlex>
            )
        },
        { 
            key: "location", 
            label: "Ubicación", 
            type: "string", 
            sortable: false, 
            render: (row: any) => (
                <ITFlex align="center" className="flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-indigo-400 text-xs" />
                    <ITText as="span">{row.location?.name}</ITText>
                </ITFlex>
            )
        },
        { 
            key: "scanType", 
            label: "Tipo", 
            type: "string", 
            sortable: false,
            render: (row: any) => (
                <ITBadget 
                    color={row.scanType === 'ASSIGNMENT' ? 'success' : row.scanType === 'RECURRING' ? 'warning' : 'primary'} 
                    size="sm"
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
                <ITFlex align="center" gap={1} className="flex items-center gap-1 text-slate-500">
                    {row.media && row.media.length > 0 ? (
                        <>
                            <FaFileAlt className="text-blue-400" />
                            <ITText as="span" className="text-xs font-medium">{row.media.length}</ITText>
                        </>
                    ) : (
                        <ITText as="span" className="text-xs text-slate-300">-</ITText>
                    )}
                </ITFlex>
            )
        },
        {
            key: "actions",
            label: "Acciones",
            type: "actions",
            actions: (row: any) => (
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                    <ITButton
                        onClick={() => setViewingEntry(row)}
                        size="sm"
                        color='secondary'
                        variant="outlined"
                       
                    >
                        <FaEye />
                    </ITButton>
                </ITFlex>
            )
        }
    ], [guards, handleDelete]);

  return (
    <ITPage
      className="m-0! px-4! max-w-screen!"
      noPadding
      title="Kardex"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Operación" }, { label: "Kardex" }]}
      description="Historial de actividades y reportes en tiempo real"
      icon={<FaBook size={20} />}
      iconColor="#065911"
      actions={
<ITFlex align="center" gap={3} className="flex items-center gap-3">
            <ITFlex direction="column" className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Filtrar por Guardia</label>
                <ITFlex align="center" className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] min-w-[260px] shadow-sm">
                    <FaUser className="text-slate-300 text-xs mr-2" />
                    <ITInput
                        name="searchKardex"
                        placeholder="Nombre de guardia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full"
                        className="!bg-transparent !border-0 !shadow-none !p-0 text-sm font-bold text-slate-600"
                    />
                    {searchTerm.length > 0 && (
                        <ITButton
                            variant="icon-only"
                            color="gray"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            icon={<FaTimesCircle className="text-xs" />}
                            title="Limpiar búsqueda"
                           
                        />
                    )}
                </ITFlex>
            </ITFlex>

            <ITFlex direction="column" className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Periodo</label>
                <ITFlex align="center" gap={3} className="flex items-center gap-3">
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
                       
                        size="md"
                        title="Actualizar tabla"
                    >
                        <ITFlex align="center" gap={2}><FaSync className={`text-xs text-slate-500`} />
                        <ITText as="span" className="text-xs font-bold text-slate-600">Refrescar</ITText></ITFlex>
                    </ITButton>
                </ITFlex>
            </ITFlex>
        </ITFlex>
      }
    >
      

      <ITFlex direction="column" className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
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

      {viewingEntry && (
      <ITDialog isOpen onClose={() => setViewingEntry(null)} title="Detalle de Actividad" className="max-w-4xl max-h-[90vh] flex flex-col">
        <ITText as="p" className="text-sm text-slate-500 mb-4">Registrado el {dayjs(viewingEntry.timestamp).format("DD [de] MMMM, YYYY [a las] HH:mm a")}</ITText>
              
              <ITFlex direction="column" className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
                <ITFlex direction="column" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  <ITFlex direction="column" className="lg:col-span-8 space-y-8">
                    {/* Multimedia Section - Prominent */}
                    <section>
                      <ITFlex align="center" justify="between" className="flex items-center justify-between mb-4">
                        <ITText as="h4" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ITText as="span" className="w-1 h-4 bg-indigo-500 rounded-full block"></ITText>
                            Evidencia Multimedia
                        </ITText>
                        {viewingEntry.media && viewingEntry.media.length > 0 && 
                            <ITText as="span" className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                                {viewingEntry.media.length} elementos
                            </ITText>
                        }
                      </ITFlex>
        
                      {viewingEntry.media && viewingEntry.media.length > 0 ? (
                        <MediaCarousel 
                          media={viewingEntry.media as any} 
                          title="Evidencia" 
                          onDelete={handleDeleteMedia}
                        />
                      ) : (
                        <ITFlex direction="column" align="center" justify="center" className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                          <ITFlex align="center" justify="center" className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <FaFileAlt className="text-slate-300" />
                          </ITFlex>
                          <ITText as="p" className="text-sm font-medium text-slate-500">Sin evidencia adjunta</ITText>
                          <ITText as="p" className="text-xs text-slate-400">El usuario no subió fotos ni videos en este reporte.</ITText>
                        </ITFlex>
                      )}
                    </section>
                    
                    <section className="space-y-3">
                        <ITFlex align="center" justify="between" className="flex items-center justify-between">
                            <ITFlex align="center" className="flex items-center gap-2.5">
                                <ITText as="h4" className="text-sm font-bold text-slate-800">Observaciones</ITText>
                            </ITFlex>
                            <ITText as="span" className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
                                {viewingEntry.notes ? `${viewingEntry.notes.split('\n').filter(l => l.trim()).length} notas` : 'Vacío'}
                            </ITText>
                        </ITFlex>
                        <ITFlex direction="column" className="bg-white p-5 rounded-xl border border-slate-200/60">
                            {viewingEntry.notes ? (
                                <ITFlex direction="column" className="space-y-2.5">
                                    {viewingEntry.notes.split('\n').map((line, i) => {
                                        if (line.trim().startsWith('[ ]') || line.trim().startsWith('[x]')) {
                                            const isChecked = line.trim().startsWith('[x]');
                                            const text = line.replace(/\[.\]/, '').trim();
                                            return (
                                                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-50/50 transition-all">
                                                    <ITFlex direction="column" className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                        isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                                                    }`}>
                                                        {isChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                    </ITFlex>
                                                    <ITText as="span" className={`text-sm ${isChecked ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{text}</ITText>
                                                </div>
                                            );
                                        }
                                        if (line.trim().startsWith('---')) return <hr key={i} className="my-4 border-slate-100" />;
                                        if (!line.trim()) return <div key={i} className="h-2"></div>;
                                        return (
                                            <p key={i} className="text-sm text-slate-700 leading-relaxed pl-2 border-l-2 border-emerald-500/20">{line}</p>
                                        );
                                    })}
                                </ITFlex>
                            ) : (
                                <ITFlex direction="column" align="center" justify="center" className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                                    <FaFileAlt className="text-2xl mb-2 opacity-20" />
                                    <ITText as="span" className="text-sm font-medium">Sin observaciones registradas</ITText>
                                </ITFlex>
                            )}
                        </ITFlex>
                    </section>
                  </ITFlex>
        
                  <ITFlex direction="column" className="lg:col-span-4 space-y-6">
                     {viewingEntry.latitude && viewingEntry.longitude ? (
                         <ITFlex direction="column" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                             <ITText as="h5" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                                 <FaMapMarkerAlt className="text-indigo-400" />
                                 Ubicación de Escaneo
                             </ITText>
                             <GoogleMapComponent 
                                 lat={Number(viewingEntry.latitude)} 
                                 lng={Number(viewingEntry.longitude)} 
                                 height="200px"
                             />
                             <ITFlex direction="column" className="mt-3">
                                 <ITText as="p" className="text-[10px] text-slate-400 font-medium italic">
                                     GPS: {viewingEntry.latitude.toFixed(6)}, {viewingEntry.longitude.toFixed(6)}
                                 </ITText>
                             </ITFlex>
                         </ITFlex>
                     ) : null}
  
                     <ITFlex direction="column" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <ITText as="h5" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Detalles del Reporte</ITText>
                        <ITFlex direction="column" className="space-y-4">
                            <ITFlex align="start" gap={4} className="flex items-start gap-4">
                                <ITFlex align="center" justify="center" className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500"><FaUser /></ITFlex>
                                <ITFlex direction="column">
                                    <ITText as="p" className="text-xs text-slate-400 font-medium">Realizado por</ITText>
                                    <ITText as="p" className="text-sm font-bold text-slate-800">{viewingEntry.user?.name} {viewingEntry.user?.lastName || ''}</ITText>
                                    <ITText as="p" className="text-xs text-slate-500">{viewingEntry.user?.username}</ITText>
                                </ITFlex>
                            </ITFlex>
                            <ITFlex align="start" gap={4} className="flex items-start gap-4">
                                <ITFlex align="center" justify="center" className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500"><FaMapMarkerAlt /></ITFlex>
                                <ITFlex direction="column">
                                    <ITText as="p" className="text-xs text-slate-400 font-medium">Ubicación</ITText>
                                    <ITText as="p" className="text-sm font-bold text-slate-800">{viewingEntry.location?.name}</ITText>
                                    <ITText as="p" className="text-xs text-slate-500">Pasillo {viewingEntry.location?.aisle}</ITText>
                                </ITFlex>
                            </ITFlex>
                            <ITFlex align="start" gap={4} className="flex items-start gap-4">
                                <ITFlex direction="column" className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    viewingEntry.scanType === 'ASSIGNMENT' ? 'bg-blue-50 text-blue-500' : 
                                    viewingEntry.scanType === 'RECURRING' ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-500'
                                }`}><FaLayerGroup /></ITFlex>
                                <ITFlex direction="column">
                                    <ITText as="p" className="text-xs text-slate-400 font-medium">Clasificación</ITText>
                                    <ITText as="p" className="text-sm font-bold text-slate-800">{translateScanType(viewingEntry.scanType)}</ITText>
                                </ITFlex>
                            </ITFlex>
                        </ITFlex>
                     </ITFlex>
                  </ITFlex>
                </ITFlex>
              </ITFlex>
      </ITDialog>
      )}
    </ITPage>
  );
};

export default KardexPage;
