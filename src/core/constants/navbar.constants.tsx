import { AppState } from "@app/core/store/store";
import LOGO from "@assets/logo.png";
import {
  FaBook,
  FaChild,
  FaClock,
  FaComments,
  FaExclamationTriangle,
  FaGlassCheers,
  FaHome,
  FaLayerGroup,
  FaListAlt,
  FaMapMarkedAlt,
  FaSearchLocation,
  FaSwatchbook,
  FaTshirt,
  FaUserClock,
  FaUserShield,
  FaWrench
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

export const useNavigationItems = (): any[] => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: AppState) => state.auth);

  const isRouteActive = (path: string, subroutes?: string[]) => {
    if (subroutes?.length) {
      return subroutes.some((subroute) =>
        location.pathname.startsWith(subroute)
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const baseItems: any[] = [
    {
      id: "home",
      label: "Inicio",
      action: () => navigate("/home"),
      isActive: isRouteActive("/home"),
      icon: <FaHome  />,
      roles: ["ADMIN", "SHIFT", "GUARD", "MAINT", "RESDN"],
    },
    {
      id: "locations",
      label: "Ubicaciones",
      action: () => navigate("/locations"),
      isActive: isRouteActive("/locations"),
      icon: <FaSearchLocation  />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "incidents",
      label: "Reportes",
      action: () => navigate("/incidents"),
      isActive: isRouteActive("/incidents"),
      icon: <FaExclamationTriangle  />, 
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "club",
      label: "Casa Club",
      action: () => navigate("/club"),
      isActive: isRouteActive("/club"),
      icon: <FaGlassCheers  />, 
      roles: ["ADMIN", "SHIFT", "GUARD", "MAINT"],
    },
    {
      id: "maintenances",
      label: "Mantenimientos",
      action: () => navigate("/maintenances"),
      isActive: isRouteActive("/maintenances"),
      icon: <FaWrench  />, 
      roles: ["ADMIN", "MAINT"],
    },
    {
      id: "kardex",
      label: "Kardex",
      action: () => navigate("/kardex"),
      isActive: isRouteActive("/kardex"),
      icon: <FaBook  />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "rounds",
      label: "Historial de recorridos",
      action: () => navigate("/rounds"),
      isActive: isRouteActive("/rounds"),
      icon: <FaClock  />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "routes",
      label: "Rutas",
      action: () => navigate("/routes"),
      isActive: isRouteActive("/routes"),
      icon: <FaMapMarkedAlt  />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "guards",
      label: "Guardias",
      action: () => navigate("/guards"),
      isActive: isRouteActive("/guards"),
      icon: <FaUserShield />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "chat",
      label: "Chat",
      action: () => navigate("/chat"),
      isActive: isRouteActive("/chat"),
      icon: <FaComments />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "shift-handover",
      label: "Entrega de Turno",
      action: () => navigate("/shift-handover"),
      isActive: isRouteActive("/shift-handover"),
      icon: <FaSwatchbook />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "uniform",
      label: "Uniforme",
      action: () => navigate("/uniform"),
      isActive: isRouteActive("/uniform"),
      icon: <FaTshirt />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "guard-tracking",
      label: "Seguimiento",
      action: () => navigate("/guard-tracking"),
      isActive: isRouteActive("/guard-tracking"),
      icon: <FaUserClock />,
      roles: ["ADMIN", "SHIFT"],
    },
    {
      id: "users",
      label: "Usuarios",
      action: () => navigate("/users"),
      isActive: isRouteActive("/users"),
      icon: <FaChild  />,
      roles: ["ADMIN"],
    },
    {
      id: "catalogs",
      label: "Catálogos",
      action: () => navigate("/catalogs"),
      isActive: isRouteActive("/catalogs"),
      icon: <FaLayerGroup />,
      roles: ["ADMIN"],
    },
    {
      id: "schedule",
      label: "Horarios",
      action: () => navigate("/schedules"),
      isActive: isRouteActive("/schedules"),
      icon: <FaListAlt  />,
      roles: ["ADMIN"],
    }
  ];

  return baseItems.filter((item) => (user?.role ? item.roles.includes(user.role) : false));
};

// ------------- NAVBAR (legacy) -----------------
export const Navbar = () => {
  const navigationItems = useNavigationItems();

  return (
    <div className="flex flex-row space-x-4">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={item.action}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            item.isActive
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export const NAVBAR_LOGO = () => (
  <img src={LOGO} className="h-[80px] hidden md:flex" />
);

export const SIDEBAR_LOGO = () => (
  <img src={LOGO} className="mt-5 h-[40px] flex md:hidden" />
);
