
import { useEffect, useRef, useState } from 'react';
import { ITCard, ITDatePicker, ITButton, ITBadget } from "@axzydev/axzy_ui_system";
import { FaSync, FaExclamationTriangle, FaQrcode, FaTimesCircle, FaChartLine } from 'react-icons/fa';
import { Chart, registerables } from 'chart.js';
import * as ReportService from '../../services/ReportService';
import dayjs from 'dayjs';

Chart.register(...registerables);

export const AnalyticsTab = () => {
    const [dateRange, setDateRange] = useState<any>([dayjs().startOf('month').toDate(), dayjs().toDate()]);
    const [stats, setStats] = useState<ReportService.IGuardStats | null>(null);
    const [topPerformers, setTopPerformers] = useState<ReportService.ITopPerformance[]>([]);
    const [workloadData, setWorkloadData] = useState<ReportService.IGuardWorkload[]>([]);
    const [loading, setLoading] = useState(false);

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
    }, []);

    useEffect(() => {
        if (!loading) {
            renderPerformanceChart();
            renderWorkloadChart();
            renderDistributionChart();
        }
    }, [topPerformers, workloadData, stats, loading]);

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
                        borderRadius: 12,
                        barThickness: 35,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { size: 14, weight: 'bold' } }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false }, ticks: { font: { weight: 'bold' } } },
                        x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
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
                        borderRadius: 20,
                        borderSkipped: false,
                        barThickness: 18,
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
                            padding: 15,
                            displayColors: true,
                            usePointStyle: true,
                            bodyFont: { size: 12, family: "'Inter', sans-serif" },
                            titleFont: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
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
                            ticks: { font: { size: 10, weight: 600 }, color: '#94a3b8' }
                        },
                        y: { 
                            grid: { display: false },
                            ticks: { 
                                font: { size: 11, weight: 700, family: "'Inter', sans-serif" },
                                color: '#334155',
                                padding: 10
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
                        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 11, weight: 'bold' } } }
                    }
                }
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Range Selector */}
            <div className="flex justify-end gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit ml-auto">
                <ITDatePicker name="range" value={dateRange} range onChange={(e: any) => setDateRange(e.target.value)} className="!border-none !bg-transparent !shadow-none !p-0 px-2" />
                <ITButton onClick={fetchData} size="small" variant="filled" color="primary" className="!rounded-xl !h-10 !w-10 !p-0 flex items-center justify-center">
                    <FaSync className={loading ? 'animate-spin' : ''} />
                </ITButton>
            </div>

            {/* General Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Eventos/Incidencias" value={stats?.totalIncidents} icon={<FaExclamationTriangle />} color="indigo" loading={loading} />
                <StatsCard title="Puntos Escaneados" value={stats?.totalScans} icon={<FaQrcode />} color="emerald" loading={loading} />
                <StatsCard title="Rondas Incompletas" value={stats?.incompleteRounds} icon={<FaChartLine />} color="orange" loading={loading} />
                <StatsCard title="Puntos Omitidos" value={stats?.missedScans} icon={<FaTimesCircle />} color="red" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Performance Chart */}
                <ITCard className="lg:col-span-8 shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6 relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Top Desempeño (Escaneos)</h3>
                    <div className="h-[300px]">
                        <canvas ref={performanceChartRef}></canvas>
                    </div>
                </ITCard>

                {/* Activity Distribution */}
                <ITCard className="lg:col-span-4 shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 text-left w-full">Distribución de Actividad</h3>
                    <div className="h-[250px] w-full">
                        <canvas ref={distributionChartRef}></canvas>
                    </div>
                </ITCard>

                {/* Workload Comparison */}
                <ITCard className="lg:col-span-12 shadow-xl shadow-slate-200/50 border-none bg-white rounded-3xl p-6 relative">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Comparativa de Carga de Trabajo</h3>
                        <ITBadget color="primary" variant="outlined" size="small">Ranking Operacional</ITBadget>
                    </div>
                    <div className="h-[400px]">
                        <canvas ref={workloadChartRef}></canvas>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-4 italic">* El índice de carga se calcula ponderando escaneos, reportes y rondas finalizadas.</p>
                </ITCard>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon, color, loading }: any) => {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600'
    };
    const circleClasses: Record<string, string> = {
        indigo: 'bg-indigo-500/10',
        emerald: 'bg-emerald-500/10',
        orange: 'bg-orange-500/10',
        red: 'bg-red-500/10'
    };

    return (
        <ITCard className="p-6 shadow-lg shadow-slate-100/50 border-none bg-white rounded-3xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${circleClasses[color]} group-hover:scale-110 transition-transform duration-500`} />
            {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center animate-pulse" />}
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-4 text-xl shadow-sm`}>{icon}</div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-3xl font-black text-slate-800">{value ?? 0}</h4>
            </div>
        </ITCard>
    );
};
