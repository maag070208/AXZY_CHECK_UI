import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { ITFlex, ITPage } from "@axzydev/axzy_ui_system";
import { FaAddressBook, FaHome, FaQrcode, FaUser, FaWrench } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";
import { ResidentHomeDashboard } from "../components/ResidentHomeDashboard";
import { GuardHomeDashboard } from "../components/GuardHomeDashboard";
import { ShiftHomeDashboard } from "../components/ShiftHomeDashboard";
import { LiveOpsDashboard } from "../../dashboard/pages/LiveOpsDashboard";
import { useCan } from "@app/core/permissions/useCan";
import { P } from "@app/core/permissions/permissions.constants";
import { useRolePalette } from "@app/core/hooks/useRolePalette";

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);
  const can = useCan();
  const palette = useRolePalette();

  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);

  // El dashboard administrativo en vivo (rondas activas, guardias en turno,
  // alertas + analytics históricos integrados) reemplaza el Home para quienes
  // supervisan guardias día a día: ADMIN y SHIFT (Jefe de Guardias).
  const showLiveDashboard = can(P.DASHBOARD_VIEW);
  const isResident = user.role === "RESDN";
  const isGuard = user.role === "GUARD";
  const isShift = user.role === "SHIFT";

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    if (showLiveDashboard) return;

    // Solo MAINT llega a esta vista (ADMIN y SHIFT ven el dashboard en vivo); el resto de roles no tiene accesos rápidos.
    const cards = [
      {
        title: "Mi perfil",
        description: "Tus datos y tu propiedad",
        icon: <FaUser className="text-white" />,
        action: () => navigate("/resident?tab=perfil"),
        permission: P.RESIDENT_SELF,
      },
      {
        title: "Mis contactos",
        description: "Contactos registrados",
        icon: <FaAddressBook className="text-white" />,
        action: () => navigate("/resident?tab=contactos"),
        permission: P.RESIDENT_SELF,
      },
      {
        title: "Mis pases",
        description: "Invitaciones y códigos QR",
        icon: <FaQrcode className="text-white" />,
        action: () => navigate("/resident?tab=invitaciones"),
        permission: P.INVITATION_VIEW,
      },
      {
        title: "Generar invitación",
        description: "Crea un pase para tu visita",
        icon: <FaQrcode className="text-white" />,
        action: () => navigate("/resident?tab=invitaciones&create=1"),
        permission: P.INVITATION_CREATE,
      },
      {
        title: "Mantenimiento",
        description: "Gestión de reportes técnicos",
        icon: <FaWrench className="text-white" />,
        action: () => navigate("/maintenances"),
        permission: P.MAINTENANCE_MANAGE,
      },
      {
        title: "Invitaciones",
        description: "Pases y accesos de visitas",
        icon: <FaQrcode className="text-white" />,
        action: () => navigate("/invitations"),
        permission: P.INVITATION_MANAGE,
      },
      {
        title: "Casa Club",
        description: "Reportes y reservas",
        icon: <FaHome className="text-white" />,
        action: () => navigate("/club"),
        permission: P.CLUB_VIEW,
      },
      {
        title: "Chat",
        description: "Comunicación del equipo",
        icon: <FaAddressBook className="text-white" />,
        action: () => navigate("/chat"),
        permission: P.CHAT_USE,
      },
    ];

    setHomeCardItem(cards.filter((card) => can(card.permission)));
  }, [user, showLiveDashboard, can]);

  if (showLiveDashboard && !isShift) return <LiveOpsDashboard />;
  if (isShift) return <ShiftHomeDashboard />;
  if (isResident) return <ResidentHomeDashboard />;
  if (isGuard) return <GuardHomeDashboard />;

  return (
    <ITPage
      className="m-0! px-0! max-w-screen! bg-slate-50!"
      noPadding
      title="Inicio"
      description={`Bienvenido${user?.name ? `, ${user.name}` : ""}. Accesos rápidos a tus módulos.`}
      icon={<FaHome size={20} />}
      iconColor={palette.primary}
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
