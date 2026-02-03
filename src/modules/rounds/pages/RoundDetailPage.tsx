import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoundDetail, IRoundDetail } from "../services/RoundsService";
import { ITLoader, ITBadget } from "axzy_ui_system";
import { FaArrowLeft, FaPlay, FaCheckCircle, FaQrcode, FaExclamationTriangle, FaMapMarkerAlt, FaClock, FaStopwatch, FaRoute, FaMapMarkedAlt } from "react-icons/fa";
import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { getRoutesList } from "../../routes/services/RoutesService";

const RoundDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<IRoundDetail | null>(null);
    const [loading, setLoading] = useState(true);

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
            alert("No hay puntos con coordenadas GPS para trazar una ruta.");
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

    if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;
    if (!data) return <div className="p-10 text-center text-slate-500">No se encontró la ronda.</div>;

    return (
        <div className="p-6 bg-[#f6fbf4] min-h-screen">
            <div className="mb-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2"
                >
                    <FaArrowLeft />
                    <span>Volver</span>
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {routeTitle || data.round.recurringConfiguration?.title || `Ronda #${data.round.id}`}
                        </h1>
                        <div className="flex flex-col gap-1 mt-1">
                             <p className="text-slate-500 text-sm">
                                Guardia: <span className="font-medium text-slate-700">{data.round.guard.name} {data.round.guard.lastName}</span>
                            </p>
                            {data.round.recurringConfiguration?.startTime && (
                                <p className="text-slate-500 text-sm">
                                    Horario: <span className="font-medium text-slate-700">{data.round.recurringConfiguration.startTime} - {data.round.recurringConfiguration.endTime}</span>
                                </p>
                            )}
                        </div>
                    </div>
                     <ITBadget 
                        color={data.round.status === "COMPLETED" ? "success" : "warning"}
                        variant="filled"
                        size="medium"
                    >
                        {data.round.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
                    </ITBadget>
                </div>
            </div>

            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                {/* Metrics Dashboard */}
                {metrics && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <FaClock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Duración Total</p>
                                    <p className="text-xl font-bold text-slate-800">{metrics.duration}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                    <FaQrcode size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Puntos Cubiertos</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {metrics.totalScans} <span className="text-xs text-slate-400 font-normal">/ {metrics.totalRawScans}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                                    <FaStopwatch size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Promedio / Tramo</p>
                                    <p className="text-xl font-bold text-slate-800">{metrics.avgTime}</p>
                                </div>
                            </div>
                        </div>

                        {/* Treasure Map Visualization */}
                        <div className="mb-10 p-6 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                                    <FaRoute /> Ruta Recorrida
                                </h3>
                                <button 
                                    onClick={handleOpenRouteMap}
                                    className="text-xs flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium shadow-sm"
                                >
                                    <FaMapMarkedAlt />
                                    Ver Trazo en Mapa
                                </button>
                            </div>
                            <div className="flex items-start min-w-max pb-4">
                                {metrics.mapNodes.map((node: any, idx: number) => (
                                    <div key={idx} className="flex items-center">
                                        {/* Connector Line (Except for first) */}
                                        {idx > 0 && (
                                           <div className="flex flex-col items-center justify-center -mt-6 mx-2">
                                                <span className="text-[10px] font-bold text-slate-400 mb-1 bg-white px-1 rounded border border-slate-100">{node.timeDiff}</span>
                                                <div className="w-16 h-0.5 bg-slate-300"></div>
                                           </div>
                                        )}

                                        {/* Node */}
                                        <div className="flex flex-col items-center w-24 relative groups">
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center border-4 z-10 shadow-sm transition-transform hover:scale-110
                                                ${node.status === 'START' ? 'bg-blue-600 border-blue-200 text-white' : ''}
                                                ${node.status === 'END' ? 'bg-slate-800 border-slate-300 text-white' : ''}
                                                ${node.status === 'SUCCESS' ? 'bg-green-500 border-green-200 text-white' : ''}
                                                ${node.status === 'DUPLICATE' ? 'bg-red-500 border-red-200 text-white' : ''}
                                                ${node.status === 'INCOMPLETE' ? 'bg-orange-500 border-orange-200 text-white' : ''}
                                            `}>
                                                {node.status === 'START' && <FaPlay className="text-xs ml-0.5" />}
                                                {node.status === 'END' && <FaCheckCircle className="text-xs" />}
                                                {node.status === 'SUCCESS' && <FaCheckCircle className="text-sm" />}
                                                {node.status === 'DUPLICATE' && <span className="font-bold text-lg">!</span>}
                                                {node.status === 'INCOMPLETE' && <FaExclamationTriangle className="text-xs" />}
                                            </div>
                                            
                                            <p className={`text-center text-xs font-bold mt-3 leading-tight ${node.status === 'DUPLICATE' ? 'text-red-600' : 'text-slate-600'}`}>
                                                {node.label}
                                            </p>
                                            
                                            {node.status === 'DUPLICATE' && (
                                                <span className="text-[9px] text-red-500 font-bold mt-1 bg-red-50 px-1 rounded">REPETIDO</span>
                                            )}
                                            {node.status === 'INCOMPLETE' && (
                                                <span className="text-[9px] text-orange-500 font-bold mt-1 bg-orange-50 px-1 rounded">INCOMPLETO</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex flex-wrap gap-4 justify-end text-[10px] text-slate-500 font-medium border-t border-slate-200 pt-3">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Completado</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Repetido/Error</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div>Sin Evidencia</div>
                            </div>
                        </div>
                    </>
                )}

                <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Timeline</h2>
                
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                    {data.timeline.map((event, index) => (
                        <div key={index} className="relative pl-8">
                            <EventIcon type={event.type} />
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-xs font-semibold text-slate-400 block mb-1">
                                    {new Date(event.timestamp).toLocaleString()}
                                </span>
                                <h3 className="text-md font-bold text-slate-700">
                                    {event.description}
                                </h3>
                                {event.type === 'SCAN' && (
                                    <div className="mt-2 text-sm text-slate-600">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span>
                                                Ubicación: <span className="font-medium">{event.data?.location?.name}</span>
                                            </span>
                                            {event.data?.latitude && event.data?.longitude && (
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${event.data.latitude},${event.data.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                                                    title="Ver ubicación exacta en Google Maps"
                                                >
                                                    <FaMapMarkerAlt />
                                                    <span>Ver Mapa</span>
                                                </a>
                                            )}
                                        </div>
                                        
                                        {/* Notes */}
                                        {event.data?.notes && (
                                             <NotesViewer notes={event.data.notes} />
                                        )}

                                        {/* Tasks */}
                                        {event.data?.assignment?.tasks && (
                                            <TaskList tasks={event.data.assignment.tasks} />
                                        )}

                                        {/* Evidence */}
                                        <MediaGallery media={event.data?.media} />
                                    </div>
                                )}
                                {event.type === 'INCIDENT' && (
                                    <div className="mt-2 text-sm text-slate-600">
                                        Categoría: <span className="font-medium">{event.data?.category}</span>
                                        <div className="mt-1 p-2 bg-red-50 text-red-700 rounded text-xs border border-red-100">
                                            {event.data?.description || 'Sin detalle'}
                                        </div>
                                         {/* Evidence */}
                                         <MediaGallery media={event.data?.media} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {data.timeline.length === 0 && (
                     <div className="text-center text-slate-400 py-10">
                        No hay eventos registrados en esta ronda.
                    </div>
                )}
            </div>
        </div>
    );
};

const EventIcon = ({ type }: { type: string }) => {
    let icon = <div className="w-2 h-2 rounded-full bg-slate-300" />;
    let bg = "bg-slate-100";
    let border = "border-slate-300";

    if (type === 'START') {
        icon = <FaPlay className="text-blue-600 text-[10px]" />;
        bg = "bg-blue-100";
        border = "border-blue-500";
    }
    if (type === 'SCAN') {
        icon = <FaQrcode className="text-purple-600 text-[10px]" />;
        bg = "bg-purple-100";
        border = "border-purple-500";
    }
    if (type === 'INCIDENT') {
        icon = <FaExclamationTriangle className="text-orange-600 text-[10px]" />;
        bg = "bg-orange-100";
        border = "border-orange-500";
    }
    if (type === 'END') {
        icon = <FaCheckCircle className="text-green-600 text-[10px]" />;
        bg = "bg-green-100";
        border = "border-green-500";
    }

    return (
        <div className={`absolute -left-[9px] top-0 w-6 h-6 rounded-full ${bg} border-2 ${border} flex items-center justify-center z-10`}>
            {icon}
        </div>
    );
};

// Subcomponent for Media Gallery (using Carousel)
const MediaGallery = ({ media }: { media: any[] }) => {
    if (!media || !Array.isArray(media) || media.length === 0) return null;
    return (
        <div className="mt-4 rounded-xl overflow-hidden shadow-sm border border-slate-200">
             <MediaCarousel media={media} title="Evidencia" />
        </div>
    );
};

// Subcomponent for Notes with Parsing
const NotesViewer = ({ notes }: { notes: string }) => {
    if (!notes) return null;

    // Simple parser for checkbox pattern
    const lines = notes.split('\n');
    
    return (
        <div className="mt-2 space-y-1">
            {lines.map((line, i) => {
                const trimmed = line.trim();

                // Headers
                if (trimmed.startsWith('---')) {
                     const headerText = trimmed.replace(/---/g, '').trim();
                     return (
                         <div key={i} className="relative py-2 my-1">
                             <div className="absolute inset-0 flex items-center">
                                 <div className="w-full border-t border-slate-200"></div>
                             </div>
                             <div className="relative flex justify-center">
                                 <span className="px-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                        <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-100/50 transition-colors">
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                isChecked 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'bg-white border-slate-300'
                            }`}>
                                {isChecked && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-xs leading-relaxed ${
                                isChecked 
                                    ? 'text-slate-500 line-through decoration-emerald-300' 
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
                     <div key={i} className="p-2 bg-yellow-50 text-slate-700 rounded text-xs border border-yellow-100 italic">
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
        <div className="mt-4 mb-2">
            <div className="flex items-center gap-2 mb-3">
                 <div className="w-1 h-4 bg-emerald-500 rounded-full block"></div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tareas Realizadas</h4>
            </div>
           
            <div className="space-y-2">
                {tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200 group/item bg-white border border-slate-100">
                         <div className={`relative mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            task.completed 
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-400 border-emerald-500 shadow-emerald-200 shadow-sm' 
                                : 'bg-white border-slate-300 group-hover/item:border-emerald-300'
                        }`}>
                            {task.completed && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-sm leading-relaxed transition-all duration-200 ${
                            task.completed 
                                ? 'text-slate-700 font-medium line-through decoration-emerald-300 decoration-2' 
                                : 'text-slate-600 group-hover/item:text-slate-800'
                        }`}>
                            {task.description}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoundDetailPage;
