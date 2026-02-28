import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { FaChild, FaListAlt, FaExclamationTriangle, FaBook, FaWrench, FaClock, FaRoute } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);

  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const cards = [
      {
        title: "Ubicaciones",
        description: "Gestionar espacios de estacionamiento",
        icon: <FaListAlt className="text-white" />,
        action: () => navigate("/locations"),
      },
      {
        title: "Incidencias",
        description: "Reportes de incidencias",
        icon: <FaExclamationTriangle className="text-white" />,
        action: () => navigate("/incidents"),
      },
      {
        title: "Kardex",
        description: "Historial de movimientos",
        icon: <FaBook className="text-white" />,
        action: () => navigate("/kardex"),
      },
      {
        title: "Mantenimiento",
        description: "Reportes de mantenimiento",
        icon: <FaWrench className="text-white" />,
        action: () => navigate("/maintenances"),
      },
      {
        title: "Rondas",
        description: "Registro y control de rondas",
        icon: <FaClock className="text-white" />,
        action: () => navigate("/rounds"),
      },
    ];

    if (user.role === "ADMIN") {
        cards.push(
            {
              title: "Usuarios",
              description: "Administrar usuarios del sistema",
              icon: <FaChild className="text-white" />,
              action: () => navigate("/users"),
            },
            {
              title: "Horarios",
              description: "Configurar turnos y horarios",
              icon: <FaListAlt className="text-white" />,
              action: () => navigate("/schedules"),
            },
            {
              title: "Rutas",
              description: "Configuración de rutas de rondas",
              icon: <FaRoute className="text-white" />,
              action: () => navigate("/routes"),
            }
        );
    }
    
    setHomeCardItem(cards);
  }, [user]);

  return (
    <div className="bg-[#f6fbf4] min-h-screen p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto relative z-10">
          {homeCardItem.map((item, index) => (
            <HomeCardItem key={index} item={item} index={index} />
          ))}
        </div>
    </div>
  );
};

export default HomePage;
