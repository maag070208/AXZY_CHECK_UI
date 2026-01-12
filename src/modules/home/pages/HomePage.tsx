import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { FaCalendarAlt, FaChild, FaClock, FaDumbbell, FaListAlt, FaKey } from "react-icons/fa";
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
        title: "Entradas",
        description: "Registrar y ver vehículos ingresados",
        icon: <FaCalendarAlt className="text-white" />, 
        action: () => navigate("/entries"),
      },
      {
        title: "Movimientos",
        description: "Gestionar movimientos internos",
        icon: <FaClock className="text-white" />,
        action: () => navigate("/movements"),
      },
      {
        title: "Salidas",
        description: "Registrar salidas de vehículos",
        icon: <FaDumbbell className="text-white" />, // Using dumbell temporarily or better icon
        action: () => navigate("/exits"),
      },
      {
        title: "Control de Llaves",
        description: "Historial de asignación de llaves",
        icon: <FaKey className="text-white" />,
        action: () => navigate("/assignments"),
      },
    ];

    if (user.role === "ADMIN") {
        cards.push(
            {
              title: "Usuarios",
              description: "Administrar usuarios del sistema",
              icon: <FaChild className="text-white" />,
              action: () => navigate("/users"), // Assuming users module exists or will exist
            }
        );
    }
    
    setHomeCardItem(cards);
  }, [user]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 max-w-5xl mx-auto relative z-10">
      {homeCardItem.map((item, index) => (
        <HomeCardItem key={index} item={item} index={index} />
      ))}
    </div>
  );
};

export default HomePage;
