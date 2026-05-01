import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaBuilding, FaCalendarAlt, FaCheckCircle, FaCheckDouble, FaClipboardList, FaClock, FaExclamationTriangle, FaEye, FaFileAlt, FaImage, FaLocationArrow, FaMapMarkedAlt, FaMapMarkerAlt, FaPlay, FaQrcode, FaRoute, FaStopwatch, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getRoundDetail, IRoundDetail } from "../services/RoundsService";
import { deleteKardexEntry, deleteKardexMedia } from "../../kardex/services/KardexService";
import { deleteIncident, deleteIncidentMedia } from "../../incidents/services/IncidentService";
import { AppState } from "@app/core/store/store";

const RoundDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const role = useSelector((state: AppState) => state.auth.role);
    const isAdmin = role === 'ADMIN';

    const [data, setData] = useState<IRoundDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const handleDeleteMedia = async (eventId: number, type: 'SCAN' | 'INCIDENT', item: any) => {
        const key = item.key || item.url.split('/').pop();
        if (!key) return;

        let res;
        if (type === 'SCAN') {
            res = await deleteKardexMedia(eventId, key);
        } else {
            res = await deleteIncidentMedia(eventId, key);
        }

        if (res.success) {
            dispatch(showToast({ message: "Archivo eliminado correctamente", type: "success" }));
            // Actualización local para evitar recarga completa
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    timeline: prev.timeline.map(e => {
                        const currentId = e.data?.id;
                        if (currentId === eventId && e.type === type) {
                            return {
                                ...e,
                                data: {
                                    ...e.data,
                                    media: e.data.media.filter((m: any) => (m.key || m.url.split('/').pop()) !== key)
                                }
                            };
                        }
                        return e;
                    })
                };
            });
        }
    };

    const handleDeleteEvent = async (eventId: number, type: 'SCAN' | 'INCIDENT') => {
        if (!window.confirm("¿Deseas eliminar este registro permanentemente?")) return;

        let res;
        if (type === 'SCAN') {
            res = await deleteKardexEntry(eventId);
        } else {
            res = await deleteIncident(eventId);
        }

        if (res.success) {
            dispatch(showToast({ message: "Registro eliminado", type: "success" }));
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    timeline: prev.timeline.filter(e => !(e.data?.id === eventId && e.type === type))
                };
            });
        }
    };

    const [routeTitle, setRouteTitle] = useState("");

    const metrics = useMemo(() => {
        if (!data) return null;
        
        const start = new Date(data.round.startTime);
        const end = data.round.endTime ? new Date(data.round.endTime) : (data.round.status === 'COMPLETED' ? new Date() : null);
        const effectiveEnd = end || new Date();

        const durationMs = effectiveEnd.getTime() - start.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationSeconds = Math.floor((durationMs % 60000) / 1000);
        
        // Filter scans
        const scans = data.timeline.filter(e => e.type === 'SCAN').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const visitedLocations = new Set<string>();
        let validScansCount = 0;

        // Treasure Map Nodes
        const mapNodes: any[] = [];
        let previousTime = start;

        // Start Node
        mapNodes.push({
            type: 'START',
            label: 'Inicio',
            status: 'START',
            timeDiff: null
        });

        scans.forEach(scan => {
            const current = new Date(scan.timestamp);
            const diff = current.getTime() - previousTime.getTime();
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);

            const locId = String(scan.data?.location?.id);
            const isDuplicate = visitedLocations.has(locId);
            visitedLocations.add(locId);

            // Check evidence (naive check on media array)
            const hasEvidence = scan.data?.media && Array.isArray(scan.data.media) && scan.data.media.length > 0;
            
            let status = 'SUCCESS';
            if (isDuplicate) status = 'DUPLICATE';
            else if (!hasEvidence) status = 'INCOMPLETE';
            else validScansCount++; // Only count if unique and complete? Or just valid? User said "no contar 2 veces".

            mapNodes.push({
                type: 'POINT',
                label: scan.data?.location?.name || "Punto",
                status,
                timeDiff: `${mins}m ${secs}s`,
                diffMs: diff
            });

            previousTime = current;
        });

        // Computed expected points
        const expectedLocs = data.round.recurringConfiguration?.recurringLocations || [];
        const missingLocs = expectedLocs.filter((l: any) => !visitedLocations.has(String(l.location.id)));
        
        missingLocs.forEach((loc: any) => {
            mapNodes.push({
                type: 'POINT',
                label: loc.location.name,
                status: data.round.status === 'COMPLETED' ? 'MISSING' : 'PENDING',
                timeDiff: '--',
                diffMs: 0
            });
        });

        // End Node
        if (data.round.endTime) {
            const current = new Date(data.round.endTime);
            const diff = current.getTime() - previousTime.getTime();
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
             mapNodes.push({
                type: 'END',
                label: 'Fin',
                status: 'END',
                timeDiff: `${mins}m ${secs}s`
            });
        }
        
        const avgTime = scans.length > 0 ? (durationMs / (scans.length + (data.round.endTime ? 1 : 0))) : 0;
        const avgMins = Math.floor(avgTime / 60000);
        const avgSecs = Math.floor((avgTime % 60000) / 1000);
        
        return {
            duration: `${durationMinutes}m ${durationSeconds}s`,
            totalScans: validScansCount,
            totalRawScans: scans.length,
            expectedScans: expectedLocs.length,
            mapNodes,
            avgTime: `${avgMins}m ${avgSecs}s`
        };
    }, [data]);

    useEffect(() => {
        if (id) {
            getData(Number(id));
        }
    }, [id]);

    const getData = async (roundId: number) => {
        setLoading(true);
        const res = await getRoundDetail(roundId);
        if (res.success && res.data) {
            setData(res.data);
            
            // Handle missing recurringConfiguration relation
            if (res.data.round.recurringConfiguration) {
                setRouteTitle(res.data.round.recurringConfiguration.title);
            } else if (res.data.round.recurringConfigurationId) {
                // Fetch routes to find title
                getRoutesList().then(routesRes => {
                    if (routesRes.success && routesRes.data) {
                        const match = routesRes.data.find((r: any) => r.id === res.data.round.recurringConfigurationId);
                        if (match) setRouteTitle(match.title);
                    }
                });
            }
        }
        setLoading(false);
    };

    const handleOpenRouteMap = () => {
        if (!data) return;
        
        const scansWithCoords = data.timeline
            .filter(e => e.type === 'SCAN' && e.data?.latitude && e.data?.longitude)
            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (scansWithCoords.length === 0) {
            dispatch(showToast({ message: "No hay puntos con coordenadas GPS para trazar una ruta.", type: "warning" }));
            return;
        }

        if (scansWithCoords.length === 1) {
             // Just open the single point
             const url = `https://www.google.com/maps/search/?api=1&query=${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
             window.open(url, '_blank');
             return;
        }

        const origin = `${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
        const destination = `${scansWithCoords[scansWithCoords.length - 1].data.latitude},${scansWithCoords[scansWithCoords.length - 1].data.longitude}`;
        
        const waypoints = scansWithCoords.slice(1, -1).map(s => `${s.data.latitude},${s.data.longitude}`).join('|');
        
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
        
        window.open(url, '_blank');
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <div className="text-center">
                <ITLoader />
                <p className="mt-4 text-slate-500 font-medium">Cargando detalles de la ronda...</p>
            </div>
        </div>
    );
    
    if (!data) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaExclamationTriangle className="text-red-500 text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontró la ronda</h3>
                <p className="text-slate-500 mb-6">La ronda que buscas no existe o ha sido eliminada.</p>
                <button 
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Volver
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all duration-200 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                                <FaArrowLeft className="text-sm" />
                            </div>
                            <span className="font-medium hidden sm:inline">Volver</span>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <ITBadget 
                                color={data.round.status === "COMPLETED" ? "success" : "warning"}
                                variant="filled"
                                size="medium"
                            >
                                {data.round.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
                            </ITBadget>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Title Section */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                        {routeTitle || data.round.recurringConfiguration?.title || `Ronda #${data.round.id}`}
                    </h1>
                    
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <FaUserShield className="text-blue-600 text-sm" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Guardia</p>
                                <p className="font-semibold text-slate-700">{data.round.guard.name} {data.round.guard.lastName}</p>
                            </div>
                        </div>
                        
                        {data.round.recurringConfiguration?.startTime && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                    <FaClock className="text-purple-600 text-sm" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Horario programado</p>
                                    <p className="font-semibold text-slate-700">
                                        {data.round.recurringConfiguration.startTime} - {data.round.recurringConfiguration.endTime}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-600">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <FaCalendarAlt className="text-emerald-600 text-sm" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Fecha de inicio</p>
                                <p className="font-semibold text-slate-700">
                                    {new Date(data.round.startTime).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Dashboard */}
                {metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <FaClock className="text-white text-xl" />
                                </div>
                                <FaEye className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Duración Total</p>
                            <p className="text-2xl font-bold text-slate-800">{metrics.duration}</p>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                                    <FaQrcode className="text-white text-xl" />
                                </div>
                                <FaEye className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                Puntos {metrics.expectedScans > 0 ? 'Cubiertos' : 'Válidos'}
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                                {metrics.totalScans} 
                                <span className="text-sm text-slate-400 font-normal ml-1">/ {metrics.expectedScans > 0 ? metrics.expectedScans : metrics.totalRawScans}</span>
                            </p>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                                    <FaStopwatch className="text-white text-xl" />
                                </div>
                                <FaEye className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Promedio por tramo</p>
                            <p className="text-2xl font-bold text-slate-800">{metrics.avgTime}</p>
                        </div>
                    </div>
                )}

                {/* Treasure Map Visualization */}
                {metrics && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <FaRoute className="text-white text-lg" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">Ruta Recorrida</h3>
                            </div>
                            
                            <button 
                                onClick={handleOpenRouteMap}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-200 font-medium text-sm"
                            >
                                <FaMapMarkedAlt className="text-blue-600" />
                                <span>Ver trazo en mapa</span>
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto pb-4">
                            <div className="flex items-start min-w-max">
                                {metrics.mapNodes.map((node: any, idx: number) => (
                                    <div key={idx} className="flex items-center">
                                        {/* Connector Line */}
                                        {idx > 0 && (
                                            <div className="flex flex-col items-center mx-2">
                                                {node.timeDiff && node.timeDiff !== '--' && (
                                                    <span className="text-xs font-mono text-slate-500 mb-2 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                                        {node.timeDiff}
                                                    </span>
                                                )}
                                                <div className="w-12 h-0.5 bg-gradient-to-r from-slate-300 to-slate-400"></div>
                                            </div>
                                        )}

                                        {/* Node */}
                                        <div className="flex flex-col items-center w-28 group">
                                            <div className={`
                                                relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110
                                                ${node.status === 'START' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-300' : ''}
                                                ${node.status === 'END' ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-300' : ''}
                                                ${node.status === 'SUCCESS' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-300' : ''}
                                                ${node.status === 'DUPLICATE' ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-300' : ''}
                                                ${node.status === 'INCOMPLETE' ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-300' : ''}
                                                ${node.status === 'MISSING' ? 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300' : ''}
                                                ${node.status === 'PENDING' ? 'bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300' : ''}
                                            `}>
                                                {node.status === 'START' && <FaPlay className="text-white text-lg ml-0.5" />}
                                                {node.status === 'END' && <FaCheckCircle className="text-white text-lg" />}
                                                {node.status === 'SUCCESS' && <FaCheckCircle className="text-white text-lg" />}
                                                {node.status === 'DUPLICATE' && <span className="text-white text-2xl font-bold">!</span>}
                                                {node.status === 'INCOMPLETE' && <FaExclamationTriangle className="text-white text-lg" />}
                                                {node.status === 'MISSING' && <span className="text-red-600 text-xl font-bold">?</span>}
                                                {node.status === 'PENDING' && <FaClock className="text-slate-500 text-lg" />}
                                            </div>
                                            
                                            <p className={`text-center text-sm font-semibold mt-3 leading-tight ${
                                                node.status === 'DUPLICATE' ? 'text-red-600' : 
                                                node.status === 'MISSING' ? 'text-red-500' :
                                                node.status === 'PENDING' ? 'text-slate-400' :
                                                'text-slate-700'
                                            }`}>
                                                {node.label}
                                            </p>
                                            
                                            {node.status === 'MISSING' && (
                                                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1">FALTANTE</span>
                                            )}
                                            {node.status === 'PENDING' && (
                                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1">PENDIENTE</span>
                                            )}
                                            {node.status === 'DUPLICATE' && (
                                                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1">REPETIDO</span>
                                            )}
                                            {node.status === 'INCOMPLETE' && (
                                                <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mt-1">INCOMPLETO</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap gap-6 justify-end">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                                <span>Completado</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600"></div>
                                <span>Repetido/Error</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"></div>
                                <span>Sin evidencia</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timeline Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <FaCheckDouble className="text-white text-lg" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Línea de tiempo</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Eventos registrados durante la ronda</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                            {data.timeline.map((event, index) => (
                                <div key={index} className="relative pl-8">
                                    <EventIcon type={event.type} />
                                    <div className="bg-gradient-to-r from-slate-50 to-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    {event.type}
                                                </span>
                                            </div>
                                            
                                            {isAdmin && (event.type === 'INCIDENT' || (event.type === 'SCAN' && (event.data?.scanType === 'FREE' || event.data?.user?.role === 'MANTENIMIENTO'))) && (
                                                <button 
                                                    onClick={() => handleDeleteEvent(event.data.id, event.type as any)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar registro"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-md font-bold text-slate-700 mb-3">
                                            {event.description}
                                        </h3>
                                        
                                        {event.type === 'SCAN' && (
                                            <div className="mt-3 space-y-4">
                                                {/* Location Header */}
                                                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                        <FaBuilding className="text-purple-600 text-lg" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Ubicación</p>
                                                        <p className="font-bold text-slate-800 text-lg">{event.data?.location?.name}</p>
                                                        {event.data?.location?.address && (
                                                            <p className="text-xs text-slate-500 mt-0.5">{event.data.location.address}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Row with Photos and Location */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {/* Photos Section */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <FaImage className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-700">Evidencia fotográfica</h4>
                                                                <p className="text-xs text-slate-400">
                                                                    {event.data?.media?.length || 0} {event.data?.media?.length === 1 ? 'foto' : 'fotos'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {event.data?.media && event.data.media.length > 0 ? (
                                                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                                                                <MediaCarousel 
                                                                    media={event.data.media} 
                                                                    title="Evidencia" 
                                                                    showDelete={isAdmin}
                                                                    onDelete={(item) => handleDeleteMedia(event.data.id, event.type as any, item)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
                                                                <FaImage className="text-slate-300 text-3xl mx-auto mb-2" />
                                                                <p className="text-sm text-slate-400">No hay evidencia fotográfica</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Location Section */}
                                                    {event.data?.latitude && event.data?.longitude ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                                                    <FaLocationArrow className="text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-slate-700">Ubicación GPS</h4>
                                                                    <p className="text-xs text-slate-400">Coordenadas exactas del punto de control</p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="rounded-xl overflow-hidden border border-slate-200">
                                                                <GoogleMapComponent 
                                                                    lat={Number(event.data.latitude)} 
                                                                    lng={Number(event.data.longitude)} 
                                                                    height="250px"
                                                                    zoom={18}
                                                                />
                                                            </div>
                                                            
                                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    <div>
                                                                        <p className="text-xs text-slate-400">Latitud</p>
                                                                        <p className="font-mono text-slate-700 font-medium">{event.data.latitude}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-slate-400">Longitud</p>
                                                                        <p className="font-mono text-slate-700 font-medium">{event.data.longitude}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t border-slate-200">
                                                                    <a 
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${event.data.latitude},${event.data.longitude}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                    >
                                                                        <FaMapMarkerAlt className="text-xs" />
                                                                        Abrir en Google Maps
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                                    <FaLocationArrow className="text-red-600" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-slate-700">Ubicación GPS</h4>
                                                                    <p className="text-xs text-slate-400">Coordenadas no disponibles</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-200">
                                                                <FaExclamationTriangle className="text-red-400 text-3xl mx-auto mb-2" />
                                                                <p className="text-sm text-red-600">No se registraron coordenadas GPS para este punto</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Notes Section */}
                                                {event.data?.notes && (
                                                    <div className="mt-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                                                                <FaFileAlt className="text-yellow-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-700">Notas adicionales</h4>
                                                                <p className="text-xs text-slate-400">Comentarios y observaciones</p>
                                                            </div>
                                                        </div>
                                                        <NotesViewer notes={event.data.notes} />
                                                    </div>
                                                )}
                                                
                                                {/* Tasks Section */}
                                                {event.data?.assignment?.tasks && (
                                                    <div className="mt-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                                <FaClipboardList className="text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-700">Tareas realizadas</h4>
                                                                <p className="text-xs text-slate-400">Lista de tareas completadas en este punto</p>
                                                            </div>
                                                        </div>
                                                        <TaskList tasks={event.data.assignment.tasks} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {event.type === 'INCIDENT' && (
                                            <div className="mt-3 space-y-4">
                                                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                        <FaExclamationTriangle className="text-orange-600 text-lg" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Categoría del incidente</p>
                                                        <p className="font-bold text-slate-800 text-lg">{event.data?.category}</p>
                                                    </div>
                                                </div>
                                                
                                                {event.data?.description && (
                                                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                                                        <p className="text-sm text-red-800 font-medium mb-1">Descripción:</p>
                                                        <p className="text-sm text-red-700">{event.data.description}</p>
                                                    </div>
                                                )}
                                                
                                                {/* Row for Incident Photos and Location */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {/* Photos Section */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <FaImage className="text-blue-600" />
                                                            </div>
                                                            <h4 className="font-semibold text-slate-700">Evidencia fotográfica</h4>
                                                        </div>
                                                        
                                                        {event.data?.media && event.data.media.length > 0 ? (
                                                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                                                                <MediaCarousel 
                                                                    media={event.data.media} 
                                                                    title="Evidencia" 
                                                                    showDelete={isAdmin}
                                                                    onDelete={(item) => handleDeleteMedia(event.data.id, event.type as any, item)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
                                                                <FaImage className="text-slate-300 text-3xl mx-auto mb-2" />
                                                                <p className="text-sm text-slate-400">No hay evidencia fotográfica</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Location Section for Incident */}
                                                    {event.data?.latitude && event.data?.longitude ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                                                    <FaLocationArrow className="text-green-600" />
                                                                </div>
                                                                <h4 className="font-semibold text-slate-700">Ubicación del incidente</h4>
                                                            </div>
                                                            
                                                            <div className="rounded-xl overflow-hidden border border-slate-200">
                                                                <GoogleMapComponent 
                                                                    lat={Number(event.data.latitude)} 
                                                                    lng={Number(event.data.longitude)} 
                                                                    height="250px"
                                                                    zoom={18}
                                                                />
                                                            </div>
                                                            
                                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    <div>
                                                                        <p className="text-xs text-slate-400">Latitud</p>
                                                                        <p className="font-mono text-slate-700 font-medium">{event.data.latitude}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-slate-400">Longitud</p>
                                                                        <p className="font-mono text-slate-700 font-medium">{event.data.longitude}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t border-slate-200">
                                                                    <a 
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${event.data.latitude},${event.data.longitude}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                    >
                                                                        <FaMapMarkerAlt className="text-xs" />
                                                                        Abrir en Google Maps
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                                    <FaLocationArrow className="text-red-600" />
                                                                </div>
                                                                <h4 className="font-semibold text-slate-700">Ubicación GPS</h4>
                                                            </div>
                                                            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-200">
                                                                <FaExclamationTriangle className="text-red-400 text-3xl mx-auto mb-2" />
                                                                <p className="text-sm text-red-600">No se registraron coordenadas GPS para este incidente</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {data.timeline.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaClock className="text-slate-400 text-3xl" />
                                </div>
                                <p className="text-slate-500 font-medium">No hay eventos registrados</p>
                                <p className="text-sm text-slate-400 mt-1">Esta ronda aún no tiene actividad</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventIcon = ({ type }: { type: string }) => {
    let icon = <div className="w-2 h-2 rounded-full bg-slate-300" />;
    let bg = "bg-slate-100";
    let border = "border-slate-300";

    if (type === 'START') {
        icon = <FaPlay className="text-blue-600 text-xs" />;
        bg = "bg-blue-100";
        border = "border-blue-500";
    }
    if (type === 'SCAN') {
        icon = <FaQrcode className="text-purple-600 text-xs" />;
        bg = "bg-purple-100";
        border = "border-purple-500";
    }
    if (type === 'INCIDENT') {
        icon = <FaExclamationTriangle className="text-orange-600 text-xs" />;
        bg = "bg-orange-100";
        border = "border-orange-500";
    }
    if (type === 'END') {
        icon = <FaCheckCircle className="text-green-600 text-xs" />;
        bg = "bg-green-100";
        border = "border-green-500";
    }

    return (
        <div className={`absolute -left-[13px] top-0 w-7 h-7 rounded-full ${bg} border-2 ${border} flex items-center justify-center z-10 shadow-sm`}>
            {icon}
        </div>
    );
};

// Subcomponent for Media Gallery (using Carousel)
// const MediaGallery = ({ media }: { media: any[] }) => {
//     if (!media || !Array.isArray(media) || media.length === 0) return null;
//     return (
//         <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200">
//             <MediaCarousel media={media} title="Evidencia" />
//         </div>
//     );
// };

// Subcomponent for Notes with Parsing
const NotesViewer = ({ notes }: { notes: string }) => {
    if (!notes) return null;

    // Simple parser for checkbox pattern
    const lines = notes.split('\n');
    
    return (
        <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
            {lines.map((line, i) => {
                const trimmed = line.trim();

                // Headers
                if (trimmed.startsWith('---')) {
                     const headerText = trimmed.replace(/---/g, '').trim();
                     return (
                         <div key={i} className="relative py-2 my-2">
                             <div className="absolute inset-0 flex items-center">
                                 <div className="w-full border-t border-slate-300"></div>
                             </div>
                             <div className="relative flex justify-center">
                                 <span className="px-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                     {headerText}
                                 </span>
                             </div>
                         </div>
                     );
                }

                // Checkboxes
                if (trimmed.startsWith('[ ]') || trimmed.startsWith('[x]')) {
                    const isChecked = trimmed.startsWith('[x]');
                    const text = trimmed.replace(/\[.\]/, '').trim();
                    return (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isChecked 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'bg-white border-slate-300'
                            }`}>
                                {isChecked && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-sm leading-relaxed ${
                                isChecked 
                                    ? 'text-slate-500 line-through decoration-emerald-400' 
                                    : 'text-slate-700'
                            }`}>
                                {text}
                            </span>
                        </div>
                    );
                }

                // Regular text (if not empty)
                if (!trimmed) return null;

                return (
                     <div key={i} className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 text-slate-700 rounded-lg text-sm border border-yellow-200 italic">
                        "{trimmed}"
                    </div>
                );
            })}
        </div>
    );
};

// Subcomponent for Tasks (DB Relation)
const TaskList = ({ tasks }: { tasks: any[] }) => {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return null;
    return (
        <div className="space-y-2">
            {tasks.map((task, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 transition-all duration-200">
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                        task.completed 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500' 
                            : 'bg-white border-slate-300'
                    }`}>
                        {task.completed && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className={`text-sm leading-relaxed ${
                        task.completed 
                            ? 'text-slate-600 line-through decoration-emerald-400' 
                            : 'text-slate-700'
                    }`}>
                        {task.description}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default RoundDetailPage;