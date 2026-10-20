
import { useEffect, useRef, useState } from 'react';
import { ITBadget, ITButton, ITDatePicker, ITFlex, ITSegmentedControl, ITText } from "@axzydev/axzy_ui_system";
import { FaSync, FaExclamationTriangle, FaQrcode, FaTimesCircle, FaChartLine } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
import * as ReportService from '../../services/ReportService';
import dayjs from 'dayjs';

Chart.register(...registerables);

type AnalyticsSubTab = 'resumen' | 'carga';

/**
 * "Security Analytics" — histórico por rango de fechas, integrado como
 * sección del dashboard en vivo (ya no en pestañas de Home). Rediseñado en
 * dos sub-pestañas compactas ("Resumen" / "Carga de Trabajo") en vez de
 * apilar las 4 tarjetas grandes + 3 gráficas una tras otra.
 */
export const AnalyticsTab = () => {
    const [dateRange, setDateRange] = useState<any>([dayjs().startOf('year').toDate(), dayjs().toDate()]);
    const [stats, setStats] = useState<ReportService.IGuardStats | null>(null);
    const [topPerformers, setTopPerformers] = useState<ReportService.ITopPerformance[]>([]);
    const [workloadData, setWorkloadData] = useState<ReportService.IGuardWorkload[]>([]);
    const [loading, setLoading] = useState(false);
    const [subTab, setSubTab] = useState<AnalyticsSubTab>('resumen');

    const performanceChartRef = useRef<HTMLCanvasElement>(null);
    const workloadChartRef = useRef<HTMLCanvasElement>(null);
    const distributionChartRef = useRef<HTMLCanvasElement>(null);
    const charts = useRef<{ [key: string]: Chart | null }>({});

    const fetchData = async () => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return;
        setLoading(true);
        const filters = { startDate: dayjs(dateRange[0]).format('YYYY-MM-DD'), endDate: dayjs(dateRange[1]).format('YYYY-MM-DD') };

        const [statsRes, topRes, workloadRes] = await Promise.all([
            ReportService.getGuardStats(filters),
            ReportService.getTopPerformance(filters),
            ReportService.getWorkloadComparison(filters)
        ]);

        if (statsRes.success) setStats(statsRes.data || null);
        if (topRes.success) setTopPerformers(topRes.data || []);
        if (workloadRes.success) setWorkloadData(workloadRes.data || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) {
            renderPerformanceChart();
            renderWorkloadChart();
            renderDistributionChart();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topPerformers, workloadData, stats, loading]);

    // Las gráficas de la sub-pestaña oculta se crean con su contenedor en
    // display:none (Chart.js mide mal ahí) — al cambiar de sub-pestaña les
    // pedimos que se re-midan contra su tamaño real ya visible.
    useEffect(() => {
        if (subTab === 'resumen') {
            charts.current.perf?.resize();
            charts.current.dist?.resize();
        } else {
            charts.current.workload?.resize();
        }
    }, [subTab]);

    const renderPerformanceChart = () => {
        if (charts.current.perf) charts.current.perf.destroy();
        if (performanceChartRef.current && topPerformers.length) {
            const ctx = performanceChartRef.current.getContext('2d');
            if (!ctx) return;

            const vibrantColors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

            charts.current.perf = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: topPerformers.map(g => `${g.name}`),
                    datasets: [{
                        label: 'Escaneos Totales',
                        data: topPerformers.map(g => g.totalScans),
                        backgroundColor: topPerformers.map((_, i) => vibrantColors[i % vibrantColors.length]),
                        borderRadius: 10,
                        barThickness: 26,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#1e293b', padding: 10, titleFont: { size: 12, weight: 'bold' } }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } },
                        x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } }
                    }
                }
            });
        }
    };

    const renderWorkloadChart = () => {
        if (charts.current.workload) charts.current.workload.destroy();
        if (workloadChartRef.current && workloadData.length) {
            const ctx = workloadChartRef.current.getContext('2d');
            if (!ctx) return;

            const topWorkload = workloadData.slice(0, 10);

            // Create Gradients based on Roles
            const getGradient = (role: string) => {
                const gradient = ctx.createLinearGradient(0, 0, 400, 0);
                if (role === 'SHIFT_GUARD') {
                    gradient.addColorStop(0, '#6366f1');
                    gradient.addColorStop(1, '#a5b4fc');
                } else if (role === 'MANTENIMIENTO') {
                    gradient.addColorStop(0, '#f59e0b');
                    gradient.addColorStop(1, '#fcd34d');
                } else {
                    gradient.addColorStop(0, '#10b981');
                    gradient.addColorStop(1, '#6ee7b7');
                }
                return gradient;
            };

            const backgroundColors = topWorkload.map(g => getGradient(g.role));

            charts.current.workload = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: topWorkload.map(g => g.name),
                    datasets: [{
                        label: 'Índice de Carga',
                        data: topWorkload.map(g => g.workload),
                        backgroundColor: backgroundColors,
                        borderRadius: 16,
                        borderSkipped: false,
                        barThickness: 16,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#1e293b',
                            bodyColor: '#64748b',
                            borderColor: '#e2e8f0',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            usePointStyle: true,
                            bodyFont: { size: 11, family: "'Inter', sans-serif" },
                            titleFont: { size: 12, weight: 'bold', family: "'Inter', sans-serif" },
                            callbacks: {
                                label: (context: any) => {
                                    const g = topWorkload[context.dataIndex];
                                    return [
                                        `🚀 Índice Total: ${g.workload}`,
                                        `📍 Escaneos: ${g.details.scans}`,
                                        `📝 Reportes: ${g.details.reports}`,
                                        `🔄 Rondas: ${g.details.rounds}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: true, color: '#f1f5f9' },
                            ticks: { font: { size: 9, weight: 600 }, color: '#94a3b8' }
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                font: { size: 10, weight: 700, family: "'Inter', sans-serif" },
                                color: '#334155',
                                padding: 8
                            }
                        }
                    }
                }
            });
        }
    };

    const renderDistributionChart = () => {
        if (charts.current.dist) charts.current.dist.destroy();
        if (distributionChartRef.current && stats) {
            const ctx = distributionChartRef.current.getContext('2d');
            if (!ctx) return;
            charts.current.dist = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Escaneos', 'Reportes/Manto.', 'Rondas Incompletas', 'Faltantes'],
                    datasets: [{
                        data: [stats.totalScans, stats.totalIncidents, stats.incompleteRounds, stats.missedScans],
                        backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' }, boxWidth: 8 } }
                    }
                }
            });
        }
    };

    return (
        <ITFlex direction="column" className="w-full pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-500">
            {/* Encabezado + filtro de fechas */}
            <ITFlex align="end" justify="between" gap={3} className="flex flex-wrap items-end justify-between gap-3">
                <ITFlex direction="column">
                    <ITText as="h2" className="text-lg font-black text-slate-800 tracking-tight">Security Analytics</ITText>
                    <ITText as="p" className="text-slate-400 text-[11px] mt-0.5">Histórico por rango de fechas.</ITText>
                </ITFlex>
                <ITFlex align="center" gap={2} className="flex items-center gap-2">
                    <ITFlex direction="column" className="bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <ITDatePicker name="range" value={dateRange} range onChange={(e: any) => setDateRange(e.target.value)} className="!border-none !bg-transparent !shadow-none !p-0 px-2" />
                    </ITFlex>
                    <ITButton onClick={fetchData} size="sm" variant="filled" color="primary">
                        <FaSync className={loading ? 'animate-spin' : ''} size={12} />
                    </ITButton>
                </ITFlex>
            </ITFlex>

            {/* Sub-pestañas — UI System */}
            <ITSegmentedControl
                className="self-start"
                size="sm"
                options={[
                    { value: 'resumen', label: 'Resumen' },
                    { value: 'carga', label: 'Carga de Trabajo' },
                ]}
                value={subTab}
                onChange={(value) => setSubTab(value as AnalyticsSubTab)}
            />

            {/* Resumen: estadísticas compactas + 2 gráficas */}
            <ITFlex direction="column" className={subTab === 'resumen' ? 'space-y-4' : 'hidden'}>
                <ITFlex gap={3} className="flex flex-wrap gap-3">
                    <StatPill title="Eventos/Incidencias" value={stats?.totalIncidents} icon={<FaExclamationTriangle />} color="indigo" loading={loading} />
                    <StatPill title="Puntos Escaneados" value={stats?.totalScans} icon={<FaQrcode />} color="emerald" loading={loading} />
                    <StatPill title="Rondas Incompletas" value={stats?.incompleteRounds} icon={<FaChartLine />} color="orange" loading={loading} />
                    <StatPill title="Puntos Omitidos" value={stats?.missedScans} icon={<FaTimesCircle />} color="red" loading={loading} />
                </ITFlex>

                <ITFlex direction="column" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <ITFlex direction="column" className="lg:col-span-7 shadow-sm border border-slate-100 bg-white rounded-2xl p-5">
                        <ITText as="h3" className="text-[13px] font-bold text-slate-800 mb-4">Top Desempeño (Escaneos)</ITText>
                        <ITFlex direction="column" className="h-[220px]">
                            <canvas ref={performanceChartRef}></canvas>
                        </ITFlex>
                    </ITFlex>

                    <ITFlex direction="column" align="center" className="lg:col-span-5 shadow-sm border border-slate-100 bg-white rounded-2xl p-5 flex flex-col items-center">
                        <ITText as="h3" className="text-[13px] font-bold text-slate-800 mb-4 text-left w-full">Distribución de Actividad</ITText>
                        <ITFlex direction="column" className="h-[220px] w-full">
                            <canvas ref={distributionChartRef}></canvas>
                        </ITFlex>
                    </ITFlex>
                </ITFlex>
            </ITFlex>

            {/* Carga de trabajo: sola, con más espacio */}
            <ITFlex direction="column" className={subTab === 'carga' ? '' : 'hidden'}>
                <ITFlex direction="column" className="shadow-sm border border-slate-100 bg-white rounded-2xl p-5">
                    <ITFlex align="center" justify="between" className="flex items-center justify-between mb-4">
                        <ITText as="h3" className="text-[13px] font-bold text-slate-800">Comparativa de Carga de Trabajo</ITText>
                        <ITBadget color="primary" variant="outlined" size="sm">Ranking Operacional</ITBadget>
                    </ITFlex>
                    <ITFlex direction="column" className="h-[320px]">
                        <canvas ref={workloadChartRef}></canvas>
                    </ITFlex>
                    <ITText as="p" className="text-[10px] text-slate-400 mt-3 italic">* El índice de carga se calcula ponderando escaneos, reportes y rondas finalizadas.</ITText>
                </ITFlex>
            </ITFlex>
        </ITFlex>
    );
};

const StatPill = ({ title, value, icon, color, loading }: any) => {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600'
    };

    return (
        <ITFlex align="center" className="flex-1 min-w-[150px] flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm">
            <ITFlex direction="column" className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center text-xs flex-shrink-0`}>{icon}</ITFlex>
            <ITFlex direction="column" className="min-w-0">
                {loading ? (
                    <ITFlex direction="column" className="h-4 w-10 bg-slate-100 rounded animate-pulse" />
                ) : (
                    <ITText as="p" className="text-base font-black text-slate-800 leading-none">{value ?? 0}</ITText>
                )}
                <ITText as="p" className="text-[8.5px] font-black text-slate-400 uppercase tracking-wide truncate mt-0.5">{title}</ITText>
            </ITFlex>
        </ITFlex>
    );
};
