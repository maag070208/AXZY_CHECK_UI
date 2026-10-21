import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { ITFlex, ITPage } from "@axzydev/axzy_ui_system";
import { FaHome, FaWrench } from "react-icons/fa";
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

    // Solo MAINT llega a esta vista (ADMIN y SHIFT ven el dashboard en vivo); el resto de roles no tiene accesos rápidos.
    const cards = [
      {
        title: "Mantenimiento",
        description: "Gestión de reportes técnicos",
        icon: <FaWrench className="text-white" />,
        action: () => navigate("/maintenances"),
        roles: ["MAINT"],
      },
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
      <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homeCardItem.map((item, index) => (
          <HomeCardItem key={index} item={item} index={index} />
        ))}
      </ITFlex>
    </ITPage>
  );
};

export default HomePage;
