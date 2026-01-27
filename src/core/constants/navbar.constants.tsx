import { AppState } from "@app/core/store/store";
import LOGO from "@assets/logo.png";
import {
  FaChild,
  FaHome,
  FaListAlt,
  FaExclamationTriangle,
  FaBook,
  FaClock,
  FaMapMarkedAlt,
  FaSearchLocation,
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
      icon: <FaHome className="text-white" />,
    },
    {
      id: "locations",
      label: "Ubicaciones",
      action: () => navigate("/locations"),
      isActive: isRouteActive("/locations"),
      icon: <FaSearchLocation className="text-white" />,
    },
    {
      id: "incidents",
      label: "Incidencias",
      action: () => navigate("/incidents"),
      isActive: isRouteActive("/incidents"),
      icon: <FaExclamationTriangle className="text-white" />, 
    },
    {
      id: "kardex",
      label: "Kardex",
      action: () => navigate("/kardex"),
      isActive: isRouteActive("/kardex"),
      icon: <FaBook className="text-white" />,
    },
    {
      id: "rounds",
      label: "Rondas",
      action: () => navigate("/rounds"),
      isActive: isRouteActive("/rounds"),
      icon: <FaClock className="text-white" />,
    },
    {
      id: "routes",
      label: "Rutas",
      action: () => navigate("/routes"),
      isActive: isRouteActive("/routes"),
      icon: <FaMapMarkedAlt className="text-white" />,
    },
    {
      id: 'schedule',
      label: 'Horarios',
       action: () => navigate("/schedules"),
      isActive: isRouteActive("/schedules"),
      icon: <FaListAlt className="text-white" />,
    }
  ];

  if (user?.role === "ADMIN" || user?.role === "LIDER") {
    baseItems.push({
      id: "users",
      label: "Usuarios",
      action: () => navigate("/users"),
      isActive: isRouteActive("/users"),
      icon: <FaChild className="text-white" />,
    });
  }

  return baseItems;
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
