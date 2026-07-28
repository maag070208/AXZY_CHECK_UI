import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import {
  FaBook, FaChartBar, FaChild, FaClock,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaListAlt,
  FaMapMarkerAlt, FaPlayCircle,
  FaRoad,
  FaRoute,
  FaSync,
  FaTable,
  FaTasks,
  FaThLarge, FaUserShield, FaWrench
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";
import { AnalyticsTab } from "../components/tabs/AnalyticsTab";
import { OperationalDetailTab } from "../components/tabs/OperationalDetailTab";
import * as ReportService from "../services/ReportService";

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);

  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"nav" | "analytics" | "detail">("nav");
  const [metrics, setMetrics] = useState<ReportService.IDashboardMetrics | null>(null);
  const [completedRounds, setCompletedRounds] = useState<ReportService.ICompletedRoundToday[]>([]);
  const [loading, setLoading] = useState(true);

  const isPrivileged = user.role === "ADMIN" || user.role === "LIDER";

  const fetchMetrics = async () => {
    setLoading(true);
    const [metricsRes, roundsRes] = await Promise.all([
      ReportService.getDashboardMetrics(),
      ReportService.getCompletedRoundsToday(),
    ]);
    if (metricsRes.success) {
      setMetrics(metricsRes.data || null);
    }
    if (roundsRes.success) {
      setCompletedRounds(roundsRes.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const cards = [
      {
        title: "Ubicaciones",
        description: "Espacios de estacionamiento y locales",
        icon: <FaListAlt className="text-white" />,
        action: () => navigate("/locations"),
      },
      {
        title: "Recorridos",
        description: "Supervisión de rondas en tiempo real",
        icon: <FaClock className="text-white" />,
        action: () => navigate("/rounds"),
      },
      {
        title: "Rutas",
        description: "Configuración de rutas de vigilancia",
        icon: <FaRoute className="text-white" />,
        action: () => navigate("/routes"),
      },
      {
        title: "Incidencias",
        description: "Reportes de novedades y emergencias",
        icon: <FaExclamationTriangle className="text-white" />,
        action: () => navigate("/incidents"),
      },
      {
        title: "Mantenimiento",
        description: "Gestión de reportes técnicos",
        icon: <FaWrench className="text-white" />,
        action: () => navigate("/maintenances"),
      },
      {
        title: "Kardex",
        description: "Historial de movimientos y bitácora",
        icon: <FaBook className="text-white" />,
        action: () => navigate("/kardex"),
      },
      {
        title: "Guardias",
        description: "Gestión de personal operativo",
        icon: <FaUserShield className="text-white" />,
        action: () => navigate("/guards"),
      },
      {
        title: "Horarios",
        description: "Configuración de turnos y roles",
        icon: <FaListAlt className="text-white" />,
        action: () => navigate("/schedules"),
      }
    ];

    if (user.role === "ADMIN" || user.role === "LIDER") {
        cards.push({
            title: "Usuarios",
            description: "Administrar usuarios del sistema",
            icon: <FaChild className="text-white" />,
            action: () => navigate("/users"),
        });
    }
    
    setHomeCardItem(cards);
    fetchMetrics();
  }, [user]);

  return (
    <div className="bg-[#f8fafc] min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          
          {isPrivileged && (
            <div className="flex items-center justify-center p-1 bg-white border border-slate-100 rounded-2xl shadow-sm w-fit mx-auto sticky top-4 z-50 backdrop-blur-md bg-white/80">
                <TabButton 
                    active={activeTab === "nav"} 
                    onClick={() => setActiveTab("nav")}
                    icon={<FaThLarge />}
                    label="Navegación"
                />
                <TabButton 
                    active={activeTab === "analytics"} 
                    onClick={() => setActiveTab("analytics")}
                    icon={<FaChartBar />}
                    label="Security Analytics"
                />
                <TabButton 
                    active={activeTab === "detail"} 
                    onClick={() => setActiveTab("detail")}
                    icon={<FaTable />}
                    label="Detalle Operativo"
                />
            </div>
          )}

          <div className="mt-8 transition-all duration-500">
            {activeTab === "nav" && (
              <>
                <DashboardMetrics metrics={metrics} completedRounds={completedRounds} loading={loading} onRefresh={fetchMetrics} navigate={navigate} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
                    {homeCardItem.map((item, index) => (
                        <HomeCardItem key={index} item={item} index={index} />
                    ))}
                </div>
              </>
            )}

            {isPrivileged && activeTab === "analytics" && (
                <AnalyticsTab />
            )}

            {isPrivileged && activeTab === "detail" && (
                <OperationalDetailTab />
            )}
          </div>
        </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold ${
            active 
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" 
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
        }`}
    >
        {icon}
        <span className={active ? "block" : "hidden md:block"}>{label}</span>
    </button>
);

const DashboardMetrics = ({ metrics, completedRounds, loading, onRefresh, navigate }: { metrics: ReportService.IDashboardMetrics | null; completedRounds: ReportService.ICompletedRoundToday[]; loading: boolean; onRefresh: () => void; navigate: (path: string) => void }) => {
  const metricCards = [
    { label: "Ubicaciones", value: metrics?.totalLocations, icon: <FaMapMarkerAlt />, color: "blue", action: () => navigate("/locations") },
    { label: "Guardias", value: metrics?.totalGuards, icon: <FaUserShield />, color: "indigo", action: () => navigate("/guards") },
    { label: "Rondas Activas", value: metrics?.activeRounds, icon: <FaPlayCircle />, color: "green", action: () => navigate("/rounds?status=IN_PROGRESS") },
    { label: "Incidencias Pendientes", value: metrics?.pendingIncidents, icon: <FaExclamationCircle />, color: "red", action: () => navigate("/incidents?status=PENDING") },
    { label: "Mantenimiento Pendiente", value: metrics?.pendingMaintenance, icon: <FaWrench />, color: "orange", action: () => navigate("/maintenances?status=PENDING") },
    { label: "Asignaciones Activas", value: metrics?.activeAssignments, icon: <FaTasks />, color: "purple", action: () => navigate("/assignments") },
    { label: "Rutas Activas", value: metrics?.activeRoutes, icon: <FaRoad />, color: "teal", action: () => navigate("/routes") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Resumen operativo del sistema</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {completedRounds.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Rondas Completadas Hoy</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">{completedRounds.length} rondas</span>
          </div>
          <div className="divide-y divide-slate-50">
            {completedRounds.slice(0, 5).map((round) => {
              const pct = round.totalLocations > 0 ? Math.round((round.scannedLocations / round.totalLocations) * 100) : 0;
              return (
                <div key={round.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/rounds/${round.id}`)}>
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 flex-shrink-0">
                    <FaClock className="text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{round.guardName}</p>
                    <p className="text-xs text-slate-400">{round.routeName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-600">{round.durationMinutes} min</p>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${round.missedLocations > 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon, color, loading, action }: { label: string; value?: number; icon: React.ReactNode; color: string; loading: boolean; action?: () => void }) => {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-500/10" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-500/10" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", iconBg: "bg-indigo-500/10" },
    green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-500/10" },
    red: { bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-500/10" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", iconBg: "bg-orange-500/10" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-500/10" },
  };

  const colors = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" onClick={action}>
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}
      <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center mb-3 text-lg`}>
        <span className={colors.text}>{icon}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value ?? 0}</p>
    </div>
  );
};

export default HomePage;
