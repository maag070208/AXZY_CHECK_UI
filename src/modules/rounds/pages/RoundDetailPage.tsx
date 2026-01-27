import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoundDetail, IRoundDetail } from "../services/RoundsService";
import { ITLoader, ITBadget } from "axzy_ui_system";
import { FaArrowLeft, FaPlay, FaCheckCircle, FaQrcode, FaExclamationTriangle, FaMapMarkerAlt } from "react-icons/fa";
import { MediaCarousel } from "@app/core/components/MediaCarousel";

const RoundDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<IRoundDetail | null>(null);
    const [loading, setLoading] = useState(true);

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
        }
        setLoading(false);
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
                            Detalle de Ronda #{data.round.id}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Guardia: <span className="font-medium text-slate-700">{data.round.guard.name} {data.round.guard.lastName}</span>
                        </p>
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

            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
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
