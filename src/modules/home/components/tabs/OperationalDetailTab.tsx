
import { useEffect, useState } from 'react';
import { ITBadget, ITButton, ITDatePicker, ITDialog, ITFlex, ITLoader, ITTable, ITText } from "@axzydev/axzy_ui_system";
import { FaSync, FaClock, FaEye, FaExclamationCircle, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import * as ReportService from '../../services/ReportService';
import dayjs from 'dayjs';

// ITTable exige filas tipo Record<string, unknown>; el mapeo de la interfaz lo cumple.
type GuardRow = { [K in keyof ReportService.IGuardDetail]: ReportService.IGuardDetail[K] };

type MissedRow = { [K in keyof ReportService.IMissedPoint]: ReportService.IMissedPoint[K] };

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
        <ITFlex direction="column" className="space-y-8 animate-in fade-in duration-500">
            <ITFlex justify="end" gap={3} className="flex justify-end gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit ml-auto">
                <ITDatePicker name="range" value={dateRange} range onChange={(e: any) => setDateRange(e.target.value)} className="!border-none !bg-transparent !shadow-none !p-0 px-2" />
                <ITButton onClick={fetchData} size="sm" variant="filled" color="primary">
                    <FaSync className={loading ? 'animate-spin' : ''} />
                </ITButton>
            </ITFlex>

            <ITFlex direction="column" className="shadow-2xl shadow-slate-200/60 border border-slate-100 bg-white rounded-[2rem] overflow-hidden relative min-h-[400px]">
                <ITFlex align="center" justify="between" className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                    <ITFlex direction="column">
                        <ITText as="h3" className="text-xl font-black text-slate-800 tracking-tight">Detalle Operativo</ITText>
                        <ITText as="p" className="text-xs text-slate-400 font-medium mt-1">Monitoreo de rendimiento por personal</ITText>
                    </ITFlex>
                    <ITFlex align="center" gap={2} className="flex items-center gap-2">
                         <ITBadget color="primary" variant="outlined" size="sm" className="!px-4 !py-1 !rounded-full font-bold">{detail.length} Personas</ITBadget>
                    </ITFlex>
                </ITFlex>
                
                {loading && <ShimmerOverlay label="Actualizando registros..." />}
                
                <ITTable<GuardRow>
                    data={detail}
                    variant="default"
                    columns={[
                        {
                            key: 'name',
                            label: 'Personal',
                            type: 'string',
                            align: 'left',
                            render: (item) => {
                                const roleColor = ROLE_COLORS[item.role] || 'emerald';
                                return (
                                    <ITFlex align="center" gap={4} className="flex items-center gap-4">
                                        <ITFlex direction="column" className={`w-11 h-11 rounded-2xl bg-${roleColor}-50 text-${roleColor}-600 flex items-center justify-center font-black text-xs shadow-sm shadow-${roleColor}-100/50`}>
                                            {getInitials(item.name, item.lastName)}
                                        </ITFlex>
                                        <ITFlex direction="column">
                                            <ITFlex direction="column" className="font-black text-slate-700 uppercase text-xs tracking-tight">{item.name} {item.lastName}</ITFlex>
                                            <ITFlex align="center" gap={2} className="flex items-center gap-2 mt-1">
                                                <ITBadget color={roleColor as any} size="sm" variant="filled" className="!text-[8px] !px-1.5 !py-0 !rounded-md font-black uppercase !bg-opacity-10 !text-opacity-90 border-none">
                                                    {ROLE_TRANSLATIONS[item.role] || item.role}
                                                </ITBadget>
                                                <ITText as="span" className="text-[9px] text-slate-300 font-bold tracking-widest">#{item.guardId}</ITText>
                                            </ITFlex>
                                        </ITFlex>
                                    </ITFlex>
                                );
                            },
                        },
                        {
                            key: 'totalRounds',
                            label: 'Rondas',
                            type: 'number',
                            align: 'center',
                            render: (item) => (
                                <ITFlex direction="column" className="text-center">
                                    <ITFlex direction="column" className="font-mono text-sm font-black text-slate-600">{item.totalRounds}</ITFlex>
                                    <ITFlex direction="column" className="text-[9px] text-slate-300 font-bold uppercase mt-1">Totales</ITFlex>
                                </ITFlex>
                            ),
                        },
                        {
                            key: 'totalScans',
                            label: 'Escaneos',
                            type: 'number',
                            align: 'center',
                            render: (item) => (
                                <ITFlex direction="column" className="text-center">
                                    <ITFlex direction="column" className="font-mono text-sm font-black text-emerald-600">{item.totalScans}</ITFlex>
                                    <ITFlex direction="column" className="text-[9px] text-slate-300 font-bold uppercase mt-1">Escaneos</ITFlex>
                                </ITFlex>
                            ),
                        },
                        {
                            key: 'missedScans',
                            label: 'Omitidos',
                            type: 'number',
                            align: 'center',
                            render: (item) => (
                                <ITFlex direction="column" className="text-center">
                                    <ITFlex direction="column" className={`font-mono text-sm font-black ${item.missedScans > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                        {item.missedScans}
                                    </ITFlex>
                                    <ITFlex direction="column" className="text-[9px] text-slate-300 font-bold uppercase mt-1">Omitidos</ITFlex>
                                </ITFlex>
                            ),
                        },
                        {
                            key: 'compliance',
                            label: 'Cumplimiento',
                            type: 'number',
                            align: 'center',
                            render: (item) => {
                                const compliance = getCompliance(item);
                                const hasActivity = item.totalScans + item.missedScans > 0;
                                return (
                                    <ITFlex direction="column" align="center" className="flex flex-col items-center">
                                        <ITFlex direction="column" className={`text-xs font-black ${hasActivity ? getComplianceColor(compliance) : 'text-slate-300'}`}>
                                            {hasActivity ? `${compliance}%` : '---'}
                                        </ITFlex>
                                        <ITFlex direction="column" className="w-16 h-1 rounded-full bg-slate-100 mt-2 overflow-hidden">
                                            <ITFlex direction="column"
                                                className={`h-full transition-all duration-1000 ${hasActivity ? getComplianceBg(compliance) : 'bg-slate-200'}`}
                                                style={{ width: `${hasActivity ? compliance : 0}%` }}
                                            />
                                        </ITFlex>
                                        {!hasActivity && (
                                            <ITText as="span" className="text-[8px] font-black text-slate-300 uppercase mt-1">Sin Actividad</ITText>
                                        )}
                                    </ITFlex>
                                );
                            },
                        },
                        {
                            key: 'avgRoundTimeMinutes',
                            label: 'Eficiencia',
                            type: 'number',
                            align: 'center',
                            render: (item) => (
                                <ITFlex align="center" justify="center" className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 w-fit mx-auto">
                                    <FaClock className="text-slate-300 text-[10px]" />
                                    {item.avgRoundTimeMinutes} min
                                </ITFlex>
                            ),
                        },
                        {
                            key: 'actions',
                            label: 'Acciones',
                            type: 'actions',
                            align: 'right',
                            actions: (item) => (
                                <ITButton
                                    size="md"
                                    variant="filled"
                                    color="primary"
                                   
                                    onClick={() => handleViewDetail(item)}
                                >
                                    <ITFlex align="center" gap={2}><FaEye className="text-sm" />
                                    <ITText as="span" className="text-[10px] font-black uppercase tracking-wider">Detalles</ITText></ITFlex>
                                </ITButton>
                            ),
                        },
                    ]}
                />
            </ITFlex>

            {/* DETAIL MODAL - Already redesigned to be consistent */}
            <ITDialog 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={`Historial Operativo: ${selectedGuard?.name}`}
                className="!max-w-4xl w-full"
            >
                <ITFlex direction="column" className="p-0 flex flex-col h-[75vh]">
                    <ITFlex direction="column" className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar space-y-10">
                        {loadingBreakdown ? (
                            <ITFlex direction="column" align="center" gap={4} className="py-20 flex flex-col items-center gap-4">
                                <ITLoader />
                                <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consolidando historial...</ITText>
                            </ITFlex>
                        ) : (
                            <>
                                {/* Incomplete Rounds Section */}
                                <section>
                                    <ITText as="h4" className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                        <ITFlex align="center" gap={3} className="flex items-center gap-3">
                                            <ITFlex direction="column" className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                            Rondas Incompletas
                                        </ITFlex>
                                        <ITBadget color="warning" variant="filled" size="sm" className="!rounded-lg">{breakdown?.incompleteRounds.length || 0}</ITBadget>
                                    </ITText>
                                    <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {breakdown?.incompleteRounds.length === 0 ? (
                                            <ITFlex direction="column" className="col-span-2 p-12 bg-white border border-slate-100 rounded-[2rem] text-center shadow-sm">
                                                <ITFlex align="center" justify="center" className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                                    <FaClock className="text-2xl" />
                                                </ITFlex>
                                                <ITText as="p" className="text-sm font-black text-slate-800 uppercase tracking-tight">Rendimiento Perfecto</ITText>
                                                <ITText as="p" className="text-xs text-slate-400 mt-2">Todas las rondas de este periodo fueron completadas al 100%.</ITText>
                                            </ITFlex>
                                        ) : (
                                            breakdown?.incompleteRounds.map((round) => (
                                                <div key={round.roundId} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-300">
                                                    <ITFlex align="start" justify="between" className="flex justify-between items-start mb-5">
                                                        <ITFlex align="center" gap={4} className="flex items-center gap-4">
                                                            <ITFlex align="center" justify="center" className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-lg shadow-sm">
                                                                <FaExclamationCircle />
                                                            </ITFlex>
                                                            <ITFlex direction="column">
                                                                <ITText as="p" className="text-[10px] font-black text-slate-400 tracking-widest">ID #{round.roundId}</ITText>
                                                                <ITText as="p" className="text-sm font-black text-slate-800 uppercase">{dayjs(round.startTime).format("DD [de] MMM")}</ITText>
                                                            </ITFlex>
                                                        </ITFlex>
                                                        <ITBadget color="warning" variant="outlined" size="sm" className="font-black text-[9px] !rounded-lg border-2">CRÍTICO</ITBadget>
                                                    </ITFlex>
                                                    
                                                    <ITFlex direction="column" className="space-y-4">
                                                        <ITFlex align="center" justify="between" className="flex items-center justify-between">
                                                            <ITText as="span" className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                                                <FaClock className="text-slate-300" />
                                                                Horario de Ronda
                                                            </ITText>
                                                            <ITText as="span" className="text-[11px] font-black text-slate-700">
                                                                {dayjs(round.startTime).format("HH:mm")} - {dayjs(round.endTime).format("HH:mm")}
                                                            </ITText>
                                                        </ITFlex>
                                                        <ITFlex direction="column" className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                            <ITFlex direction="column" 
                                                                className="h-full bg-orange-500 transition-all duration-1000" 
                                                                style={{ width: `${((round.totalLocations - round.missedCount) / round.totalLocations) * 100}%` }}
                                                            />
                                                        </ITFlex>
                                                        <ITFlex align="center" justify="between" className="flex items-center justify-between text-[10px] font-black text-orange-600 uppercase">
                                                            <ITText as="span">Omisiones: {round.missedCount}</ITText>
                                                            <ITText as="span">Efectividad: {Math.round(((round.totalLocations - round.missedCount) / round.totalLocations) * 100)}%</ITText>
                                                        </ITFlex>
                                                    </ITFlex>
                                                </div>
                                            ))
                                        )}
                                    </ITFlex>
                                </section>

                                {/* Missed Points Section */}
                                <section>
                                     <ITText as="h4" className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                        <ITFlex align="center" gap={3} className="flex items-center gap-3">
                                            <ITFlex direction="column" className="w-1.5 h-6 bg-red-500 rounded-full" />
                                            Bitácora de Omisiones
                                        </ITFlex>
                                        <ITBadget color="danger" variant="filled" size="sm" className="!rounded-lg">{breakdown?.missedPoints.length || 0}</ITBadget>
                                    </ITText>
                                    <ITFlex direction="column" className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/30 overflow-hidden">
                                        {breakdown?.missedPoints.length === 0 ? (
                                            <ITFlex direction="column" className="p-14 text-center">
                                                <ITFlex align="center" justify="center" className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                                    <FaMapMarkerAlt className="text-2xl" />
                                                </ITFlex>
                                                <ITText as="p" className="text-sm font-black text-slate-800 uppercase">Cobertura Total</ITText>
                                                <ITText as="p" className="text-[11px] text-slate-400 mt-2">No se detectaron puntos de control omitidos en este periodo.</ITText>
                                            </ITFlex>
                                        ) : (
                                            <ITTable<MissedRow>
                                                data={breakdown?.missedPoints ?? []}
                                                variant="default"
                                                columns={[
                                                    {
                                                        key: 'locationName',
                                                        label: 'Ubicación del Punto',
                                                        type: 'string',
                                                        align: 'left',
                                                        render: (point) => (
                                                            <ITFlex align="center" gap={4} className="flex items-center gap-4">
                                                                <ITFlex align="center" justify="center" className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-sm shadow-sm">
                                                                    <FaMapMarkerAlt />
                                                                </ITFlex>
                                                                <ITFlex direction="column">
                                                                    <ITFlex direction="column" className="font-black text-slate-700 uppercase text-[11px] tracking-tight">{point.locationName}</ITFlex>
                                                                    <ITFlex direction="column" className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Pasillo: {point.aisle}</ITFlex>
                                                                </ITFlex>
                                                            </ITFlex>
                                                        ),
                                                    },
                                                    {
                                                        key: 'startTime',
                                                        label: 'Contexto Temporal',
                                                        type: 'date',
                                                        align: 'left',
                                                        render: (point) => (
                                                            <ITFlex direction="column">
                                                                <ITFlex align="center" gap={2} className="font-black text-slate-600 text-[10px] uppercase flex items-center gap-2">
                                                                    <FaCalendarAlt className="text-slate-300" />
                                                                    {dayjs(point.startTime).format("DD/MM/YYYY")}
                                                                </ITFlex>
                                                                <ITFlex direction="column" className="text-[9px] text-slate-400 font-medium mt-1">Ronda: #{point.roundId} @ {dayjs(point.startTime).format("HH:mm")} hrs</ITFlex>
                                                            </ITFlex>
                                                        ),
                                                    },
                                                    {
                                                        key: 'roundId',
                                                        label: 'Gravedad',
                                                        type: 'string',
                                                        align: 'right',
                                                        render: () => (
                                                            <ITText as="span" className="text-[8px] font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full uppercase tracking-widest">Aviso de Omisión</ITText>
                                                        ),
                                                    },
                                                ]}
                                            />
                                        )}
                                    </ITFlex>
                                </section>
                            </>
                        )}
                    </ITFlex>
                    <ITFlex justify="end" className="px-10 py-6 border-t border-slate-50 bg-white flex justify-end">
                        <ITButton variant="outlined" color="primary" onClick={() => setIsModalOpen(false)}>
                            Cerrar Historial
                        </ITButton>
                    </ITFlex>
                </ITFlex>
            </ITDialog>
        </ITFlex>
    );
};

const ShimmerOverlay = ({ label = 'Actualizando' }: { label?: string }) => (
    <ITFlex direction="column" align="center" justify="center" className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-4 rounded-2xl animate-in fade-in duration-300">
        <ITFlex direction="column" className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
        <ITText as="p" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{label}</ITText>
    </ITFlex>
);
