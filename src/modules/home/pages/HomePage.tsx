import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { FaBook, FaChartBar, FaChild, FaClock, FaExclamationTriangle, FaListAlt, FaRoute, FaTable, FaThLarge, FaUserShield, FaWrench } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";
import { AnalyticsTab } from "../components/tabs/AnalyticsTab";
import { OperationalDetailTab } from "../components/tabs/OperationalDetailTab";

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);

  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"nav" | "analytics" | "detail">("nav");

  const isPrivileged = user.role === "ADMIN" || user.role === "LIDER";

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
      // {
      //   title: "Propiedades",
      //   description: "Catálogo de casas y departamentos",
      //   icon: <FaBuilding className="text-white" />,
      //   action: () => navigate("/properties"),
      // },
      // {
      //   title: "Residentes",
      //   description: "Directorio y expedientes de vecinos",
      //   icon: <FaAddressBook className="text-white" />,
      //   action: () => navigate("/residents"),
      // },
      // {
      //   title: "Invitaciones",
      //   description: "Control de accesos y pases QR",
      //   icon: <FaIdCard className="text-white" />,
      //   action: () => navigate("/invitations"),
      // },
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
        cards.push(
            {
              title: "Usuarios",
              description: "Administrar usuarios del sistema",
              icon: <FaChild className="text-white" />,
              action: () => navigate("/users"),
            }
        );
    }
    
    setHomeCardItem(cards);
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {homeCardItem.map((item, index) => (
                        <HomeCardItem key={index} item={item} index={index} />
                    ))}
                </div>
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

export default HomePage;
