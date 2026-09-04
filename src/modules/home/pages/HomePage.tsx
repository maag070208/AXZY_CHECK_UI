import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { FaBook, FaChild, FaClock, FaExclamationTriangle, FaListAlt, FaRoute, FaUserShield, FaWrench } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";
import { LiveOpsDashboard } from "../../dashboard/pages/LiveOpsDashboard";

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);

  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);

  // El dashboard administrativo en vivo (rondas activas, guardias en turno,
  // alertas + analytics históricos integrados) reemplaza el Home para quienes
  // supervisan guardias día a día: ADMIN y SHIFT (Jefe de Guardias).
  const showLiveDashboard = user.role === "ADMIN" || user.role === "SHIFT";

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    if (showLiveDashboard) return;

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
  }, [user, showLiveDashboard]);

  return (
    <div className="bg-[#f8fafc] min-h-screen p-6">
        <div className={`${showLiveDashboard ? "max-w-[1600px]" : "max-w-6xl"} mx-auto space-y-8 relative z-10`}>
          {showLiveDashboard ? (
            <LiveOpsDashboard />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {homeCardItem.map((item, index) => (
                    <HomeCardItem key={index} item={item} index={index} />
                ))}
            </div>
          )}
        </div>
    </div>
  );
};

export default HomePage;
