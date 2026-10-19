import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { ITPage } from "@axzydev/axzy_ui_system";
import { FaHome, FaBook, FaClock, FaExclamationTriangle, FaListAlt, FaRoute, FaUserShield, FaWrench } from "react-icons/fa";
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
        roles: ["ADMIN", "SHIFT"],
      },
      {
        title: "Recorridos",
        description: "Supervisión de rondas en tiempo real",
        icon: <FaClock className="text-white" />,
        action: () => navigate("/rounds"),
        roles: ["ADMIN", "SHIFT"],
      },
      {
        title: "Rutas",
        description: "Configuración de rutas de vigilancia",
        icon: <FaRoute className="text-white" />,
        action: () => navigate("/routes"),
        roles: ["ADMIN", "SHIFT"],
      },
      {
        title: "Incidencias",
        description: "Reportes de novedades y emergencias",
        icon: <FaExclamationTriangle className="text-white" />,
        action: () => navigate("/incidents"),
        roles: ["ADMIN", "SHIFT"],
      },
      {
        title: "Mantenimiento",
        description: "Gestión de reportes técnicos",
        icon: <FaWrench className="text-white" />,
        action: () => navigate("/maintenances"),
        roles: ["ADMIN", "MAINT"],
      },
      {
        title: "Kardex",
        description: "Historial de movimientos y bitácora",
        icon: <FaBook className="text-white" />,
        action: () => navigate("/kardex"),
        roles: ["ADMIN", "SHIFT"],
      },
      {
        title: "Guardias",
        description: "Gestión de personal operativo",
        icon: <FaUserShield className="text-white" />,
        action: () => navigate("/guards"),
        roles: ["ADMIN", "SHIFT"],
      },
      {
        title: "Horarios",
        description: "Configuración de turnos y roles",
        icon: <FaListAlt className="text-white" />,
        action: () => navigate("/schedules"),
        roles: ["ADMIN"],
      }
    ];

    setHomeCardItem(cards.filter((card) => (user.role ? card.roles.includes(user.role) : false)));
  }, [user, showLiveDashboard]);

  if (showLiveDashboard) return <LiveOpsDashboard />;

  return (
    <ITPage
      className="m-0! px-0! max-w-screen!"
      noPadding
      title="Inicio"
      description={`Bienvenido${user?.name ? `, ${user.name}` : ""}. Accesos rápidos a tus módulos.`}
      icon={<FaHome size={20} />}
      iconColor="#065911"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homeCardItem.map((item, index) => (
          <HomeCardItem key={index} item={item} index={index} />
        ))}
      </div>
    </ITPage>
  );
};

export default HomePage;
