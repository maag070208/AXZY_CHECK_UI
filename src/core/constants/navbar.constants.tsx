import { AppState } from "@app/core/store/store";
import LOGO from "@assets/logo.svg";
import React from "react";
import {
  FaBuilding,
  FaClipboardList,
  FaHome,
  FaLayerGroup,
  FaShieldAlt,
  FaUsers,
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

  type Leaf = { id: string; label: string; path: string; roles: string[] };
  type Group = { id: string; label: string; items: Leaf[] };
  type Section = {
    id: string;
    label: string;
    icon: React.ReactNode;
    path?: string;
    roles?: string[];
    groups?: Group[];
  };

  const sections: Section[] = [
    {
      id: "home",
      label: "Inicio",
      path: "/home",
      icon: <FaHome />,
      roles: ["ADMIN", "SHIFT", "GUARD", "MAINT", "RESDN"],
    },
    {
      id: "operation",
      label: "Operación",
      icon: <FaShieldAlt />,
      groups: [
        {
          id: "monitoring",
          label: "Monitoreo",
          items: [
            { id: "guard-tracking", label: "Seguimiento", path: "/guard-tracking", roles: ["ADMIN", "SHIFT"] },
            { id: "locations", label: "Ubicaciones", path: "/locations", roles: ["ADMIN", "SHIFT"] },
            { id: "chat", label: "Chat", path: "/chat", roles: ["ADMIN", "SHIFT"] },
          ],
        },
        {
          id: "rounds-group",
          label: "Rondas",
          items: [
            { id: "rounds", label: "Historial de recorridos", path: "/rounds", roles: ["ADMIN", "SHIFT"] },
            { id: "routes", label: "Rutas", path: "/routes", roles: ["ADMIN", "SHIFT"] },
          ],
        },
        {
          id: "records",
          label: "Registros",
          items: [
            { id: "kardex", label: "Kardex", path: "/kardex", roles: ["ADMIN", "SHIFT"] },
            { id: "shift-handover", label: "Entrega de turno", path: "/shift-handover", roles: ["ADMIN", "SHIFT"] },
          ],
        },
      ],
    },
    {
      id: "residential",
      label: "Residencial",
      icon: <FaBuilding />,
      groups: [
        {
          id: "homes",
          label: "Hogares",
          items: [
            { id: "properties", label: "Propiedades", path: "/properties", roles: ["ADMIN", "SHIFT"] },
            { id: "residents", label: "Residentes", path: "/residents", roles: ["ADMIN"] },
            { id: "persons", label: "Personas", path: "/persons", roles: ["ADMIN"] },
          ],
        },
        {
          id: "access",
          label: "Accesos",
          items: [
            { id: "invitations", label: "Invitaciones", path: "/invitations", roles: ["ADMIN", "SHIFT", "GUARD"] },
          ],
        },
      ],
    },
    {
      id: "reports",
      label: "Reportes",
      icon: <FaClipboardList />,
      groups: [
        {
          id: "report-types",
          label: "Tipos de reporte",
          items: [
            { id: "incidents", label: "Incidencias", path: "/incidents", roles: ["ADMIN", "SHIFT"] },
            { id: "maintenances", label: "Mantenimientos", path: "/maintenances", roles: ["ADMIN", "MAINT"] },
            { id: "club", label: "Casa Club", path: "/club", roles: ["ADMIN", "SHIFT", "GUARD", "MAINT"] },
          ],
        },
      ],
    },
    {
      id: "staff",
      label: "Personal",
      icon: <FaUsers />,
      groups: [
        {
          id: "staff-main",
          label: "Equipo",
          items: [
            { id: "guards", label: "Guardias", path: "/guards", roles: ["ADMIN", "SHIFT"] },
            { id: "schedule", label: "Horarios", path: "/schedules", roles: ["ADMIN"] },
            { id: "uniform", label: "Uniforme", path: "/uniform", roles: ["ADMIN", "SHIFT"] },
            { id: "users", label: "Usuarios", path: "/users", roles: ["ADMIN"] },
          ],
        },
      ],
    },
    {
      id: "catalogs",
      label: "Catálogos",
      path: "/catalogs",
      icon: <FaLayerGroup />,
      roles: ["ADMIN"],
    },
  ];

  const role = user?.role;
  const allowed = (roles: string[]) => !!role && roles.includes(role);

  const items: any[] = [];
  for (const section of sections) {
    if (!section.groups) {
      if (!allowed(section.roles!)) continue;
      items.push({
        id: section.id,
        label: section.label,
        icon: section.icon,
        action: () => navigate(section.path!),
        isActive: isRouteActive(section.path!),
      });
      continue;
    }

    const subitems = section.groups
      .map((group) => ({
        id: group.id,
        label: group.label,
        items: group.items
          .filter((leaf) => allowed(leaf.roles))
          .map((leaf) => ({
            id: leaf.id,
            label: leaf.label,
            action: () => navigate(leaf.path),
            isActive: isRouteActive(leaf.path),
          })),
      }))
      .filter((group) => group.items.length > 0);

    if (!subitems.length) continue;
    items.push({
      id: section.id,
      label: section.label,
      icon: section.icon,
      isActive: subitems.some((g) => g.items.some((i) => i.isActive)),
      subitems,
    });
  }

  return items;
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
  <img src={LOGO} className="h-10 w-auto object-contain" />
);

export const SIDEBAR_LOGO = () => (
  <img src={LOGO} className="mt-5 h-[40px] flex md:hidden" />
);
