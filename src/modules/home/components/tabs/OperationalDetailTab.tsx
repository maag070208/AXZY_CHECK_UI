
import { useEffect, useState } from 'react';
import { ITCard, ITDatePicker, ITButton, ITBadget, ITDialog, ITLoader } from "@axzydev/axzy_ui_system";
import { FaSync, FaClock, FaEye, FaExclamationCircle, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import * as ReportService from '../../services/ReportService';
import dayjs from 'dayjs';

export const OperationalDetailTab = () => {
    const [dateRange, setDateRange] = useState<any>([dayjs().startOf('month').toDate(), dayjs().toDate()]);
    const [detail, setDetail] = useState<ReportService.IGuardDetail[]>([]);
    const [loading, setLoading] = useState(false);

    const ROLE_TRANSLATIONS: Record<string, string> = {
        'SHIFT_GUARD': 'Jefe de Guardias',
        'GUARD': 'Guardia',
        'MANTENIMIENTO': 'Mantenimiento'
    };

    const ROLE_COLORS: Record<string, string> = {
        'SHIFT_GUARD': 'indigo',
        'GUARD': 'emerald',
        'MANTENIMIENTO': 'orange'
    };

    const getInitials = (name: string, lastName?: string) => {
        return `${name.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getCompliance = (item: ReportService.IGuardDetail) => {
        const totalPointsRequired = item.totalScans + item.missedScans;
        if (totalPointsRequired === 0) return 0;
        return Math.round((item.totalScans / totalPointsRequired) * 100);
    };

    const getComplianceColor = (percent: number) => {
        if (percent < 50) return 'text-red-500';
        if (percent < 80) return 'text-amber-500';
        return 'text-emerald-500';
    };

    const getComplianceBg = (percent: number) => {
        if (percent < 50) return 'bg-red-500';
        if (percent < 80) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGuard, setSelectedGuard] = useState<ReportService.IGuardDetail | null>(null);
    const [breakdown, setBreakdown] = useState<ReportService.IGuardDetailBreakdown | null>(null);
    const [loadingBreakdown, setLoadingBreakdown] = useState(false);

    const fetchData = async () => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return;
        setLoading(true);
        const filters = { startDate: dayjs(dateRange[0]).format('YYYY-MM-DD'), endDate: dayjs(dateRange[1]).format('YYYY-MM-DD') };
        const res = await ReportService.getDetailedReport(filters);
        if (res.success) {
            const sorted = (res.data || []).sort((a, b) => {
                const compA = getCompliance(a);
                const compB = getCompliance(b);
                if (a.totalRounds !== b.totalRounds) return b.totalRounds - a.totalRounds;
                return compB - compA;
            });
            setDetail(sorted);
        }
        setLoading(false);
    };

    const handleViewDetail = async (guard: ReportService.IGuardDetail) => {
        setSelectedGuard(guard);
        setIsModalOpen(true);
        setLoadingBreakdown(true);
        const filters = { startDate: dayjs(dateRange[0]).format('YYYY-MM-DD'), endDate: dayjs(dateRange[1]).format('YYYY-MM-DD') };
        const res = await ReportService.getGuardDetailBreakdown(guard.guardId, filters);
        if (res.success) setBreakdown(res.data || null);
        setLoadingBreakdown(false);
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-end gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit ml-auto">
                <ITDatePicker name="range" value={dateRange} range onChange={(e: any) => setDateRange(e.target.value)} className="!border-none !bg-transparent !shadow-none !p-0 px-2" />
                <ITButton onClick={fetchData} size="small" variant="filled" color="primary" className="!rounded-xl !h-10 !w-10 !p-0 flex items-center justify-center">
                    <FaSync className={loading ? 'animate-spin' : ''} />
                </ITButton>
            </div>

            <ITCard className="shadow-2xl shadow-slate-200/60 border-none bg-white rounded-[2rem] overflow-hidden relative min-h-[400px]">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Detalle Operativo</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Monitoreo de rendimiento por personal</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <ITBadget color="primary" variant="outlined" size="small" className="!px-4 !py-1 !rounded-full font-bold">{detail.length} Personas</ITBadget>
                    </div>
                </div>
                
                {loading && <ShimmerOverlay label="Actualizando registros..." />}
                
                <div className="overflow-x-auto relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/40">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Rondas</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Escaneos</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Omitidos</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Cumplimiento</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Eficiencia</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {detail.map((item) => {
                                const compliance = getCompliance(item);
                                const roleColor = ROLE_COLORS[item.role] || 'emerald';
                                
                                return (
                                    <tr key={item.guardId} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 rounded-2xl bg-${roleColor}-50 text-${roleColor}-600 flex items-center justify-center font-black text-xs shadow-sm shadow-${roleColor}-100/50 group-hover:scale-105 transition-transform duration-300`}>
                                                    {getInitials(item.name, item.lastName)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-700 uppercase text-xs tracking-tight">{item.name} {item.lastName}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <ITBadget color={roleColor as any} size="small" variant="filled" className="!text-[8px] !px-1.5 !py-0 !rounded-md font-black uppercase !bg-opacity-10 !text-opacity-90 border-none">
                                                            {ROLE_TRANSLATIONS[item.role] || item.role}
                                                        </ITBadget>
                                                        <span className="text-[9px] text-slate-300 font-bold tracking-widest">#{item.guardId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="font-mono text-sm font-black text-slate-600">{item.totalRounds}</div>
                                            <div className="text-[9px] text-slate-300 font-bold uppercase mt-1">Totales</div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="font-mono text-sm font-black text-emerald-600">{item.totalScans}</div>
                                            <div className="text-[9px] text-slate-300 font-bold uppercase mt-1">Escaneos</div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`font-mono text-sm font-black ${item.missedScans > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                                {item.missedScans}
                                            </div>
                                            <div className="text-[9px] text-slate-300 font-bold uppercase mt-1">Omitidos</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col items-center">
                                                <div className={`text-xs font-black ${item.totalScans + item.missedScans === 0 ? 'text-slate-300' : getComplianceColor(compliance)}`}>
                                                    {item.totalScans + item.missedScans === 0 ? '---' : `${compliance}%`}
                                                </div>
                                                <div className="w-16 h-1 rounded-full bg-slate-100 mt-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${item.totalScans + item.missedScans === 0 ? 'bg-slate-200' : getComplianceBg(compliance)}`} 
                                                        style={{ width: `${item.totalScans + item.missedScans === 0 ? 0 : compliance}%` }} 
                                                    />
                                                </div>
                                                {item.totalScans + item.missedScans === 0 && (
                                                    <span className="text-[8px] font-black text-slate-300 uppercase mt-1">Sin Actividad</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 w-fit mx-auto">
                                                <FaClock className="text-slate-300 text-[10px]" />
                                                {item.avgRoundTimeMinutes} min
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <ITButton 
                                                size="small" 
                                                variant="filled" 
                                                color="primary" 
                                                className="!rounded-2xl !py-2.5 !px-6 !bg-slate-900 group-hover:!bg-emerald-600 transition-all duration-300 shadow-xl shadow-slate-200 group-hover:shadow-emerald-200 flex items-center gap-2 ml-auto"
                                                onClick={() => handleViewDetail(item)}
                                            >
                                                <FaEye className="text-sm" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Detalles</span>
                                            </ITButton>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </ITCard>

            {/* DETAIL MODAL - Already redesigned to be consistent */}
            <ITDialog 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={`Historial Operativo: ${selectedGuard?.name}`}
                className="!max-w-4xl w-full"
            >
                <div className="p-0 flex flex-col h-[75vh]">
                    <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar space-y-10">
                        {loadingBreakdown ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <ITLoader />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consolidando historial...</p>
                            </div>
                        ) : (
                            <>
                                {/* Incomplete Rounds Section */}
                                <section>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                            Rondas Incompletas
                                        </div>
                                        <ITBadget color="warning" variant="filled" size="small" className="!rounded-lg">{breakdown?.incompleteRounds.length || 0}</ITBadget>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {breakdown?.incompleteRounds.length === 0 ? (
                                            <div className="col-span-2 p-12 bg-white border border-slate-100 rounded-[2rem] text-center shadow-sm">
                                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                                    <FaClock className="text-2xl" />
                                                </div>
                                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Rendimiento Perfecto</p>
                                                <p className="text-xs text-slate-400 mt-2">Todas las rondas de este periodo fueron completadas al 100%.</p>
                                            </div>
                                        ) : (
                                            breakdown?.incompleteRounds.map((round) => (
                                                <div key={round.roundId} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-300">
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-lg shadow-sm">
                                                                <FaExclamationCircle />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 tracking-widest">ID #{round.roundId}</p>
                                                                <p className="text-sm font-black text-slate-800 uppercase">{dayjs(round.startTime).format("DD [de] MMM")}</p>
                                                            </div>
                                                        </div>
                                                        <ITBadget color="warning" variant="outlined" size="small" className="font-black text-[9px] !rounded-lg border-2">CRÍTICO</ITBadget>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                                                <FaClock className="text-slate-300" />
                                                                Horario de Ronda
                                                            </span>
                                                            <span className="text-[11px] font-black text-slate-700">
                                                                {dayjs(round.startTime).format("HH:mm")} - {dayjs(round.endTime).format("HH:mm")}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-orange-500 transition-all duration-1000" 
                                                                style={{ width: `${((round.totalLocations - round.missedCount) / round.totalLocations) * 100}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] font-black text-orange-600 uppercase">
                                                            <span>Omisiones: {round.missedCount}</span>
                                                            <span>Efectividad: {Math.round(((round.totalLocations - round.missedCount) / round.totalLocations) * 100)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                {/* Missed Points Section */}
                                <section>
                                     <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                                            Bitácora de Omisiones
                                        </div>
                                        <ITBadget color="danger" variant="filled" size="small" className="!rounded-lg">{breakdown?.missedPoints.length || 0}</ITBadget>
                                    </h4>
                                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/30 overflow-hidden">
                                        {breakdown?.missedPoints.length === 0 ? (
                                            <div className="p-14 text-center">
                                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                                    <FaMapMarkerAlt className="text-2xl" />
                                                </div>
                                                <p className="text-sm font-black text-slate-800 uppercase">Cobertura Total</p>
                                                <p className="text-[11px] text-slate-400 mt-2">No se detectaron puntos de control omitidos en este periodo.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50/50">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Ubicación del Punto</th>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contexto Temporal</th>
                                                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Gravedad</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {breakdown?.missedPoints.map((point, index) => (
                                                        <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-sm shadow-sm">
                                                                        <FaMapMarkerAlt />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-slate-700 uppercase text-[11px] tracking-tight">{point.locationName}</div>
                                                                        <div className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Pasillo: {point.aisle}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="font-black text-slate-600 text-[10px] uppercase flex items-center gap-2">
                                                                    <FaCalendarAlt className="text-slate-300" />
                                                                    {dayjs(point.startTime).format("DD/MM/YYYY")}
                                                                </div>
                                                                <div className="text-[9px] text-slate-400 font-medium mt-1">Ronda: #{point.roundId} @ {dayjs(point.startTime).format("HH:mm")} hrs</div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <span className="text-[8px] font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full uppercase tracking-widest">Aviso de Omisión</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>
                    <div className="px-10 py-6 border-t border-slate-50 bg-white flex justify-end">
                        <ITButton variant="outlined" color="primary" onClick={() => setIsModalOpen(false)} className="!rounded-[1.25rem] px-12 py-3 !border-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
                            Cerrar Historial
                        </ITButton>
                    </div>
                </div>
            </ITDialog>
        </div>
    );
};

const ShimmerOverlay = ({ label = 'Actualizando' }: { label?: string }) => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-4 rounded-2xl animate-in fade-in duration-300">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{label}</p>
    </div>
);
